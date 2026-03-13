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
const whatsappConfig = functions.config().whatsapp;
// Updated with user provided keys as primary or fallback
const accessToken = (whatsappConfig === null || whatsappConfig === void 0 ? void 0 : whatsappConfig.access_token) || 'EAARnTi3ZAPNYBQFC70F28fb9MispCQZAVtfnHhmPsdZBNqyWQZBcA3bE7pU4430ZBzDJxEoHZAbmUD2EWOxZBS9aRirmHvM5luC6U03sIz752oracncCSZCb9WPOtaLaIcAiXkytFuFPF5AuJrmoLvB6leQ09wyOWNfS217JjNZAvjYYxjfEZCtvfxyZChGBkWzZBQZDZD';
const phoneNumberId = (whatsappConfig === null || whatsappConfig === void 0 ? void 0 : whatsappConfig.phone_number_id) || '676837795516836';
function cleanNumber(phone) {
    return phone.replace(/\D/g, ''); // Solo números, quita el '+'
}
async function makeWhatsAppRequest(data, type) {
    var _a, _b, _c;
    // Priority: Cloud Config > Environment Variables
    const apiToken = ((_a = functions.config().whatsapp) === null || _a === void 0 ? void 0 : _a.access_token) || process.env.WHATSAPP_ACCESS_TOKEN || accessToken;
    const phoneId = ((_b = functions.config().whatsapp) === null || _b === void 0 ? void 0 : _b.phone_number_id) || process.env.WHATSAPP_PHONE_NUMBER_ID || phoneNumberId;
    if (!apiToken || !phoneId) {
        functions.logger.error('❌ [WhatsApp API] Missing credentials!', { hasToken: !!apiToken, hasPhoneId: !!phoneId });
        throw new Error('WhatsApp API credentials are not configured.');
    }
    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
    try {
        const response = await axios_1.default.post(url, data, {
            headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        });
        functions.logger.info(`✅ [WhatsApp API] ${type} success`, { recipient: data.to });
        return response.data;
    }
    catch (error) {
        const errorData = ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message;
        functions.logger.error(`❌ [WhatsApp API] Error (${type}):`, {
            error: errorData,
            payload: data,
            url: url.replace(phoneId, 'HIDDEN_ID')
        });
        throw new Error(`WhatsApp API Error: ${JSON.stringify(errorData)}`);
    }
}
async function markAsRead(messageId) {
    if (!messageId)
        return;
    return await makeWhatsAppRequest({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
    }, 'MarkAsRead');
}
async function sendMessage(to, message) {
    if (!message)
        return;
    const cleanTo = cleanNumber(to);
    return await makeWhatsAppRequest({ messaging_product: 'whatsapp', to: cleanTo, text: { body: message } }, 'Text');
}
async function sendMediaMessage(to, fileUrl, caption = '', fileName = 'file') {
    const mediaType = getMediaType(fileUrl, fileName);
    if (mediaType === 'unsupported') {
        functions.logger.warn(`Unsupported media: ${fileName}`);
        return;
    }
    const cleanTo = cleanNumber(to);
    return await makeWhatsAppRequest({
        messaging_product: 'whatsapp', to: cleanTo, type: mediaType,
        [mediaType]: { link: fileUrl, caption: caption }
    }, 'Media');
}
async function sendButtonMessage(to, bodyText, buttons) {
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
    const payload = {
        messaging_product: 'whatsapp',
        to: cleanNumber(to),
        type: 'interactive',
        interactive: {
            type: 'button',
            body: { text: bodyText.substring(0, 1024) },
            action: { buttons: validButtons }
        }
    };
    await makeWhatsAppRequest(payload, 'Buttons');
}
async function sendListMessage(to, bodyText, buttonText, sections) {
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
    await makeWhatsAppRequest(payload, 'List');
}
async function sendLocationMessage(to, lat, long, name, address) {
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
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(ext || ''))
        return 'document';
    if (['mp4', '3gp'].includes(ext || ''))
        return 'video';
    if (['mp3', 'aac', 'ogg'].includes(ext || ''))
        return 'audio';
    return 'image';
}
//# sourceMappingURL=whatsappAPI.js.map