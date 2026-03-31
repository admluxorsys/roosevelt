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
                console.log(`[Omnichannel API] Attempting to send WhatsApp message to ${toNumber}...`);
                responseData = await sendWhatsAppMessage(toNumber, message, { type, template, url, filename, userId, entityId });
                messageId = responseData?.messages?.[0]?.id;
                cleanTo = responseData?.sentTo || toNumber;
                console.log(`[Omnichannel API] [META RESPONSE]:`, JSON.stringify(responseData, null, 2));
            }
            console.log(`[Omnichannel API] ✅ SUCCESS! Platform: ${targetPlatform}, ID: ${messageId} | Recipient: ${cleanTo}`);
        } catch (error: any) {
            apiError = error.response?.data || error.message;
            console.error(`[Omnichannel API] ❌ FAILED (${targetPlatform})`, apiError);
            // We proceed to Firestore log even if API failed
        }

        // 2. Log in Firestore (Aggressive Resolution)
        // If we have a temporary ID or missing IDs, we MUST search by number
        let resolvedCardId = finalCardId;
        let resolvedGroupId = finalGroupId;

        if (!resolvedCardId || !resolvedGroupId || resolvedCardId.startsWith('temp')) {
            console.log(`[Omnichannel API] 🔍 Resolving entity-card for content: ${cleanTo}`);
            try {
                const groupsSnap = await db.collection('users').doc(userId).collection('entities').doc(entityId).collection('kanban-groups').get();
                for (const groupDoc of groupsSnap.docs) {
                    const cardsRef = groupDoc.ref.collection('cards');
                    let cardSnap: any = null;

                    const searchNo = cleanTo.replace(/\+/g, '').replace(/\D/g, '');

                    const query1 = await cardsRef.where('contactNumberClean', '==', searchNo).get();
                    const query2 = query1.empty ? await cardsRef.where('contactNumber', '==', cleanTo).get() : query1;
                    const query3 = query2.empty ? await cardsRef.where('external_id', '==', cleanTo).get() : query2;

                    if (!query3.empty) {
                        // Pick the one with the latest update to match Sidebar deduplication
                        const sorted = query3.docs.sort((a, b) => {
                            const tA = (a.data().updatedAt?.toDate?.() || new Date(0)).getTime();
                            const tB = (b.data().updatedAt?.toDate?.() || new Date(0)).getTime();
                            return tB - tA;
                        });
                        resolvedCardId = sorted[0].id;
                        resolvedGroupId = groupDoc.id;
                        console.log(`[Omnichannel API] ✅ FOUND BEST MATCH: Card ${resolvedCardId} in Group ${resolvedGroupId}`);
                        break;
                    }
                }
            } catch (err: any) {
                console.error('[Omnichannel API] Resolution error:', err.message);
            }
        }

        if (resolvedCardId && resolvedGroupId) {
            try {
                const cardRef = db
                    .collection('users').doc(userId)
                    .collection('entities').doc(entityId)
                    .collection('kanban-groups').doc(resolvedGroupId)
                    .collection('cards').doc(resolvedCardId);

                const newMessage = {
                    sender: 'agent',
                    text: message,
                    timestamp: new Date(),
                    whatsappMessageId: messageId || null,
                    platform: targetPlatform,
                    status: apiError ? 'failed' : 'sent',
                    error: apiError ? (typeof apiError === 'object' ? JSON.stringify(apiError) : apiError) : null
                };

                await cardRef.update({
                    lastMessage: message.length > 40 ? message.substring(0, 37) + '...' : message,
                    updatedAt: new Date(),
                    ...(targetPlatform === 'whatsapp' ? { contactNumberClean: cleanTo.replace(/\D/g, '') } : {}),
                    messages: admin.firestore.FieldValue.arrayUnion(newMessage),
                    unreadCount: 0,
                });
                console.log(`[Omnichannel API] Firestore log success for ${resolvedCardId} (Status: ${newMessage.status})`);
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
            cardId: resolvedCardId,
            groupId: resolvedGroupId
        });
    } catch (error: any) {
        console.error('Fatal API Error:', error.message);
        return NextResponse.json(
            { error: 'Fatal error processing request', details: error.message },
            { status: 500 }
        );
    }
}
