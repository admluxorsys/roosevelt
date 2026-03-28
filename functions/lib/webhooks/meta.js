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
    var _a, _b, _c, _d, _e, _f, _g;
    // 1. VERIFICATION REQUEST (GET)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        const userId = req.query['u'];
        const entityId = req.query['e'];
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
                            if (change.field === 'messages' && ((_a = change.value) === null || _a === void 0 ? void 0 : _a.messages)) {
                                const webhookEvent = change.value;
                                const phoneNumberId = (_b = webhookEvent.metadata) === null || _b === void 0 ? void 0 : _b.phone_number_id;
                                // --- TENANT RESOLUTION ---
                                let userId = req.query['u'];
                                let entityId = req.query['e'];
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
                                const contactName = ((_e = (_d = (_c = webhookEvent.contacts) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.profile) === null || _e === void 0 ? void 0 : _e.name) || 'Cliente WhatsApp';
                                const unifiedMessage = (0, messageNormalizer_1.normalizeWhatsAppMessage)((_f = webhookEvent.messages) === null || _f === void 0 ? void 0 : _f[0], contactName);
                                const cardResult = await (0, kanbanOmni_1.handleKanbanUpdateOmni)(unifiedMessage, userId, entityId);
                                if (cardResult === null || cardResult === void 0 ? void 0 : cardResult.success) {
                                    await (0, botEngine_1.tryTriggerBot)(userId, entityId, 'whatsapp', unifiedMessage.external_id, unifiedMessage.message_text);
                                }
                            }
                        }
                    }
                    else if (webhookEvent) {
                        functions.logger.info(`Received ${platform} message`, webhookEvent);
                        // --- RESOLUCIÓN DE INQUILINO (TENANT RESOLUTION) ---
                        const recipientId = (_g = webhookEvent.recipient) === null || _g === void 0 ? void 0 : _g.id;
                        const tenant = await (0, tenantResolver_1.resolveTenant)(platform, recipientId);
                        if (!tenant) {
                            functions.logger.error(`[Meta Webhook] No mapping found for ${platform}:${recipientId}. Initializing or dropping.`);
                            // En un sistema estricto, retornaríamos aquí. 
                            // Para el "Master Mold", necesitamos que exista el mapeo.
                            continue;
                        }
                        const { userId, entityId } = tenant;
                        // --- NORMALIZATION & PROCESSING ---
                        const unifiedMessage = (0, messageNormalizer_1.normalizeMetaMessage)(webhookEvent, platform);
                        const cardResult = await (0, kanbanOmni_1.handleKanbanUpdateOmni)(unifiedMessage, userId, entityId);
                        // --- BOT TRIGGER (Unified) ---
                        if (cardResult && cardResult.success) {
                            await (0, botEngine_1.tryTriggerBot)(userId, entityId, platform, unifiedMessage.external_id, unifiedMessage.message_text);
                        }
                    }
                }
                res.status(200).send('EVENT_RECEIVED');
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