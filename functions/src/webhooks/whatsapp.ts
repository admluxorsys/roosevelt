import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { handleKanbanUpdateOmni, updateReadStatus } from '../helpers/kanbanOmni';
import { getActiveBot, executeBotFlow, resolveCardRef } from '../helpers/botEngine';
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
            const cardRef = await resolveCardRef(from);

            if (cardRef) {
                const cardSnap = await cardRef.get();
                const cardData = { id: cardRef.id, ...cardSnap.data() } as any;

                const activeBot = await getActiveBot();
                if (activeBot) {
                    const now = new Date();
                    
                    const input = body.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const isCommand = input === 'reinicia todo ahora' || input === 'reiniciar' || input === 'reset';
                    
                    const botStatus = cardData.botState?.status || 'none';
                    let shouldTrigger = false;

                    // --- LIFECYCLE TRIGGER CONDITIONS ---
                    if (isCommand) {
                        shouldTrigger = true;
                    } else if (botStatus === 'completed') {
                        functions.logger.info(`[Lifecycle] Session is completed for ${from}, skipping bot execution.`);
                        shouldTrigger = false;
                    } else if (isNew || botStatus === 'none') {
                        shouldTrigger = true;
                    } else if (botStatus === 'active') {
                        shouldTrigger = true;
                    } else if (cardData.botState?.lastInteraction) {
                        const lastInt = cardData.botState.lastInteraction.toDate ? cardData.botState.lastInteraction.toDate() : new Date(0);
                        if ((now.getTime() - lastInt.getTime()) > FORTY_EIGHT_HOURS_IN_MS) {
                            shouldTrigger = true;
                        }
                    }

                    if (shouldTrigger) {
                        // Reset state if it's starting a fresh session from none
                        const needsReset = isNew || botStatus === 'none';
                        
                        if (needsReset && cardData.botState) {
                            functions.logger.info(`[Webhook] Resetting bot state for ${from} (Reason: New/None Session)`);
                            await cardRef.update({ botState: admin.firestore.FieldValue.delete() });
                            delete cardData.botState;
                        }
                        
                        await executeBotFlow(activeBot, from, cardData, body, message.id, { mediaUrl, type: msgType });
                    }
                } else {
                    functions.logger.warn(`[Webhook] No active chatbot found in DB for ${from}. Skipping bot execution.`);
                }
            } else {
                functions.logger.error(`[Bot Error] Could not find card for ${from} after creation/update.`);
            }
        } catch (error) {
            functions.logger.error('Error in whatsappWebhook processing:', error);
        }
    } else {
        res.sendStatus(405);
    }
});
