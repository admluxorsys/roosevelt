import * as functions from 'firebase-functions';
import { normalizeTelegramMessage } from '../helpers/messageNormalizer';
import { handleKanbanUpdateOmni } from '../helpers/kanbanOmni';
import { tryTriggerBot } from '../helpers/botEngine';
import { resolveTenant } from '../helpers/tenantResolver';

/**
 * TELEGRAM WEBHOOK HANDLER
 * 
 * URL: https://[project-id].cloudfunctions.net/telegramWebhook
 */

export const telegramWebhook = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
    if (req.method === 'POST') {
        const secretToken = (req.headers['x-telegram-bot-api-secret-token'] as string) || 'malamia';
        
        // --- RESOLUCIÓN DE INQUILINO (TENANT RESOLUTION) ---
        const tenant = await resolveTenant('telegram', secretToken);
        
        if (!tenant) {
            functions.logger.error(`[Telegram Webhook] No mapping found for secret token: ${secretToken}`);
        }

        const userId = tenant?.userId || 'legacy';
        const entityId = tenant?.entityId || 'roosevelt';

        const update = req.body;

        if (update.message) {
            functions.logger.info('Received Telegram message', update.message);
            try {
                const unifiedMsg = normalizeTelegramMessage(update.message);
                const cardResult = await handleKanbanUpdateOmni(unifiedMsg, userId, entityId);

                if (cardResult && cardResult.success) {
                    await tryTriggerBot(userId, entityId, 'telegram', unifiedMsg.external_id, unifiedMsg.message_text);
                }
                res.sendStatus(200);
            } catch (error) {
                functions.logger.error('Error processing Telegram webhook', error);
                res.sendStatus(500);
            }
        } else {
            // Acknowledge other updates (edits, typing, etc.)
            res.sendStatus(200);
        }
    } else {
        res.sendStatus(405);
    }
});
