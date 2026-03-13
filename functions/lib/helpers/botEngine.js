"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveBot = getActiveBot;
exports.executeBotFlow = executeBotFlow;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const factory_1 = require("./platforms/factory");
// Delay helper
const delay = (ms) => new Promise(res => setTimeout(res, ms));
async function getActiveBot() {
    const db = admin.firestore();
    const botsSnapshot = await db.collection('chatbots')
        .where('isActive', '==', true)
        .orderBy('updatedAt', 'desc') // Tomar el más recientemente activado para consistencia
        .limit(1)
        .get();
    if (botsSnapshot.empty)
        return null;
    const botData = botsSnapshot.docs[0].data();
    if (!botData.flow || !botData.flow.nodes || !botData.flow.edges)
        return null;
    return Object.assign({ id: botsSnapshot.docs[0].id }, botData);
}
function replaceVariables(text, cardData) {
    if (!text)
        return '';
    let processedText = text;
    const variables = Object.assign({ name: cardData.contactName || 'Amigo', nombre: cardData.contactName || 'Amigo', phone: cardData.contactNumber || '' }, (cardData.customFields || {}));
    for (const [key, value] of Object.entries(variables)) {
        // Matches {key}, {{key}}, etc.
        const regex = new RegExp(`\\{+\\s*${key}\\s*\\}+`, 'gi');
        processedText = processedText.replace(regex, String(value || ''));
    }
    return processedText;
}
// Calcula el tiempo de "escritura humana" en MS
function calculateTypingDelay(text) {
    const charsPerSecond = 50; // Faster typing speed (was 25)
    const baseDelay = 100; // Minimize base latency (was 1000)
    let typingTime = (text.length / charsPerSecond) * 1000;
    if (typingTime < 500)
        typingTime = 500; // Min 0.5s (was 1.5s)
    if (typingTime > 2000)
        typingTime = 2000; // Max 2s (was 6s)
    return baseDelay + typingTime;
}
function sanitizeListData(data) {
    const cleanSections = [];
    if (Array.isArray(data.sections) && data.sections.length > 0) {
        for (const sec of data.sections) {
            const rows = sec.rows || [];
            const options = sec.options || [];
            const validRows = [];
            if (Array.isArray(rows)) {
                rows.forEach((r) => { if (r && r.title && r.title.trim() !== '')
                    validRows.push(r); });
            }
            if (Array.isArray(options)) {
                options.forEach((opt, idx) => {
                    if (typeof opt === 'string' && opt.trim() !== '') {
                        validRows.push({ id: `opt_${Date.now()}_${idx}`, title: opt, description: '' });
                    }
                });
            }
            if (validRows.length > 0)
                cleanSections.push({ title: sec.title || 'Opciones', rows: validRows });
        }
    }
    if (cleanSections.length === 0 && Array.isArray(data.options)) {
        const validRows = data.options.filter((opt) => typeof opt === 'string' && opt.trim() !== '')
            .map((opt, idx) => ({ id: `legacy_${idx}`, title: opt }));
        if (validRows.length > 0)
            cleanSections.push({ title: 'Opciones', rows: validRows });
    }
    return cleanSections;
}
function sanitizeButtonsData(buttons) {
    if (!Array.isArray(buttons))
        return [];
    return buttons.filter(b => b && b.title && b.title !== 'undefined' && b.title.trim() !== '');
}
// Helper for Name Extraction
function extractName(input) {
    const cleanInput = input.trim();
    // Regex for common introduction phrases (Case insensitive) - Multi-language support
    const patterns = [
        // Spanish
        /\b(?:me llamo|mi nombre es|yo soy|soy)\s+(.+)/i,
        /\b(?:mucho gusto,?)\s*(?:me llamo|soy)\s+(.+)/i,
        /\b(?:hola,?)?\s*(?:me llamo|soy)\s+(.+)/i,
        // English
        /\b(?:my name is|i am|i'm|this is)\s+(.+)/i,
        /\b(?:hello,?)?\s*(?:i am|i'm|my name is)\s+(.+)/i,
        /\b(?:nice to meet you,?)\s*(?:i am|i'm|my name is)\s+(.+)/i,
        // Portuguese (Basic)
        /\b(?:meu nome (?:é|e)|eu sou)\s+(.+)/i
    ];
    for (const pattern of patterns) {
        const match = cleanInput.match(pattern);
        if (match && match[1]) {
            // Remove lingering punctuation
            return match[1].replace(/[.!]+$/, '').trim();
        }
    }
    // Fallback Strategies:
    // 1. Short Answer (Likely just the name)
    // If input is 1-3 words, assume it is the name.
    const words = cleanInput.split(/\s+/);
    if (words.length <= 3) {
        return cleanInput.replace(/[.!]+$/, '');
    }
    // 2. Long Answer without introduction phrase
    // Try to find capitalized words (heuristic for proper nouns) if input is reasonably short (< 50 chars)
    // Otherwise, better to truncate to avoid saving a paragraph.
    if (cleanInput.length > 50) {
        return cleanInput.substring(0, 50) + '...';
    }
    return cleanInput;
}
// --- MAIN ENGINE ---
async function executeBotFlow(bot, to, cardData, userMessage) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    functions.logger.info(`>>> EXECUTING FLOW: ${bot.name} for ${to} <<<`);
    const platform = cardData.source || 'whatsapp'; // Default to whatsapp if not set
    const adapter = (0, factory_1.getMessagingAdapter)(platform);
    let currentNodeId = (_a = cardData.botState) === null || _a === void 0 ? void 0 : _a.currentNodeId;
    let nextNodeId = null;
    let shouldContinue = true;
    let executionCount = 0;
    const MAX_STEPS = 15;
    // --- PROCESAR INPUT USUARIO ---
    if (currentNodeId) {
        functions.logger.info(`[executeBotFlow] Processing Input for Node: ${currentNodeId}`);
        const currentNode = bot.flow.nodes.find((n) => String(n.id) === String(currentNodeId));
        if (!currentNode) {
            functions.logger.warn(`[executeBotFlow] Node ${currentNodeId} not found in flow.`);
            return;
        }
        // --- STUCK-NODE RECOVERY: Resend current node message if conversation was interrupted ---
        // If the bot was waiting (lastInteraction exists) and the user's message doesn't look like
        // a valid response (e.g., very short/generic), OR if significant time has passed (> 30 min),
        // resend the current node's prompt to guide the user back.
        const lastInteractionAt = ((_c = (_b = cardData.botState) === null || _b === void 0 ? void 0 : _b.lastInteraction) === null || _c === void 0 ? void 0 : _c.toDate)
            ? cardData.botState.lastInteraction.toDate()
            : null;
        const thirtyMinutesMs = 30 * 60 * 1000;
        const wasStuck = lastInteractionAt && (new Date().getTime() - lastInteractionAt.getTime() > thirtyMinutesMs);
        if (wasStuck) {
            functions.logger.info(`[executeBotFlow] Conversation was stuck for >30 min. Resending current node prompt to ${to}.`);
            try {
                if (currentNode.type === 'quickReplyNode') {
                    const qrText = replaceVariables(((_d = currentNode.data) === null || _d === void 0 ? void 0 : _d.bodyText) || ((_e = currentNode.data) === null || _e === void 0 ? void 0 : _e.text) || 'Por favor, elige una opción:', cardData);
                    const buttons = sanitizeButtonsData(((_f = currentNode.data) === null || _f === void 0 ? void 0 : _f.buttons) || []);
                    if (buttons.length > 0)
                        await adapter.sendButtonMessage(to, qrText, buttons);
                    else
                        await adapter.sendMessage(to, qrText);
                }
                else if (currentNode.type === 'listMessageNode') {
                    const listBody = replaceVariables(((_g = currentNode.data) === null || _g === void 0 ? void 0 : _g.body) || ((_h = currentNode.data) === null || _h === void 0 ? void 0 : _h.text) || 'Elige una opción:', cardData);
                    const sections = sanitizeListData(currentNode.data);
                    if (sections.length > 0)
                        await adapter.sendListMessage(to, listBody, ((_j = currentNode.data) === null || _j === void 0 ? void 0 : _j.buttonText) || 'Ver opciones', sections);
                    else
                        await adapter.sendMessage(to, listBody);
                }
                else if (currentNode.type === 'captureInputNode') {
                    const prompt = replaceVariables(((_k = currentNode.data) === null || _k === void 0 ? void 0 : _k.content) || ((_l = currentNode.data) === null || _l === void 0 ? void 0 : _l.text) || '', cardData);
                    if (prompt)
                        await adapter.sendMessage(to, prompt);
                }
            }
            catch (resendErr) {
                functions.logger.warn(`[executeBotFlow] Could not resend stuck node: ${resendErr.message}`);
            }
            await delay(1000);
        }
        try {
            if (platform !== 'whatsapp') {
                await adapter.markAsRead(to).catch(e => functions.logger.warn('markAsRead failed:', e.message));
            }
            else {
                await adapter.markAsRead(userMessage).catch(e => functions.logger.warn('markAsRead failed (non-critical):', e.message));
            }
        }
        catch (e) { }
        await delay(500);
        if (currentNode.type === 'captureInputNode') {
            const validation = validateInput(userMessage, currentNode.data || {});
            if (!validation.isValid) {
                functions.logger.info(`[executeBotFlow] Input validation failed for ${to}: ${validation.errorMessage}`);
                const errorMsg = validation.errorMessage || "Respuesta inválida.";
                await adapter.sendMessage(to, errorMsg);
                return;
            }
            let varName = (_m = currentNode.data) === null || _m === void 0 ? void 0 : _m.variableName;
            if (!varName || varName === 'undefined') {
                const text = (((_o = currentNode.data) === null || _o === void 0 ? void 0 : _o.text) || '').toLowerCase();
                if (text.includes('nombre') || text.includes('name'))
                    varName = 'nombre';
                else
                    varName = `captured_${currentNode.id}`;
            }
            if (varName) {
                let valueToSave = userMessage.trim();
                // IMPROVED NAME EXTRACTION
                if (['nombre', 'name'].includes(varName)) {
                    valueToSave = extractName(valueToSave);
                }
                functions.logger.info(`[executeBotFlow] Saving variable ${varName} = ${valueToSave}`);
                await saveVariable(to, varName, valueToSave, cardData.id, cardData.groupId);
                if (!cardData.customFields)
                    cardData.customFields = {};
                cardData.customFields[varName] = valueToSave;
                if (['nombre', 'name'].includes(varName))
                    cardData.contactName = valueToSave;
            }
        }
        const outgoingEdges = bot.flow.edges.filter((e) => String(e.source) === String(currentNodeId));
        let selectedEdge = null;
        if (outgoingEdges.length > 0) {
            if (outgoingEdges.length === 1) {
                selectedEdge = outgoingEdges[0];
            }
            else {
                if (currentNode.type === 'quickReplyNode') {
                    const buttons = sanitizeButtonsData(currentNode.data.buttons || []);
                    const matchedBtn = buttons.find((btn) => (btn.title || '').toLowerCase().trim() === userMessage.toLowerCase().trim() ||
                        (btn.id || '') === userMessage);
                    if (matchedBtn) {
                        const handleId = matchedBtn.id || matchedBtn.title;
                        selectedEdge = outgoingEdges.find((e) => e.sourceHandle === handleId);
                    }
                }
                else if (currentNode.type === 'listMessageNode') {
                    const sections = sanitizeListData(currentNode.data);
                    let matchedRowId = null;
                    for (const sec of sections) {
                        const row = sec.rows.find((r) => (r.title || '').toLowerCase().trim() === userMessage.toLowerCase().trim() ||
                            (r.id || '') === userMessage);
                        if (row) {
                            matchedRowId = row.id || row.title;
                            break;
                        }
                    }
                    if (matchedRowId) {
                        selectedEdge = outgoingEdges.find((e) => e.sourceHandle === matchedRowId);
                    }
                }
                if (!selectedEdge)
                    selectedEdge = outgoingEdges[0];
            }
            if (selectedEdge)
                nextNodeId = selectedEdge.target;
        }
        else {
            await updateBotState(to, { status: 'completed', currentNodeId: null }, cardData.id, cardData.groupId);
            return;
        }
    }
    else {
        const startNode = bot.flow.nodes.find((n) => n.type === 'startNode');
        if (!startNode)
            return;
        const firstEdge = bot.flow.edges.find((e) => String(e.source) === String(startNode.id));
        if (firstEdge)
            nextNodeId = firstEdge.target;
    }
    // --- EJECUCIÓN DE NODOS ---
    while (shouldContinue && nextNodeId && executionCount < MAX_STEPS) {
        executionCount++;
        const nextNode = bot.flow.nodes.find((n) => String(n.id) === String(nextNodeId));
        if (!nextNode) {
            shouldContinue = false;
            break;
        }
        await updateBotState(to, { status: 'active', currentNodeId: nextNodeId, lastInteraction: new Date() }, cardData.id, cardData.groupId);
        // Simulación Humana (Typing Delay) - CONTROLADO POR UI
        if (['textMessageNode', 'mediaMessageNode', 'quickReplyNode', 'listMessageNode'].includes(nextNode.type)) {
            // Por defecto es TRUE (Humano) a menos que se desactive explícitamente en el editor
            const simulateTyping = ((_p = nextNode.data) === null || _p === void 0 ? void 0 : _p.typingSimulation) !== false;
            if (simulateTyping) {
                const content = ((_q = nextNode.data) === null || _q === void 0 ? void 0 : _q.content) || ((_r = nextNode.data) === null || _r === void 0 ? void 0 : _r.text) || ((_s = nextNode.data) === null || _s === void 0 ? void 0 : _s.caption) || '';
                const humanDelay = calculateTypingDelay(content);
                await delay(humanDelay);
            }
        }
        switch (nextNode.type) {
            case 'textMessageNode':
                const txt = replaceVariables(nextNode.data.content || nextNode.data.text || nextNode.data.label || '', cardData);
                if (txt) {
                    await adapter.sendMessage(to, txt);
                    await logBotMessage(to, txt, cardData.id, cardData.groupId);
                }
                nextNodeId = getNextNodeId(bot, nextNodeId);
                break;
            case 'captureInputNode':
                shouldContinue = false;
                break;
            case 'mediaMessageNode':
                const caption = replaceVariables(nextNode.data.caption || '', cardData);
                if (nextNode.data.url) {
                    await adapter.sendMediaMessage(to, nextNode.data.url, caption, nextNode.data.filename);
                    await logBotMessage(to, `[Archivo] ${caption}`, cardData.id, cardData.groupId);
                }
                nextNodeId = getNextNodeId(bot, nextNodeId);
                break;
            case 'quickReplyNode':
                const qrText = replaceVariables(nextNode.data.text || nextNode.data.bodyText || 'Selecciona:', cardData);
                const buttons = sanitizeButtonsData(nextNode.data.buttons || []);
                if (buttons.length > 0) {
                    await adapter.sendButtonMessage(to, qrText, buttons);
                    await logBotMessage(to, `[Botones] ${qrText}`, cardData.id, cardData.groupId);
                    shouldContinue = false;
                }
                else {
                    await adapter.sendMessage(to, qrText);
                    nextNodeId = getNextNodeId(bot, nextNodeId);
                }
                break;
            case 'listMessageNode':
                const listBody = replaceVariables(nextNode.data.body || nextNode.data.text || 'Selecciona:', cardData);
                const btnLabel = nextNode.data.buttonText || "Opciones";
                const cleanSections = sanitizeListData(nextNode.data);
                if (cleanSections.length > 0) {
                    await adapter.sendListMessage(to, listBody, btnLabel, cleanSections);
                    await logBotMessage(to, `[Lista] ${listBody}`, cardData.id, cardData.groupId);
                    shouldContinue = false;
                }
                else {
                    await adapter.sendMessage(to, listBody);
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
                const ms = (nextNode.data.duration || 2) * 1000;
                await delay(ms);
                nextNodeId = getNextNodeId(bot, nextNodeId);
                break;
            case 'conditionNode':
                const trueEdge = bot.flow.edges.find((e) => String(e.source) === String(nextNodeId) && e.sourceHandle === 'true');
                if (trueEdge)
                    nextNodeId = trueEdge.target;
                else
                    nextNodeId = getNextNodeId(bot, nextNodeId);
                break;
            default:
                nextNodeId = getNextNodeId(bot, nextNodeId);
                break;
        }
    }
}
function getNextNodeId(bot, currentId) {
    if (!currentId)
        return null;
    const edge = bot.flow.edges.find((e) => String(e.source) === String(currentId));
    return edge ? edge.target : null;
}
function validateInput(input, config) {
    if (!input || input.trim() === '')
        return { isValid: false, errorMessage: "Respuesta vacía." };
    if (config.inputType === 'email') {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(input))
            return { isValid: false, errorMessage: config.errorMessage || "Email inválido." };
    }
    return { isValid: true };
}
async function saveVariable(contactNumber, variable, value, cardId, groupId) {
    if (!variable)
        return;
    const db = admin.firestore();
    let docRef = null;
    if (cardId && groupId) {
        docRef = db.collection('kanban-groups').doc(groupId).collection('cards').doc(cardId);
    }
    else if (cardId) {
        // Direct update by ID - Searching in all groups
        const groups = await db.collection('kanban-groups').get();
        for (const group of groups.docs) {
            const ref = group.ref.collection('cards').doc(cardId);
            const snap = await ref.get();
            if (snap.exists) {
                docRef = ref;
                break;
            }
        }
    }
    if (!docRef) {
        // Fallback to query
        const cardsRef = db.collectionGroup('cards').where('contactNumber', '==', contactNumber);
        const snapshot = await cardsRef.get();
        if (!snapshot.empty)
            docRef = snapshot.docs[0].ref;
    }
    if (docRef) {
        const updateData = {};
        updateData[`customFields.${variable}`] = value;
        if (['nombre', 'name', 'fullname'].includes(variable.toLowerCase())) {
            updateData['contactName'] = value;
        }
        await docRef.update(updateData);
    }
}
async function updateBotState(contactNumber, state, cardId, groupId) {
    const db = admin.firestore();
    let docRef = null;
    if (cardId && groupId) {
        docRef = db.collection('kanban-groups').doc(groupId).collection('cards').doc(cardId);
    }
    else if (cardId) {
        const groups = await db.collection('kanban-groups').get();
        for (const group of groups.docs) {
            const ref = group.ref.collection('cards').doc(cardId);
            const snap = await ref.get();
            if (snap.exists) {
                docRef = ref;
                break;
            }
        }
    }
    if (!docRef) {
        const cardsRef = db.collectionGroup('cards').where('contactNumber', '==', contactNumber);
        const snapshot = await cardsRef.get();
        if (!snapshot.empty)
            docRef = snapshot.docs[0].ref;
    }
    if (docRef) {
        await docRef.update({ botState: state, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
}
async function logBotMessage(contactNumber, message, cardId, groupId) {
    const db = admin.firestore();
    let docRef = null;
    if (cardId && groupId) {
        docRef = db.collection('kanban-groups').doc(groupId).collection('cards').doc(cardId);
    }
    else if (cardId) {
        const groups = await db.collection('kanban-groups').get();
        for (const group of groups.docs) {
            const ref = group.ref.collection('cards').doc(cardId);
            const snap = await ref.get();
            if (snap.exists) {
                docRef = ref;
                break;
            }
        }
    }
    if (!docRef) {
        const cardsRef = db.collectionGroup('cards').where('contactNumber', '==', contactNumber);
        const snapshot = await cardsRef.get();
        if (!snapshot.empty)
            docRef = snapshot.docs[0].ref;
    }
    if (docRef) {
        await docRef.update({
            lastMessage: message,
            messages: admin.firestore.FieldValue.arrayUnion({
                sender: 'agent',
                text: message,
                timestamp: new Date()
            }),
            unreadCount: 0
        });
    }
}
//# sourceMappingURL=botEngine.js.map