"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppAdapter = void 0;
const whatsappAPI = require("../whatsappAPI");
class WhatsAppAdapter {
    async sendMessage(to, text, options) {
        return whatsappAPI.sendMessage(to, text, options);
    }
    async sendMediaMessage(to, mediaUrl, caption, mediaType) {
        return whatsappAPI.sendMediaMessage(to, mediaUrl, caption, mediaType === 'file' ? 'document' : mediaType);
    }
    async sendButtonMessage(to, text, buttons, header) {
        return whatsappAPI.sendButtonMessage(to, text, buttons, header);
    }
    async sendListMessage(to, text, buttonText, sections) {
        return whatsappAPI.sendListMessage(to, text, buttonText, sections);
    }
    async sendLocationMessage(to, lat, long, name, address) {
        return whatsappAPI.sendLocationMessage(to, lat, long, name, address);
    }
    async markAsRead(messageId) {
        return whatsappAPI.markAsRead(messageId);
    }
}
exports.WhatsAppAdapter = WhatsAppAdapter;
//# sourceMappingURL=whatsapp.js.map