import { NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';
import fs from 'fs';
import path from 'path';

const DEBUG_FILE = '/tmp/webhook.log';

function debugLog(msg: string) {
    const time = new Date().toISOString();
    const logMsg = `[${time}] [Webhook Debug] ${msg}\n`;
    console.log(logMsg.trim());
    try { fs.appendFileSync(DEBUG_FILE, logMsg); } catch (e) {
        console.error("Failed to write to debug file:", e);
    }
}

// Meta Webhook Verification (Handshake)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const VERIFY_TOKEN = process.env.kamban_VERIFY_TOKEN || 'my_verify_token_123';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        debugLog('Verification successful (GET)');
        return new Response(challenge, { status: 200 });
    }
    debugLog('Verification failed (GET)');
    return new Response('Forbidden', { status: 403 });
}

// POST: Handle incoming messages
export async function POST(req: Request) {
    debugLog('--- WEBHOOK HIT RECEIVED ---');
    console.log('--- WEBHOOK HIT RECEIVED (STDOUT) ---');
    
    try {
        const rawBody = await req.clone().text();
        const body = JSON.parse(rawBody);
        debugLog(`[WEBHOOK JSON PARSED] entries: ${body.entry?.length}`);

        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (value?.statuses && value.statuses.length > 0) {
            const statusUpdate = value.statuses[0];
            const status = statusUpdate.status;
            const messageId = statusUpdate.id;
            const recipientId = statusUpdate.recipient_id;

            debugLog(`[POST] Status Update: ${status} for message ${messageId}`);

            // Find card containing this message
            const cardsRef = db.collectionGroup('cards');
            const snapshot = await cardsRef.where('platform_ids.kamban', '==', recipientId).get();
            
            if (!snapshot.empty) {
                const cardDoc = snapshot.docs[0];
                const messages = cardDoc.data().messages || [];
                let changed = false;
                
                const updatedMessages = messages.map((m: any) => {
                    if (m.kambanMessageId === messageId) {
                        changed = true;
                        return { ...m, status: status };
                    }
                    return m;
                });

                if (changed) {
                    await cardDoc.ref.update({ messages: updatedMessages });
                    debugLog(`[POST] Updated status to "${status}" for message ${messageId}`);
                }
            }
            return NextResponse.json({ success: true });
        }

        const message = value?.messages?.[0];
        if (message) {
            const from = message.from; 
            let text = message.text?.body;
            
            // Handle interactive responses (Buttons, Lists)
            if (message.type === 'interactive') {
                const interactive = message.interactive;
                text = interactive?.button_reply?.id || interactive?.list_reply?.id || interactive?.button_reply?.title || interactive?.list_reply?.title;
                debugLog(`[POST] Interactive message received: ${text}`);
            } else if (message.type === 'button') {
                text = message.button?.payload || message.button?.text;
                debugLog(`[POST] Button message received: ${text}`);
            }

            const messageId = message.id;
            debugLog(`[POST] Message details - From: ${from}, Text: ${text}, ID: ${messageId}`);

            if (from && text) {
                const cleanFrom = from.replace(/\D/g, '');
                debugLog(`[POST] Searching for card with clean number: ${cleanFrom}`);
                
                const groupsSnapshot = await db.collection('kamban-groups').get();
                debugLog(`[POST] Groups found: ${groupsSnapshot.size}`);
                
                let targetCardDoc: any = null;
                let targetGroupId: string | null = null;

                for (const groupDoc of groupsSnapshot.docs) {
                    debugLog(`[POST] Checking group ${groupDoc.id}...`);
                    try {
                        const cardsSnapshot = await groupDoc.ref.collection('cards')
                            .where('contactNumberClean', '==', cleanFrom)
                            .limit(1)
                            .get();
                        
                        if (!cardsSnapshot.empty) {
                            targetCardDoc = cardsSnapshot.docs[0];
                            targetGroupId = groupDoc.id;
                            debugLog(`[POST] Found existing card ${targetCardDoc.id} in group ${targetGroupId}`);
                            break;
                        }
                    } catch (queryError: any) {
                        if (queryError.code === 9 || queryError.message?.includes('FAILED_PRECONDITION')) {
                            debugLog(`[POST] Index missing for fast lookup. Falling back to in-memory search for group ${groupDoc.id}...`);
                            const allCardsInGroup = await groupDoc.ref.collection('cards').get();
                            const match = allCardsInGroup.docs.find(c => c.data().contactNumberClean === cleanFrom);
                            if (match) {
                                targetCardDoc = match;
                                targetGroupId = groupDoc.id;
                                debugLog(`[POST] Found existing card ${targetCardDoc.id} via fallback in-memory search.`);
                                break;
                            }
                        } else {
                            throw queryError;
                        }
                    }
                }

                const newMessage = {
                    sender: 'user' as const,
                    text: text,
                    timestamp: new Date(),
                    kambanMessageId: messageId,
                    platform: 'kamban'
                };

                let cardId = targetCardDoc?.id;
                let groupId = targetGroupId;

                if (targetCardDoc && targetGroupId) {
                    const currentData = targetCardDoc.data();
                    const currentUnread = currentData.unreadCount || 0;
                    debugLog(`[POST] Updating existing card ${targetCardDoc.id}. Current unread in DB: ${currentUnread}`);
                    
                    await targetCardDoc.ref.update({
                        lastMessage: text.length > 40 ? text.substring(0, 37) + '...' : text,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        unreadCount: admin.firestore.FieldValue.increment(1),
                        messages: admin.firestore.FieldValue.arrayUnion(newMessage)
                    });
                } else {
                    debugLog(`[POST] Creating NEW card for ${from}`);
                    const defaultGroupId = groupsSnapshot.docs[0]?.id || 'default';
                    const newCardRef = db.collection('kamban-groups').doc(defaultGroupId).collection('cards').doc();
                    
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
                        source: 'kamban',
                        primary_channel: 'kamban'
                    });
                    cardId = newCardRef.id;
                    groupId = defaultGroupId;
                    debugLog(`[POST] New card created: ${cardId} in group ${groupId}`);
                }

                // 2. TRIGGER CHATBOT
                debugLog(`[POST] Triggering chatbot engine...`);
                try {
                    await triggerChatbot(from, text, groupId, cardId);
                    debugLog(`[POST] Chatbot engine execution finished.`);
                } catch (botError: any) {
                    debugLog(`[POST] ERROR in triggerChatbot: ${botError.message}`);
                    console.error('[Webhook] Chatbot error:', botError.message);
                }
            } else {
                debugLog(`[POST] Message text or from missing. Skipping.`);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        debugLog(`[POST CRASH] ${error.stack || error.message}`);
        console.error('[Webhook] Error:', error.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function triggerChatbot(from: string, text: string, groupId: string | null, cardId: string | null) {
    debugLog(`[TRACING] Starting triggerChatbot. From: ${from}, Group: ${groupId}, Card: ${cardId}`);
    if (!groupId || !cardId) {
        debugLog(`[TRACING] Missing groupId (${groupId}) or cardId (${cardId}). Aborting.`);
        return;
    }
    const { sendWhatsAppMessage } = await import('@/lib/sendProviders');

    // 1. Fetch active chatbot
    debugLog(`[TRACING] Fetching active chatbot...`);
    try {
        const botsSnapshot = await db.collection('chatbots').get();
        debugLog(`[TRACING] Bots found in collection: ${botsSnapshot.size}`);
        
        const activeBotDoc = botsSnapshot.docs.find(doc => {
            const d = doc.data();
            return d.isActive === true || d.isActive === 'true';
        });
        
        if (!activeBotDoc) {
            debugLog('[TRACING] No active chatbot found (checked boolean and string isActive).');
            return;
        }

        const botData = activeBotDoc.data();
        debugLog(`[TRACING] Active bot identified: ${botData.name || activeBotDoc.id}`);
        const flow = botData.flow || { nodes: [], edges: [] };
        debugLog(`[TRACING] Flow stats: ${flow.nodes?.length || 0} nodes, ${flow.edges?.length || 0} edges.`);

        const cardRef = db.collection('kamban-groups').doc(groupId).collection('cards').doc(cardId);
        
        const cardSnap = await cardRef.get();
        if (!cardSnap.exists) {
            debugLog(`[TRACING] Card ${cardId} NOT FOUND in Firestore! Group: ${groupId}`);
            return;
        }
        const cardData = cardSnap.data() || {};

        // Helper for variable replacement
        const replaceVariables = (text: string) => {
            if (!text) return '';
            let processed = text;
            const vars = {
                nombre: cardData.contactName || 'Amigo',
                name: cardData.contactName || 'Amigo',
                ...(cardData.variables || {}),
                ...(cardData.customFields || {})
            };
            for (const [key, val] of Object.entries(vars)) {
                const regex = new RegExp(`\\{${key}\\}`, 'gi');
                processed = processed.replace(regex, String(val));
            }
            return processed;
        };
        
        // Check if we are in a 'wait' state for input
        const currentState = cardData.chatbotState || {};
        let currentNodeId = currentState.currentNodeId;
        debugLog(`[TRACING] Current state: ${JSON.stringify(currentState)}`);

        // 3. Execution Logic
        const executeNode = async (nodeId: string) => {
            debugLog(`[TRACING] executeNode called for: ${nodeId}`);
            const node = flow.nodes.find((n: any) => n.id === nodeId);
            if (!node) {
                debugLog(`[TRACING] Node NOT FOUND in flow: ${nodeId}`);
                return;
            }

            debugLog(`[TRACING] Found node type: ${node.type}`);

            if (node.type === 'startNode') {
                const nextEdge = flow.edges.find((e: any) => e.source === node.id);
                debugLog(`[TRACING] Start node, next edge: ${nextEdge?.target || 'none'}`);
                if (nextEdge) await executeNode(nextEdge.target);
                return;
            }

            if (node.type === 'textMessageNode') {
                const rawText = node.data?.content || node.data?.text || 'Hola';
                const messageText = replaceVariables(rawText);
                debugLog(`[TRACING] Text node, sending: "${messageText}" to ${from}`);
                try {
                    const sendResult = await sendWhatsAppMessage(from, messageText);
                    debugLog(`[TRACING] Send success: ${sendResult.messages?.[0]?.id}`);
                    
                    // Log message
                    await cardRef.update({
                        messages: admin.firestore.FieldValue.arrayUnion({
                            sender: 'agent',
                            text: messageText,
                            timestamp: new Date(),
                            kambanMessageId: sendResult.messages?.[0]?.id || null,
                            platform: 'kamban'
                        }),
                        lastMessage: messageText.substring(0, 37) + '...',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        unreadCount: 0,
                    });

                    // Move to next
                    const nextEdge = flow.edges.find((e: any) => e.source === node.id);
                    debugLog(`[TRACING] Next edge after text node: ${nextEdge?.target || 'none'}`);
                    if (nextEdge) {
                        await executeNode(nextEdge.target);
                    } else {
                        debugLog(`[TRACING] End of flow reached after text node.`);
                        await cardRef.update({ 'chatbotState.currentNodeId': null });
                    }
                } catch (sendError: any) {
                    debugLog(`[TRACING] FATAL ERROR sending message: ${sendError.message}`);
                }
                return;
            }

            if (node.type === 'quickReplyNode') {
                const rawText = node.data?.bodyText || node.data?.text || 'Elige una opción:';
                const messageText = replaceVariables(rawText);
                debugLog(`[TRACING] QuickReply node, message: "${messageText}"`);
                const buttons = (node.data?.buttons || []).map((btn: any) => ({
                    type: 'reply',
                    reply: {
                        id: typeof btn === 'object' ? (btn.id || btn.payload || btn.title) : btn,
                        title: (typeof btn === 'object' ? btn.title : btn).substring(0, 20)
                    }
                })).slice(0, 3);

                const sendResult = await sendWhatsAppMessage(from, messageText, { 
                    type: 'quick_reply',
                    buttons: buttons 
                } as any);

                await cardRef.update({
                    messages: admin.firestore.FieldValue.arrayUnion({
                        sender: 'agent',
                        text: `${messageText} (Opciones enviadas)`,
                        timestamp: new Date(),
                        kambanMessageId: sendResult.messages?.[0]?.id || null,
                        platform: 'kamban'
                    }),
                    'chatbotState.currentNodeId': node.id,
                    'chatbotState.waitingForInput': true,
                    'chatbotState.isQuickReply': true,
                    unreadCount: 0
                });
                return;
            }

            if (node.type === 'captureInputNode') {
                const rawText = node.data?.content || node.data?.text;
                const messageText = rawText ? replaceVariables(rawText) : null;
                debugLog(`[TRACING] CaptureInput node, current state waiting: ${currentState.waitingForInput}`);

                // If it's the first time reaching this node, we only send the prompt if content exists
                if (!currentState.waitingForInput && messageText) {
                    debugLog(`[TRACING] Sending capture prompt: "${messageText}"`);
                    const sendResult = await sendWhatsAppMessage(from, messageText);
                    await cardRef.update({
                        messages: admin.firestore.FieldValue.arrayUnion({
                            sender: 'agent',
                            text: messageText,
                            timestamp: new Date(),
                            kambanMessageId: sendResult.messages?.[0]?.id || null,
                            platform: 'kamban'
                        })
                    });
                }

                // Always update state to wait for input
                if (!currentState.waitingForInput) {
                    await cardRef.update({
                        'chatbotState.currentNodeId': node.id,
                        'chatbotState.waitingForInput': true,
                        'chatbotState.variableName': node.data?.variableName || 'last_input'
                    });
                }
                return;
            }

            if (node.type === 'mediaMessageNode') {
                const url = node.data?.url;
                const rawCaption = node.data?.caption || '';
                const caption = replaceVariables(rawCaption);
                const filename = node.data?.filename || 'archivo';
                debugLog(`[TRACING] Media node, sending URL: ${url}`);
                
                if (url) {
                    try {
                        const sendResult = await sendWhatsAppMessage(from, caption, {
                            type: 'media' as any,
                            url,
                            filename
                        } as any);

                        await cardRef.update({
                            messages: admin.firestore.FieldValue.arrayUnion({
                                sender: 'agent',
                                text: caption || `(Archivo: ${filename})`,
                                timestamp: new Date(),
                                kambanMessageId: sendResult.messages?.[0]?.id || null,
                                platform: 'kamban'
                            })
                        });
                    } catch (sendError: any) {
                        debugLog(`[TRACING] Error sending media: ${sendError.message}`);
                    }
                }

                const nextEdge = flow.edges.find((e: any) => e.source === node.id);
                if (nextEdge) {
                    await executeNode(nextEdge.target);
                } else {
                    await cardRef.update({ 'chatbotState.currentNodeId': null });
                }
                return;
            }
            
            if (node.type === 'listMessageNode') {
                const rawText = node.data?.body || node.data?.text || 'Elige una opción:';
                const messageText = replaceVariables(rawText);
                const buttonText = node.data?.buttonText || 'Ver opciones';
                const sections = (node.data?.sections || []).map((section: any) => ({
                    title: section.title || 'Opciones',
                    rows: (section.rows || section.options || []).map((row: any) => ({
                        id: typeof row === 'object' ? (row.id || row.title) : row,
                        title: (typeof row === 'object' ? row.title : row).substring(0, 24),
                        description: (typeof row === 'object' ? row.description : '').substring(0, 72)
                    })).slice(0, 10)
                })).slice(0, 10);

                debugLog(`[TRACING] ListMessage node, message: "${messageText}", sections: ${sections.length}`);
                
                try {
                    const sendResult = await sendWhatsAppMessage(from, messageText, {
                        type: 'list' as any,
                        button: buttonText,
                        sections: sections
                    } as any);

                    await cardRef.update({
                        messages: admin.firestore.FieldValue.arrayUnion({
                            sender: 'agent',
                            text: `${messageText} (Lista enviada)`,
                            timestamp: new Date(),
                            kambanMessageId: sendResult.messages?.[0]?.id || null,
                            platform: 'kamban'
                        }),
                        'chatbotState.currentNodeId': node.id,
                        'chatbotState.waitingForInput': true,
                        'chatbotState.isList': true,
                        unreadCount: 0
                    });
                } catch (sendError: any) {
                    debugLog(`[TRACING] Error sending list message: ${sendError.message}`);
                }
                return;
            }

            if (node.type === 'conditionNode') {
                const variableName = node.data?.variableName;
                const routes = node.data?.routes || [];
                const cardSnapshot = await cardRef.get();
                const currentVariables = cardSnapshot.data()?.variables || {};
                const valueToCompare = currentVariables[variableName];

                debugLog(`[TRACING] Condition node: ${variableName} = ${valueToCompare}`);

                let matchedNodeId = null;
                for (const route of routes) {
                    const { condition, value } = route;
                    let isMatch = false;

                    if (condition === 'equals') isMatch = String(valueToCompare) === String(value);
                    else if (condition === 'contains') isMatch = String(valueToCompare).includes(String(value));
                    else if (condition === 'exists') isMatch = valueToCompare !== undefined && valueToCompare !== null;

                    if (isMatch) {
                        matchedNodeId = flow.edges.find((e: any) => e.source === node.id && e.sourceHandle === route.id)?.target;
                        if (matchedNodeId) break;
                    }
                }

                if (!matchedNodeId) {
                    // Try Else route
                    matchedNodeId = flow.edges.find((e: any) => e.source === node.id && e.sourceHandle === 'else')?.target;
                }

                debugLog(`[TRACING] Condition result, next node: ${matchedNodeId || 'none'}`);
                if (matchedNodeId) {
                    await executeNode(matchedNodeId);
                } else {
                    await cardRef.update({ 'chatbotState.currentNodeId': null });
                }
                return;
            }

            if (node.type === 'setVariableNode') {
                const varName = node.data?.variableName;
                const varValue = node.data?.value;
                debugLog(`[TRACING] SetVariable node: ${varName} = ${varValue}`);
                
                if (varName) {
                    await cardRef.update({
                        [`variables.${varName}`]: varValue
                    });
                }

                const nextEdge = flow.edges.find((e: any) => e.source === node.id);
                if (nextEdge) {
                    await executeNode(nextEdge.target);
                } else {
                    await cardRef.update({ 'chatbotState.currentNodeId': null });
                }
                return;
            }

            if (node.type === 'delayNode') {
                const seconds = node.data?.durationSeconds || 2;
                debugLog(`[TRACING] Delay node: sleeping ${seconds}s`);
                await new Promise(resolve => setTimeout(resolve, seconds * 1000));
                
                const nextEdge = flow.edges.find((e: any) => e.source === node.id);
                if (nextEdge) {
                    await executeNode(nextEdge.target);
                } else {
                    await cardRef.update({ 'chatbotState.currentNodeId': null });
                }
                return;
            }
            
            if (node.type === 'endNode') {
                debugLog(`[TRACING] End node reached. Clearing state.`);
                await cardRef.update({ 'chatbotState': null });
                return;
            }

            // Fallback for unknown nodes
            debugLog(`[TRACING] WARNING: Node type "${node.type}" is NOT IMPLEMENTED. Skipping.`);
            const fallbackEdge = flow.edges.find((e: any) => e.source === node.id);
            if (fallbackEdge) {
                await executeNode(fallbackEdge.target);
            } else {
                await cardRef.update({ 'chatbotState.currentNodeId': null });
            }
        };

        // 4. Handle Input Responses vs Start
        debugLog(`[TRACING] Deciding start vs resume. WaitingForInput: ${currentState.waitingForInput}, CurrentNode: ${currentNodeId}`);
        if (currentState.waitingForInput && currentNodeId) {
            const node = flow.nodes.find((n: any) => n.id === currentNodeId);
            debugLog(`[TRACING] Resuming from node ${currentNodeId} (Type: ${node?.type})`);
            
            if (node && node.type === 'captureInputNode') {
                const varName = currentState.variableName || 'input';
                debugLog(`[TRACING] Saving capture "${text}" to variable "${varName}"`);
                await cardRef.update({
                    [`variables.${varName}`]: text,
                    'chatbotState.waitingForInput': false
                });
                
                const nextEdge = flow.edges.find((e: any) => e.source === node.id);
                if (nextEdge) {
                    await executeNode(nextEdge.target);
                } else {
                    await cardRef.update({ 'chatbotState.currentNodeId': null });
                }
            } else if (node && (node.type === 'quickReplyNode' || node.type === 'listMessageNode')) {
                debugLog(`[TRACING] Interactive response received: "${text}"`);
                // Match by ID/SourceHandle first
                let nextEdge = flow.edges.find((e: any) => 
                    e.source === node.id && 
                    (String(e.sourceHandle) === String(text) || String(e.sourceHandle?.toLowerCase()) === String(text).toLowerCase())
                );
                
                if (nextEdge) {
                    debugLog(`[TRACING] Edge found for response: ${nextEdge.target}`);
                    await cardRef.update({ 'chatbotState.waitingForInput': false });
                    await executeNode(nextEdge.target);
                } else {
                    const fallbackEdge = flow.edges.find((e: any) => e.source === node.id && !e.sourceHandle);
                    if (fallbackEdge) {
                        await cardRef.update({ 'chatbotState.waitingForInput': false });
                        await executeNode(fallbackEdge.target);
                    } else {
                        // NO MATCH and NO FALLBACK: Send a helpful message
                        debugLog(`[TRACING] No edge matched for "${text}". Sending help message.`);
                        await sendWhatsAppMessage(from, "Lo siento, no entendí esa opción. Por favor, selecciona una de las opciones del menú anterior o responde con el texto exacto.");
                    }
                }
            }
        } else {
            const startNode = flow.nodes.find((n: any) => n.type === 'startNode');
            debugLog(`[TRACING] Starting new flow at startNode: ${startNode?.id || 'NOT FOUND'}`);
            if (startNode) await executeNode(startNode.id);
        }
    } catch (criticalError: any) {
        debugLog(`[TRACING] CRITICAL ERROR IN triggerChatbot: ${criticalError.message}`);
        console.error(criticalError);
    }
}


