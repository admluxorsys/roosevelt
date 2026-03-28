
import { MessagingAdapter } from './types';
import * as metaAPI from '../metaAPI';

export class MetaAdapter implements MessagingAdapter {
    private ctx: { userId?: string, entityId?: string };

    constructor(platform: string = 'messenger', userId?: string, entityId?: string) {
        this.ctx = { userId, entityId };
    }

    async sendMessage(to: string, text: string): Promise<any> {
        return metaAPI.sendMetaMessage(to, text, undefined, this.ctx);
    }

    async sendMediaMessage(to: string, mediaUrl: string, caption: string, mediaType?: 'image' | 'video' | 'audio' | 'file'): Promise<any> {
        await metaAPI.sendMetaMediaMessage(to, mediaUrl, mediaType || 'image', undefined, this.ctx);
        if (caption) {
            await metaAPI.sendMetaMessage(to, caption, undefined, this.ctx);
        }
    }

    async sendButtonMessage(to: string, text: string, buttons: { id: string, title: string }[]): Promise<any> {
        return metaAPI.sendMetaQuickReplies(to, text, buttons, undefined, this.ctx);
    }

    async sendListMessage(to: string, text: string, buttonText: string, sections: { title: string, rows: { id: string, title: string, description?: string }[] }[]): Promise<any> {
        const allOptions: any[] = [];
        sections.forEach(sec => allOptions.push(...sec.rows));

        if (allOptions.length <= 13) {
            return metaAPI.sendMetaQuickReplies(to, text, allOptions, undefined, this.ctx);
        } else {
            let menuText = text + '\n';
            allOptions.forEach(opt => menuText += `- ${opt.title}\n`);
            return metaAPI.sendMetaMessage(to, menuText, undefined, this.ctx);
        }
    }

    async sendLocationMessage(to: string, lat: number, long: number, name: string, address: string): Promise<any> {
        const mapLink = `https://maps.google.com/?q=${lat},${long}`;
        return metaAPI.sendMetaMessage(to, `${name}\n${address}\n${mapLink}`, undefined, this.ctx);
    }

    async markAsRead(messageId: string): Promise<any> {
        return metaAPI.markMetaMessageAsRead(messageId, undefined, this.ctx);
    }
}
