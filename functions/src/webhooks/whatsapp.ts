import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { handleKanbanUpdateOmni, updateReadStatus } from '../helpers/kanbanOmni';
import { getActiveBot, executeBotFlow } from '../helpers/botEngine';
import { UnifiedMessage } from '../types/message';

const FORTY_EIGHT_HOURS_IN_MS = 48 * 60 * 60 * 1000;

export const whatsappWebhook = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
    // --- VERIFICACIÓN DE WEBHOOK (GET) ---
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        const VERIFY_TOKEN = functions.config().whatsapp?.verify_token || 'malamia';

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            functions.logger.info('WhatsApp Webhook Verified (GET)');
            res.status(200).send(challenge);
            return;
        } else {
            functions.logger.warn('WhatsApp Verification Failed (GET)');
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
            const result = await handleKanbanUpdateOmni(unifiedMessage);

            if (!result.success) {
                functions.logger.warn(`[Kanban Sync] Validation failed or error for ${from}`);
                return;
            }

            const isNew = result.isNew;
            const cardId = result.cardId;

            functions.logger.info(`[Kanban Sync] WhatsApp Card ${isNew ? 'CREATED' : 'UPDATED'} (ID: ${cardId})`);

            // 3. Ejecutar Bot
            // Fetch complete card data to check bot state
            const db = admin.firestore();
            // We need to find the card. If handleKanbanUpdateOmni returned cardId, we can find it directly.
            // Since cardId is unique in the subcollection, but we don't know the Group ID easily without querying or returning it.
            // But wait, handleKanbanUpdateOmni creates it, so we can find it.

            // To be safe and fast, let's query by ID across groups
            const cardQuery = db.collectionGroup('cards').where('platform_ids.whatsapp', '==', from).limit(1);
            const cardSnap = await cardQuery.get();

            if (!cardSnap.empty) {
                const cardDoc = cardSnap.docs[0];
                const cardData = { id: cardDoc.id, ...cardDoc.data() } as any;

                const activeBot = await getActiveBot();
                if (activeBot) {
                    const now = new Date();
                    let shouldRestart = false;

                    if (isNew) {
                        shouldRestart = true;
                    } else if (cardData.botState?.lastInteraction) {
                        const lastInteraction = cardData.botState.lastInteraction.toDate
                            ? cardData.botState.lastInteraction.toDate()
                            : new Date(0);
                        if ((now.getTime() - lastInteraction.getTime()) > FORTY_EIGHT_HOURS_IN_MS) {
                            shouldRestart = true;
                        }
                    } else if (!cardData.botState) {
                        shouldRestart = true;
                    }

                    if (shouldRestart || cardData.botState?.status === 'active') {
                        if (shouldRestart) {
                            // Reset bot state in DB
                            await cardDoc.ref.update({ botState: admin.firestore.FieldValue.delete() });
                            delete cardData.botState;
                        }
                        await executeBotFlow(activeBot, from, cardData, body);
                    }
                }
            } else {
                functions.logger.error(`[Bot Error] Could not find card ${cardId} after creation/update.`);
            }

        } catch (error) {
            functions.logger.error('Error in whatsappWebhook processing:', error);
        }
    } else {
        res.sendStatus(405);
    }
});
