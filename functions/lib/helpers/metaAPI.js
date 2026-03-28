"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSTAGRAM_ACCESS_TOKEN = void 0;
exports.sendMetaMessage = sendMetaMessage;
exports.sendMetaMediaMessage = sendMetaMediaMessage;
exports.markMetaMessageAsRead = markMetaMessageAsRead;
exports.sendMetaQuickReplies = sendMetaQuickReplies;
const functions = require("firebase-functions");
const axios_1 = require("axios");
const admin = require("firebase-admin");
// Get tokens from environment variables
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
exports.INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN;
// Generic function to make requests to Graph API
async function callSendApi(messageData, token, ctx) {
    var _a;
    let accessToken = token || PAGE_ACCESS_TOKEN;
    // Resolve tenant-specific token if context provided
    if ((ctx === null || ctx === void 0 ? void 0 : ctx.userId) && (ctx === null || ctx === void 0 ? void 0 : ctx.entityId) && !token) {
        try {
            const db = admin.firestore();
            // Try WhatsApp config first as it often contains the Meta system token
            const configSnap = await db.doc(`users/${ctx.userId}/entities/${ctx.entityId}/integrations/whatsapp`).get();
            if (configSnap.exists) {
                const data = configSnap.data();
                if (data === null || data === void 0 ? void 0 : data.accessToken) {
                    accessToken = data.accessToken;
                }
            }
        }
        catch (error) {
            functions.logger.error('[Meta API] Error fetching tenant token', error);
        }
    }
    if (!accessToken) {
        functions.logger.error('Missing Access Token (Meta/Instagram).');
        throw new Error('Access Token is not configured.');
    }
    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`;
    try {
        const response = await axios_1.default.post(url, messageData);
        return response.data;
    }
    catch (error) {
        const errorData = ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message;
        functions.logger.error('Meta API Error:', errorData);
        throw new Error(`Meta API Error: ${JSON.stringify(errorData)}`);
    }
}
/**
 * Sends a text message to a user via Messenger.
 */
async function sendMetaMessage(recipientId, text, token, ctx) {
    if (!text)
        return;
    const messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: text
        }
    };
    return await callSendApi(messageData, token, ctx);
}
/**
 * Sends a media message (image, video, etc.).
 */
async function sendMetaMediaMessage(recipientId, mediaUrl, mediaType = 'image', token, ctx) {
    if (!mediaUrl)
        return;
    const messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: mediaType,
                payload: {
                    url: mediaUrl,
                    is_reusable: true
                }
            }
        }
    };
    return await callSendApi(messageData, token, ctx);
}
/**
 * Marks a message as read in Messenger.
 * Note: Facebook does not have an explicit "mark as read" endpoint same as WhatsApp, but we can send "sender_action: mark_seen".
 */
async function markMetaMessageAsRead(recipientId, token, ctx) {
    const messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: 'mark_seen'
    };
    return await callSendApi(messageData, token, ctx);
}
/**
 * Sends Quick Replies (Buttons).
 * Facebook Quick Replies are different from WhatsApp Buttons.
 */
async function sendMetaQuickReplies(recipientId, text, quickReplies, token, ctx) {
    // Format quick replies for Messenger
    // Expected format: { content_type: 'text', title: 'Yes', payload: 'YES_PAYLOAD' }
    const formattedQRs = quickReplies.slice(0, 13).map(qr => ({
        content_type: 'text',
        title: (qr.title || 'Opción').substring(0, 20),
        payload: qr.id || qr.payload || qr.title
    }));
    const messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: text,
            quick_replies: formattedQRs
        }
    };
    return await callSendApi(messageData, token, ctx);
}
//# sourceMappingURL=metaAPI.js.map