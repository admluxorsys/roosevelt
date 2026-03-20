import { NextResponse } from 'next/server';
import axios from 'axios';
import { db, admin } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const bodyValue = await req.json();
        const { message, toNumber, cardId, groupId, type, template, platform = 'kamban' } = bodyValue;

        if (!message || !toNumber) {
            return NextResponse.json(
                { error: 'Missing required fields: message and toNumber' },
                { status: 400 }
            );
        }

        let responseData: any = {};
        let messageId: string | undefined;
        let cleanTo = toNumber;

        // --- Platform Switching Logic ---
        const targetPlatform = platform.toLowerCase();

        try {
            if (targetPlatform === 'instagram' || targetPlatform === 'messenger') {
                console.log(`[Omnichannel API] Sending to ${targetPlatform} (ID: ${toNumber})`);
                // For Meta, toNumber is the PSID/IGSID, so we don't clean it as phone number
                const { sendMetaMessage } = await import('@/lib/sendProviders');
                responseData = await sendMetaMessage(toNumber, message);
                messageId = responseData?.message_id;

            } else if (targetPlatform === 'telegram') {
                console.log(`[Omnichannel API] Sending to Telegram (ChatID: ${toNumber})`);
                // For Telegram, toNumber is ChatID
                const { sendTelegramMessage } = await import('@/lib/sendProviders');
                responseData = await sendTelegramMessage(toNumber, message);
                messageId = responseData?.result?.message_id?.toString();

            } else {
                // --- Default: WhatsApp Logic ---
                const { sendWhatsAppMessage } = await import('@/lib/sendProviders');
                responseData = await sendWhatsAppMessage(toNumber, message, { type, template });
                messageId = responseData?.messages?.[0]?.id;
                cleanTo = responseData?.sentTo || toNumber;
            }

            console.log(`[Omnichannel API] ✅ SUCCESS! Platform: ${targetPlatform}, ID: ${messageId}`);

        } catch (error: any) {
            console.error(`[Omnichannel API] ❌ FAILED (${targetPlatform})`, error.response?.data || error.message);
            return NextResponse.json(
                { error: 'Failed to send message', details: error.response?.data || error.message },
                { status: 500 }
            );
        }

        // 2. Log in Firestore (Decoupled from sending status)
        let finalCardId = cardId;
        let finalGroupId = groupId;

        if (finalCardId && finalGroupId) {
            try {
                const cardRef = db.collection('kamban-groups').doc(finalGroupId).collection('cards').doc(finalCardId);
                
                await cardRef.update({
                    lastMessage: message.length > 40 ? message.substring(0, 37) + '...' : message,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    ...(targetPlatform === 'kamban' || targetPlatform === 'whatsapp' ? { contactNumberClean: cleanTo } : {}),
                    messages: admin.firestore.FieldValue.arrayUnion({
                        sender: 'agent',
                        text: message,
                        timestamp: admin.firestore.Timestamp.now(), // More reliable Firestore Timestamp
                        kambanMessageId: messageId || null,
                        platform: targetPlatform
                    }),
                    unreadCount: 0,
                });
                console.log(`[Omnichannel API] Firestore log success for ${finalCardId}`);
            } catch (logError: any) {
                console.error('[Omnichannel API] Firestore log failed (but message was sent):', logError.message);
                // We DON'T return 500 here because the message reached the provider
            }
        } else {
            console.log('[Omnichannel API] Warning: No cardId/groupId provided. Skipping Firestore log.');
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
        console.error('Fatal API Error:', error.response?.data || error.message);
        return NextResponse.json(
            {
                error: 'Fatal error processing request',
                details: error.response?.data || error.message,
            },
            { status: 500 }
        );
    }
}


