"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaWebhook = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const messageNormalizer_1 = require("../helpers/messageNormalizer");
const kanbanOperations_1 = require("../helpers/kanbanOperations");
const botEngine_1 = require("../helpers/botEngine");
const tenantResolver_1 = require("../helpers/tenantResolver");
/**
 * META WEBHOOK HANDLER (Arquitectura Molde Maestro)
 */
exports.metaWebhook = functions.https.onRequest(async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g;
    // 1. VERIFICACIÓN (GET)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        const u = req.query['u'];
        const e = req.query['e'];
        let expectedToken = process.env.META_VERIFY_TOKEN || 'vg37e';
        if (u && e) {
            try {
                const db = admin.firestore();
                const configSnap = await db.doc(`users/${u}/entities/${e}/integrations/whatsapp`).get();
                if (configSnap.exists) {
                    expectedToken = ((_a = configSnap.data()) === null || _a === void 0 ? void 0 : _a.verifyToken) || expectedToken;
                }
            }
            catch (err) {
                functions.logger.error('[Meta Webhook Verify] Tenant fetch failed', err);
            }
        }
        if (mode === 'subscribe' && token === expectedToken) {
            res.status(200).send(challenge);
        }
        else {
            res.sendStatus(403);
        }
        return;
    }
    // 2. PROCESAMIENTO (POST)
    if (req.method === 'POST') {
        try {
            const body = req.body;
            if (!body.object || !body.entry) {
                res.status(400).send('INVALID_PAYLOAD');
                return;
            }
            const platform = (body.object === 'whatsapp_business_account' || body.object === 'whatsapp_business') ? 'whatsapp' : (body.object === 'instagram' ? 'instagram' : 'messenger');
            for (const entry of body.entry) {
                if (platform === 'whatsapp') {
                    for (const change of entry.changes || []) {
                        if (change.field !== 'messages')
                            continue;
                        const value = change.value;
                        if (!value || !value.messages)
                            continue;
                        const phoneNumberId = (_b = value.metadata) === null || _b === void 0 ? void 0 : _b.phone_number_id;
                        const wabaId = entry.id;
                        // A. RESOLVER INQUILINO (Prioridad 1: Búsqueda Global por Phone ID - Regla 1)
                        let u;
                        let e;
                        const tenant = await (0, tenantResolver_1.resolveTenant)('whatsapp', phoneNumberId, wabaId);
                        if (tenant) {
                            u = tenant.userId;
                            e = tenant.entityId;
                        }
                        else {
                            // Backup: Trust the URL only if global search fails (Rule 4 Fallback)
                            u = req.query['u'];
                            e = req.query['e'];
                        }
                        if (!u || !e) {
                            functions.logger.warn(`[WhatsApp] ❌ Abort: Unresolved Tenant for ID: ${phoneNumberId}`);
                            continue;
                        }
                        // B. AUDITORIA EN BÓVEDA
                        try {
                            const db = admin.firestore();
                            await db.collection(`users/${u}/entities/${e}/system_logs`).add({
                                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                                type: 'whatsapp_webhook_incoming',
                                platform,
                                phoneId: phoneNumberId,
                                raw: JSON.stringify(body).substring(0, 1500)
                            });
                        }
                        catch (logErr) { }
                        // C. PROCESAR MENSAJES
                        const contactName = ((_e = (_d = (_c = value.contacts) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.profile) === null || _e === void 0 ? void 0 : _e.name) || 'Cliente WhatsApp';
                        for (const msg of value.messages) {
                            if (!msg.id || msg.is_echo || msg.from === phoneNumberId)
                                continue;
                            const unified = (0, messageNormalizer_1.normalizeWhatsAppMessage)(msg, contactName);
                            // handleKanbanUpdateOmni se encarga de buscar/crear cards y sincronizar CRM
                            const result = await (0, kanbanOperations_1.handleKanbanUpdateOmni)(unified, u, e);
                            if (result === null || result === void 0 ? void 0 : result.success) {
                                await (0, botEngine_1.tryTriggerBot)(u, e, 'whatsapp', unified.external_id, unified.message_text, msg.id, { mediaUrl: unified.media_url, type: unified.message_type });
                            }
                        }
                    }
                }
                else if (entry.messaging) {
                    const event = entry.messaging[0];
                    const recipientId = (_f = event.recipient) === null || _f === void 0 ? void 0 : _f.id;
                    let u = req.query['u'];
                    let e = req.query['e'];
                    if (!u || !e) {
                        const tenant = await (0, tenantResolver_1.resolveTenant)(platform, recipientId);
                        if (tenant) {
                            u = tenant.userId;
                            e = tenant.entityId;
                        }
                    }
                    if (u && e) {
                        const unified = (0, messageNormalizer_1.normalizeMetaMessage)(event, platform);
                        const result = await (0, kanbanOperations_1.handleKanbanUpdateOmni)(unified, u, e);
                        if (result === null || result === void 0 ? void 0 : result.success) {
                            await (0, botEngine_1.tryTriggerBot)(u, e, platform, unified.external_id, unified.message_text, (_g = event.message) === null || _g === void 0 ? void 0 : _g.mid, { type: unified.message_type });
                        }
                    }
                }
            }
            res.status(200).send('EVENT_RECEIVED');
        }
        catch (err) {
            functions.logger.error(`[Meta Webhook] 💥 Critical Error: ${err.message}`);
            res.status(500).send('INTERNAL_ERROR');
        }
    }
});
//# sourceMappingURL=meta.js.map