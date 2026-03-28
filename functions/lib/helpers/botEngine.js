"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCardRef = resolveCardRef;
exports.getActiveBot = getActiveBot;
exports.tryTriggerBot = tryTriggerBot;
exports.executeBotFlow = executeBotFlow;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const axios_1 = require("axios");
const factory_1 = require("./platforms/factory");
// Delay helper
const delay = (ms) => new Promise(res => setTimeout(res, ms));
// --- LOCK SYSTEM: Prevents duplicate processing when user sends multiple messages quickly ---
const LOCK_TIMEOUT_MS = 30000; // 30 seconds max lock duration
async function acquireBotLock(cardRef) {
    const db = admin.firestore();
    try {
        return await db.runTransaction(async (tx) => {
            const snap = await tx.get(cardRef);
            if (!snap.exists)
                return false;
            const data = snap.data();
            const existingLock = data === null || data === void 0 ? void 0 : data.botLock;
            const now = Date.now();
            // If there's an active lock that hasn't expired, another instance is processing
            if (existingLock && (now - existingLock) < LOCK_TIMEOUT_MS) {
                functions.logger.warn(`[BotLock] Lock active for ${cardRef.id}, skipping (age: ${now - existingLock}ms)`);
                return false;
            }
            tx.update(cardRef, { botLock: now });
            return true;
        });
    }
    catch (err) {
        functions.logger.error(`[BotLock] Failed to acquire lock: ${err.message}`);
        return false;
    }
}
async function releaseBotLock(cardRef) {
    try {
        await cardRef.update({ botLock: admin.firestore.FieldValue.delete() });
    }
    catch (err) {
        functions.logger.warn(`[BotLock] Failed to release lock: ${err.message}`);
    }
}
// --- Search by platform_ids (New Unified Approach) ---
// Try to find by whatsapp/external_id first, scoped locally to the tenant
async function resolveCardRef(userId, entityId, contactNumber, platform = 'whatsapp') {
    const db = admin.firestore();
    const groupsPath = `users/${userId}/entities/${entityId}/kanban-groups`;
    try {
        const groupsSnap = await db.collection(groupsPath).get();
        if (groupsSnap.empty)
            return null;
        for (const groupDoc of groupsSnap.docs) {
            // Strategy A: platform_ids.{platform}
            const platformSnap = await groupDoc.ref.collection('cards')
                .where(`platform_ids.${platform}`, '==', contactNumber)
                .limit(1)
                .get();
            if (!platformSnap.empty)
                return platformSnap.docs[0].ref;
            // Strategy B: Legacy contactNumber match (mostly for WhatsApp)
            if (platform === 'whatsapp') {
                const legacySnap = await groupDoc.ref.collection('cards')
                    .where('contactNumber', '==', contactNumber)
                    .limit(1)
                    .get();
                if (!legacySnap.empty)
                    return legacySnap.docs[0].ref;
            }
        }
    }
    catch (e) {
        functions.logger.error(`[resolveCardRef] Error scanning cards for tenant ${userId}/${entityId}`, e);
    }
    return null;
}
async function getActiveBot(userId, entityId) {
    const db = admin.firestore();
    const botsSnapshot = await db.collection(`users/${userId}/entities/${entityId}/chatbots`)
        .where('isActive', '==', true)
        .get();
    if (botsSnapshot.empty)
        return null;
    // Sort in memory to avoid mandatory composite index
    const bots = botsSnapshot.docs.map(d => (Object.assign({ id: d.id }, d.data())));
    bots.sort((a, b) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const timeA = ((_c = (_b = (_a = a.updatedAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.getTime()) || ((_f = (_e = (_d = a.createdAt) === null || _d === void 0 ? void 0 : _d.toDate) === null || _e === void 0 ? void 0 : _e.call(_d)) === null || _f === void 0 ? void 0 : _f.getTime()) || 0;
        const timeB = ((_j = (_h = (_g = b.updatedAt) === null || _g === void 0 ? void 0 : _g.toDate) === null || _h === void 0 ? void 0 : _h.call(_g)) === null || _j === void 0 ? void 0 : _j.getTime()) || ((_m = (_l = (_k = b.createdAt) === null || _k === void 0 ? void 0 : _k.toDate) === null || _l === void 0 ? void 0 : _l.call(_k)) === null || _m === void 0 ? void 0 : _m.getTime()) || 0;
        return timeB - timeA;
    });
    const botData = bots[0];
    if (!botData.flow || !botData.flow.nodes || !botData.flow.edges)
        return null;
    return botData;
}
function replaceVariables(text, cardData) {
    if (!text)
        return '';
    let processedText = text;
    const variables = Object.assign({ name: cardData.contactName || 'estimado/a cliente', nombre: cardData.contactName || 'estimado/a cliente', phone: cardData.contactNumber || '' }, (cardData.customFields || {}));
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
function evaluateCondition(varValue, operator, targetValue, fuzzy = true) {
    let v = varValue === undefined || varValue === null ? '' : String(varValue);
    let t = targetValue === undefined || targetValue === null ? '' : String(targetValue);
    if (fuzzy) {
        v = v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        t = t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    switch (operator) {
        case 'equals': return v === t;
        case 'not_equals': return v !== t;
        case 'contains': return v.includes(t);
        case 'starts_with': return v.startsWith(t);
        case 'ends_with': return v.endsWith(t);
        case 'gt': return parseFloat(v) > parseFloat(t);
        case 'lt': return parseFloat(v) < parseFloat(t);
        case 'gte': return parseFloat(v) >= parseFloat(t);
        case 'lte': return parseFloat(v) <= parseFloat(t);
        case 'is_set': return varValue !== undefined && varValue !== null && String(varValue).trim() !== '';
        case 'is_empty': return varValue === undefined || varValue === null || String(varValue).trim() === '';
        case 'regex':
            try {
                const re = new RegExp(t, 'i');
                return re.test(v);
            }
            catch (e) {
                return false;
            }
        default: return false;
    }
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
/**
 * Unified Bot Trigger Logic
 * Handles checking for active bots, session lifecycle, and command overrides.
 */
async function tryTriggerBot(userId, entityId, platform, externalId, messageText, messageId, metadata) {
    var _a, _b;
    const activeBot = await getActiveBot(userId, entityId);
    if (!activeBot) {
        functions.logger.debug(`[Bot Engine] No active bot for entity ${entityId}. Skipping.`);
        return;
    }
    const cardRef = await resolveCardRef(userId, entityId, externalId, platform);
    if (!cardRef) {
        functions.logger.error(`[Bot Engine] Could not resolve card for ${externalId} on ${platform} for tenant ${userId}/${entityId}`);
        return;
    }
    const cardSnap = await cardRef.get();
    const cardData = Object.assign({ id: cardRef.id }, cardSnap.data());
    const now = new Date();
    const FORTY_EIGHT_HOURS_IN_MS = 48 * 60 * 60 * 1000;
    const input = messageText.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isCommand = input === 'reinicia todo ahora' || input === 'reiniciar' || input === 'reset';
    const botStatus = ((_a = cardData.botState) === null || _a === void 0 ? void 0 : _a.status) || 'none';
    let shouldTrigger = false;
    if (isCommand) {
        shouldTrigger = true;
    }
    else if (botStatus === 'completed') {
        shouldTrigger = false;
    }
    else if (botStatus === 'none' || botStatus === 'active') {
        shouldTrigger = true;
    }
    else if ((_b = cardData.botState) === null || _b === void 0 ? void 0 : _b.lastInteraction) {
        const lastInt = cardData.botState.lastInteraction.toDate ? cardData.botState.lastInteraction.toDate() : new Date(0);
        if ((now.getTime() - lastInt.getTime()) > FORTY_EIGHT_HOURS_IN_MS) {
            shouldTrigger = true;
        }
    }
    if (shouldTrigger) {
        // Reset state if it's starting a fresh session
        if (botStatus === 'none' && cardData.botState) {
            await cardRef.update({ botState: admin.firestore.FieldValue.delete() });
            delete cardData.botState;
        }
        await executeBotFlow(activeBot, userId, entityId, externalId, cardData, messageText, messageId, metadata);
    }
}
// --- MAIN ENGINE ---
// --- MAIN ENGINE ---
async function executeBotFlow(bot, userId, entityId, to, cardData, rawUserMessage, messageId, metadata) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10;
    functions.logger.info(`>>> EXECUTING FLOW: ${bot.name} for ${to} (Tenant: ${userId}/${entityId}) <<<`);
    let currentMsg = rawUserMessage || '';
    const platform = cardData.source || 'whatsapp'; // Default to whatsapp if not set
    const adapter = (0, factory_1.getMessagingAdapter)(platform, userId, entityId);
    // Resolve cardRef once and reuse it throughout the entire flow
    const cardRef = await resolveCardRef(userId, entityId, to, platform);
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
        const isRestartCommand = currentMsg.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 'reinicia todo ahora' || currentMsg.trim().toLowerCase() === 'reiniciar' || currentMsg.trim().toLowerCase() === 'reset';
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
            currentMsg = ""; // Clear to avoid being used by the fresh flow
            return; // STOP execution here to wait for next user message
        }
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
                        const header = {
                            type: ((_g = currentNode.data) === null || _g === void 0 ? void 0 : _g.headerType) || 'none',
                            text: replaceVariables(((_h = currentNode.data) === null || _h === void 0 ? void 0 : _h.headerText) || '', cardData),
                            url: (_j = currentNode.data) === null || _j === void 0 ? void 0 : _j.headerMediaUrl
                        };
                        if (buttons.length > 0) {
                            await adapter.sendButtonMessage(to, qrText, buttons, header);
                            await logBotMessage(to, qrText, cardData.id, cardData.groupId, cardRef, 'buttons', { buttons, header });
                        }
                        else
                            await adapter.sendMessage(to, qrText);
                    }
                    else if (currentNode.type === 'listMessageNode') {
                        const listBody = replaceVariables(((_k = currentNode.data) === null || _k === void 0 ? void 0 : _k.body) || ((_l = currentNode.data) === null || _l === void 0 ? void 0 : _l.text) || 'Elige una opción:', cardData);
                        const sections = sanitizeListData(currentNode.data);
                        if (sections.length > 0) {
                            const btnText = ((_m = currentNode.data) === null || _m === void 0 ? void 0 : _m.buttonText) || 'Ver opciones';
                            await adapter.sendListMessage(to, listBody, btnText, sections);
                            await logBotMessage(to, listBody, cardData.id, cardData.groupId, cardRef, 'list', { buttonText: btnText, sections });
                        }
                        else
                            await adapter.sendMessage(to, listBody);
                    }
                    else if (currentNode.type === 'captureInputNode') {
                        const prompt = replaceVariables(((_o = currentNode.data) === null || _o === void 0 ? void 0 : _o.content) || ((_p = currentNode.data) === null || _p === void 0 ? void 0 : _p.text) || '', cardData);
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
                else if (messageId) {
                    // WhatsApp markAsRead REQUIRES the actual WhatsApp message ID
                    await adapter.markAsRead(messageId).catch(e => functions.logger.warn(`[Bot Engine] markAsRead failed for msg ${messageId}:`, e.message));
                }
                else {
                    functions.logger.debug('[Bot Engine] Skipping markAsRead (No messageId provided)');
                }
            }
            catch (e) { }
            await delay(500);
            if (currentNode.type === 'captureInputNode') {
                const validation = validateInput(currentMsg, currentNode.data || {}, metadata);
                const maxRetries = ((_q = currentNode.data) === null || _q === void 0 ? void 0 : _q.maxRetries) || 3;
                const currentRetries = ((_r = cardData.botState) === null || _r === void 0 ? void 0 : _r.retryCount) || 0;
                if (!validation.isValid) {
                    functions.logger.info(`[executeBotFlow] Input validation failed for ${to}. Retry ${currentRetries + 1}/${maxRetries}`);
                    if (currentRetries + 1 >= maxRetries) {
                        functions.logger.info(`[executeBotFlow] Max retries reached for ${to}. Continuing flow.`);
                        // Fallback value for name variables if requested by user
                        const varName = ((_s = currentNode.data) === null || _s === void 0 ? void 0 : _s.variableName) || '';
                        const isNameVar = ['nombre', 'name', 'firstname'].includes(varName.toLowerCase());
                        const fallbackValue = isNameVar ? "Amigo" : "No provisto";
                        await saveVariable(to, varName, fallbackValue, cardData.id, cardData.groupId, cardRef);
                        // continue to next node logic below
                    }
                    else {
                        const errorMsg = replaceVariables(validation.errorMessage || "Respuesta inválida.", cardData);
                        await adapter.sendMessage(to, errorMsg);
                        // Update retry count in state
                        await updateBotState(to, Object.assign(Object.assign({}, cardData.botState), { retryCount: currentRetries + 1, lastInteraction: admin.firestore.Timestamp.now() }), cardData.id, cardData.groupId, cardRef);
                        return;
                    }
                }
                else {
                    let valueToSave = currentMsg.trim();
                    const varName = ((_t = currentNode.data) === null || _t === void 0 ? void 0 : _t.variableName) || `captured_${currentNode.id}`;
                    // --- HEURÍSTICA DE EXTRACCIÓN DE NOMBRE ---
                    if (['nombre', 'name', 'firstname', 'user'].includes(varName.toLowerCase())) {
                        valueToSave = extractName(valueToSave);
                        functions.logger.info(`[executeBotFlow] Name extracted: "${valueToSave}" from "${currentMsg}"`);
                    }
                    functions.logger.info(`[executeBotFlow] Saving variable ${varName} = ${valueToSave}`);
                    await saveVariable(to, varName, valueToSave, cardData.id, cardData.groupId, cardRef);
                    if (!cardData.customFields)
                        cardData.customFields = {};
                    cardData.customFields[varName] = valueToSave;
                    // Update local contactName for immediate use in following nodes
                    if (['nombre', 'name', 'firstname', 'user'].includes(varName.toLowerCase()) && valueToSave !== 'Amigo') {
                        cardData.contactName = valueToSave;
                    }
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
                        const matchedBtn = buttons.find((btn) => (btn.title || '').toLowerCase().trim() === currentMsg.toLowerCase().trim() ||
                            (btn.id || '') === currentMsg);
                        if (matchedBtn) {
                            const handleId = matchedBtn.id || matchedBtn.title;
                            selectedEdge = outgoingEdges.find((e) => e.sourceHandle === handleId);
                        }
                    }
                    else if (currentNode.type === 'listMessageNode') {
                        const sections = sanitizeListData(currentNode.data);
                        let matchedRowId = null;
                        for (const sec of sections) {
                            const row = sec.rows.find((r) => (r.title || '').toLowerCase().trim() === currentMsg.toLowerCase().trim() ||
                                (r.id || '') === currentMsg);
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
                await updateBotState(to, { status: 'completed', currentNodeId: null }, cardData.id, cardData.groupId, cardRef);
                return;
            }
        }
        else {
            const startNode = bot.flow.nodes.find((n) => n.type === 'start' || n.type === 'startNode');
            if (!startNode) {
                functions.logger.warn(`[executeBotFlow] Start Node NOT found for bot ${bot.id}`);
                return;
            }
            const firstEdge = bot.flow.edges.find((e) => String(e.source) === String(startNode.id));
            if (firstEdge)
                nextNodeId = firstEdge.target;
            else {
                functions.logger.warn(`[executeBotFlow] Start Node ${startNode.id} has no outgoing edges.`);
                return;
            }
        }
        // --- EJECUCIÓN DE NODOS ---
        while (shouldContinue && nextNodeId && executionCount < MAX_STEPS) {
            executionCount++;
            const nextNode = bot.flow.nodes.find((n) => String(n.id) === String(nextNodeId));
            if (!nextNode) {
                shouldContinue = false;
                break;
            }
            if (nextNode.type === 'endNode') {
                const endData = nextNode.data || {};
                functions.logger.info(`[executeBotFlow] End Node reached for ${to}. Outcome: ${endData.outcome || 'neutral'}`);
                // 1. Process Garbage Collection (Clear Variables)
                if (endData.clearVariables) {
                    const varsToClear = endData.clearVariables.split(',').map((v) => v.trim()).filter((v) => v !== '');
                    if (varsToClear.length > 0) {
                        const updateObj = {};
                        varsToClear.forEach((v) => {
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
                const simulateTyping = ((_u = nextNode.data) === null || _u === void 0 ? void 0 : _u.typingSimulation) !== false;
                if (simulateTyping) {
                    const content = ((_v = nextNode.data) === null || _v === void 0 ? void 0 : _v.content) || ((_w = nextNode.data) === null || _w === void 0 ? void 0 : _w.text) || ((_x = nextNode.data) === null || _x === void 0 ? void 0 : _x.caption) || '';
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
                    if (currentMsg && currentMsg.trim() !== '') {
                        const validation = validateInput(currentMsg, nextNode.data || {}, metadata);
                        if (validation.isValid) {
                            functions.logger.info(`[Bot Engine] Immediate valid capture for ${to} at ${nextNodeId}: "${currentMsg}"`);
                            let valueToSave = currentMsg.trim();
                            const varName = ((_y = nextNode.data) === null || _y === void 0 ? void 0 : _y.variableName) || `captured_${nextNodeId}`;
                            if (['nombre', 'name', 'firstname', 'user'].includes(varName.toLowerCase())) {
                                valueToSave = extractName(valueToSave);
                            }
                            await saveVariable(to, varName, valueToSave, cardData.id, cardData.groupId, cardRef);
                            if (!cardData.customFields)
                                cardData.customFields = {};
                            cardData.customFields[varName] = valueToSave;
                            // Update local contactName for immediate use in following nodes
                            if (['nombre', 'name', 'firstname', 'user'].includes(varName.toLowerCase()) && valueToSave !== 'Amigo') {
                                cardData.contactName = valueToSave;
                            }
                            // Continuar al siguiente nodo sin detenerse
                            currentNodeId = nextNodeId;
                            nextNodeId = getNextNodeId(bot, nextNodeId);
                            currentMsg = ""; // Consumir el mensaje para que no se use de nuevo
                            continue;
                        }
                    }
                    // Si no fue válido o no había mensaje, enviar el prompt y esperar
                    const prompt = replaceVariables(((_z = nextNode.data) === null || _z === void 0 ? void 0 : _z.content) || ((_0 = nextNode.data) === null || _0 === void 0 ? void 0 : _0.text) || '', cardData);
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
                        type: ((_1 = nextNode.data) === null || _1 === void 0 ? void 0 : _1.headerType) || 'none',
                        text: replaceVariables(((_2 = nextNode.data) === null || _2 === void 0 ? void 0 : _2.headerText) || '', cardData),
                        url: (_3 = nextNode.data) === null || _3 === void 0 ? void 0 : _3.headerMediaUrl
                    };
                    if (buttons.length > 0) {
                        await adapter.sendButtonMessage(to, qrText, buttons, header);
                        await logBotMessage(to, qrText, cardData.id, cardData.groupId, cardRef, 'buttons', { buttons, header });
                        shouldContinue = false;
                    }
                    else {
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
                    }
                    else {
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
                    }
                    else {
                        const seconds = parseFloat(delayData.durationSeconds || delayData.duration || 2);
                        delayMs = seconds * 1000;
                    }
                    await delay(delayMs);
                    nextNodeId = getNextNodeId(bot, nextNodeId);
                    break;
                case 'conditionNode':
                    const conditionData = nextNode.data || {};
                    const routes = conditionData.routes || [];
                    let matchedRouteId = null;
                    for (const route of routes) {
                        const matchType = route.matchType || 'AND';
                        const routeConditions = route.conditions || [];
                        if (routeConditions.length === 0)
                            continue;
                        let routeMatches = matchType === 'AND'; // Start true for AND, false for OR
                        for (const cond of routeConditions) {
                            // Resolve variable value from cardData
                            const varName = (cond.variable || '').replace(/[\{\}]/g, '').trim();
                            const varValue = ((_4 = cardData.customFields) === null || _4 === void 0 ? void 0 : _4[varName]) || cardData[varName];
                            const isMatch = evaluateCondition(varValue, cond.operator, cond.value, conditionData.fuzzyMatch !== false);
                            if (matchType === 'AND') {
                                routeMatches = routeMatches && isMatch;
                                if (!routeMatches)
                                    break; // Optimization: fail fast for AND
                            }
                            else {
                                routeMatches = routeMatches || isMatch;
                                if (routeMatches)
                                    break; // Optimization: succeed fast for OR
                            }
                        }
                        if (routeMatches) {
                            matchedRouteId = route.id;
                            break;
                        }
                    }
                    if (matchedRouteId) {
                        const matchedEdge = bot.flow.edges.find((e) => String(e.source) === String(nextNodeId) && String(e.sourceHandle) === String(matchedRouteId));
                        if (matchedEdge)
                            nextNodeId = matchedEdge.target;
                        else
                            nextNodeId = getNextNodeId(bot, nextNodeId);
                    }
                    else {
                        // Fallback to "else" handle
                        const elseEdge = bot.flow.edges.find((e) => String(e.source) === String(nextNodeId) && e.sourceHandle === 'else');
                        if (elseEdge)
                            nextNodeId = elseEdge.target;
                        else
                            nextNodeId = getNextNodeId(bot, nextNodeId);
                    }
                    break;
                case 'setVariableNode': {
                    const setVarData = nextNode.data || {};
                    const varToSet = (setVarData.variableName || '').replace(/[\{\}]/g, '').trim();
                    const opCat = setVarData.operationCategory || 'set';
                    const op = setVarData.operation || 'set';
                    let valueToUse = replaceVariables(setVarData.value || '', cardData);
                    if (varToSet) {
                        let currentVal = (_7 = (_6 = (_5 = cardData.customFields) === null || _5 === void 0 ? void 0 : _5[varToSet]) !== null && _6 !== void 0 ? _6 : cardData[varToSet]) !== null && _7 !== void 0 ? _7 : '';
                        let newVal = valueToUse;
                        if (opCat === 'math') {
                            const numCurrent = parseFloat(currentVal) || 0;
                            const numInput = parseFloat(valueToUse) || 0;
                            if (op === 'add')
                                newVal = numCurrent + numInput;
                            else if (op === 'subtract')
                                newVal = numCurrent - numInput;
                            else if (op === 'multiply')
                                newVal = numCurrent * numInput;
                        }
                        else if (opCat === 'list') {
                            let list = Array.isArray(currentVal) ? currentVal : [];
                            if (op === 'push') {
                                list.push(valueToUse);
                                newVal = list;
                            }
                        }
                        // Save to Firestore
                        await cardRef.update({
                            [`customFields.${varToSet}`]: newVal,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        // Update local cardData for immediate reuse in same flow
                        if (!cardData.customFields)
                            cardData.customFields = {};
                        cardData.customFields[varToSet] = newVal;
                    }
                    nextNodeId = getNextNodeId(bot, nextNodeId);
                    break;
                }
                case 'webhookNode': {
                    const webhookData = nextNode.data || {};
                    const url = replaceVariables(webhookData.url || '', cardData);
                    const method = (webhookData.method || 'POST').toUpperCase();
                    const saveTo = (webhookData.saveResponseTo || '').replace(/[\{\}]/g, '').trim();
                    if (url) {
                        try {
                            functions.logger.info(`[Bot] Executing Webhook: ${method} ${url}`);
                            const response = await (0, axios_1.default)({
                                method,
                                url,
                                timeout: 10000,
                            });
                            if (saveTo) {
                                await cardRef.update({
                                    [`customFields.${saveTo}`]: response.data,
                                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                if (!cardData.customFields)
                                    cardData.customFields = {};
                                cardData.customFields[saveTo] = response.data;
                            }
                            const successEdge = bot.flow.edges.find((e) => String(e.source) === String(nextNodeId) && e.sourceHandle === 'success');
                            if (successEdge)
                                nextNodeId = successEdge.target;
                            else
                                nextNodeId = getNextNodeId(bot, nextNodeId);
                        }
                        catch (error) {
                            functions.logger.error(`[Bot] Webhook Error:`, error.message);
                            const failureEdge = bot.flow.edges.find((e) => String(e.source) === String(nextNodeId) && e.sourceHandle === 'failure');
                            if (failureEdge)
                                nextNodeId = failureEdge.target;
                            else
                                nextNodeId = getNextNodeId(bot, nextNodeId);
                        }
                    }
                    else {
                        nextNodeId = getNextNodeId(bot, nextNodeId);
                    }
                    break;
                }
                case 'generativeAINode': {
                    const aiData = nextNode.data || {};
                    const systemPrompt = replaceVariables(aiData.systemPrompt || 'Eres un asistente útil.', cardData);
                    const userMsg = cardData.lastMessage || '';
                    const model = aiData.model || 'gpt-4o';
                    const temperature = (_8 = aiData.temperature) !== null && _8 !== void 0 ? _8 : 0.7;
                    const outputVar = (aiData.outputVariable || '').replace(/[\{\}]/g, '').trim();
                    const apiKey = (_9 = functions.config().openai) === null || _9 === void 0 ? void 0 : _9.key;
                    if (apiKey) {
                        try {
                            functions.logger.info(`[Bot] Calling AI Model: ${model}`);
                            const aiResponse = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
                                model: model.startsWith('gpt') ? model : 'gpt-4o',
                                messages: [
                                    { role: 'system', content: systemPrompt },
                                    { role: 'user', content: userMsg }
                                ],
                                temperature: temperature
                            }, {
                                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                                timeout: 30000
                            });
                            const aiText = aiResponse.data.choices[0].message.content;
                            if (outputVar) {
                                await cardRef.update({
                                    [`customFields.${outputVar}`]: aiText,
                                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                                if (!cardData.customFields)
                                    cardData.customFields = {};
                                cardData.customFields[outputVar] = aiText;
                            }
                            else {
                                await adapter.sendMessage(to, aiText);
                                await logBotMessage(to, aiText, cardData.id, cardData.groupId, cardRef);
                            }
                        }
                        catch (error) {
                            functions.logger.error(`[Bot] AI Error:`, ((_10 = error.response) === null || _10 === void 0 ? void 0 : _10.data) || error.message);
                            await adapter.sendMessage(to, "Lo siento, tuve un problema procesando tu solicitud con IA.");
                        }
                    }
                    else {
                        functions.logger.warn("[Bot] Missing OpenAI API Key in functions.config().openai.key");
                        await adapter.sendMessage(to, "El nodo de IA no está configurado (falta API Key).");
                    }
                    nextNodeId = getNextNodeId(bot, nextNodeId);
                    break;
                }
                case 'humanHandoffNode': {
                    functions.logger.info(`[Bot] Human Handoff initiated for ${to}`);
                    await cardRef.update({
                        isHandledByHuman: true,
                        botActive: false,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    await adapter.sendMessage(to, "Te estoy transfiriendo con un agente humano. Por favor, espera un momento.");
                    return;
                }
                default:
                    nextNodeId = getNextNodeId(bot, nextNodeId);
                    break;
            }
        }
    }
    finally {
        // ALWAYS release the lock, even if an error occurred
        if (lockAcquired) {
            await releaseBotLock(cardRef);
        }
    }
}
function extractName(input) {
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
    const capitalized = cleaned.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ').trim();
    return capitalized || "Amigo";
}
function getNextNodeId(bot, currentId) {
    if (!currentId)
        return null;
    const edge = bot.flow.edges.find((e) => String(e.source) === String(currentId));
    return edge ? edge.target : null;
}
function validateInput(input, config, metadata) {
    const value = (input || '').trim();
    const defaultError = config.errorMessage || "Formato inválido. Por favor, intenta de nuevo.";
    // 0. Verificación de Vacío
    if (!value && !(metadata === null || metadata === void 0 ? void 0 : metadata.mediaUrl)) {
        return { isValid: false, errorMessage: "Respuesta vacía. Por favor escribe algo." };
    }
    // 1. Prioridad: Expresión Regular Personalizada o Generada desde la UI
    const regexStr = config.validationRegex || config.regex;
    if (regexStr && config.inputType !== 'text') {
        try {
            const re = new RegExp(regexStr);
            if (!re.test(value))
                return { isValid: false, errorMessage: defaultError };
        }
        catch (e) {
            functions.logger.error('Invalid regex in node config:', regexStr);
        }
    }
    // 2. Control de Calidad Heurístico (Evitar "basura")
    if (config.inputType === 'text' || !config.inputType) {
        const hasTooManyRepeatedChars = /(.)\1{4,}/.test(value.toLowerCase());
        const isTooLongWithoutSpaces = value.length > 20 && !value.includes(' ');
        const isTooShort = value.length < 2 && !(metadata === null || metadata === void 0 ? void 0 : metadata.mediaUrl);
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
        if (!regex.test(value))
            return { isValid: false, errorMessage: defaultError };
    }
    else if (inputType === 'number') {
        const regex = /^-?\d+(\.\d+)?$/;
        if (!regex.test(value))
            return { isValid: false, errorMessage: defaultError };
    }
    else if (inputType === 'phone') {
        const regex = /^\+?[\d\s-]{8,20}$/;
        if (!regex.test(value))
            return { isValid: false, errorMessage: defaultError };
    }
    else if (inputType === 'url') {
        try {
            new URL(value);
        }
        catch (_) {
            return { isValid: false, errorMessage: defaultError };
        }
    }
    else if (inputType === 'date') {
        // Validación para DD/MM/AAAA
        const regex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
        if (!regex.test(value))
            return { isValid: false, errorMessage: defaultError };
    }
    else if (inputType === 'dni' || inputType === 'cpf') {
        // Validación genérica para DNI/CPF (numeros, puntos, guiones)
        const regex = /^[\d.-]{7,15}$/;
        if (!regex.test(value))
            return { isValid: false, errorMessage: defaultError };
    }
    else if (inputType === 'image') {
        if ((metadata === null || metadata === void 0 ? void 0 : metadata.type) !== 'image' && !(metadata === null || metadata === void 0 ? void 0 : metadata.mediaUrl)) {
            return { isValid: false, errorMessage: "Por favor, envía una imagen." };
        }
    }
    else if (inputType === 'file' || inputType === 'document') {
        if (!['document', 'pdf', 'file'].includes((metadata === null || metadata === void 0 ? void 0 : metadata.type) || '') && !(metadata === null || metadata === void 0 ? void 0 : metadata.mediaUrl)) {
            return { isValid: false, errorMessage: "Por favor, envía un documento." };
        }
    }
    return { isValid: true };
}
async function saveVariable(contactNumber, variable, value, cardId, groupId, existingRef, userId, entityId, platform) {
    if (!variable)
        return;
    // Use pre-resolved ref if available, otherwise fall back to lookup
    const docRef = existingRef || (userId && entityId ? await resolveCardRef(userId, entityId, contactNumber, platform || 'whatsapp') : null);
    if (docRef) {
        const updateData = {};
        updateData[`customFields.${variable}`] = value;
        // --- AUTO-UPDATE CONTACT NAME ---
        const varLower = variable.toLowerCase();
        const isNameVariable = varLower === 'nombre' || varLower === 'name' || varLower === 'firstname';
        if (isNameVariable && value && value !== 'Amigo') {
            updateData.contactName = value;
            functions.logger.info(`[saveVariable] Auto-updating contactName for ${contactNumber} to ${value}`);
        }
        await docRef.update(Object.assign(Object.assign({}, updateData), { updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
        // SYNC WITH MASTER CONTACTS COLLECTION (Disabled by user request)
        /*
        if (isNameVariable) {
            ...
        }
        */
    }
}
async function updateBotState(contactNumber, state, cardId, groupId, existingRef, userId, entityId, platform) {
    // Use pre-resolved ref if available, otherwise fall back to lookup
    const docRef = existingRef || (userId && entityId ? await resolveCardRef(userId, entityId, contactNumber, platform || 'whatsapp') : null);
    if (docRef) {
        await docRef.update({ botState: state, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
}
async function logBotMessage(contactNumber, message, cardId, groupId, existingRef, type = 'text', metadata, userId, entityId, platform) {
    // Use pre-resolved ref if available, otherwise fall back to lookup
    const docRef = existingRef || (userId && entityId ? await resolveCardRef(userId, entityId, contactNumber, platform || 'whatsapp') : null);
    if (docRef) {
        await docRef.update({
            lastMessage: message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            messages: admin.firestore.FieldValue.arrayUnion({
                sender: 'agent',
                text: message,
                type: type,
                metadata: metadata || null,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            }),
            unreadCount: 0
        });
    }
}
//# sourceMappingURL=botEngine.js.map