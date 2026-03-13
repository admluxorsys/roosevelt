
// src/helpers/whatsappAPI.ts
import * as functions from 'firebase-functions';
import axios from 'axios';

const whatsappConfig = functions.config().whatsapp;
// Updated with user provided keys as primary or fallback
const accessToken = whatsappConfig?.access_token || 'EAARnTi3ZAPNYBQFC70F28fb9MispCQZAVtfnHhmPsdZBNqyWQZBcA3bE7pU4430ZBzDJxEoHZAbmUD2EWOxZBS9aRirmHvM5luC6U03sIz752oracncCSZCb9WPOtaLaIcAiXkytFuFPF5AuJrmoLvB6leQ09wyOWNfS217JjNZAvjYYxjfEZCtvfxyZChGBkWzZBQZDZD';
const phoneNumberId = whatsappConfig?.phone_number_id || '676837795516836';

function cleanNumber(phone: string): string {
    return phone.replace(/\D/g, ''); // Solo números, quita el '+'
}

async function makeWhatsAppRequest(data: object, type: string) {
    // Priority: Cloud Config > Environment Variables
    const apiToken = functions.config().whatsapp?.access_token || process.env.WHATSAPP_ACCESS_TOKEN || accessToken;
    const phoneId = functions.config().whatsapp?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || phoneNumberId;

    if (!apiToken || !phoneId) {
        functions.logger.error('❌ [WhatsApp API] Missing credentials!', { hasToken: !!apiToken, hasPhoneId: !!phoneId });
        throw new Error('WhatsApp API credentials are not configured.');
    }

    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;

    try {
        const response = await axios.post(url, data, {
            headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        });
        functions.logger.info(`✅ [WhatsApp API] ${type} success`, { recipient: (data as any).to });
        return response.data;
    } catch (error: any) {
        const errorData = error.response?.data || error.message;
        functions.logger.error(`❌ [WhatsApp API] Error (${type}):`, {
            error: errorData,
            payload: data,
            url: url.replace(phoneId, 'HIDDEN_ID')
        });
        throw new Error(`WhatsApp API Error: ${JSON.stringify(errorData)}`);
    }
}

export async function markAsRead(messageId: string): Promise<any> {
    if (!messageId) return;
    return await makeWhatsAppRequest({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
    }, 'MarkAsRead');
}

export async function sendMessage(to: string, message: string): Promise<any> {
    if (!message) return;
    const cleanTo = cleanNumber(to);
    return await makeWhatsAppRequest({ messaging_product: 'whatsapp', to: cleanTo, text: { body: message } }, 'Text');
}

export async function sendMediaMessage(to: string, fileUrl: string, caption: string = '', fileName: string = 'file'): Promise<any> {
    const mediaType = getMediaType(fileUrl, fileName);
    if (mediaType === 'unsupported') {
        functions.logger.warn(`Unsupported media: ${fileName}`);
        return;
    }
    const cleanTo = cleanNumber(to);
    return await makeWhatsAppRequest({
        messaging_product: 'whatsapp', to: cleanTo, type: mediaType,
        [mediaType]: { link: fileUrl, caption: caption }
    }, 'Media');
}

export async function sendButtonMessage(to: string, bodyText: string, buttons: any[]): Promise<void> {
    const validButtons = buttons.slice(0, 3).map((btn, i) => {
        const id = (btn.id || `btn_${i}`).substring(0, 256);
        const title = (btn.title || "Opción").substring(0, 20);
        return {
            type: "reply",
            reply: { id, title }
        };
    });

    if (validButtons.length === 0) return;

    const payload = {
        messaging_product: 'whatsapp',
        to: cleanNumber(to),
        type: 'interactive',
        interactive: {
            type: 'button',
            body: { text: bodyText.substring(0, 1024) },
            action: { buttons: validButtons }
        }
    };

    await makeWhatsAppRequest(payload, 'Buttons');
}

export async function sendListMessage(to: string, bodyText: string, buttonText: string, sections: any[]): Promise<void> {
    if (!sections || sections.length === 0) return;

    const formattedSections: any[] = [];
    let totalRows = 0;

    for (const sec of sections) {
        const rows = (sec.rows || []).map((row: any) => {
            const rowId = (row.id || row.title || `row_${Math.random()}`).substring(0, 200);
            let rowTitle = (row.title || "Opción").trim();
            if (rowTitle.length > 24) rowTitle = rowTitle.substring(0, 21) + "...";
            let rowDesc = row.description ? row.description.substring(0, 72) : undefined;
            return { id: rowId, title: rowTitle, description: rowDesc };
        });

        if (rows.length > 0) {
            formattedSections.push({
                title: (sec.title || "Opciones").substring(0, 50),
                rows: rows
            });
            totalRows += rows.length;
        }
    }

    if (totalRows === 0) return;

    let validBtnText = (buttonText || "Ver Opciones").substring(0, 20);

    const payload = {
        messaging_product: 'whatsapp',
        to: cleanNumber(to),
        type: 'interactive',
        interactive: {
            type: 'list',
            body: { text: (bodyText || "Selecciona una opción").substring(0, 1024) },
            action: { button: validBtnText, sections: formattedSections }
        }
    };

    await makeWhatsAppRequest(payload, 'List');
}

export async function sendLocationMessage(to: string, lat: number, long: number, name: string, address: string): Promise<void> {
    await makeWhatsAppRequest({
        messaging_product: 'whatsapp', to: cleanNumber(to), type: 'location',
        location: { latitude: lat, longitude: long, name: name, address: address }
    }, 'Location');
}

function getMediaType(url: string, fileName: string): 'image' | 'document' | 'video' | 'audio' | 'unsupported' {
    const ext = (fileName.includes('.') ? fileName.split('.').pop() : url.split('.').pop())?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return 'image';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(ext || '')) return 'document';
    if (['mp4', '3gp'].includes(ext || '')) return 'video';
    if (['mp3', 'aac', 'ogg'].includes(ext || '')) return 'audio';
    return 'image';
}
