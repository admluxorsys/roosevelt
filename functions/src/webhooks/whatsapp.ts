import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { normalizeWhatsAppMessage } from '../helpers/messageNormalizer';
import { handleKanbanUpdateOmni } from '../helpers/kanbanOperations';
import { tryTriggerBot } from '../helpers/botEngine';
import { resolveTenant } from '../helpers/tenantResolver';

/**
 * OLD WHATSAPP WEBHOOK HANDLER
 * (Maintain for backward compatibility but migrate to Meta Webhook)
 */

export const whatsappWebhook = functions.https.onRequest(async (req, res) => {
    // 1. VERIFICACIÓN (GET)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'vg37e';

        if (mode === 'subscribe' && token === expectedToken) {
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
        return;
    }

    // 2. PROCESAMIENTO (POST)
    if (req.method === 'POST') {
        try {
            const body = req.body;

            if (!body.entry) {
                res.status(400).send('INVALID_PAYLOAD');
                return;
            }

            for (const entry of body.entry) {
                for (const change of entry.changes || []) {
                    if (change.field !== 'messages') continue;
                    const value = change.value;
                    if (!value || !value.messages) continue;

                    const phoneNumberId = value.metadata?.phone_number_id;
                    const wabaId = entry.id;

                    // A. RESOLVER INQUILINO (Prioridad 1: Búsqueda Global - Regla 1)
                    let u: string | undefined;
                    let e: string | undefined;

                    const tenant = await resolveTenant('whatsapp', phoneNumberId, wabaId);
                    if (tenant) {
                        u = tenant.userId;
                        e = tenant.entityId;
                    } else {
                        // Backup: URL context (Rule 4 Fallback)
                        u = req.query['u'] as string;
                        e = req.query['e'] as string;
                    }

                    if (!u || !e) {
                        functions.logger.warn(`[WhatsApp] ❌ Abort: Unresolved Tenant for ID: ${phoneNumberId}`);
                        continue;
                    }

                    // B. AUDITORIA EN BÓVEDA (Regla 7 - No Roots)
                    try {
                        const db = admin.firestore();
                        await db.collection(`users/${u}/entities/${e}/system_logs`).add({
                            timestamp: admin.firestore.FieldValue.serverTimestamp(),
                            type: 'whatsapp_legacy_webhook',
                            phoneId: phoneNumberId,
                            raw: JSON.stringify(body).substring(0, 1500)
                        });
                    } catch (logErr) {}

                    // C. PROCESAR MENSAJES
                    const contactName = value.contacts?.[0]?.profile?.name || 'Cliente WhatsApp';
                    for (const msg of value.messages) {
                        if (!msg.id || msg.is_echo || msg.from === phoneNumberId) continue;

                        const unified = normalizeWhatsAppMessage(msg, contactName);
                        const result = await handleKanbanUpdateOmni(unified, u, e);
                        
                        if (result?.success) {
                            await tryTriggerBot(u, e, 'whatsapp', unified.external_id, unified.message_text, msg.id, { mediaUrl: unified.media_url, type: unified.message_type });
                        }
                    }
                }
            }
            res.status(200).send('EVENT_RECEIVED');
        } catch (err: any) {
            functions.logger.error(`[WhatsApp Legacy Webhook] 💥 Critical Error: ${err.message}`);
            res.status(500).send('INTERNAL_ERROR');
        }
    }
});
