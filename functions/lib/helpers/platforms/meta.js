"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaAdapter = void 0;
const metaAPI = require("../metaAPI");
class MetaAdapter {
    constructor(platform = 'messenger', userId, entityId) {
        this.ctx = { userId, entityId };
    }
    async sendMessage(to, text) {
        return metaAPI.sendMetaMessage(to, text, undefined, this.ctx);
    }
    async sendMediaMessage(to, mediaUrl, caption, mediaType) {
        await metaAPI.sendMetaMediaMessage(to, mediaUrl, mediaType || 'image', undefined, this.ctx);
        if (caption) {
            await metaAPI.sendMetaMessage(to, caption, undefined, this.ctx);
        }
    }
    async sendButtonMessage(to, text, buttons) {
        return metaAPI.sendMetaQuickReplies(to, text, buttons, undefined, this.ctx);
    }
    async sendListMessage(to, text, buttonText, sections) {
        const allOptions = [];
        sections.forEach(sec => allOptions.push(...sec.rows));
        if (allOptions.length <= 13) {
            return metaAPI.sendMetaQuickReplies(to, text, allOptions, undefined, this.ctx);
        }
        else {
            let menuText = text + '\n';
            allOptions.forEach(opt => menuText += `- ${opt.title}\n`);
            return metaAPI.sendMetaMessage(to, menuText, undefined, this.ctx);
        }
    }
    async sendLocationMessage(to, lat, long, name, address) {
        const mapLink = `https://maps.google.com/?q=${lat},${long}`;
        return metaAPI.sendMetaMessage(to, `${name}\n${address}\n${mapLink}`, undefined, this.ctx);
    }
    async markAsRead(messageId) {
        return metaAPI.markMetaMessageAsRead(messageId, undefined, this.ctx);
    }
}
exports.MetaAdapter = MetaAdapter;
//# sourceMappingURL=meta.js.map