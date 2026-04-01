"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webchatWebhook = void 0;
const functions = require("firebase-functions");
const messageNormalizer_1 = require("../helpers/messageNormalizer");
const kanbanOperations_1 = require("../helpers/kanbanOperations");
const botEngine_1 = require("../helpers/botEngine");
const tenantResolver_1 = require("../helpers/tenantResolver");
/**
 * WEB CHAT WEBHOOK HANDLER
 *
 * Receives messages from the custom website widget.
 * URL: https://[project-id].cloudfunctions.net/webchatWebhook
 */
// Simple in-memory rate limiting check could go here, or Auth check
// For now, assuming direct post from widget secured by CORS/Origin check in Firebase Config
exports.webchatWebhook = functions.https.onRequest(async (req, res) => {
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
            const tenant = await (0, tenantResolver_1.resolveTenant)('webchat', platformId);
            const userId = (tenant === null || tenant === void 0 ? void 0 : tenant.userId) || 'legacy';
            const entityId = (tenant === null || tenant === void 0 ? void 0 : tenant.entityId) || 'roosevelt';
            const unifiedMsg = (0, messageNormalizer_1.normalizeWebChatMessage)(body);
            const cardResult = await (0, kanbanOperations_1.handleKanbanUpdateOmni)(unifiedMsg, userId, entityId);
            // Trigger Bot (Unified Logic)
            if (cardResult && cardResult.success) {
                await (0, botEngine_1.tryTriggerBot)(userId, entityId, 'webchat', unifiedMsg.external_id, unifiedMsg.message_text);
            }
            res.status(200).json({ success: true });
        }
        catch (error) {
            functions.logger.error('Error processing WebChat webhook', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    else {
        res.sendStatus(405);
    }
});
//# sourceMappingURL=webchat.js.map