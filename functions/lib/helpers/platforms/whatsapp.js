"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppAdapter = void 0;
const whatsappAPI = require("../whatsappAPI");
class WhatsAppAdapter {
    constructor(userId, entityId) {
        this.ctx = { userId, entityId };
    }
    async sendMessage(to, text, options) {
        return whatsappAPI.sendMessage(to, text, Object.assign(Object.assign({}, options), this.ctx));
    }
    async sendMediaMessage(to, mediaUrl, caption, mediaType) {
        return whatsappAPI.sendMediaMessage(to, mediaUrl, caption, mediaType === 'file' ? 'document' : mediaType, this.ctx);
    }
    async sendButtonMessage(to, text, buttons, header) {
        return whatsappAPI.sendButtonMessage(to, text, buttons, header, this.ctx);
    }
    async sendListMessage(to, text, buttonText, sections) {
        return whatsappAPI.sendListMessage(to, text, buttonText, sections, this.ctx);
    }
    async sendLocationMessage(to, lat, long, name, address) {
        return whatsappAPI.sendLocationMessage(to, lat, long, name, address, this.ctx);
    }
    async markAsRead(messageId) {
        return whatsappAPI.markAsRead(messageId, this.ctx);
    }
}
exports.WhatsAppAdapter = WhatsAppAdapter;
//# sourceMappingURL=whatsapp.js.map