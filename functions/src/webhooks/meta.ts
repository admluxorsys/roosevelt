import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { normalizeMetaMessage, normalizeWhatsAppMessage } from '../helpers/messageNormalizer';
import { handleKanbanUpdateOmni } from '../helpers/kanbanOmni';
import { tryTriggerBot } from '../helpers/botEngine';
import { resolveTenant } from '../helpers/tenantResolver';

/**
 * META WEBHOOK HANDLER
 * Supports: Instagram Graph API, Facebook Graph API (Messenger)
 * 
 * URL: https://[project-id].cloudfunctions.net/metaWebhook
 */


export const metaWebhook = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
    // 1. VERIFICATION REQUEST (GET)
    if (req.method === 'POST') {
        // --- DEBUG: LOG RAW REQUEST (Cloud Functions Logging — Respetando Molde Maestro) ---
        functions.logger.info(`[WhatsApp Webhook Raw] Received POST from Meta`, {
            body: req.body,
            query: req.query
        });
    }

    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        const userId = req.query['u'] as string;
        const entityId = req.query['e'] as string;

        let expectedToken = process.env.META_VERIFY_TOKEN || 'vg37e';

        // Si se proveen IDs de inquilino, buscamos su token específico
        if (userId && entityId) {
            try {
                const db = admin.firestore();
                // 1. Probar con la configuración pública
                let configSnap = await db.doc(`users/${userId}/entities/${entityId}/integrations/whatsapp`).get();
                
                // 2. Si no existe, probar con la interna (Modo Dev)
                if (!configSnap.exists) {
                    configSnap = await db.doc(`users/${userId}/entities/${entityId}/integrations/whatsapp_internal`).get();
                }

                if (configSnap.exists) {
                    const data = configSnap.data();
                    if (data?.verifyToken) {
                        expectedToken = data.verifyToken;
                    }
                }
            } catch (error) {
                functions.logger.error('[Meta Webhook Verify] Error fetching tenant config', error);
            }
        }

        if (mode === 'subscribe' && token === expectedToken) {
            functions.logger.info(`Meta Webhook Verified (GET) for Tenant: ${userId || 'master'}`);
            res.status(200).send(challenge);
        } else {
            functions.logger.warn(`Meta Verification Failed (GET). Got: ${token}, Expected: ${expectedToken}`);
            res.sendStatus(403);
        }
        return;
    }

    // 2. EVENT NOTIFICATION (POST)
    if (req.method === 'POST') {
        try {
            // Confirm reception immediately to avoid Meta timeouts
            res.status(200).send('EVENT_RECEIVED');

            const body = req.body;

            // Support 'instagram', 'page' (messenger), 'whatsapp_business_account' AND 'whatsapp_business'
            if (body.object === 'instagram' || body.object === 'page' || body.object === 'whatsapp_business_account' || body.object === 'whatsapp_business') {
                const platform = (body.object === 'whatsapp_business_account' || body.object === 'whatsapp_business') ? 'whatsapp' : (body.object === 'instagram' ? 'instagram' : 'messenger');

                // Iterate over entries
                for (const entry of body.entry) {
                    functions.logger.info(`[Meta Webhook] Processing entry for platform: ${platform}`);
                    const webhookEvent = entry.messaging ? entry.messaging[0] : null;

                    if (platform === 'whatsapp') {
                        for (const change of entry.changes || []) {
                            if (change.field !== 'messages') continue;
                            const value = change.value;
                            if (!value || !value.messages) continue;

                            // 1. RESOLVE TENANT (Search or URL Fallback)
                            let userId = req.query['u'] as string;
                            let entityId = req.query['e'] as string;
                            const phoneNumberId = value.metadata?.phone_number_id;
                            const businessAccountId = entry.id;

                            const tenant = await resolveTenant('whatsapp', phoneNumberId, businessAccountId);
                            if (tenant) {
                                userId = tenant.userId;
                                entityId = tenant.entityId;
                            }

                            if (!userId || !entityId) {
                                functions.logger.warn(`[WhatsApp Webhook] Unresolved tenant for ${phoneNumberId}.`);
                                continue;
                            }

                            // 2. PROCESS MESSAGES
                            const contactName = value.contacts?.[0]?.profile?.name || 'Cliente WhatsApp';
                            
                            for (const msg of value.messages) {
                                if (!msg.id) {
                                    functions.logger.warn(`[WhatsApp Webhook] Skipping message without ID`, msg);
                                    continue;
                                }

                                try {
                                    functions.logger.info(`[WhatsApp Webhook] Processing msg ${msg.id} from ${msg.from}`);
                                    const unifiedMessage = normalizeWhatsAppMessage(msg, contactName);
                                    const cardResult = await handleKanbanUpdateOmni(unifiedMessage, userId, entityId);
                                    functions.logger.info(`[WhatsApp Webhook] ✅ Kanban updated. CardId: ${cardResult?.cardId}, isNew: ${cardResult?.isNew}`);

                                    if (cardResult?.success) {
                                        await tryTriggerBot(userId, entityId, 'whatsapp', unifiedMessage.external_id, unifiedMessage.message_text, msg.id, { mediaUrl: unifiedMessage.media_url, type: unifiedMessage.message_type });
                                    }
                                } catch (msgErr: any) {
                                    functions.logger.error(`[WhatsApp Webhook] ❌ Failed to process msg ${msg.id}: ${msgErr.message}`);
                                }
                            }
                        }
                    } else if (webhookEvent) {
                        functions.logger.info(`Received ${platform} message`, webhookEvent);

                        // --- RESOLUCIÓN DE INQUILINO (TENANT RESOLUTION) ---
                        const recipientId = webhookEvent.recipient?.id;
                        
                        let userId = req.query['u'] as string;
                        let entityId = req.query['e'] as string;

                        if (!userId || !entityId) {
                            const tenant = await resolveTenant(platform, recipientId);
                            if (tenant) {
                                userId = tenant.userId;
                                entityId = tenant.entityId;
                            }
                        }

                        if (!userId || !entityId) {
                            functions.logger.error(`[Meta Webhook] ❌ No mapping OR query params found for ${platform}:${recipientId}. Dropping.`);
                            continue;
                        }

                        // --- NORMALIZATION & PROCESSING ---
                        const unifiedMessage = normalizeMetaMessage(webhookEvent, platform);
                        const cardResult = await handleKanbanUpdateOmni(unifiedMessage, userId, entityId);

                        // --- BOT TRIGGER (Unified) ---
                        if (cardResult && cardResult.success) {
                            await tryTriggerBot(userId, entityId, platform, unifiedMessage.external_id, unifiedMessage.message_text);
                        }
                    }
                }
                // res.status(200).send('EVENT_RECEIVED'); // Moved to top
            } else {
                res.sendStatus(404);
            }
        } catch (error) {
            functions.logger.error('Error processing Meta webhook', error);
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(405);
    }
});
