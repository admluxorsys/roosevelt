import { NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';

// Meta Webhook Verification (Handshake)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'my_verify_token_123';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[Webhook] Verification successful');
        return new Response(challenge, { status: 200 });
    }

    return new Response('Forbidden', { status: 403 });
}

// POST: Handle incoming messages
export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('[Webhook] Received:', JSON.stringify(body, null, 2));

        // Check if it's a WhatsApp message
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (message) {
            const from = message.from; // Sender's phone number
            const text = message.text?.body;
            const messageId = message.id;

            if (from && text) {
                console.log(`[Webhook] Message from ${from}: ${text}`);
                
                // 1. Find or create the contact in CRM/Kanban
                // We search by contactNumberClean (without + or spaces)
                const cleanFrom = from.replace(/\D/g, '');
                
                // Query cards across all kanban-groups
                const groupsSnapshot = await db.collection('kanban-groups').get();
                let targetCard: any = null;
                let targetGroupId: string | null = null;

                for (const groupDoc of groupsSnapshot.docs) {
                    const cardsSnapshot = await groupDoc.ref.collection('cards')
                        .where('contactNumberClean', '==', cleanFrom)
                        .limit(1)
                        .get();
                    
                    if (!cardsSnapshot.empty) {
                        targetCard = cardsSnapshot.docs[0];
                        targetGroupId = groupDoc.id;
                        break;
                    }
                }

                const newMessage = {
                    sender: 'user',
                    text: text,
                    timestamp: new Date(),
                    whatsappMessageId: messageId,
                    platform: 'whatsapp'
                };

                if (targetCard && targetGroupId) {
                    // Update existing card
                    await targetCard.ref.update({
                        lastMessage: text.length > 40 ? text.substring(0, 37) + '...' : text,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        unreadCount: admin.firestore.FieldValue.increment(1),
                        messages: admin.firestore.FieldValue.arrayUnion(newMessage)
                    });
                    console.log(`[Webhook] Updated card ${targetCard.id} in group ${targetGroupId}`);
                } else {
                    // Create a new contact/card in a default group (e.g., 'Bandeja de Entrada')
                    // For now, let's find the first group if none matches
                    const defaultGroupId = groupsSnapshot.docs[0]?.id || 'default';
                    const newCardRef = db.collection('kanban-groups').doc(defaultGroupId).collection('cards').doc();
                    
                    await newCardRef.set({
                        contactName: value.contacts?.[0]?.profile?.name || from,
                        contactNumber: from,
                        contactNumberClean: cleanFrom,
                        lastMessage: text.length > 40 ? text.substring(0, 37) + '...' : text,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        messages: [newMessage],
                        unreadCount: 1,
                        status: 'open',
                        source: 'WhatsApp',
                        primary_channel: 'WhatsApp'
                    });
                    console.log(`[Webhook] Created new card in group ${defaultGroupId}`);
                }

                // 2. TRIGGER CHATBOT
                try {
                    console.log(`[Webhook] Triggering chatbot for ${from}...`);
                    await triggerChatbot(from, text, targetGroupId, targetCard?.id);
                } catch (botError: any) {
                    console.error('[Webhook] Chatbot error:', botError.message);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Webhook] Error:', error.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function triggerChatbot(from: string, text: string, groupId: string | null, cardId: string | null) {
    const { sendWhatsAppMessage } = await import('@/lib/sendProviders');

    // 1. Fetch active chatbot
    const botsSnapshot = await db.collection('chatbots').where('isActive', '==', true).limit(1).get();
    
    if (botsSnapshot.empty) {
        console.log('[Chatbot] No active bot found.');
        return;
    }

    const botDoc = botsSnapshot.docs[0];
    const botData = botDoc.data();
    const flow = botData.flow || { nodes: [], edges: [] };
    
    console.log(`[Chatbot] Triggering bot: ${botData.name}`);

    // 2. Find Start Node
    const startNode = flow.nodes.find((n: any) => n.type === 'startNode');
    if (!startNode) {
        console.log('[Chatbot] No start node found in flow.');
        return;
    }

    // 3. Find first connection from start node
    const firstEdge = flow.edges.find((e: any) => e.source === startNode.id);
    if (!firstEdge) {
        console.log('[Chatbot] Start node is not connected to anything.');
        return;
    }

    // 4. Find the target node
    const targetNode = flow.nodes.find((n: any) => n.id === firstEdge.target);
    if (!targetNode) return;

    // 5. Execute action based on node type
    if (targetNode.type === 'textMessageNode') {
        const messageText = targetNode.data?.label || 'Hola, ¿en qué puedo ayudarte?';
        console.log(`[Chatbot] Sending automated reply: ${messageText}`);
        
        const sendResult = await sendWhatsAppMessage(from, messageText);
        
        // 6. Log the bot's message in Firestore
        if (cardId && groupId) {
            const cardRef = db.collection('kanban-groups').doc(groupId).collection('cards').doc(cardId);
            await cardRef.update({
                lastMessage: messageText.length > 40 ? messageText.substring(0, 37) + '...' : messageText,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                messages: admin.firestore.FieldValue.arrayUnion({
                    sender: 'agent',
                    text: `[Bot] ${messageText}`,
                    timestamp: new Date(),
                    whatsappMessageId: sendResult.messages?.[0]?.id || null,
                    platform: 'whatsapp'
                })
            });
        }
    } else {
        console.log(`[Chatbot] Target node type ${targetNode.type} not yet implemented for auto-trigger.`);
    }
}
