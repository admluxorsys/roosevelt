import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { UnifiedMessage } from '../types/message';
import { handleKanbanUpdateOmni } from '../helpers/kanbanOperations';
import { tryTriggerBot } from '../helpers/botEngine';

/**
 * BAILEYS WEBHOOK HANDLER (Internal)
 * Receives messages from the local WhatsApp service (Baileys)
 * and injects them into the Master Mold architecture.
 */
export const baileysWebhook = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
    if (req.method !== 'POST') {
        res.sendStatus(405);
        return;
    }

    try {
        const { userId, entityId, message, event } = req.body;

        if (!userId || !entityId) {
            functions.logger.warn('[Baileys Webhook] Missing context (userId/entityId)', req.body);
            res.status(400).send('Missing context');
            return;
        }

        const db = admin.firestore();

        if (event === 'connection_open') {
            functions.logger.info(`[Baileys Webhook] Connection established for Entity: ${entityId} (Type: ${req.body.type})`);
            const integrationType = req.body.type === 'business' ? 'whatsapp_qr_business' : 'whatsapp_qr_personal';
            const integrationPath = `users/${userId}/entities/${entityId}/integrations/${integrationType}`;
            
            await db.doc(integrationPath).set({
                status: 'Connected',
                phoneNumber: req.body.phoneNumber || 'N/A',
                last_connection: FieldValue.serverTimestamp(),
                updated_at: FieldValue.serverTimestamp()
            }, { merge: true });

            res.status(200).send('CONNECTED_OK');
            return;
        }

        if (event === 'connection_closed') {
            functions.logger.info(`[Baileys Webhook] Connection closed for Entity: ${entityId}`);
            const integrationType = req.body.type === 'business' ? 'whatsapp_qr_business' : 'whatsapp_qr_personal';
            const integrationPath = `users/${userId}/entities/${entityId}/integrations/${integrationType}`;
            
            await db.doc(integrationPath).set({
                status: 'Offline',
                updated_at: FieldValue.serverTimestamp()
            }, { merge: true });

            res.status(200).send('CLOSED_OK');
            return;
        }

        if (!message) {
            res.status(400).send('Missing message payload');
            return;
        }

        // 2. Normalize into UnifiedMessage
        const unifiedMessage: UnifiedMessage = {
            source_platform: 'whatsapp',
            external_id: message.from,
            contact_name: message.contactName || 'Cliente WhatsApp',
            message_text: message.text || '',
            message_type: message.type || 'text',
            timestamp: new Date(message.timestamp || Date.now()),
            media_url: message.mediaUrl
        };

        functions.logger.info(`[Baileys Webhook] Processing message for Entity: ${entityId}`, unifiedMessage);

        // 3. Update Kanban/Omnichannel (Rule 4: Isolated Storage)
        const cardResult = await handleKanbanUpdateOmni(unifiedMessage, userId, entityId);

        // 4. Trigger Bot (Unified Logic)
        if (cardResult?.success) {
            await tryTriggerBot(userId, entityId, 'whatsapp', unifiedMessage.external_id, unifiedMessage.message_text);
        }

        res.status(200).send('OK');
    } catch (error) {
        functions.logger.error('[Baileys Webhook] Global Error:', error);
        res.status(500).send('Internal Server Error');
    }
});
