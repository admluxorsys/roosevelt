"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappWebhook = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const kanbanOmni_1 = require("../helpers/kanbanOmni");
const botEngine_1 = require("../helpers/botEngine");
const tenantResolver_1 = require("../helpers/tenantResolver");
exports.whatsappWebhook = functions.runWith({ invoker: 'public' }).https.onRequest(async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    // --- VERIFICACIÓN DE WEBHOOK (GET) ---
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        const userId = req.query['u'];
        const entityId = req.query['e'];
        let expectedToken = ((_a = functions.config().whatsapp) === null || _a === void 0 ? void 0 : _a.verify_token) || 'malamia';
        // Caso 1: Se proveen IDs de inquilino (Requisito estricto por falta de índices)
        if (userId && entityId) {
            try {
                const db = admin.firestore();
                // Check both public and internal for the token
                const [publicSnap, internalSnap] = await Promise.all([
                    db.doc(`users/${userId}/entities/${entityId}/integrations/whatsapp`).get(),
                    db.doc(`users/${userId}/entities/${entityId}/integrations/whatsapp_internal`).get()
                ]);
                if (publicSnap.exists && ((_b = publicSnap.data()) === null || _b === void 0 ? void 0 : _b.verifyToken) === token) {
                    expectedToken = token;
                }
                else if (internalSnap.exists && ((_c = internalSnap.data()) === null || _c === void 0 ? void 0 : _c.verifyToken) === token) {
                    expectedToken = token;
                }
            }
            catch (error) {
                functions.logger.error('[Webhook Verify] Error fetching tenant config', error);
            }
        }
        else {
            functions.logger.error('[Webhook Verify] Missing u or e parameters. Universal webhook requires indexing.');
        }
        if (mode === 'subscribe' && token === expectedToken) {
            functions.logger.info(`✅ [Verification Success] Hub Token: ${token}, Expected: ${expectedToken}, User: ${userId}`);
            res.status(200).send(challenge);
            return;
        }
        else {
            functions.logger.warn(`❌ [Verification Failed] Hub Token: ${token}, Expected: ${expectedToken}, User: ${userId}`);
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
        const change = (_f = (_e = (_d = entry === null || entry === void 0 ? void 0 : entry[0]) === null || _d === void 0 ? void 0 : _d.changes) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.value;
        if (!change)
            return;
        const metadata = change.metadata;
        const recipientPhoneNumberId = metadata === null || metadata === void 0 ? void 0 : metadata.phone_number_id;
        if (!recipientPhoneNumberId) {
            functions.logger.warn('[Webhook] No recipient phone_number_id found in metadata');
            return;
        }
        // --- RESOLUCIÓN DE INQUILINO (TENANT RESOLUTION) ---
        // 1. Intentar resolver por phoneNumberId (Maestra de Mapeos)
        const tenant = await (0, tenantResolver_1.resolveTenant)('whatsapp', recipientPhoneNumberId);
        let userId = req.query['u'];
        let entityId = req.query['e'];
        if (tenant) {
            userId = tenant.userId;
            entityId = tenant.entityId;
            functions.logger.info(`[WhatsApp Webhook] Resolved Tenant from Mapping: User=${userId}, Entity=${entityId}`);
        }
        else if (userId && entityId) {
            functions.logger.info(`[Webhook] Resolved Tenant directly from URL: User=${userId}, Entity=${entityId}`);
        }
        else {
            functions.logger.error(`[WhatsApp Webhook] Could not resolve tenant for ${recipientPhoneNumberId} (No mapping and no URL params).`);
            return;
        }
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
                const updatedMessages = messages.map((m) => {
                    if (m.whatsappMessageId === messageId) {
                        changed = true;
                        return Object.assign(Object.assign({}, m), { status: status });
                    }
                    return m;
                });
                if (changed) {
                    await cardDoc.ref.update({ messages: updatedMessages });
                }
                if (status === 'read') {
                    await (0, kanbanOmni_1.updateReadStatus)(recipientId, 'whatsapp');
                }
            }
            return;
        }
        // --- CASO 2: MANEJO DE MENSAJES ENTRANTES ---
        const message = (_g = change.messages) === null || _g === void 0 ? void 0 : _g[0];
        if (!message)
            return;
        const contact = (_h = change.contacts) === null || _h === void 0 ? void 0 : _h[0];
        const from = message.from; // Formato: 593963142795
        const contactName = ((_j = contact === null || contact === void 0 ? void 0 : contact.profile) === null || _j === void 0 ? void 0 : _j.name) || 'Usuario WhatsApp';
        // EXTRACCIÓN DEL MENSAJE Y NORMALIZACIÓN
        let body = '';
        let mediaUrl = undefined;
        let msgType = 'text';
        if (message.type === 'text') {
            body = message.text.body;
            msgType = 'text';
        }
        else if (message.type === 'interactive') {
            const interactive = message.interactive;
            body = ((_k = interactive.button_reply) === null || _k === void 0 ? void 0 : _k.title) || ((_l = interactive.list_reply) === null || _l === void 0 ? void 0 : _l.title) || '[Interacción]';
            msgType = 'interactive';
        }
        else if (['image', 'video', 'audio', 'voice', 'document', 'sticker'].includes(message.type)) {
            msgType = message.type === 'voice' ? 'audio' : message.type;
            body = ((_m = message[message.type]) === null || _m === void 0 ? void 0 : _m.caption) || `[${message.type.toUpperCase()}]`;
            // Note: Media URL retrieval often requires an extra API call to Meta to get the DL URL
            // For now we just store the ID or caption. 
            // In a full implementation, we fetch the media URL here. 
            mediaUrl = (_o = message[message.type]) === null || _o === void 0 ? void 0 : _o.id;
        }
        else {
            body = `[Mensaje tipo: ${message.type}]`;
            msgType = 'unknown';
        }
        functions.logger.info(`📩 WhatsApp Webhook: ${from} -> "${body}"`);
        try {
            // 1. Crear Objeto Unificado
            const unifiedMessage = {
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
            const result = await (0, kanbanOmni_1.handleKanbanUpdateOmni)(unifiedMessage, userId, entityId);
            if (!result.success) {
                functions.logger.warn(`[Kanban Sync] Validation failed or error for ${from}`);
                return;
            }
            const isNew = result.isNew;
            const cardId = result.cardId;
            functions.logger.info(`[Kanban Sync] WhatsApp Card ${isNew ? 'CREATED' : 'UPDATED'} (ID: ${cardId})`);
            // 3. Ejecutar Bot (Unified Logic)
            await (0, botEngine_1.tryTriggerBot)(userId, entityId, 'whatsapp', from, body, message.id, { mediaUrl, type: msgType });
        }
        catch (error) {
            functions.logger.error('Error in whatsappWebhook processing:', error);
        }
    }
    else {
        res.sendStatus(405);
    }
});
//# sourceMappingURL=whatsapp.js.map