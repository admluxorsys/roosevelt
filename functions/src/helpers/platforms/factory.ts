
import { MessagingAdapter } from './types';
import { WhatsAppAdapter } from './whatsapp';
import { MetaAdapter } from './meta';
import { TelegramAdapter } from './telegram';
import { XAdapter } from './x';
import { WebChatAdapter } from './webchat';
import { TikTokAdapter } from './tiktok';

export function getMessagingAdapter(platform: string, userId?: string, entityId?: string): MessagingAdapter {
    switch (platform.toLowerCase()) {
        case 'whatsapp':
            return new WhatsAppAdapter(userId, entityId);
        case 'messenger':
        case 'facebook':
            return new MetaAdapter('messenger', userId, entityId);
        case 'instagram':
            return new MetaAdapter('instagram', userId, entityId);
        case 'telegram':
            return new TelegramAdapter();
        case 'x':
        case 'twitter':
            return new XAdapter();
        case 'web':
        case 'webchat':
            return new WebChatAdapter();
        case 'tiktok':
            return new TikTokAdapter();
        default:
            // Default to WhatsApp for legacy compatibility or throw error
            console.warn(`Unknown platform ${platform}, defaulting to WhatsAppAdapter`);
            return new WhatsAppAdapter(userId, entityId);
    }
}
