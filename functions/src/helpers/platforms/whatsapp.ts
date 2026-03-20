
import { MessagingAdapter } from './types';
import * as whatsappAPI from '../whatsappAPI';

export class WhatsAppAdapter implements MessagingAdapter {
    async sendMessage(to: string, text: string, options?: { preview_url?: boolean }): Promise<any> {
        return whatsappAPI.sendMessage(to, text, options);
    }

    async sendMediaMessage(to: string, mediaUrl: string, caption: string, mediaType?: 'image' | 'video' | 'audio' | 'file'): Promise<any> {
        return whatsappAPI.sendMediaMessage(to, mediaUrl, caption, mediaType === 'file' ? 'document' : mediaType);
    }

    async sendButtonMessage(to: string, text: string, buttons: { id: string, title: string }[], header?: { type: string, text?: string, url?: string }): Promise<any> {
        return whatsappAPI.sendButtonMessage(to, text, buttons, header);
    }

    async sendListMessage(to: string, text: string, buttonText: string, sections: { title: string, rows: { id: string, title: string, description?: string }[] }[]): Promise<any> {
        return whatsappAPI.sendListMessage(to, text, buttonText, sections);
    }

    async sendLocationMessage(to: string, lat: number, long: number, name: string, address: string): Promise<any> {
        return whatsappAPI.sendLocationMessage(to, lat, long, name, address);
    }

    async markAsRead(messageId: string): Promise<any> {
        return whatsappAPI.markAsRead(messageId);
    }
}
