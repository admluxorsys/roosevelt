
import axios from 'axios';
import { db } from './firebase-admin'; // Use admin to fetch tokens on server

// --- Meta (Instagram & Messenger) ---

/**
 * Generic function to make requests to Meta Graph API
 */
async function callMetaSendApi(messageData: object, token?: string): Promise<any> {
    const accessToken = token || process.env.META_PAGE_ACCESS_TOKEN;

    if (!accessToken) {
        console.error('Missing Access Token (Meta/Instagram).');
        throw new Error('Access Token is not configured.');
    }

    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`;

    try {
        const response = await axios.post(url, messageData);
        return response.data;
    } catch (error: any) {
        const errorData = error.response?.data || error.message;
        console.error('Meta API Error:', JSON.stringify(errorData, null, 2));
        throw new Error(`Meta API Error: ${JSON.stringify(errorData)}`);
    }
}

export async function sendMetaMessage(recipientId: string, text: string, token?: string): Promise<any> {
    if (!text) return;
    const messageData = {
        recipient: { id: recipientId },
        message: { text: text }
    };
    return await callMetaSendApi(messageData, token);
}

// --- WhatsApp Business Cloud API (Multi-Tenant Aware) ---

interface WhatsAppSendOptions {
    type?: 'text' | 'template' | 'quick_reply' | 'list' | 'media';
    template?: any;
    buttons?: any[];
    button?: string;
    sections?: any[];
    url?: string;
    filename?: string;
    // Multi-tenant context
    userId?: string;
    entityId?: string;
}

/**
 * Sends a message via WhatsApp Business API.
 * If userId and entityId are provided, it fetches the credentials from Firestore.
 */
export async function sendWhatsAppMessage(
    toNumber: string,
    message: string,
    options: WhatsAppSendOptions = {}
): Promise<any> {
    let token = process.env.WHATSAPP_ACCESS_TOKEN;
    let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    // 1. Multi-Tenant Token Resolution
    if (options.userId && options.entityId) {
        try {
            // First try standard paths for the specific user
            const configPath = `users/${options.userId}/entities/${options.entityId}/integrations/whatsapp`;
            const internalPath = `users/${options.userId}/entities/${options.entityId}/integrations/whatsapp_internal`;

            const configDoc = await db.doc(configPath).get();
            let data = configDoc.data();

            if (!data?.accessToken || !data?.phoneNumberId) {
                const internalDoc = await db.doc(internalPath).get();
                if (internalDoc.exists) data = internalDoc.data();
            }

            // Explicitly removed backup discovery scan to enforce tenant isolation and improve speed

            if (data?.accessToken && data?.phoneNumberId) {
                token = data.accessToken;
                phoneNumberId = data.phoneNumberId;
            } else {
                console.warn(`[sendWhatsAppMessage] No valid config found for entity ${options.entityId}`);
            }
        } catch (err) {
            console.error(`[sendWhatsAppMessage] Error resolving config:`, err);
        }
    }

    // 2. Final Extraction & Validation
    if (!token || !phoneNumberId) {
        throw new Error(`Configuración de WhatsApp faltante para '${options.entityId}'. \nDetalles: userId=${options.userId}, hasToken=${!!token}, hasPhoneId=${!!phoneNumberId}`);
    }

    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const cleanTo = toNumber.replace(/\D/g, '');

    let payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
    };

    // Construct Payload based on type
    if (options.type === 'template' && options.template) {
        payload.type = 'template';
        payload.template = {
            name: options.template.name,
            language: { code: options.template.language?.code || 'es' },
            components: options.template.components || []
        };
    } else if (options.type === 'quick_reply') {
        payload.type = 'interactive';
        payload.interactive = {
            type: 'button',
            body: { text: message },
            action: { buttons: options.buttons }
        };
    } else if (options.type === 'list') {
        payload.type = 'interactive';
        payload.interactive = {
            type: 'list',
            header: { type: 'text', text: 'Opciones' },
            body: { text: message },
            action: {
                button: options.button || 'Seleccionar',
                sections: options.sections
            }
        };
    } else if (options.type === 'media') {
        payload.type = 'document'; // or image/video based on filename? defaulting to document
        payload.document = {
            link: options.url,
            filename: options.filename,
            caption: message
        };
    } else {
        payload.type = 'text';
        payload.text = { body: message, preview_url: false };
    }

    try {
        const response = await axios.post(url, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return { ...response.data, sentTo: cleanTo };
    } catch (error: any) {
        const errorData = error.response?.data || error.message;
        console.error('WhatsApp API Error:', JSON.stringify(errorData, null, 2));
        throw new Error(`WhatsApp API Error: ${JSON.stringify(errorData)}`);
    }
}
