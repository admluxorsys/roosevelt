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
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const userId = searchParams.get('u');
    const entityId = searchParams.get('e');
    let expectedToken = process.env.kamban_VERIFY_TOKEN || 'vg37e';

    // MULTI-TENANT VERIFICATION: If IDs are in URL, we check the tenant's specific token
    if (userId && entityId) {
        try {
            const [publicSnap, internalSnap] = await Promise.all([
                db.doc(`users/${userId}/entities/${entityId}/integrations/whatsapp`).get(),
                db.doc(`users/${userId}/entities/${entityId}/integrations/whatsapp_internal`).get()
            ]);

            const tenantToken = publicSnap.data()?.verifyToken || internalSnap.data()?.verifyToken;
            if (tenantToken) expectedToken = tenantToken;
        } catch (err) {
            debugLog(`[GET] Error loading tenant token: ${err}`);
        }
    }

    if (mode === 'subscribe' && token === expectedToken) {
        debugLog(`Verification successful (GET) | Tenant: ${entityId || 'Global'}`);
        return new Response(challenge, { status: 200 });
    }
    debugLog(`Verification failed (GET) | Expected: ${expectedToken}, Got: ${token}`);
    return new Response('Forbidden', { status: 403 });
}

// POST: Handle incoming messages
export async function POST(req: Request) {
    debugLog('--- [Master Webhook] INCOMING HIT ---');

    try {
        const { searchParams } = new URL(req.url);
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

        // 1. TENANT IDENTIFICATION (Resilient Strategy: Agnostic + URL Fallback)
        debugLog(`[POST] Searching tenant for Phone ID: ${recipientPhoneNumberId}`);
        const { resolveTenant } = await import('@/lib/tenantResolver');

        let userId = searchParams.get('u');
        let entityId = searchParams.get('e');

        // Try discovery from vault
        const tenant = await resolveTenant('whatsapp', recipientPhoneNumberId);

        if (tenant) {
            userId = tenant.userId;
            entityId = tenant.entityId;
            debugLog(`[POST] Tenant Discovery Success: User=${userId}, Entity=${entityId}`);
        } else if (userId && entityId) {
            debugLog(`[POST] Using Tenant from URL: User=${userId}, Entity=${entityId}`);
        } else {
            // BACKUP SEARCH: try a legacy system mapping if it exists
            const mappingRef = db.doc(`system_mappings/whatsapp_numbers/numbers/${recipientPhoneNumberId}`);
            const mappingDoc = await mappingRef.get();
            if (mappingDoc.exists) {
                const legacy = mappingDoc.data() as { userId: string, entityId: string };
                userId = legacy.userId;
                entityId = legacy.entityId;
                debugLog(`[POST] Found via legacy mapping: User=${userId}, Entity=${entityId}`);
            } else {
                debugLog(`[POST] ❌ ABORT: Could not resolve tenant for Phone ID ${recipientPhoneNumberId} (No mapping and no URL params).`);
                return NextResponse.json({ success: false, error: 'Tenant not mapped' });
            }
        }

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
            const cardsRef = db.collection(`${entityPath}/kanban-groups`);
            const groupsSnapshot = await cardsRef.get();

<<<<<<< Updated upstream
            // OPTIMIZED: Search in parallel instead of sequentially blocking
            const updatePromises = groupsSnapshot.docs.map(async (group) => {
=======
            for (const group of groupsSnapshot.docs) {
>>>>>>> Stashed changes
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
                }
            });

            await Promise.all(updatePromises);
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

<<<<<<< Updated upstream
                // OPTIMIZED O(1) Search: Find group and card via indexed Contacts context
                let targetCardDoc: any = null;
                let targetGroupId: string | null = null;

                const contactSnap = await db.collection(`${entityPath}/contacts`)
                    .where('phone', '==', `+${cleanFrom}`)
                    .limit(1)
                    .get();

                if (!contactSnap.empty) {
                    const contactData = contactSnap.docs[0].data();
                    targetGroupId = contactData.kanbanGroupId;
                    const contactCardId = contactData.kanbanCardId;

                    if (targetGroupId && contactCardId) {
                        const cardRef = db.doc(`${entityPath}/kanban-groups/${targetGroupId}/cards/${contactCardId}`);
                        const cardGet = await cardRef.get();
                        if (cardGet.exists) {
                            targetCardDoc = cardGet;
                        }
                    }
=======
                // Find all potential cards for this number across all groups
                const allMatches: any[] = [];
                const groupsRef = db.collection(`${entityPath}/kanban-groups`);
                const groupsSnapshot = await groupsRef.get();

                for (const groupDoc of groupsSnapshot.docs) {
                    const cardsSnapshot = await groupDoc.ref.collection('cards')
                        .where('contactNumberClean', '==', cleanFrom)
                        .get();

                    cardsSnapshot.forEach(doc => {
                        allMatches.push({ doc, groupId: groupDoc.id });
                    });
                }

                let targetCardDoc: any = null;
                let targetGroupId: string | null = null;

                if (allMatches.length > 0) {
                    // Pick the one with the latest update
                    allMatches.sort((a, b) => {
                        const tA = (a.doc.data().updatedAt?.toDate?.() || new Date(0)).getTime();
                        const tB = (b.doc.data().updatedAt?.toDate?.() || new Date(0)).getTime();
                        return tB - tA;
                    });
                    targetCardDoc = allMatches[0].doc;
                    targetGroupId = allMatches[0].groupId;
>>>>>>> Stashed changes
                }

                // Fallback search in parallel if contact doesn't exist but card somehow does (legacy)
                if (!targetCardDoc || !targetGroupId) {
                    const groupsRef = db.collection(`${entityPath}/kanban-groups`);
                    const groupsSnapshot = await groupsRef.get();

                    const searchPromises = groupsSnapshot.docs.map(async (groupDoc) => {
                        const cardsSnapshot = await groupDoc.ref.collection('cards')
                            .where('contactNumberClean', '==', cleanFrom)
                            .limit(1)
                            .get();
                        return cardsSnapshot.empty ? null : { doc: cardsSnapshot.docs[0], id: groupDoc.id };
                    });

                    const results = await Promise.all(searchPromises);
                    const found = results.find(r => r !== null);
                    if (found) {
                        targetCardDoc = found.doc;
                        targetGroupId = found.id;
                    }
                }

                // Reference used below for default group in card creation
                const groupsRef = db.collection(`${entityPath}/kanban-groups`);
                const groupsSnapshot = await groupsRef.get();

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
                        updatedAt: new Date(),
                        unreadCount: admin.firestore.FieldValue.increment(1),
                        messages: admin.firestore.FieldValue.arrayUnion(newMessage)
                    });
                } else {
                    // Create NEW card in a default group or 'unassigned'
                    const defaultGroup = groupsSnapshot.docs[0];
                    if (defaultGroup) {
                        const newCardRef = defaultGroup.ref.collection('cards').doc();

                        // 1. Generate CRM ID (Requires Transaction on system_metadata/counters)
                        let numericId = String(Date.now()).slice(-10);
                        try {
                            const counterRef = db.collection(`${entityPath}/system_metadata`).doc('counters');
                            await db.runTransaction(async (tx) => {
                                const snap = await tx.get(counterRef);
                                const next = (snap.exists ? (snap.data()?.crmIdCount || 0) : 0) + 1;
                                tx.set(counterRef, { crmIdCount: next }, { merge: true });
                                numericId = String(next).padStart(10, '0');
                            });
                        } catch (err) {
                            debugLog(`[POST] Error generating CRM ID: ${err}`);
                        }

                        await newCardRef.set({
                            crmId: numericId,
                            contactName: value.contacts?.[0]?.profile?.name || from,
                            contactNumber: from,
                            contactNumberClean: cleanFrom,
                            lastMessage: text.length > 50 ? text.substring(0, 47) + '...' : text,
                            updatedAt: new Date(),
                            createdAt: new Date(),
                            messages: [newMessage],
                            unreadCount: 1,
                            status: 'open',
                            source: 'whatsapp',
                            primary_channel: 'whatsapp'
                        });

                        // 2. Create the Contact in the CRM Database
                        const contactName = value.contacts?.[0]?.profile?.name || from;
                        await db.collection(`${entityPath}/contacts`).doc(numericId).set({
                            crmId: numericId,
                            contactName: contactName,
                            firstName: contactName,
                            contactNumber: from,
                            phone: `+${cleanFrom}`, // Standardize
                            kanbanGroupId: defaultGroup.id,
                            kanbanCardId: newCardRef.id,
                            createdAt: new Date().toISOString()
                        }, { merge: true });

                        cardId = newCardRef.id;
                        groupId = defaultGroup.id;
                    }
                }

<<<<<<< Updated upstream
                // 4. TRIGGER CHATBOT (Specific to this tenant) - OPTIMIZED: Asynchronous Non-blocking
                if (groupId && cardId) {
                    debugLog(`[POST] Triggering chatbot for ${entityId}...`);
                    try {
                        // Do NOT await, allow webhook to respond to Meta immediately
                        triggerChatbot(from, text, groupId, cardId, userId, entityId).catch(botError => {
                            debugLog(`[POST] Chatbot Async Error: ${botError?.message || String(botError)}`);
                        });
                    } catch (botError: any) {
                        debugLog(`[POST] Chatbot Trigger Error: ${botError.message}`);
                    }
=======
                // Trigger Chatbot (Local/Hybrid development support)
                if (groupId && cardId) {
                    console.log(`[Webhook] 🤖 Triggering Chatbot for ${from}...`);
                    await triggerChatbot(from, text, groupId, cardId, userId, entityId);
>>>>>>> Stashed changes
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
    console.log(`[Chatbot Engine] 🚀 Initiated for Tenant: ${entityId} | From: ${from}`);
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
        const cardRef = db.collection('users').doc(userId).collection('entities').doc(entityId).collection('kanban-groups').doc(groupId).collection('cards').doc(cardId);

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
                    updatedAt: new Date(),
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
        // Failsafe Restart Command
        if (text.trim().toLowerCase() === 'reinicia todo ahora') {
            await cardRef.update({
                'chatbotState.waitingForInput': false,
                'chatbotState.currentNodeId': null
            });
            const startNode = flow.nodes.find((n: any) => n.type === 'startNode');
            if (startNode) await executeNode(startNode.id);
            return;
        }

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
                } else {
                    debugLog(`[Chatbot] Invalid input for interactive node ${node.id}, user sent '${text}'. Resending node.`);
                    // Resend the interactive node so the user knows they need to click an option
                    await executeNode(node.id);
                }
            } else {
                // Failsafe: if waiting for input but node is something else, just start over.
                await cardRef.update({ 'chatbotState.waitingForInput': false });
                const startNode = flow.nodes.find((n: any) => n.type === 'startNode');
                if (startNode) await executeNode(startNode.id);
            }
        } else {
            const startNode = flow.nodes.find((n: any) => n.type === 'startNode');
            if (startNode) await executeNode(startNode.id);
        }

    } catch (err) {
        debugLog(`[Chatbot Critical Error] ${err instanceof Error ? err.message : String(err)}`);
    }
}


