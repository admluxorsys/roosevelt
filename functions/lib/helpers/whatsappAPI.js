"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = markAsRead;
exports.sendMessage = sendMessage;
exports.sendMediaMessage = sendMediaMessage;
exports.sendButtonMessage = sendButtonMessage;
exports.sendListMessage = sendListMessage;
exports.sendLocationMessage = sendLocationMessage;
// src/helpers/whatsappAPI.ts
const functions = require("firebase-functions");
const axios_1 = require("axios");
const admin = require("firebase-admin");
const whatsappConfig = functions.config().whatsapp;
// Updated with user provided keys as primary or fallback
const accessToken = (whatsappConfig === null || whatsappConfig === void 0 ? void 0 : whatsappConfig.access_token) || '';
const phoneNumberId = (whatsappConfig === null || whatsappConfig === void 0 ? void 0 : whatsappConfig.phone_number_id) || '676837795516836';
function cleanNumber(phone) {
    return phone.replace(/\D/g, ''); // Solo números, quita el '+'
}
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function makeWhatsAppRequest(data, type, ctx) {
    var _a, _b, _c, _d;
    // Priority: Cloud Config > Environment Variables
    let apiToken = ((_a = functions.config().whatsapp) === null || _a === void 0 ? void 0 : _a.access_token) || process.env.WHATSAPP_ACCESS_TOKEN || accessToken;
    let phoneId = ((_b = functions.config().whatsapp) === null || _b === void 0 ? void 0 : _b.phone_number_id) || process.env.WHATSAPP_PHONE_NUMBER_ID || phoneNumberId;
    if ((ctx === null || ctx === void 0 ? void 0 : ctx.userId) && (ctx === null || ctx === void 0 ? void 0 : ctx.entityId)) {
        try {
            const configPath = `users/${ctx.userId}/entities/${ctx.entityId}/integrations/whatsapp`;
            const docRef = admin.firestore().doc(configPath);
            const snapshot = await docRef.get();
            if (snapshot.exists) {
                const configData = snapshot.data();
                if ((configData === null || configData === void 0 ? void 0 : configData.accessToken) && (configData === null || configData === void 0 ? void 0 : configData.phoneNumberId)) {
                    apiToken = configData.accessToken;
                    phoneId = configData.phoneNumberId;
                }
            }
        }
        catch (e) {
            functions.logger.error("Failed to fetch custom credentials", e);
        }
    }
    if (!apiToken || !phoneId) {
        functions.logger.error('❌ [WhatsApp API] Missing credentials!', { hasToken: !!apiToken, hasPhoneId: !!phoneId });
        throw new Error('WhatsApp API credentials are not configured.');
    }
    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
    let lastError = null;
    const MAX_ATTEMPTS = 3;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const response = await axios_1.default.post(url, data, {
                headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
            });
            functions.logger.info(`✅ [WhatsApp API] ${type} success (Attempt ${attempt})`, { recipient: data.to });
            return response.data;
        }
        catch (error) {
            lastError = ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message;
            // Only retry on potential transient errors (5xx or 429)
            const status = (_d = error.response) === null || _d === void 0 ? void 0 : _d.status;
            const isTransient = status === 429 || (status >= 500 && status <= 599);
            if (isTransient && attempt < MAX_ATTEMPTS) {
                const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s
                functions.logger.warn(`⚠️ [WhatsApp API] ${type} failed (Attempt ${attempt}/${MAX_ATTEMPTS}). Retrying in ${waitTime}ms...`, { error: lastError });
                await sleep(waitTime);
                continue;
            }
            functions.logger.error(`❌ [WhatsApp API] Error (${type}) on attempt ${attempt}:`, {
                error: lastError,
                payload: data,
                url: url.replace(phoneId, 'HIDDEN_ID')
            });
            break;
        }
    }
    throw new Error(`WhatsApp API Error after ${MAX_ATTEMPTS} attempts: ${JSON.stringify(lastError)}`);
}
async function markAsRead(messageId, ctx) {
    if (!messageId)
        return;
    return await makeWhatsAppRequest({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
    }, 'MarkAsRead', ctx);
}
async function sendMessage(to, message, options) {
    if (!message)
        return;
    const cleanTo = cleanNumber(to);
    const payload = {
        messaging_product: 'whatsapp',
        to: cleanTo,
        text: { body: message }
    };
    if (options === null || options === void 0 ? void 0 : options.preview_url) {
        payload.text.preview_url = true;
    }
    return await makeWhatsAppRequest(payload, 'Text', options);
}
async function sendMediaMessage(to, fileUrl, caption = '', fileName = 'file', ctx) {
    const mediaType = getMediaType(fileUrl, fileName);
    if (mediaType === 'unsupported') {
        functions.logger.warn(`Unsupported media: ${fileName}`);
        return;
    }
    const cleanTo = cleanNumber(to);
    return await makeWhatsAppRequest({
        messaging_product: 'whatsapp', to: cleanTo, type: mediaType,
        [mediaType]: { link: fileUrl, caption: caption }
    }, 'Media', ctx);
}
async function sendButtonMessage(to, bodyText, buttons, header, ctx) {
    const validButtons = buttons.slice(0, 3).map((btn, i) => {
        const id = (btn.id || `btn_${i}`).substring(0, 256);
        const title = (btn.title || "Opción").substring(0, 20);
        return {
            type: "reply",
            reply: { id, title }
        };
    });
    if (validButtons.length === 0)
        return;
    const interactive = {
        type: 'button',
        body: { text: bodyText.substring(0, 1024) },
        action: { buttons: validButtons }
    };
    // Add optional header if provided
    if (header && header.type !== 'none') {
        if (header.type === 'text' && header.text) {
            interactive.header = { type: 'text', text: header.text.substring(0, 60) };
        }
        else if (['image', 'video', 'document'].includes(header.type) && header.url) {
            interactive.header = {
                type: header.type,
                [header.type]: { link: header.url }
            };
        }
    }
    const payload = {
        messaging_product: 'whatsapp',
        to: cleanNumber(to),
        type: 'interactive',
        interactive
    };
    await makeWhatsAppRequest(payload, 'Buttons', ctx);
}
async function sendListMessage(to, bodyText, buttonText, sections, ctx) {
    if (!sections || sections.length === 0)
        return;
    const formattedSections = [];
    let totalRows = 0;
    for (const sec of sections) {
        const rows = (sec.rows || []).map((row) => {
            const rowId = (row.id || row.title || `row_${Math.random()}`).substring(0, 200);
            let rowTitle = (row.title || "Opción").trim();
            if (rowTitle.length > 24)
                rowTitle = rowTitle.substring(0, 21) + "...";
            let rowDesc = row.description ? row.description.substring(0, 72) : undefined;
            return { id: rowId, title: rowTitle, description: rowDesc };
        });
        if (rows.length > 0) {
            formattedSections.push({
                title: (sec.title || "Opciones").substring(0, 50),
                rows: rows
            });
            totalRows += rows.length;
        }
    }
    if (totalRows === 0)
        return;
    let validBtnText = (buttonText || "Ver Opciones").substring(0, 20);
    const payload = {
        messaging_product: 'whatsapp',
        to: cleanNumber(to),
        type: 'interactive',
        interactive: {
            type: 'list',
            body: { text: (bodyText || "Selecciona una opción").substring(0, 1024) },
            action: { button: validBtnText, sections: formattedSections }
        }
    };
    await makeWhatsAppRequest(payload, 'List', ctx);
}
async function sendLocationMessage(to, lat, long, name, address, ctx) {
    await makeWhatsAppRequest({
        messaging_product: 'whatsapp', to: cleanNumber(to), type: 'location',
        location: { latitude: lat, longitude: long, name: name, address: address }
    }, 'Location');
}
function getMediaType(url, fileName) {
    var _a;
    const ext = (_a = (fileName.includes('.') ? fileName.split('.').pop() : url.split('.').pop())) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || ''))
        return 'image';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'].includes(ext || ''))
        return 'document';
    if (['mp4', '3gp', 'mov', 'avi', 'mkv'].includes(ext || ''))
        return 'video';
    if (['mp3', 'aac', 'ogg', 'wav', 'm4a'].includes(ext || ''))
        return 'audio';
    return 'image';
}
//# sourceMappingURL=whatsappAPI.js.map