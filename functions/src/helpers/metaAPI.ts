
import * as functions from 'firebase-functions';
import axios from 'axios';

import * as admin from 'firebase-admin';

// Get tokens from environment variables
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
export const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN;

interface Context {
    userId?: string;
    entityId?: string;
}

// Generic function to make requests to Graph API
async function callSendApi(messageData: object, token?: string, ctx?: Context): Promise<any> {
    let accessToken = token || PAGE_ACCESS_TOKEN;

    // Resolve tenant-specific token if context provided
    if (ctx?.userId && ctx?.entityId && !token) {
        try {
            const db = admin.firestore();
            // Try WhatsApp config first as it often contains the Meta system token
            const configSnap = await db.doc(`users/${ctx.userId}/entities/${ctx.entityId}/integrations/whatsapp`).get();
            if (configSnap.exists) {
                const data = configSnap.data();
                if (data?.accessToken) {
                    accessToken = data.accessToken;
                }
            }
        } catch (error) {
            functions.logger.error('[Meta API] Error fetching tenant token', error);
        }
    }

    if (!accessToken) {
        functions.logger.error('Missing Access Token (Meta/Instagram).');
        throw new Error('Access Token is not configured.');
    }

    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`;

    try {
        const response = await axios.post(url, messageData);
        return response.data;
    } catch (error: any) {
        const errorData = error.response?.data || error.message;
        functions.logger.error('Meta API Error:', errorData);
        throw new Error(`Meta API Error: ${JSON.stringify(errorData)}`);
    }
}

/**
 * Sends a text message to a user via Messenger.
 */
export async function sendMetaMessage(recipientId: string, text: string, token?: string, ctx?: Context): Promise<any> {
    if (!text) return;

    const messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: text
        }
    };

    return await callSendApi(messageData, token, ctx);
}

/**
 * Sends a media message (image, video, etc.).
 */
export async function sendMetaMediaMessage(recipientId: string, mediaUrl: string, mediaType: 'image' | 'video' | 'audio' | 'file' = 'image', token?: string, ctx?: Context): Promise<any> {
    if (!mediaUrl) return;

    const messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: mediaType,
                payload: {
                    url: mediaUrl,
                    is_reusable: true
                }
            }
        }
    };

    return await callSendApi(messageData, token, ctx);
}

/**
 * Marks a message as read in Messenger.
 * Note: Facebook does not have an explicit "mark as read" endpoint same as WhatsApp, but we can send "sender_action: mark_seen".
 */
export async function markMetaMessageAsRead(recipientId: string, token?: string, ctx?: Context): Promise<any> {
    const messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: 'mark_seen'
    };

    return await callSendApi(messageData, token, ctx);
}

/**
 * Sends Quick Replies (Buttons).
 * Facebook Quick Replies are different from WhatsApp Buttons.
 */
export async function sendMetaQuickReplies(recipientId: string, text: string, quickReplies: any[], token?: string, ctx?: Context): Promise<any> {
    // Format quick replies for Messenger
    // Expected format: { content_type: 'text', title: 'Yes', payload: 'YES_PAYLOAD' }
    const formattedQRs = quickReplies.slice(0, 13).map(qr => ({
        content_type: 'text',
        title: (qr.title || 'Opción').substring(0, 20),
        payload: qr.id || qr.payload || qr.title
    }));

    const messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: text,
            quick_replies: formattedQRs
        }
    };

    return await callSendApi(messageData, token, ctx);
}
