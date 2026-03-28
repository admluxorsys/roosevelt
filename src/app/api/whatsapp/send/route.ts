import { NextResponse } from 'next/server';
import axios from 'axios';
import { db, admin } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const bodyValue = await req.json();
        const { message, toNumber, cardId, groupId, type, template, url, filename, platform = 'kamban', userId, entityId } = bodyValue;

        if (!message || !toNumber) {
            return NextResponse.json(
                { error: 'Missing required fields: message and toNumber' },
                { status: 400 }
            );
        }

        if (!userId || !entityId) {
            return NextResponse.json(
                { error: 'Missing tenant context: userId and entityId are required' },
                { status: 400 }
            );
        }

        let responseData: any = {};
        let messageId: string | undefined;
        let cleanTo = toNumber;

        // --- Platform Switching Logic ---
        const targetPlatform = platform.toLowerCase();

        let finalCardId = cardId;
        let finalGroupId = groupId;
        let apiError: any = null;

        try {
            if (targetPlatform === 'instagram' || targetPlatform === 'messenger') {
                console.log(`[Omnichannel API] Sending to ${targetPlatform} (ID: ${toNumber})`);
                const { sendMetaMessage } = await import('@/lib/sendProviders');
                responseData = await sendMetaMessage(toNumber, message);
                messageId = responseData?.message_id;
            } else {
                const { sendWhatsAppMessage } = await import('@/lib/sendProviders');
                responseData = await sendWhatsAppMessage(toNumber, message, { type, template, url, filename, userId, entityId });
                messageId = responseData?.messages?.[0]?.id;
                cleanTo = responseData?.sentTo || toNumber;
            }
            console.log(`[Omnichannel API] ✅ SUCCESS! Platform: ${targetPlatform}, ID: ${messageId}`);
        } catch (error: any) {
            apiError = error.response?.data || error.message;
            console.error(`[Omnichannel API] ❌ FAILED (${targetPlatform})`, apiError);
            // We proceed to Firestore log even if API failed
        }

        // 2. Log in Firestore
        if (finalCardId && finalGroupId) {
            try {
                const cardRef = db
                    .collection('users').doc(userId)
                    .collection('entities').doc(entityId)
                    .collection('kanban-groups').doc(finalGroupId)
                    .collection('cards').doc(finalCardId);
                
                const newMessage = {
                    sender: 'agent',
                    text: message,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    kambanMessageId: messageId || null,
                    platform: targetPlatform,
                    status: apiError ? 'failed' : 'sent',
                    error: apiError ? (typeof apiError === 'object' ? JSON.stringify(apiError) : apiError) : null
                };

                await cardRef.update({
                    lastMessage: message.length > 40 ? message.substring(0, 37) + '...' : message,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    ...(targetPlatform === 'whatsapp' ? { contactNumberClean: cleanTo } : {}),
                    messages: admin.firestore.FieldValue.arrayUnion(newMessage),
                    unreadCount: 0,
                });
                console.log(`[Omnichannel API] Firestore log success for ${finalCardId} (Status: ${newMessage.status})`);
            } catch (logError: any) {
                console.error('[Omnichannel API] Firestore log failed:', logError.message);
            }
        }

        if (apiError) {
            return NextResponse.json(
                { error: 'Failed to send message', details: apiError },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: responseData,
            messageId: messageId,
            sentTo: cleanTo,
            cardId: finalCardId,
            groupId: finalGroupId
        });
    } catch (error: any) {
        console.error('Fatal API Error:', error.message);
        return NextResponse.json(
            { error: 'Fatal error processing request', details: error.message },
            { status: 500 }
        );
    }
}



