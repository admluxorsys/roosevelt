"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessagingAdapter = getMessagingAdapter;
const whatsapp_1 = require("./whatsapp");
const meta_1 = require("./meta");
const telegram_1 = require("./telegram");
const x_1 = require("./x");
const webchat_1 = require("./webchat");
const tiktok_1 = require("./tiktok");
function getMessagingAdapter(platform, userId, entityId) {
    switch (platform.toLowerCase()) {
        case 'whatsapp':
            return new whatsapp_1.WhatsAppAdapter(userId, entityId);
        case 'messenger':
        case 'facebook':
            return new meta_1.MetaAdapter('messenger', userId, entityId);
        case 'instagram':
            return new meta_1.MetaAdapter('instagram', userId, entityId);
        case 'telegram':
            return new telegram_1.TelegramAdapter();
        case 'x':
        case 'twitter':
            return new x_1.XAdapter();
        case 'web':
        case 'webchat':
            return new webchat_1.WebChatAdapter();
        case 'tiktok':
            return new tiktok_1.TikTokAdapter();
        default:
            // Default to WhatsApp for legacy compatibility or throw error
            console.warn(`Unknown platform ${platform}, defaulting to WhatsAppAdapter`);
            return new whatsapp_1.WhatsAppAdapter(userId, entityId);
    }
}
//# sourceMappingURL=factory.js.map