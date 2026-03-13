import { NextResponse } from 'next/server';
import axios from 'axios';
import { db, admin } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const bodyValue = await req.json();
        const { message, toNumber, cardId, groupId, type, template, platform = 'whatsapp' } = bodyValue;

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

        // 2. Log in Firestore
        let finalCardId = cardId;
        let finalGroupId = groupId;

        if (!finalCardId || !finalGroupId) {
            // ... (Card finding logic - largely same, but needs to be platform aware if strictly needed)
            // For now, assuming card exists or this is a response.
            // Simplified fallback for existing cards to keep it safe.
            // If strictly new contact from API, we might need more logic here, but for now we focus on REPLYing.
            console.log('[Omnichannel API] Warning: No cardId provided. Logging might be incomplete if card not found.');
            // (We can assume frontend always sends cardId for replies)
        }

        if (finalCardId && finalGroupId) {
            const cardRef = db.collection('kanban-groups').doc(finalGroupId).collection('cards').doc(finalCardId);

            await cardRef.update({
                lastMessage: message.length > 40 ? message.substring(0, 37) + '...' : message,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                // Only update contactNumberClean if it's WhatsApp/Phone
                ...(targetPlatform === 'whatsapp' ? { contactNumberClean: cleanTo } : {}),
                messages: admin.firestore.FieldValue.arrayUnion({
                    sender: 'agent',
                    text: message,
                    timestamp: new Date(),
                    whatsappMessageId: messageId || null, // rename this field in future to generic 'messageId'
                    platform: targetPlatform
                }),
                unreadCount: 0,
            });
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
        console.error('Error sending message:', error.response?.data || error.message);
        return NextResponse.json(
            {
                error: 'Failed to send message',
                details: error.response?.data || error.message,
            },
            { status: 500 }
        );
    }
}

