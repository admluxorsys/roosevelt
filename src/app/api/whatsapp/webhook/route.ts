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
    debugLog('--- [Master Webhook] INCOMING HIT ---');
    
    try {
        const rawBody = await req.clone().text();
        const body = JSON.parse(rawBody);
        
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const metadata = value?.metadata;
        const recipientPhoneNumberId = metadata?.phone_number_id;

        if (!recipientPhoneNumberId) {
            debugLog('[POST] Error: phone_number_id missing in webhook metadata.');
            return NextResponse.json({ success: false, error: 'No phone_number_id' });
        }

        // 1. TENANT IDENTIFICATION (The core of multi-tenancy)
        debugLog(`[POST] Searching tenant for Phone ID: ${recipientPhoneNumberId}`);
        const mappingRef = db.doc(`system_mappings/whatsapp_numbers/numbers/${recipientPhoneNumberId}`);
        const mappingDoc = await mappingRef.get();

        if (!mappingDoc.exists) {
            debugLog(`[POST] No tenant mapping found for ${recipientPhoneNumberId}. Aborting.`);
            return NextResponse.json({ success: false, error: 'Tenant not mapped' });
        }

        const { userId, entityId } = mappingDoc.data() as { userId: string, entityId: string };
        debugLog(`[POST] Tenant Identified: User=${userId}, Entity=${entityId}`);

        // Base path for this specific tenant's entity
        const entityPath = `users/${userId}/entities/${entityId}`;

        // 2. STATUS UPDATES (Read receipts, delivery, etc.)
        if (value?.statuses && value.statuses.length > 0) {
            const statusUpdate = value.statuses[0];
            const status = statusUpdate.status;
            const messageId = statusUpdate.id;
            const recipientId = statusUpdate.recipient_id;

            debugLog(`[POST] Status Update [${status}] for message ${messageId} in tenant ${entityId}`);

            // Find card containing this message in the tenant's context
            const cardsRef = db.collection(`${entityPath}/kamban-groups`);
            const groupsSnapshot = await cardsRef.get();
            
            for (const group of groupsSnapshot.docs) {
                const cardSnapshot = await group.ref.collection('cards')
                    .where('platform_ids.whatsapp', '==', recipientId)
                    .get();
                
                if (!cardSnapshot.empty) {
                    const cardDoc = cardSnapshot.docs[0];
                    const messages = cardDoc.data().messages || [];
                    let changed = false;
                    
                    const updatedMessages = messages.map((m: any) => {
                        if (m.whatsappMessageId === messageId || m.kambanMessageId === messageId) {
                            changed = true;
                            return { ...m, status: status };
                        }
                        return m;
                    });

                    if (changed) {
                        await cardDoc.ref.update({ messages: updatedMessages });
                        debugLog(`[POST] Status synced to card ${cardDoc.id}`);
                    }
                    break;
                }
            }
            return NextResponse.json({ success: true });
        }

        // 3. INCOMING MESSAGE HANDLING
        const message = value?.messages?.[0];
        if (message) {
            const from = message.from; 
            let text = message.text?.body || '';
            
            // Handle interactive/button responses
            if (message.type === 'interactive') {
                const interactive = message.interactive;
                text = interactive?.button_reply?.id || interactive?.list_reply?.id || interactive?.button_reply?.title || interactive?.list_reply?.title;
            } else if (message.type === 'button') {
                text = message.button?.payload || message.button?.text;
            } else if (message.type === 'image' || message.type === 'document' || message.type === 'video') {
                text = `[Archivo ${message.type}]`;
            }

            const messageId = message.id;
            debugLog(`[POST] Message from ${from}: "${text}" (Tenant: ${entityId})`);

            if (from && text) {
                const cleanFrom = from.replace(/\D/g, '');
                
                // Find group and card in the tenant's context
                const groupsRef = db.collection(`${entityPath}/kamban-groups`);
                const groupsSnapshot = await groupsRef.get();
                
                let targetCardDoc: any = null;
                let targetGroupId: string | null = null;

                for (const groupDoc of groupsSnapshot.docs) {
                    const cardsSnapshot = await groupDoc.ref.collection('cards')
                        .where('contactNumberClean', '==', cleanFrom)
                        .limit(1)
                        .get();
                    
                    if (!cardsSnapshot.empty) {
                        targetCardDoc = cardsSnapshot.docs[0];
                        targetGroupId = groupDoc.id;
                        break;
                    }
                }

                const newMessage = {
                    sender: 'user' as const,
                    text: text,
                    timestamp: new Date(),
                    whatsappMessageId: messageId,
                    platform: 'whatsapp'
                };

                let cardId = targetCardDoc?.id;
                let groupId = targetGroupId;

                if (targetCardDoc && targetGroupId) {
                    await targetCardDoc.ref.update({
                        lastMessage: text.length > 50 ? text.substring(0, 47) + '...' : text,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        unreadCount: admin.firestore.FieldValue.increment(1),
                        messages: admin.firestore.FieldValue.arrayUnion(newMessage)
                    });
                } else {
                    // Create NEW card in a default group or 'unassigned'
                    const defaultGroup = groupsSnapshot.docs[0];
                    if (defaultGroup) {
                        const newCardRef = defaultGroup.ref.collection('cards').doc();
                        await newCardRef.set({
                            contactName: value.contacts?.[0]?.profile?.name || from,
                            contactNumber: from,
                            contactNumberClean: cleanFrom,
                            lastMessage: text.length > 50 ? text.substring(0, 47) + '...' : text,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            messages: [newMessage],
                            unreadCount: 1,
                            status: 'open',
                            source: 'whatsapp',
                            primary_channel: 'whatsapp'
                        });
                        cardId = newCardRef.id;
                        groupId = defaultGroup.id;
                    }
                }

                // 4. TRIGGER CHATBOT (Specific to this tenant)
                if (groupId && cardId) {
                    debugLog(`[POST] Triggering chatbot for ${entityId}...`);
                    try {
                        await triggerChatbot(from, text, groupId, cardId, userId, entityId);
                    } catch (botError: any) {
                        debugLog(`[POST] Chatbot Error: ${botError.message}`);
                    }
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        debugLog(`[POST CRASH] ${error.stack || error.message}`);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function triggerChatbot(from: string, text: string, groupId: string, cardId: string, userId: string, entityId: string) {
    debugLog(`[Chatbot Engine] Starting for Tenant: ${entityId} | From: ${from}`);
    
    const { sendWhatsAppMessage } = await import('@/lib/sendProviders');
    const entityPath = `users/${userId}/entities/${entityId}`;

    try {
        // 1. Fetch Tenant-specific Chatbot
        const botsRef = db.collection(`${entityPath}/chatbots`);
        const botsSnapshot = await botsRef.get();
        
        const activeBotDoc = botsSnapshot.docs.find(doc => doc.data().isActive === true || doc.data().isActive === 'true');
        
        if (!activeBotDoc) {
            debugLog(`[Chatbot] No active robot for entity ${entityId}.`);
            return;
        }

        const botData = activeBotDoc.data();
        const flow = botData.flow || { nodes: [], edges: [] };
        const cardRef = db.doc(`${entityPath}/kamban-groups/${groupId}/cards/${cardId}`);
        
        const cardSnap = await cardRef.get();
        if (!cardSnap.exists) return;
        const cardData = cardSnap.data() || {};

        // Helper: Variable Injection
        const replaceVars = (val: string) => {
            if (!val) return '';
            let p = val;
            const context = {
                nombre: cardData.contactName || 'Amigo',
                ...(cardData.variables || {}),
                ...(cardData.customFields || {})
            };
            for (const [k, v] of Object.entries(context)) {
                p = p.replace(new RegExp(`\\{${k}\\}`, 'gi'), String(v));
            }
            return p;
        };
        
        const currentState = cardData.chatbotState || {};
        const currentNodeId = currentState.currentNodeId;

        // --- Execution Engine ---
        const executeNode = async (nodeId: string) => {
            debugLog(`[Chatbot] Running Node: ${nodeId}`);
            const node = flow.nodes.find((n: any) => n.id === nodeId);
            if (!node) return;

            const sendOpts: any = { userId, entityId };

            if (node.type === 'startNode') {
                const edge = flow.edges.find((e: any) => e.source === node.id);
                if (edge) await executeNode(edge.target);
                return;
            }

            if (node.type === 'textMessageNode') {
                const msg = replaceVars(node.data?.content || node.data?.text || 'Hola');
                const res = await sendWhatsAppMessage(from, msg, sendOpts);
                
                await cardRef.update({
                    messages: admin.firestore.FieldValue.arrayUnion({
                        sender: 'agent', text: msg, timestamp: new Date(), whatsappMessageId: res.messages?.[0]?.id || null, platform: 'whatsapp'
                    }),
                    lastMessage: msg.substring(0, 47) + '...',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    unreadCount: 0,
                });

                const next = flow.edges.find((e: any) => e.source === node.id);
                if (next) await executeNode(next.target);
                return;
            }

            if (node.type === 'quickReplyNode') {
                const msg = replaceVars(node.data?.bodyText || node.data?.text || 'Opción:');
                const buttons = (node.data?.buttons || []).map((btn: any) => ({
                    type: 'reply',
                    reply: {
                        id: (typeof btn === 'object' ? (btn.id || btn.title) : btn).substring(0, 20),
                        title: (typeof btn === 'object' ? btn.title : btn).substring(0, 20)
                    }
                })).slice(0, 3);

                const res = await sendWhatsAppMessage(from, msg, { ...sendOpts, type: 'quick_reply', buttons });

                await cardRef.update({
                    messages: admin.firestore.FieldValue.arrayUnion({
                        sender: 'agent', text: `${msg} (Menú Enviado)`, timestamp: new Date(), whatsappMessageId: res.messages?.[0]?.id || null, platform: 'whatsapp'
                    }),
                    'chatbotState.currentNodeId': node.id,
                    'chatbotState.waitingForInput': true,
                    'chatbotState.isQuickReply': true
                });
                return;
            }

            if (node.type === 'listMessageNode') {
                const msg = replaceVars(node.data?.body || 'Selecciona:');
                const sections = (node.data?.sections || []).map((s: any) => ({
                    title: (s.title || 'Opciones').substring(0, 20),
                    rows: (s.rows || []).map((r: any) => ({
                        id: r.id || r.title, title: r.title.substring(0, 24), description: (r.description || '').substring(0, 72)
                    }))
                }));

                const res = await sendWhatsAppMessage(from, msg, { ...sendOpts, type: 'list', sections, button: node.data?.buttonText || 'Ver opciones' });

                await cardRef.update({
                    messages: admin.firestore.FieldValue.arrayUnion({
                        sender: 'agent', text: `${msg} (Lista Enviada)`, timestamp: new Date(), whatsappMessageId: res.messages?.[0]?.id || null, platform: 'whatsapp'
                    }),
                    'chatbotState.currentNodeId': node.id,
                    'chatbotState.waitingForInput': true,
                    'chatbotState.isList': true
                });
                return;
            }

            // Fallback for Capture
            if (node.type === 'captureInputNode') {
                const prompt = replaceVars(node.data?.content || '');
                if (!currentState.waitingForInput && prompt) {
                    await sendWhatsAppMessage(from, prompt, sendOpts);
                }
                await cardRef.update({
                    'chatbotState.currentNodeId': node.id,
                    'chatbotState.waitingForInput': true,
                    'chatbotState.variableName': node.data?.variableName || 'last_input'
                });
                return;
            }

            // Condition Logic
            if (node.type === 'conditionNode') {
                const val = (await cardRef.get()).data()?.variables?.[node.data?.variableName];
                let target = null;
                for (const r of node.data?.routes || []) {
                    if (r.condition === 'equals' && String(val) === String(r.value)) {
                        target = flow.edges.find((e: any) => e.source === node.id && e.sourceHandle === r.id)?.target;
                        if (target) break;
                    }
                }
                if (!target) target = flow.edges.find((e: any) => e.source === node.id && e.sourceHandle === 'else')?.target;
                if (target) await executeNode(target);
                return;
            }

            // Set Variable
            if (node.type === 'setVariableNode') {
                await cardRef.update({ [`variables.${node.data?.variableName}`]: node.data?.value });
                const next = flow.edges.find((e: any) => e.source === node.id);
                if (next) await executeNode(next.target);
                return;
            }

            // End
            if (node.type === 'endNode') {
                await cardRef.update({ 'chatbotState': null });
                return;
            }
        };

        // --- Resume vs Start ---
        if (currentState.waitingForInput && currentNodeId) {
            const node = flow.nodes.find((n: any) => n.id === currentNodeId);
            if (node?.type === 'captureInputNode') {
                await cardRef.update({ [`variables.${currentState.variableName || 'input'}`]: text, 'chatbotState.waitingForInput': false });
                const next = flow.edges.find((e: any) => e.source === node.id);
                if (next) await executeNode(next.target);
            } else if (node?.type === 'quickReplyNode' || node?.type === 'listMessageNode') {
                const edge = flow.edges.find((e: any) => e.source === node.id && (String(e.sourceHandle) === String(text) || String(e.sourceHandle?.toLowerCase()) === String(text).toLowerCase()));
                if (edge) {
                    await cardRef.update({ 'chatbotState.waitingForInput': false });
                    await executeNode(edge.target);
                }
            }
        } else {
            const startNode = flow.nodes.find((n: any) => n.type === 'startNode');
            if (startNode) await executeNode(startNode.id);
        }

    } catch (err) {
        debugLog(`[Chatbot Critical Error] ${err instanceof Error ? err.message : String(err)}`);
    }
}


