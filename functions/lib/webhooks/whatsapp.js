"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappWebhook = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const messageNormalizer_1 = require("../helpers/messageNormalizer");
const kanbanOperations_1 = require("../helpers/kanbanOperations");
const botEngine_1 = require("../helpers/botEngine");
const tenantResolver_1 = require("../helpers/tenantResolver");
/**
 * OLD WHATSAPP WEBHOOK HANDLER
 * (Maintain for backward compatibility but migrate to Meta Webhook)
 */
exports.whatsappWebhook = functions.https.onRequest(async (req, res) => {
    var _a, _b, _c, _d;
    // 1. VERIFICACIÓN (GET)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'vg37e';
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
            if (!body.entry) {
                res.status(400).send('INVALID_PAYLOAD');
                return;
            }
            for (const entry of body.entry) {
                for (const change of entry.changes || []) {
                    if (change.field !== 'messages')
                        continue;
                    const value = change.value;
                    if (!value || !value.messages)
                        continue;
                    const phoneNumberId = (_a = value.metadata) === null || _a === void 0 ? void 0 : _a.phone_number_id;
                    const wabaId = entry.id;
                    // A. RESOLVER INQUILINO (Prioridad 1: Búsqueda Global - Regla 1)
                    let u;
                    let e;
                    const tenant = await (0, tenantResolver_1.resolveTenant)('whatsapp', phoneNumberId, wabaId);
                    if (tenant) {
                        u = tenant.userId;
                        e = tenant.entityId;
                    }
                    else {
                        // Backup: URL context (Rule 4 Fallback)
                        u = req.query['u'];
                        e = req.query['e'];
                    }
                    if (!u || !e) {
                        functions.logger.warn(`[WhatsApp] ❌ Abort: Unresolved Tenant for ID: ${phoneNumberId}`);
                        continue;
                    }
                    // B. AUDITORIA EN BÓVEDA (Regla 7 - No Roots)
                    try {
                        const db = admin.firestore();
                        await db.collection(`users/${u}/entities/${e}/system_logs`).add({
                            timestamp: admin.firestore.FieldValue.serverTimestamp(),
                            type: 'whatsapp_legacy_webhook',
                            phoneId: phoneNumberId,
                            raw: JSON.stringify(body).substring(0, 1500)
                        });
                    }
                    catch (logErr) { }
                    // C. PROCESAR MENSAJES
                    const contactName = ((_d = (_c = (_b = value.contacts) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.profile) === null || _d === void 0 ? void 0 : _d.name) || 'Cliente WhatsApp';
                    for (const msg of value.messages) {
                        if (!msg.id || msg.is_echo || msg.from === phoneNumberId)
                            continue;
                        const unified = (0, messageNormalizer_1.normalizeWhatsAppMessage)(msg, contactName);
                        const result = await (0, kanbanOperations_1.handleKanbanUpdateOmni)(unified, u, e);
                        if (result === null || result === void 0 ? void 0 : result.success) {
                            await (0, botEngine_1.tryTriggerBot)(u, e, 'whatsapp', unified.external_id, unified.message_text, msg.id, { mediaUrl: unified.media_url, type: unified.message_type });
                        }
                    }
                }
            }
            res.status(200).send('EVENT_RECEIVED');
        }
        catch (err) {
            functions.logger.error(`[WhatsApp Legacy Webhook] 💥 Critical Error: ${err.message}`);
            res.status(500).send('INTERNAL_ERROR');
        }
    }
});
//# sourceMappingURL=whatsapp.js.map