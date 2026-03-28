"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramWebhook = void 0;
const functions = require("firebase-functions");
const messageNormalizer_1 = require("../helpers/messageNormalizer");
const kanbanOmni_1 = require("../helpers/kanbanOmni");
const botEngine_1 = require("../helpers/botEngine");
const tenantResolver_1 = require("../helpers/tenantResolver");
/**
 * TELEGRAM WEBHOOK HANDLER
 *
 * URL: https://[project-id].cloudfunctions.net/telegramWebhook
 */
exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method === 'POST') {
        const secretToken = req.headers['x-telegram-bot-api-secret-token'] || 'malamia';
        // --- RESOLUCIÓN DE INQUILINO (TENANT RESOLUTION) ---
        const tenant = await (0, tenantResolver_1.resolveTenant)('telegram', secretToken);
        if (!tenant) {
            functions.logger.error(`[Telegram Webhook] No mapping found for secret token: ${secretToken}`);
        }
        const userId = (tenant === null || tenant === void 0 ? void 0 : tenant.userId) || 'legacy';
        const entityId = (tenant === null || tenant === void 0 ? void 0 : tenant.entityId) || 'roosevelt';
        const update = req.body;
        if (update.message) {
            functions.logger.info('Received Telegram message', update.message);
            try {
                const unifiedMsg = (0, messageNormalizer_1.normalizeTelegramMessage)(update.message);
                const cardResult = await (0, kanbanOmni_1.handleKanbanUpdateOmni)(unifiedMsg, userId, entityId);
                if (cardResult && cardResult.success) {
                    await (0, botEngine_1.tryTriggerBot)(userId, entityId, 'telegram', unifiedMsg.external_id, unifiedMsg.message_text);
                }
                res.sendStatus(200);
            }
            catch (error) {
                functions.logger.error('Error processing Telegram webhook', error);
                res.sendStatus(500);
            }
        }
        else {
            // Acknowledge other updates (edits, typing, etc.)
            res.sendStatus(200);
        }
    }
    else {
        res.sendStatus(405);
    }
});
//# sourceMappingURL=telegram.js.map