"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaWebhook = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const messageNormalizer_1 = require("../helpers/messageNormalizer");
const kanbanOmni_1 = require("../helpers/kanbanOmni");
const botEngine_1 = require("../helpers/botEngine");
const tenantResolver_1 = require("../helpers/tenantResolver");
/**
 * META WEBHOOK HANDLER
 * Supports: Instagram Graph API, Facebook Graph API (Messenger)
 *
 * URL: https://[project-id].cloudfunctions.net/metaWebhook
 */
exports.metaWebhook = functions.https.onRequest(async (req, res) => {
    var _a, _b, _c, _d, _e;
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
        const userId = req.query['u'];
        const entityId = req.query['e'];
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
                    if (data === null || data === void 0 ? void 0 : data.verifyToken) {
                        expectedToken = data.verifyToken;
                    }
                }
            }
            catch (error) {
                functions.logger.error('[Meta Webhook Verify] Error fetching tenant config', error);
            }
        }
        if (mode === 'subscribe' && token === expectedToken) {
            functions.logger.info(`Meta Webhook Verified (GET) for Tenant: ${userId || 'master'}`);
            res.status(200).send(challenge);
        }
        else {
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
                            if (change.field !== 'messages')
                                continue;
                            const value = change.value;
                            if (!value || !value.messages)
                                continue;
                            // 1. RESOLVE TENANT (Search or URL Fallback)
                            let userId = req.query['u'];
                            let entityId = req.query['e'];
                            const phoneNumberId = (_a = value.metadata) === null || _a === void 0 ? void 0 : _a.phone_number_id;
                            const businessAccountId = entry.id;
                            const tenant = await (0, tenantResolver_1.resolveTenant)('whatsapp', phoneNumberId, businessAccountId);
                            if (tenant) {
                                userId = tenant.userId;
                                entityId = tenant.entityId;
                            }
                            if (!userId || !entityId) {
                                functions.logger.warn(`[WhatsApp Webhook] Unresolved tenant for ${phoneNumberId}.`);
                                continue;
                            }
                            // 2. PROCESS MESSAGES
                            const contactName = ((_d = (_c = (_b = value.contacts) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.profile) === null || _d === void 0 ? void 0 : _d.name) || 'Cliente WhatsApp';
                            for (const msg of value.messages) {
                                if (!msg.id) {
                                    functions.logger.warn(`[WhatsApp Webhook] Skipping message without ID`, msg);
                                    continue;
                                }
                                try {
                                    functions.logger.info(`[WhatsApp Webhook] Processing msg ${msg.id} from ${msg.from}`);
                                    const unifiedMessage = (0, messageNormalizer_1.normalizeWhatsAppMessage)(msg, contactName);
                                    const cardResult = await (0, kanbanOmni_1.handleKanbanUpdateOmni)(unifiedMessage, userId, entityId);
                                    functions.logger.info(`[WhatsApp Webhook] ✅ Kanban updated. CardId: ${cardResult === null || cardResult === void 0 ? void 0 : cardResult.cardId}, isNew: ${cardResult === null || cardResult === void 0 ? void 0 : cardResult.isNew}`);
                                    if (cardResult === null || cardResult === void 0 ? void 0 : cardResult.success) {
                                        await (0, botEngine_1.tryTriggerBot)(userId, entityId, 'whatsapp', unifiedMessage.external_id, unifiedMessage.message_text, msg.id, { mediaUrl: unifiedMessage.media_url, type: unifiedMessage.message_type });
                                    }
                                }
                                catch (msgErr) {
                                    functions.logger.error(`[WhatsApp Webhook] ❌ Failed to process msg ${msg.id}: ${msgErr.message}`);
                                }
                            }
                        }
                    }
                    else if (webhookEvent) {
                        functions.logger.info(`Received ${platform} message`, webhookEvent);
                        // --- RESOLUCIÓN DE INQUILINO (TENANT RESOLUTION) ---
                        const recipientId = (_e = webhookEvent.recipient) === null || _e === void 0 ? void 0 : _e.id;
                        let userId = req.query['u'];
                        let entityId = req.query['e'];
                        if (!userId || !entityId) {
                            const tenant = await (0, tenantResolver_1.resolveTenant)(platform, recipientId);
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
                        const unifiedMessage = (0, messageNormalizer_1.normalizeMetaMessage)(webhookEvent, platform);
                        const cardResult = await (0, kanbanOmni_1.handleKanbanUpdateOmni)(unifiedMessage, userId, entityId);
                        // --- BOT TRIGGER (Unified) ---
                        if (cardResult && cardResult.success) {
                            await (0, botEngine_1.tryTriggerBot)(userId, entityId, platform, unifiedMessage.external_id, unifiedMessage.message_text);
                        }
                    }
                }
                // res.status(200).send('EVENT_RECEIVED'); // Moved to top
            }
            else {
                res.sendStatus(404);
            }
        }
        catch (error) {
            functions.logger.error('Error processing Meta webhook', error);
            res.sendStatus(500);
        }
    }
    else {
        res.sendStatus(405);
    }
});
//# sourceMappingURL=meta.js.map