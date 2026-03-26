import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { handleKanbanUpdateOmni, updateReadStatus } from '../helpers/kanbanOmni';
import { tryTriggerBot } from '../helpers/botEngine';
import { UnifiedMessage } from '../types/message';



export const whatsappWebhook = functions.runWith({ invoker: 'public' }).https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
    // --- VERIFICACIÓN DE WEBHOOK (GET) ---
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        const userId = req.query['u'] as string;
        const entityId = req.query['e'] as string;

        let expectedToken = functions.config().whatsapp?.verify_token || 'malamia';

        // Caso 1: Se proveen IDs de inquilino (Requisito estricto por falta de índices)
        if (userId && entityId) {
            try {
                const db = admin.firestore();
                // Check both public and internal for the token
                const [publicSnap, internalSnap] = await Promise.all([
                    db.doc(`users/${userId}/entities/${entityId}/integrations/whatsapp`).get(),
                    db.doc(`users/${userId}/entities/${entityId}/integrations/whatsapp_internal`).get()
                ]);

                if (publicSnap.exists && publicSnap.data()?.verifyToken === token) {
                    expectedToken = token as string;
                } else if (internalSnap.exists && internalSnap.data()?.verifyToken === token) {
                    expectedToken = token as string;
                }
            } catch (error) {
                functions.logger.error('[Webhook Verify] Error fetching tenant config', error);
            }
        } else {
            functions.logger.error('[Webhook Verify] Missing u or e parameters. Universal webhook requires indexing.');
        }

        if (mode === 'subscribe' && token === expectedToken) {
            functions.logger.info(`✅ [Verification Success] Hub Token: ${token}, Expected: ${expectedToken}, User: ${userId}`);

            res.status(200).send(challenge);
            return;
        } else {
            functions.logger.warn(`❌ [Verification Failed] Hub Token: ${token}, Expected: ${expectedToken}, User: ${userId}`);
            res.sendStatus(403);
            return;
        }
    }

    // --- RECEPCIÓN DE EVENTOS (POST) ---
    if (req.method === 'POST') {
        functions.logger.info('📩 [Webhook] Request received');
        res.status(200).send('EVENT_RECEIVED');

        const requestBody = req.body;
        if (!requestBody || !requestBody.entry) {
            functions.logger.warn('[Webhook] Empty or invalid body received');
            return;
        }

        const { entry } = requestBody;
        const change = entry?.[0]?.changes?.[0]?.value;
        if (!change) return;

        const metadata = change.metadata;
        const recipientPhoneNumberId = metadata?.phone_number_id;

        if (!recipientPhoneNumberId) {
            functions.logger.warn('[Webhook] No recipient phone_number_id found in metadata');
            return;
        }

        // --- RESOLUCIÓN DE INQUILINO DIRECTA (Vía URL) ---
        // Evitamos usar collectionGroup para eludir el error de "Index Required" de Firestore
        const userId = req.query['u'] as string;
        const entityId = req.query['e'] as string;

        if (!userId || !entityId) {
            functions.logger.error(`[WhatsApp Webhook] Missing u/e parameters in POST request.`);
            return;
        }

        functions.logger.info(`[Webhook] Resolved Tenant directly from URL: User=${userId}, Entity=${entityId}`);

        // --- CASO 1: MANEJO DE ESTADOS (READ, DELIVERED, SENT) ---
        if (change.statuses && change.statuses.length > 0) {
            const statusUpdate = change.statuses[0];
            const status = statusUpdate.status;
            const messageId = statusUpdate.id;
            const recipientId = statusUpdate.recipient_id;

            functions.logger.info(`[Status Update] ${status} for message ${messageId}`);

            const db = admin.firestore();
            const cardQuery = db.collectionGroup('cards').where('platform_ids.whatsapp', '==', recipientId).limit(1);
            const snap = await cardQuery.get();

            if (!snap.empty) {
                const cardDoc = snap.docs[0];
                const messages = cardDoc.data().messages || [];
                let changed = false;

                const updatedMessages = messages.map((m: any) => {
                    if (m.whatsappMessageId === messageId) {
                        changed = true;
                        return { ...m, status: status };
                    }
                    return m;
                });

                if (changed) {
                    await cardDoc.ref.update({ messages: updatedMessages });
                }

                if (status === 'read') {
                    await updateReadStatus(recipientId, 'whatsapp');
                }
            }
            return;
        }

        // --- CASO 2: MANEJO DE MENSAJES ENTRANTES ---
        const message = change.messages?.[0];
        if (!message) return;

        const contact = change.contacts?.[0];
        const from = message.from; // Formato: 593963142795
        const contactName = contact?.profile?.name || 'Usuario WhatsApp';

        // EXTRACCIÓN DEL MENSAJE Y NORMALIZACIÓN
        let body = '';
        let mediaUrl = undefined;
        let msgType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'interactive' | 'unknown' = 'text';

        if (message.type === 'text') {
            body = message.text.body;
            msgType = 'text';
        } else if (message.type === 'interactive') {
            const interactive = message.interactive;
            body = interactive.button_reply?.title || interactive.list_reply?.title || '[Interacción]';
            msgType = 'interactive';
        } else if (['image', 'video', 'audio', 'voice', 'document', 'sticker'].includes(message.type)) {
            msgType = message.type === 'voice' ? 'audio' : message.type;
            body = message[message.type]?.caption || `[${message.type.toUpperCase()}]`;
            // Note: Media URL retrieval often requires an extra API call to Meta to get the DL URL
            // For now we just store the ID or caption. 
            // In a full implementation, we fetch the media URL here. 
            mediaUrl = message[message.type]?.id;
        } else {
            body = `[Mensaje tipo: ${message.type}]`;
            msgType = 'unknown';
        }

        functions.logger.info(`📩 WhatsApp Webhook: ${from} -> "${body}"`);

        try {
            // 1. Crear Objeto Unificado
            const unifiedMessage: UnifiedMessage = {
                source_platform: 'whatsapp',
                external_id: from,
                contact_name: contactName,
                message_text: body,
                message_type: msgType,
                timestamp: new Date(parseInt(message.timestamp) * 1000),
                media_url: mediaUrl,
                platform_metadata: message
            };

            // 2. Gestionar Tarjeta en Kanban (Omnichannel)
            const result = await handleKanbanUpdateOmni(unifiedMessage, userId, entityId);

            if (!result.success) {
                functions.logger.warn(`[Kanban Sync] Validation failed or error for ${from}`);
                return;
            }

            const isNew = result.isNew;
            const cardId = result.cardId;

            functions.logger.info(`[Kanban Sync] WhatsApp Card ${isNew ? 'CREATED' : 'UPDATED'} (ID: ${cardId})`);

            // 3. Ejecutar Bot (Unified Logic)
            await tryTriggerBot(userId, entityId, 'whatsapp', from, body, message.id, { mediaUrl, type: msgType });
        } catch (error) {
            functions.logger.error('Error in whatsappWebhook processing:', error);
        }
    } else {
        res.sendStatus(405);
    }
});
