"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeWhatsAppMessage = normalizeWhatsAppMessage;
exports.normalizeMetaMessage = normalizeMetaMessage;
exports.normalizeXMessage = normalizeXMessage;
exports.normalizeWebChatMessage = normalizeWebChatMessage;
exports.normalizeTelegramMessage = normalizeTelegramMessage;
exports.normalizeTikTokMessage = normalizeTikTokMessage;
/**
 * UNIVERSAL MESSAGE NORMALIZER
 *
 * The Gateway logic. Converts any platform payload into a UnifiedMessage
 * that the Kanban system can understand.
 */
// --- 1. WhatsApp Normalizer (Wrapper for existing logic compatibility) ---
function normalizeWhatsAppMessage(message, contactName) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    let type = 'text';
    let text = '';
    let mediaUrl = undefined;
    if (message.type === 'text') {
        text = ((_a = message.text) === null || _a === void 0 ? void 0 : _a.body) || '';
    }
    else if (message.type === 'image') {
        type = 'image';
        text = ((_b = message.image) === null || _b === void 0 ? void 0 : _b.caption) || 'Imagen';
        mediaUrl = (_c = message.image) === null || _c === void 0 ? void 0 : _c.id;
    }
    else if (message.type === 'video') {
        type = 'video';
        text = ((_d = message.video) === null || _d === void 0 ? void 0 : _d.caption) || 'Video';
        mediaUrl = (_e = message.video) === null || _e === void 0 ? void 0 : _e.id;
    }
    else if (message.type === 'audio' || message.type === 'voice') {
        type = 'audio';
        text = 'Audio';
        mediaUrl = ((_f = message.audio) === null || _f === void 0 ? void 0 : _f.id) || ((_g = message.voice) === null || _g === void 0 ? void 0 : _g.id);
    }
    else if (message.type === 'document') {
        type = 'document';
        text = ((_h = message.document) === null || _h === void 0 ? void 0 : _h.caption) || ((_j = message.document) === null || _j === void 0 ? void 0 : _j.filename) || 'Documento';
        mediaUrl = (_k = message.document) === null || _k === void 0 ? void 0 : _k.id;
    }
    else if (message.type === 'sticker') {
        type = 'sticker';
        text = 'Sticker';
        mediaUrl = (_l = message.sticker) === null || _l === void 0 ? void 0 : _l.id;
    }
    else if (message.type === 'interactive') {
        type = 'interactive';
        text = ((_o = (_m = message.interactive) === null || _m === void 0 ? void 0 : _m.button_reply) === null || _o === void 0 ? void 0 : _o.title) || ((_q = (_p = message.interactive) === null || _p === void 0 ? void 0 : _p.list_reply) === null || _q === void 0 ? void 0 : _q.title) || 'Interacción';
    }
    return {
        source_platform: 'whatsapp',
        external_id: message.from,
        contact_name: contactName,
        message_text: text || '',
        message_type: type,
        timestamp: new Date(parseInt(message.timestamp) * 1000),
        media_url: mediaUrl,
        interactive_data: message.interactive ? {
            button_id: (_r = message.interactive.button_reply) === null || _r === void 0 ? void 0 : _r.id,
            list_id: (_s = message.interactive.list_reply) === null || _s === void 0 ? void 0 : _s.id
        } : undefined,
        platform_metadata: message
    };
}
// --- 2. Meta (Instagram & Messenger) Normalizer ---
function normalizeMetaMessage(entry, platform, userProfile) {
    const msg = entry.message;
    const isComment = entry.item === 'comment';
    let text = (msg === null || msg === void 0 ? void 0 : msg.text) || '';
    let type = 'text';
    let mediaUrl;
    // Handle Attachments
    if ((msg === null || msg === void 0 ? void 0 : msg.attachments) && msg.attachments.length > 0) {
        const att = msg.attachments[0];
        mediaUrl = att.payload.url;
        if (att.type === 'image')
            type = 'image';
        if (att.type === 'video')
            type = 'video';
        if (att.type === 'audio')
            type = 'audio';
        if (att.type === 'file')
            type = 'document';
        if (!text)
            text = `[${type.toUpperCase()}]`;
    }
    // Handle Comments
    if (isComment) {
        type = 'comment';
        // Logic to extract comment text from payload would go here
    }
    return {
        source_platform: platform,
        external_id: entry.sender.id,
        contact_name: (userProfile === null || userProfile === void 0 ? void 0 : userProfile.name) || 'Instagram User',
        message_text: text,
        message_type: type,
        timestamp: new Date(entry.timestamp || Date.now()),
        media_url: mediaUrl,
        platform_metadata: {
            platform_user_id: entry.sender.id,
            username: userProfile === null || userProfile === void 0 ? void 0 : userProfile.username,
            profile_picture: userProfile === null || userProfile === void 0 ? void 0 : userProfile.profile_pic,
            // Store reply context if it's a comment
            reply_to_id: entry.post_id || entry.comment_id
        }
    };
}
// --- 3. X (Twitter) Normalizer ---
function normalizeXMessage(data, includes) {
    var _a;
    const user = (_a = includes === null || includes === void 0 ? void 0 : includes.users) === null || _a === void 0 ? void 0 : _a.find(u => u.id === data.author_id);
    // Determine type (DM, Mention, Reply) based on referenced_tweets or webhook type
    // Assuming simple DM for now
    return {
        source_platform: 'x',
        external_id: data.author_id,
        contact_name: (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.username) || 'X User',
        message_text: data.text,
        message_type: 'text', // Default, would check media_key for image/video
        timestamp: new Date(data.created_at),
        platform_metadata: {
            username: user === null || user === void 0 ? void 0 : user.username,
            profile_picture: user === null || user === void 0 ? void 0 : user.profile_image_url,
            is_verified: user === null || user === void 0 ? void 0 : user.verified,
            platform_user_id: data.author_id
        }
    };
}
// --- 4. Web Chat Normalizer ---
function normalizeWebChatMessage(payload) {
    let type = 'text';
    let mediaUrl;
    if (payload.attachments && payload.attachments.length > 0) {
        const att = payload.attachments[0];
        mediaUrl = att.url;
        type = att.type.startsWith('image') ? 'image' : 'document'; // Simple inference
    }
    return {
        source_platform: 'web',
        external_id: payload.sessionId, // Session ID persists across reloads ideally
        contact_name: payload.visitorName || 'Web Visitor',
        message_text: payload.text || (mediaUrl ? '[File]' : ''),
        message_type: type,
        timestamp: new Date(),
        media_url: mediaUrl,
        platform_metadata: {
            platform_specific_data: { sessionId: payload.sessionId }
        }
    };
}
// --- 5. Telegram Normalizer ---
function normalizeTelegramMessage(payload // Typed loosely as Telegram types are complex
) {
    var _a;
    const from = payload.from || {};
    const chat = payload.chat || {};
    let type = 'text';
    let text = payload.text || '';
    let mediaUrl;
    if (payload.photo && payload.photo.length > 0) {
        type = 'image';
        text = payload.caption || '[Photo]';
        // Note: Telegram sends file_id, needs GetFile API to get URL. 
        // For now storing file_id as URL placeholder
        mediaUrl = payload.photo[payload.photo.length - 1].file_id;
    }
    else if (payload.voice) {
        type = 'audio';
        text = '[Voice Message]';
        mediaUrl = payload.voice.file_id;
    }
    // Interactive Callbacks (for button clicks)
    // Note: Usually comes in 'callback_query' update, not 'message'
    const contactName = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'Telegram User';
    return {
        source_platform: 'telegram',
        external_id: ((_a = from.id) === null || _a === void 0 ? void 0 : _a.toString()) || 'unknown',
        contact_name: contactName,
        message_text: text,
        message_type: type,
        timestamp: new Date(payload.date * 1000),
        media_url: mediaUrl,
        platform_metadata: {
            username: from.username,
            platform_user_id: from.id,
            chat_id: chat.id
        }
    };
}
// --- 6. TikTok Normalizer ---
function normalizeTikTokMessage(webhookEvent) {
    // TikTok structure is complex, simplified for blueprint
    return {
        source_platform: 'tiktok',
        external_id: webhookEvent.from_user_id || 'unknown',
        contact_name: 'TikTok User', // Requires separate API fetch usually
        message_text: webhookEvent.content || '',
        message_type: webhookEvent.message_type === 'sticker' ? 'sticker' : 'text',
        timestamp: new Date(webhookEvent.create_time * 1000),
    };
}
//# sourceMappingURL=messageNormalizer.js.map