
// src/helpers/whatsappAPI.ts
import * as functions from 'firebase-functions';
import axios from 'axios';

const whatsappConfig = functions.config().whatsapp;
// Updated with user provided keys as primary or fallback
const accessToken = whatsappConfig?.access_token || '';
const phoneNumberId = whatsappConfig?.phone_number_id || '676837795516836';

function cleanNumber(phone: string): string {
    return phone.replace(/\D/g, ''); // Solo números, quita el '+'
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function makeWhatsAppRequest(data: object, type: string) {
    // Priority: Cloud Config > Environment Variables
    const apiToken = functions.config().whatsapp?.access_token || process.env.WHATSAPP_ACCESS_TOKEN || accessToken;
    const phoneId = functions.config().whatsapp?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || phoneNumberId;

    if (!apiToken || !phoneId) {
        functions.logger.error('❌ [WhatsApp API] Missing credentials!', { hasToken: !!apiToken, hasPhoneId: !!phoneId });
        throw new Error('WhatsApp API credentials are not configured.');
    }

    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;

    let lastError: any = null;
    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const response = await axios.post(url, data, {
                headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
            });
            functions.logger.info(`✅ [WhatsApp API] ${type} success (Attempt ${attempt})`, { recipient: (data as any).to });
            return response.data;
        } catch (error: any) {
            lastError = error.response?.data || error.message;
            
            // Only retry on potential transient errors (5xx or 429)
            const status = error.response?.status;
            const isTransient = status === 429 || (status >= 500 && status <= 599);
            
            if (isTransient && attempt < MAX_ATTEMPTS) {
                const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s
                functions.logger.warn(`⚠️ [WhatsApp API] ${type} failed (Attempt ${attempt}/${MAX_ATTEMPTS}). Retrying in ${waitTime}ms...`, { error: lastError });
                await sleep(waitTime);
                continue;
            }
            
            functions.logger.error(`❌ [WhatsApp API] Error (${type}) on attempt ${attempt}:`, {
                error: lastError,
                payload: data,
                url: url.replace(phoneId, 'HIDDEN_ID')
            });
            break;
        }
    }
    
    throw new Error(`WhatsApp API Error after ${MAX_ATTEMPTS} attempts: ${JSON.stringify(lastError)}`);
}

export async function markAsRead(messageId: string): Promise<any> {
    if (!messageId) return;
    return await makeWhatsAppRequest({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
    }, 'MarkAsRead');
}

export async function sendMessage(to: string, message: string, options?: { preview_url?: boolean }): Promise<any> {
    if (!message) return;
    const cleanTo = cleanNumber(to);
    const payload: any = {
        messaging_product: 'whatsapp',
        to: cleanTo,
        text: { body: message }
    };
    if (options?.preview_url) {
        payload.text.preview_url = true;
    }
    return await makeWhatsAppRequest(payload, 'Text');
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

export async function sendButtonMessage(to: string, bodyText: string, buttons: any[], header?: { type: string, text?: string, url?: string }): Promise<void> {
    const validButtons = buttons.slice(0, 3).map((btn, i) => {
        const id = (btn.id || `btn_${i}`).substring(0, 256);
        const title = (btn.title || "Opción").substring(0, 20);
        return {
            type: "reply",
            reply: { id, title }
        };
    });

    if (validButtons.length === 0) return;

    const interactive: any = {
        type: 'button',
        body: { text: bodyText.substring(0, 1024) },
        action: { buttons: validButtons }
    };

    // Add optional header if provided
    if (header && header.type !== 'none') {
        if (header.type === 'text' && header.text) {
            interactive.header = { type: 'text', text: header.text.substring(0, 60) };
        } else if (['image', 'video', 'document'].includes(header.type) && header.url) {
            interactive.header = {
                type: header.type,
                [header.type]: { link: header.url }
            };
        }
    }

    const payload = {
        messaging_product: 'whatsapp',
        to: cleanNumber(to),
        type: 'interactive',
        interactive
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
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'].includes(ext || '')) return 'document';
    if (['mp4', '3gp', 'mov', 'avi', 'mkv'].includes(ext || '')) return 'video';
    if (['mp3', 'aac', 'ogg', 'wav', 'm4a'].includes(ext || '')) return 'audio';
    return 'image';
}
