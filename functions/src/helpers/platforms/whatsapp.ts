
import { MessagingAdapter } from './types';
import * as whatsappAPI from '../whatsappAPI';

export class WhatsAppAdapter implements MessagingAdapter {
    private ctx: { userId?: string, entityId?: string };

    constructor(userId?: string, entityId?: string) {
        this.ctx = { userId, entityId };
    }

    async sendMessage(to: string, text: string, options?: { preview_url?: boolean }): Promise<any> {
        return whatsappAPI.sendMessage(to, text, { ...options, ...this.ctx });
    }

    async sendMediaMessage(to: string, mediaUrl: string, caption: string, mediaType?: 'image' | 'video' | 'audio' | 'file'): Promise<any> {
        return whatsappAPI.sendMediaMessage(to, mediaUrl, caption, mediaType === 'file' ? 'document' : mediaType, this.ctx);
    }

    async sendButtonMessage(to: string, text: string, buttons: { id: string, title: string }[], header?: { type: string, text?: string, url?: string }): Promise<any> {
        return whatsappAPI.sendButtonMessage(to, text, buttons, header, this.ctx);
    }

    async sendListMessage(to: string, text: string, buttonText: string, sections: { title: string, rows: { id: string, title: string, description?: string }[] }[]): Promise<any> {
        return whatsappAPI.sendListMessage(to, text, buttonText, sections, this.ctx);
    }

    async sendLocationMessage(to: string, lat: number, long: number, name: string, address: string): Promise<any> {
        return whatsappAPI.sendLocationMessage(to, lat, long, name, address, this.ctx);
    }

    async markAsRead(messageId: string): Promise<any> {
        return whatsappAPI.markAsRead(messageId, this.ctx);
    }
}
