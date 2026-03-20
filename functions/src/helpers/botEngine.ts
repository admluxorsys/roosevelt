import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { getMessagingAdapter } from './platforms/factory';

// Delay helper
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- LOCK SYSTEM: Prevents duplicate processing when user sends multiple messages quickly ---
const LOCK_TIMEOUT_MS = 30000; // 30 seconds max lock duration

async function acquireBotLock(cardRef: FirebaseFirestore.DocumentReference): Promise<boolean> {
    const db = admin.firestore();
    try {
        return await db.runTransaction(async (tx) => {
            const snap = await tx.get(cardRef);
            if (!snap.exists) return false;
            const data = snap.data();
            const existingLock = data?.botLock;
            const now = Date.now();
            // If there's an active lock that hasn't expired, another instance is processing
            if (existingLock && (now - existingLock) < LOCK_TIMEOUT_MS) {
                functions.logger.warn(`[BotLock] Lock active for ${cardRef.id}, skipping (age: ${now - existingLock}ms)`);
                return false;
            }
            tx.update(cardRef, { botLock: now });
            return true;
        });
    } catch (err: any) {
        functions.logger.error(`[BotLock] Failed to acquire lock: ${err.message}`);
        return false;
    }
}

async function releaseBotLock(cardRef: FirebaseFirestore.DocumentReference): Promise<void> {
    try {
        await cardRef.update({ botLock: admin.firestore.FieldValue.delete() });
    } catch (err: any) {
        functions.logger.warn(`[BotLock] Failed to release lock: ${err.message}`);
    }
}

// Helper to resolve cardRef from known IDs or fallback search
export async function resolveCardRef(contactNumber: string, cardId?: string, groupId?: string): Promise<FirebaseFirestore.DocumentReference | null> {
    const db = admin.firestore();

    if (cardId && groupId) {
        return db.collection('kanban-groups').doc(groupId).collection('cards').doc(cardId);
    }

    if (cardId) {
        const groups = await db.collection('kanban-groups').get();
        for (const group of groups.docs) {
            const ref = group.ref.collection('cards').doc(cardId);
            const snap = await ref.get();
            if (snap.exists) return ref;
        }
    }

    // --- Search by platform_ids (New Unified Approach) ---
    // Try to find by whatsapp/external_id first
    try {
        const platformSnap = await db.collectionGroup('cards')
            .where(`platform_ids.whatsapp`, '==', contactNumber)
            .limit(1)
            .get();
        if (!platformSnap.empty) return platformSnap.docs[0].ref;
    } catch (e) {
        functions.logger.warn(`[resolveCardRef] index for platform_ids.whatsapp not ready.`);
    }

    // Fallback: search by contactNumber (Legacy)
    const cardsRef = db.collectionGroup('cards').where('contactNumber', '==', contactNumber);
    const snapshot = await cardsRef.get();
    if (!snapshot.empty) return snapshot.docs[0].ref;

    return null;
}

export async function getActiveBot(): Promise<any | null> {
    const db = admin.firestore();
    const botsSnapshot = await db.collection('chatbots')
        .where('isActive', '==', true)
        .orderBy('updatedAt', 'desc') // Tomar el más recientemente activado para consistencia
        .limit(1)
        .get();

    if (botsSnapshot.empty) return null;
    const botData = botsSnapshot.docs[0].data();
    if (!botData.flow || !botData.flow.nodes || !botData.flow.edges) return null;
    return { id: botsSnapshot.docs[0].id, ...botData };
}

function replaceVariables(text: string, cardData: any): string {
    if (!text) return '';
    let processedText = text;
    const variables = {
        name: cardData.contactName || 'estimado/a cliente',
        nombre: cardData.contactName || 'estimado/a cliente',
        phone: cardData.contactNumber || '',
        ...(cardData.customFields || {})
    };
    for (const [key, value] of Object.entries(variables)) {
        // Matches {key}, {{key}}, etc.
        const regex = new RegExp(`\\{+\\s*${key}\\s*\\}+`, 'gi');
        processedText = processedText.replace(regex, String(value || ''));
    }
    return processedText;
}

// Calcula el tiempo de "escritura humana" en MS
function calculateTypingDelay(text: string): number {
    const charsPerSecond = 50; // Faster typing speed (was 25)
    const baseDelay = 100;    // Minimize base latency (was 1000)
    let typingTime = (text.length / charsPerSecond) * 1000;

    if (typingTime < 500) typingTime = 500;   // Min 0.5s (was 1.5s)
    if (typingTime > 2000) typingTime = 2000; // Max 2s (was 6s)

    return baseDelay + typingTime;
}

function sanitizeListData(data: any): any[] {
    const cleanSections: any[] = [];
    if (Array.isArray(data.sections) && data.sections.length > 0) {
        for (const sec of data.sections) {
            const rows = sec.rows || [];
            const options = sec.options || [];
            const validRows: any[] = [];
            if (Array.isArray(rows)) {
                rows.forEach((r: any) => { if (r && r.title && r.title.trim() !== '') validRows.push(r); });
            }
            if (Array.isArray(options)) {
                options.forEach((opt: any, idx: number) => {
                    if (typeof opt === 'string' && opt.trim() !== '') {
                        validRows.push({ id: `opt_${Date.now()}_${idx}`, title: opt, description: '' });
                    }
                });
            }
            if (validRows.length > 0) cleanSections.push({ title: sec.title || 'Opciones', rows: validRows });
        }
    }
    if (cleanSections.length === 0 && Array.isArray(data.options)) {
        const validRows = data.options.filter((opt: any) => typeof opt === 'string' && opt.trim() !== '')
            .map((opt: string, idx: number) => ({ id: `legacy_${idx}`, title: opt }));
        if (validRows.length > 0) cleanSections.push({ title: 'Opciones', rows: validRows });
    }
    return cleanSections;
}

function sanitizeButtonsData(buttons: any[]): any[] {
    if (!Array.isArray(buttons)) return [];
    return buttons.filter(b => b && b.title && b.title !== 'undefined' && b.title.trim() !== '');
}

// --- MAIN ENGINE ---

// --- MAIN ENGINE ---

export async function executeBotFlow(
    bot: any, 
    to: string, 
    cardData: any, 
    userMessage: string, 
    messageId?: string,
    metadata?: { mediaUrl?: string, type?: string }
): Promise<void> {
    functions.logger.info(`>>> EXECUTING FLOW: ${bot.name} for ${to} (Type: ${metadata?.type || 'text'}) <<<`);

    const platform = cardData.source || 'whatsapp'; // Default to whatsapp if not set
    const adapter = getMessagingAdapter(platform);

    // Resolve cardRef once and reuse it throughout the entire flow
    const cardRef = await resolveCardRef(to, cardData.id, cardData.groupId);
    if (!cardRef) {
        functions.logger.warn(`[executeBotFlow] Could not resolve cardRef for ${to}`);
        return;
    }

    let lockAcquired = false;

    // Wrap everything in try/finally to ALWAYS release the lock
    try {
        // Acquire lock to prevent duplicate processing
        lockAcquired = await acquireBotLock(cardRef);
        if (!lockAcquired) {
            functions.logger.info(`[executeBotFlow] Skipping duplicate execution for ${to} — lock active`);
            return;
        }

        // --- RESTART COMMAND (For testing purposes) ---
        const isRestartCommand = userMessage.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 'reinicia todo ahora' || userMessage.trim().toLowerCase() === 'reiniciar' || userMessage.trim().toLowerCase() === 'reset';

        // --- ABSOLUTE RESTART COMMAND ---
        if (isRestartCommand) {
            functions.logger.info(`[Bot Engine] Absolute Restart requested for ${to}`);
            await cardRef.update({
                botState: admin.firestore.FieldValue.delete(),
                customFields: admin.firestore.FieldValue.delete(),
                contactName: "Amigo",
                lastBotInteraction: admin.firestore.FieldValue.delete(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            await adapter.sendMessage(to, "🔄 Reinicio completado, empezamos de nuevo.");
            userMessage = ""; // Clear to avoid being used by the fresh flow
            return; // STOP execution here to wait for next user message
        }

        let currentNodeId = cardData.botState?.currentNodeId;
        let nextNodeId: string | null = null;
        let shouldContinue = true;
        let executionCount = 0;
        const MAX_STEPS = 15;

    // --- PROCESAR INPUT USUARIO ---
    if (currentNodeId) {
        functions.logger.info(`[executeBotFlow] Processing Input for Node: ${currentNodeId}`);
        const currentNode = bot.flow.nodes.find((n: any) => String(n.id) === String(currentNodeId));
        if (!currentNode) {
            functions.logger.warn(`[executeBotFlow] Node ${currentNodeId} not found in flow.`);
            return;
        }

        // --- STUCK-NODE RECOVERY: Resend current node message if conversation was interrupted ---
        // If the bot was waiting (lastInteraction exists) and the user's message doesn't look like
        // a valid response (e.g., very short/generic), OR if significant time has passed (> 30 min),
        // resend the current node's prompt to guide the user back.
        const lastInteractionAt = cardData.botState?.lastInteraction?.toDate
            ? cardData.botState.lastInteraction.toDate()
            : null;
        const thirtyMinutesMs = 30 * 60 * 1000;
        const wasStuck = lastInteractionAt && (new Date().getTime() - lastInteractionAt.getTime() > thirtyMinutesMs);

        if (wasStuck) {
            functions.logger.info(`[executeBotFlow] Conversation was stuck for >30 min. Resending current node prompt to ${to}.`);
            try {
                if (currentNode.type === 'quickReplyNode') {
                    const qrText = replaceVariables(currentNode.data?.bodyText || currentNode.data?.text || 'Por favor, elige una opción:', cardData);
                    const buttons = sanitizeButtonsData(currentNode.data?.buttons || []);
                    const header = {
                        type: currentNode.data?.headerType || 'none',
                        text: replaceVariables(currentNode.data?.headerText || '', cardData),
                        url: currentNode.data?.headerMediaUrl
                    };
                    if (buttons.length > 0) {
                        await adapter.sendButtonMessage(to, qrText, buttons, header);
                        await logBotMessage(to, qrText, cardData.id, cardData.groupId, cardRef, 'buttons', { buttons, header });
                    } else await adapter.sendMessage(to, qrText);
                } else if (currentNode.type === 'listMessageNode') {
                    const listBody = replaceVariables(currentNode.data?.body || currentNode.data?.text || 'Elige una opción:', cardData);
                    const sections = sanitizeListData(currentNode.data);
                    if (sections.length > 0) {
                        const btnText = currentNode.data?.buttonText || 'Ver opciones';
                        await adapter.sendListMessage(to, listBody, btnText, sections);
                        await logBotMessage(to, listBody, cardData.id, cardData.groupId, cardRef, 'list', { buttonText: btnText, sections });
                    } else await adapter.sendMessage(to, listBody);
                } else if (currentNode.type === 'captureInputNode') {
                    const prompt = replaceVariables(currentNode.data?.content || currentNode.data?.text || '', cardData);
                    if (prompt) await adapter.sendMessage(to, prompt);
                }
            } catch (resendErr: any) {
                functions.logger.warn(`[executeBotFlow] Could not resend stuck node: ${resendErr.message}`);
            }
            await delay(1000);
        }

        try {
            if (platform !== 'whatsapp') {
                await adapter.markAsRead(to).catch(e => functions.logger.warn('markAsRead failed:', e.message));
            } else if (messageId) {
                // WhatsApp markAsRead REQUIRES the actual WhatsApp message ID
                await adapter.markAsRead(messageId).catch(e => functions.logger.warn(`[Bot Engine] markAsRead failed for msg ${messageId}:`, e.message));
            } else {
                functions.logger.debug('[Bot Engine] Skipping markAsRead (No messageId provided)');
            }
        } catch (e) { }

        await delay(500);

        if (currentNode.type === 'captureInputNode') {
            const validation = validateInput(userMessage, currentNode.data || {}, metadata);
            const maxRetries = currentNode.data?.maxRetries || 3;
            const currentRetries = cardData.botState?.retryCount || 0;

            if (!validation.isValid) {
                functions.logger.info(`[executeBotFlow] Input validation failed for ${to}. Retry ${currentRetries + 1}/${maxRetries}`);
                
                if (currentRetries + 1 >= maxRetries) {
                    functions.logger.info(`[executeBotFlow] Max retries reached for ${to}. Continuing flow.`);
                    // Fallback value for name variables if requested by user
                    const varName = currentNode.data?.variableName || '';
                    const isNameVar = ['nombre', 'name', 'firstname'].includes(varName.toLowerCase());
                    const fallbackValue = isNameVar ? "Amigo" : "No provisto";
                    
                    await saveVariable(to, varName, fallbackValue, cardData.id, cardData.groupId, cardRef);
                    // continue to next node logic below
                } else {
                    const errorMsg = replaceVariables(validation.errorMessage || "Respuesta inválida.", cardData);
                    await adapter.sendMessage(to, errorMsg);
                    // Update retry count in state
                    await updateBotState(to, { 
                        ...cardData.botState, 
                        retryCount: currentRetries + 1,
                        lastInteraction: admin.firestore.Timestamp.now() 
                    }, cardData.id, cardData.groupId, cardRef);
                    return;
                }
            } else {
                let valueToSave = userMessage.trim();
                const varName = currentNode.data?.variableName || `captured_${currentNode.id}`;

                // --- HEURÍSTICA DE EXTRACCIÓN DE NOMBRE ---
                if (['nombre', 'name', 'firstname', 'user'].includes(varName.toLowerCase())) {
                    valueToSave = extractName(valueToSave);
                    functions.logger.info(`[executeBotFlow] Name extracted: "${valueToSave}" from "${userMessage}"`);
                }

                functions.logger.info(`[executeBotFlow] Saving variable ${varName} = ${valueToSave}`);
                await saveVariable(to, varName, valueToSave, cardData.id, cardData.groupId, cardRef);

                if (!cardData.customFields) cardData.customFields = {};
                cardData.customFields[varName] = valueToSave;
                
                // Update local contactName for immediate use in following nodes
                if (['nombre', 'name', 'firstname', 'user'].includes(varName.toLowerCase()) && valueToSave !== 'Amigo') {
                    cardData.contactName = valueToSave;
                }
            }
        }

        const outgoingEdges = bot.flow.edges.filter((e: any) => String(e.source) === String(currentNodeId));
        let selectedEdge = null;

        if (outgoingEdges.length > 0) {
            if (outgoingEdges.length === 1) {
                selectedEdge = outgoingEdges[0];
            } else {
                if (currentNode.type === 'quickReplyNode') {
                    const buttons = sanitizeButtonsData(currentNode.data.buttons || []);
                    const matchedBtn = buttons.find((btn: any) =>
                        (btn.title || '').toLowerCase().trim() === userMessage.toLowerCase().trim() ||
                        (btn.id || '') === userMessage
                    );
                    if (matchedBtn) {
                        const handleId = matchedBtn.id || matchedBtn.title;
                        selectedEdge = outgoingEdges.find((e: any) => e.sourceHandle === handleId);
                    }
                } else if (currentNode.type === 'listMessageNode') {
                    const sections = sanitizeListData(currentNode.data);
                    let matchedRowId = null;
                    for (const sec of sections) {
                        const row = sec.rows.find((r: any) =>
                            (r.title || '').toLowerCase().trim() === userMessage.toLowerCase().trim() ||
                            (r.id || '') === userMessage
                        );
                        if (row) {
                            matchedRowId = row.id || row.title;
                            break;
                        }
                    }
                    if (matchedRowId) {
                        selectedEdge = outgoingEdges.find((e: any) => e.sourceHandle === matchedRowId);
                    }
                }
                if (!selectedEdge) selectedEdge = outgoingEdges[0];
            }
            if (selectedEdge) nextNodeId = selectedEdge.target;
        } else {
            await updateBotState(to, { status: 'completed', currentNodeId: null }, cardData.id, cardData.groupId, cardRef);
            return;
        }
    } else {
        const startNode = bot.flow.nodes.find((n: any) => n.type === 'start' || n.type === 'startNode');
        if (!startNode) {
            functions.logger.warn(`[executeBotFlow] Start Node NOT found for bot ${bot.id}`);
            return;
        }
        const firstEdge = bot.flow.edges.find((e: any) => String(e.source) === String(startNode.id));
        if (firstEdge) nextNodeId = firstEdge.target;
        else {
            functions.logger.warn(`[executeBotFlow] Start Node ${startNode.id} has no outgoing edges.`);
            return;
        }
    }

    // --- EJECUCIÓN DE NODOS ---
    while (shouldContinue && nextNodeId && executionCount < MAX_STEPS) {
        executionCount++;
        const nextNode = bot.flow.nodes.find((n: any) => String(n.id) === String(nextNodeId));
        if (!nextNode) { shouldContinue = false; break; }

        if (nextNode.type === 'endNode') {
            const endData = nextNode.data || {};
            functions.logger.info(`[executeBotFlow] End Node reached for ${to}. Outcome: ${endData.outcome || 'neutral'}`);
            
            // 1. Process Garbage Collection (Clear Variables)
            if (endData.clearVariables) {
                const varsToClear = endData.clearVariables.split(',').map((v: string) => v.trim()).filter((v: string) => v !== '');
                if (varsToClear.length > 0) {
                    const updateObj: any = {};
                    varsToClear.forEach((v: string) => {
                        updateObj[`customFields.${v}`] = admin.firestore.FieldValue.delete();
                    });
                    await cardRef.update(updateObj);
                }
            }

            // 2. Save Outcome for CRM/Analytics
            const botOutcome = {
                outcome: endData.outcome || 'neutral',
                label: endData.outcomeLabel || (endData.outcome === 'success' ? 'Éxito' : 'Cierre'),
                finishedAt: new Date()
            };
            await cardRef.update({ botOutcome });

            await updateBotState(to, { status: 'completed', currentNodeId: nextNodeId, lastInteraction: new Date() }, cardData.id, cardData.groupId, cardRef);
            shouldContinue = false;
            break;
        }
        await updateBotState(to, { status: 'active', currentNodeId: nextNodeId, lastInteraction: new Date() }, cardData.id, cardData.groupId, cardRef);

        // Simulación Humana (Typing Delay) - CONTROLADO POR UI
        if (['textMessageNode', 'mediaMessageNode', 'quickReplyNode', 'listMessageNode'].includes(nextNode.type)) {
            // Por defecto es TRUE (Humano) a menos que se desactive explícitamente en el editor
            const simulateTyping = nextNode.data?.typingSimulation !== false;

            if (simulateTyping) {
                const content = nextNode.data?.content || nextNode.data?.text || nextNode.data?.caption || '';
                const humanDelay = calculateTypingDelay(content);
                await delay(humanDelay);
            }
        }

        switch (nextNode.type) {
            case 'textMessageNode':
                const txt = replaceVariables(nextNode.data.content || nextNode.data.text || nextNode.data.label || '', cardData);
                if (txt) {
                    const options = { preview_url: nextNode.data.previewUrl !== false };
                    await adapter.sendMessage(to, txt, options);
                    await logBotMessage(to, txt, cardData.id, cardData.groupId, cardRef, 'text');
                }
                nextNodeId = getNextNodeId(bot, nextNodeId);
                break;

            case 'captureInputNode':
                functions.logger.info(`[Bot Engine] Reached CaptureInputNode ${nextNodeId}. Checking if current message can be used.`);
                
                // --- MEJORA: CAPTURA INMEDIATA ---
                // Si el mensaje actual no está vacío (y no fue un comando de reinicio/recuperación),
                // intentamos validarlo inmediatamente antes de suspender el bot.
                if (userMessage && userMessage.trim() !== '') {
                    const validation = validateInput(userMessage, nextNode.data || {}, metadata);
                    if (validation.isValid) {
                        functions.logger.info(`[Bot Engine] Immediate valid capture for ${to} at ${nextNodeId}: "${userMessage}"`);
                        
                        let valueToSave = userMessage.trim();
                        const varName = nextNode.data?.variableName || `captured_${nextNodeId}`;

                        if (['nombre', 'name', 'firstname', 'user'].includes(varName.toLowerCase())) {
                            valueToSave = extractName(valueToSave);
                        }

                        await saveVariable(to, varName, valueToSave, cardData.id, cardData.groupId, cardRef);
                        
                        if (!cardData.customFields) cardData.customFields = {};
                        cardData.customFields[varName] = valueToSave;
                        
                        // Update local contactName for immediate use in following nodes
                        if (['nombre', 'name', 'firstname', 'user'].includes(varName.toLowerCase()) && valueToSave !== 'Amigo') {
                            cardData.contactName = valueToSave;
                        }

                        // Continuar al siguiente nodo sin detenerse
                        currentNodeId = nextNodeId;
                        nextNodeId = getNextNodeId(bot, nextNodeId);
                        userMessage = ""; // Consumir el mensaje para que no se use de nuevo
                        continue; 
                    }
                }

                // Si no fue válido o no había mensaje, enviar el prompt y esperar
                const prompt = replaceVariables(nextNode.data?.content || nextNode.data?.text || '', cardData);
                if (prompt) {
                    await delay(calculateTypingDelay(prompt));
                    await adapter.sendMessage(to, prompt);
                    await logBotMessage(to, prompt, cardData.id, cardData.groupId, cardRef, 'text');
                }
                
                // Suspender ejecución y esperar nueva entrada
                await updateBotState(to, { 
                    botState: 'awaiting_input', 
                    currentNodeId: nextNodeId, 
                    retryCount: 0,
                    lastInteraction: admin.firestore.Timestamp.now()
                }, cardData.id, cardData.groupId, cardRef);
                shouldContinue = false;
                break;

            case 'mediaMessageNode':
                const caption = replaceVariables(nextNode.data.caption || '', cardData);
                if (nextNode.data.url) {
                    await adapter.sendMediaMessage(to, nextNode.data.url, caption, nextNode.data.filename);
                    await logBotMessage(to, caption, cardData.id, cardData.groupId, cardRef, 'media', { url: nextNode.data.url, filename: nextNode.data.filename });
                }
                nextNodeId = getNextNodeId(bot, nextNodeId);
                break;

            case 'quickReplyNode':
                const qrText = replaceVariables(nextNode.data.text || nextNode.data.bodyText || 'Selecciona:', cardData);
                const buttons = sanitizeButtonsData(nextNode.data.buttons || []);
                const header = {
                    type: nextNode.data?.headerType || 'none',
                    text: replaceVariables(nextNode.data?.headerText || '', cardData),
                    url: nextNode.data?.headerMediaUrl
                };
                if (buttons.length > 0) {
                    await adapter.sendButtonMessage(to, qrText, buttons, header);
                    await logBotMessage(to, qrText, cardData.id, cardData.groupId, cardRef, 'buttons', { buttons, header });
                    shouldContinue = false;
                } else {
                    await adapter.sendMessage(to, qrText);
                    await logBotMessage(to, qrText, cardData.id, cardData.groupId, cardRef, 'text');
                    nextNodeId = getNextNodeId(bot, nextNodeId);
                }
                break;

            case 'listMessageNode':
                const listBody = replaceVariables(nextNode.data.body || nextNode.data.text || 'Selecciona:', cardData);
                const btnLabel = nextNode.data.buttonText || "Opciones";
                const cleanSections = sanitizeListData(nextNode.data);
                if (cleanSections.length > 0) {
                    await adapter.sendListMessage(to, listBody, btnLabel, cleanSections);
                    await logBotMessage(to, listBody, cardData.id, cardData.groupId, cardRef, 'list', { buttonText: btnLabel, sections: cleanSections });
                    shouldContinue = false;
                } else {
                    await adapter.sendMessage(to, listBody);
                    await logBotMessage(to, listBody, cardData.id, cardData.groupId, cardRef, 'text');
                    nextNodeId = getNextNodeId(bot, nextNodeId);
                }
                break;

            case 'locationNode':
                if (nextNode.data.latitude) {
                    await adapter.sendLocationMessage(to, parseFloat(nextNode.data.latitude), parseFloat(nextNode.data.longitude), nextNode.data.name, nextNode.data.address);
                }
                nextNodeId = getNextNodeId(bot, nextNodeId);
                break;

            case 'delayNode':
                const delayData = nextNode.data || {};
                let delayMs = 2000;

                if (delayData.mode === 'random') {
                    const min = parseFloat(delayData.minSeconds || 1);
                    const max = parseFloat(delayData.maxSeconds || 3);
                    delayMs = (Math.random() * (max - min) + min) * 1000;
                    functions.logger.info(`[Bot Engine] Random delay for ${to}: ${delayMs.toFixed(0)}ms (Range: ${min}-${max}s)`);
                } else {
                    const seconds = parseFloat(delayData.durationSeconds || delayData.duration || 2);
                    delayMs = seconds * 1000;
                }

                await delay(delayMs);
                nextNodeId = getNextNodeId(bot, nextNodeId);
                break;

            case 'conditionNode':
                const trueEdge = bot.flow.edges.find((e: any) => String(e.source) === String(nextNodeId) && e.sourceHandle === 'true');
                if (trueEdge) nextNodeId = trueEdge.target;
                else nextNodeId = getNextNodeId(bot, nextNodeId);
                break;

            default:
                nextNodeId = getNextNodeId(bot, nextNodeId);
                break;
        }
    }

    } finally {
        // ALWAYS release the lock, even if an error occurred
        if (lockAcquired) {
            await releaseBotLock(cardRef);
        }
    }
}

function extractName(input: string): string {
    // Remover prefijos comunes con flexibilidad en puntuación
    const prefixes = [
        /^(me llamo|soy|mi nombre es|este es|habla|aqui)[\s:,!¡.-]*/i,
        /^(hola|buen[oa]s\s+(dias|tardes|noches))[\s,!¡¿?.-]*(me llamo|soy)?[\s:,!¡.-]*/i,
        /^[\s,!¡¿?.-]*(me llamo|soy)[\s:,!¡.-]*/i
    ];
    let cleaned = input.trim();
    for (const p of prefixes) {
        if (p.test(cleaned)) {
            cleaned = cleaned.replace(p, '');
            break; // Detenerse tras el primer prefix match
        }
    }
    // Capitalizar primera letra de cada palabra
    const capitalized = cleaned.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ').trim();
    
    return capitalized || "Amigo";
}

function getNextNodeId(bot: any, currentId: string | null): string | null {
    if (!currentId) return null;
    const edge = bot.flow.edges.find((e: any) => String(e.source) === String(currentId));
    return edge ? edge.target : null;
}

function validateInput(input: string, config: any, metadata?: { mediaUrl?: string, type?: string }): { isValid: boolean, errorMessage?: string } {
    const value = (input || '').trim();
    const defaultError = config.errorMessage || "Formato inválido. Por favor, intenta de nuevo.";

    // 0. Verificación de Vacío
    if (!value && !metadata?.mediaUrl) {
        return { isValid: false, errorMessage: "Respuesta vacía. Por favor escribe algo." };
    }
    
    // 1. Prioridad: Expresión Regular Personalizada o Generada desde la UI
    const regexStr = config.validationRegex || config.regex;
    if (regexStr && config.inputType !== 'text') {
        try {
            const re = new RegExp(regexStr);
            if (!re.test(value)) return { isValid: false, errorMessage: defaultError };
        } catch (e) {
            functions.logger.error('Invalid regex in node config:', regexStr);
        }
    }

    // 2. Control de Calidad Heurístico (Evitar "basura")
    if (config.inputType === 'text' || !config.inputType) {
        const hasTooManyRepeatedChars = /(.)\1{4,}/.test(value.toLowerCase());
        const isTooLongWithoutSpaces = value.length > 20 && !value.includes(' ');
        const isTooShort = value.length < 2 && !metadata?.mediaUrl;
        
        // --- DETECCIÓN DE BASURA (Heurística de vocales) ---
        // Los nombres y palabras reales en español/inglés suelen tener vocales.
        // "jksdbckjs" -> 0 vocales. Es probable que sea basura.
        const vowelCount = (value.match(/[aeiouáéíóúü]/gi) || []).length;
        const isLikelyGarbage = value.length > 4 && vowelCount === 0;

        if (hasTooManyRepeatedChars || isTooLongWithoutSpaces || isTooShort || isLikelyGarbage) {
            functions.logger.info(`[validateInput] Quality check FAILED for "${value}" (vowels: ${vowelCount})`);
            return { isValid: false, errorMessage: defaultError };
        }
    }

    // 3. Validaciones por Tipo
    const inputType = config.inputType;
    if (inputType === 'email') {
        // Regex más estricto que requiere punto después de la arroba
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!regex.test(value)) return { isValid: false, errorMessage: defaultError };
    } else if (inputType === 'number') {
        const regex = /^-?\d+(\.\d+)?$/;
        if (!regex.test(value)) return { isValid: false, errorMessage: defaultError };
    } else if (inputType === 'phone') {
        const regex = /^\+?[\d\s-]{8,20}$/;
        if (!regex.test(value)) return { isValid: false, errorMessage: defaultError };
    } else if (inputType === 'url') {
        try {
            new URL(value);
        } catch (_) {
            return { isValid: false, errorMessage: defaultError };
        }
    } else if (inputType === 'date') {
        // Validación para DD/MM/AAAA
        const regex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
        if (!regex.test(value)) return { isValid: false, errorMessage: defaultError };
    } else if (inputType === 'dni' || inputType === 'cpf') {
        // Validación genérica para DNI/CPF (numeros, puntos, guiones)
        const regex = /^[\d.-]{7,15}$/;
        if (!regex.test(value)) return { isValid: false, errorMessage: defaultError };
    } else if (inputType === 'image') {
        if (metadata?.type !== 'image' && !metadata?.mediaUrl) {
            return { isValid: false, errorMessage: "Por favor, envía una imagen." };
        }
    } else if (inputType === 'file' || inputType === 'document') {
        if (!['document', 'pdf', 'file'].includes(metadata?.type || '') && !metadata?.mediaUrl) {
            return { isValid: false, errorMessage: "Por favor, envía un documento." };
        }
    }

    return { isValid: true };
}

async function saveVariable(contactNumber: string, variable: string, value: string, cardId?: string, groupId?: string, existingRef?: FirebaseFirestore.DocumentReference | null) {
    if (!variable) return;

    // Use pre-resolved ref if available, otherwise fall back to lookup
    const docRef = existingRef || await resolveCardRef(contactNumber, cardId, groupId);

    if (docRef) {
        const updateData: any = {};
        updateData[`customFields.${variable}`] = value;
        
        // --- AUTO-UPDATE CONTACT NAME ---
        const varLower = variable.toLowerCase();
        const isNameVariable = varLower === 'nombre' || varLower === 'name' || varLower === 'firstname';
        
        if (isNameVariable && value && value !== 'Amigo') {
            updateData.contactName = value;
            functions.logger.info(`[saveVariable] Auto-updating contactName for ${contactNumber} to ${value}`);
        }
        
        await docRef.update(updateData);
        
        // SYNC WITH MASTER CONTACTS COLLECTION (Disabled by user request)
        /*
        if (isNameVariable) {
            ...
        }
        */
    }
}

async function updateBotState(contactNumber: string, state: any, cardId?: string, groupId?: string, existingRef?: FirebaseFirestore.DocumentReference | null) {
    // Use pre-resolved ref if available, otherwise fall back to lookup
    const docRef = existingRef || await resolveCardRef(contactNumber, cardId, groupId);

    if (docRef) {
        await docRef.update({ botState: state, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
}

async function logBotMessage(contactNumber: string, message: string, cardId?: string, groupId?: string, existingRef?: FirebaseFirestore.DocumentReference | null, type: string = 'text', metadata?: any) {
    // Use pre-resolved ref if available, otherwise fall back to lookup
    const docRef = existingRef || await resolveCardRef(contactNumber, cardId, groupId);

    if (docRef) {
        await docRef.update({ 
            lastMessage: message, 
            messages: admin.firestore.FieldValue.arrayUnion({ 
                sender: 'agent', 
                text: message, 
                type: type,
                metadata: metadata || null,
                timestamp: new Date() 
            }),
            unreadCount: 0
        });
    }
}
