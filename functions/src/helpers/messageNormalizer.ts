// src/helpers/messageNormalizer.ts
import {
    UnifiedMessage,
    MetaRawMessage,
    XRawMessage,
} from '../types/message';

/**
 * UNIVERSAL MESSAGE NORMALIZER
 * 
 * The Gateway logic. Converts any platform payload into a UnifiedMessage
 * that the Kanban system can understand.
 */

// --- 1. WhatsApp Normalizer (Wrapper for existing logic compatibility) ---
export function normalizeWhatsAppMessage(
    message: any,
    contactName: string
): UnifiedMessage {
    let type: UnifiedMessage['message_type'] = 'text';
    let text = '';
    let mediaUrl = undefined;

    if (message.type === 'text') {
        text = message.text?.body || '';
    } else if (message.type === 'image') {
        type = 'image';
        text = message.image?.caption || 'Imagen';
        mediaUrl = message.image?.id;
    } else if (message.type === 'video') {
        type = 'video';
        text = message.video?.caption || 'Video';
        mediaUrl = message.video?.id;
    } else if (message.type === 'audio' || message.type === 'voice') {
        type = 'audio';
        text = 'Audio';
        mediaUrl = message.audio?.id || message.voice?.id;
    } else if (message.type === 'document') {
        type = 'document';
        text = message.document?.caption || message.document?.filename || 'Documento';
        mediaUrl = message.document?.id;
    } else if (message.type === 'sticker') {
        type = 'sticker';
        text = 'Sticker';
        mediaUrl = message.sticker?.id;
    } else if (message.type === 'interactive') {
        type = 'interactive';
        text = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || 'Interacción';
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
            button_id: message.interactive.button_reply?.id,
            list_id: message.interactive.list_reply?.id
        } : undefined,
        platform_metadata: message
    };
}

// --- 2. Meta (Instagram & Messenger) Normalizer ---
export function normalizeMetaMessage(
    entry: MetaRawMessage,
    platform: 'instagram' | 'messenger',
    userProfile?: { name: string; username?: string; profile_pic?: string }
): UnifiedMessage {
    const msg = entry.message;
    const isComment = entry.item === 'comment';

    let text = msg?.text || '';
    let type: UnifiedMessage['message_type'] = 'text';
    let mediaUrl: string | undefined;

    // Handle Attachments
    if (msg?.attachments && msg.attachments.length > 0) {
        const att = msg.attachments[0];
        mediaUrl = att.payload.url;
        if (att.type === 'image') type = 'image';
        if (att.type === 'video') type = 'video';
        if (att.type === 'audio') type = 'audio';
        if (att.type === 'file') type = 'document';
        if (!text) text = `[${type.toUpperCase()}]`;
    }

    // Handle Comments
    if (isComment) {
        type = 'comment';
        // Logic to extract comment text from payload would go here
    }

    return {
        source_platform: platform,
        external_id: entry.sender.id,
        contact_name: userProfile?.name || 'Instagram User',
        message_text: text,
        message_type: type,
        timestamp: new Date(entry.timestamp || Date.now()),
        media_url: mediaUrl,
        platform_metadata: {
            platform_user_id: entry.sender.id,
            username: userProfile?.username,
            profile_picture: userProfile?.profile_pic,
            // Store reply context if it's a comment
            reply_to_id: entry.post_id || entry.comment_id
        }
    };
}

// --- 3. X (Twitter) Normalizer ---
export function normalizeXMessage(
    data: XRawMessage['data'],
    includes?: XRawMessage['includes']
): UnifiedMessage {
    const user = includes?.users?.find(u => u.id === data.author_id);

    // Determine type (DM, Mention, Reply) based on referenced_tweets or webhook type
    // Assuming simple DM for now

    return {
        source_platform: 'x',
        external_id: data.author_id,
        contact_name: user?.name || user?.username || 'X User',
        message_text: data.text,
        message_type: 'text', // Default, would check media_key for image/video
        timestamp: new Date(data.created_at),
        platform_metadata: {
            username: user?.username,
            profile_picture: user?.profile_image_url,
            is_verified: user?.verified,
            platform_user_id: data.author_id
        }
    };
}

// --- 4. Web Chat Normalizer ---
export function normalizeWebChatMessage(
    payload: {
        sessionId: string;
        text: string;
        visitorName?: string;
        attachments?: Array<{ url: string; type: string }>;
    }
): UnifiedMessage {
    let type: UnifiedMessage['message_type'] = 'text';
    let mediaUrl: string | undefined;

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
export function normalizeTelegramMessage(
    payload: any // Typed loosely as Telegram types are complex
): UnifiedMessage {
    const from = payload.from || {};
    const chat = payload.chat || {};

    let type: UnifiedMessage['message_type'] = 'text';
    let text = payload.text || '';
    let mediaUrl: string | undefined;

    if (payload.photo && payload.photo.length > 0) {
        type = 'image';
        text = payload.caption || '[Photo]';
        // Note: Telegram sends file_id, needs GetFile API to get URL. 
        // For now storing file_id as URL placeholder
        mediaUrl = payload.photo[payload.photo.length - 1].file_id;
    } else if (payload.voice) {
        type = 'audio';
        text = '[Voice Message]';
        mediaUrl = payload.voice.file_id;
    }

    // Interactive Callbacks (for button clicks)
    // Note: Usually comes in 'callback_query' update, not 'message'

    const contactName = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'Telegram User';

    return {
        source_platform: 'telegram',
        external_id: from.id?.toString() || 'unknown',
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
export function normalizeTikTokMessage(
    webhookEvent: any
): UnifiedMessage {
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
