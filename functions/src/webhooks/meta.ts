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
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        const userId = req.query['u'] as string;
        const entityId = req.query['e'] as string;

        let expectedToken = process.env.META_VERIFY_TOKEN || 'malamia';

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
            const body = req.body;

            // Support 'instagram', 'page' (messenger) and 'whatsapp_business_account'
            if (body.object === 'instagram' || body.object === 'page' || body.object === 'whatsapp_business_account') {
                const platform = body.object === 'whatsapp_business_account' ? 'whatsapp' : (body.object === 'instagram' ? 'instagram' : 'messenger');

                // Iterate over entries
                for (const entry of body.entry) {
                    const webhookEvent = entry.messaging ? entry.messaging[0] : null;

                    if (platform === 'whatsapp') {
                        // WhatsApp Payload is structured differently (body.entry[].changes)
                        for (const change of entry.changes || []) {
                            if (change.field === 'messages' && change.value?.messages) {
                                const webhookEvent = change.value;
                                const phoneNumberId = webhookEvent.metadata?.phone_number_id;
                                
                                // --- TENANT RESOLUTION ---
                                let userId = req.query['u'] as string;
                                let entityId = req.query['e'] as string;
                                
                                if (!userId || !entityId) {
                                    functions.logger.info(`[WhatsApp Webhook] No query params found. Falling back to collectionGroup search for ${phoneNumberId}`);
                                    const integrationsSnap = await admin.firestore()
                                        .collectionGroup('integrations')
                                        .where('phoneNumberId', '==', phoneNumberId)
                                        .limit(1)
                                        .get();
                                    
                                    if (integrationsSnap.empty) {
                                        functions.logger.error(`[WhatsApp Webhook] No isolated integration found for ${phoneNumberId}.`);
                                        continue;
                                    }

                                    const integrationDoc = integrationsSnap.docs[0];
                                    const pathParts = integrationDoc.ref.path.split('/');
                                    userId = pathParts[1];
                                    entityId = pathParts[3];
                                }

                                functions.logger.info(`[WhatsApp Webhook] Processing for Tenant: ${userId}/${entityId}`);
                                
                                // Normalize and process
                                const contactName = webhookEvent.contacts?.[0]?.profile?.name || 'Cliente WhatsApp';
                                const unifiedMessage = normalizeWhatsAppMessage(webhookEvent.messages?.[0], contactName);
                                const cardResult = await handleKanbanUpdateOmni(unifiedMessage, userId, entityId);
                                
                                if (cardResult?.success) {
                                    await tryTriggerBot(userId, entityId, 'whatsapp', unifiedMessage.external_id, unifiedMessage.message_text);
                                }
                            }
                        }
                    } else if (webhookEvent) {
                        functions.logger.info(`Received ${platform} message`, webhookEvent);

                        // --- RESOLUCIÓN DE INQUILINO (TENANT RESOLUTION) ---
                        const recipientId = webhookEvent.recipient?.id;
                        const tenant = await resolveTenant(platform, recipientId);

                        if (!tenant) {
                            functions.logger.error(`[Meta Webhook] No mapping found for ${platform}:${recipientId}. Initializing or dropping.`);
                            // En un sistema estricto, retornaríamos aquí. 
                            // Para el "Master Mold", necesitamos que exista el mapeo.
                            continue;
                        }

                        const { userId, entityId } = tenant;

                        // --- NORMALIZATION & PROCESSING ---
                        const unifiedMessage = normalizeMetaMessage(webhookEvent, platform);
                        const cardResult = await handleKanbanUpdateOmni(unifiedMessage, userId, entityId);

                        // --- BOT TRIGGER (Unified) ---
                        if (cardResult && cardResult.success) {
                            await tryTriggerBot(userId, entityId, platform, unifiedMessage.external_id, unifiedMessage.message_text);
                        }
                    }
                }
                res.status(200).send('EVENT_RECEIVED');
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
