import * as functions from 'firebase-functions';
import { normalizeWebChatMessage } from '../helpers/messageNormalizer';
import { handleKanbanUpdateOmni } from '../helpers/kanbanOmni';
import { tryTriggerBot } from '../helpers/botEngine';
import { resolveTenant } from '../helpers/tenantResolver';

/**
 * WEB CHAT WEBHOOK HANDLER
 * 
 * Receives messages from the custom website widget.
 * URL: https://[project-id].cloudfunctions.net/webchatWebhook
 */

// Simple in-memory rate limiting check could go here, or Auth check
// For now, assuming direct post from widget secured by CORS/Origin check in Firebase Config

export const webchatWebhook = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*'); // Secure this in production!
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method === 'POST') {
        try {
            const body = req.body;
            // Expected body: { sessionId, text, visitorName?, attachments? }

            if (!body.sessionId || !body.text) {
                res.status(400).send('Missing required fields');
                return;
            }

            functions.logger.info('Received WebChat message', body);

            // For WebChat, we resolve tenant by sessionId OR a dedicated widgetId
            // If body.entityId is provided by widget, we use it directly, but still resolve mapping for userId
            const platformId = body.widgetId || body.entityId || 'default';
            const tenant = await resolveTenant('webchat', platformId);
            const userId = tenant?.userId || 'legacy';
            const entityId = tenant?.entityId || 'roosevelt';

            const unifiedMsg = normalizeWebChatMessage(body);
            const cardResult = await handleKanbanUpdateOmni(unifiedMsg, userId, entityId);

            // Trigger Bot (Unified Logic)
            if (cardResult && cardResult.success) {
                await tryTriggerBot(userId, entityId, 'webchat', unifiedMsg.external_id, unifiedMsg.message_text);
            }

            res.status(200).json({ success: true });
        } catch (error) {
            functions.logger.error('Error processing WebChat webhook', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.sendStatus(405);
    }
});
