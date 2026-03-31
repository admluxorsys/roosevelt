"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleKanbanUpdateOmni = handleKanbanUpdateOmni;
exports.updateReadStatus = updateReadStatus;
const admin = require("firebase-admin");
/**
 * OMNICHANNEL KANBAN MANAGER
 *
 * Handles Creation & Updates of Kanban Cards for ALL platforms.
 *
 * SEARCH STRATEGY (in-memory iteration — no Firestore indexes required):
 * 1. By platform_ids.{platform} (new unified approach)
 * 2. By contactNumber / contactNumberClean suffix match (last 9 digits)
 * 3. By external_id (legacy exact match)
 */
function sanitizeForFirestore(obj) {
    if (obj === null || obj === undefined)
        return null;
    if (typeof obj !== 'object' || obj instanceof Date)
        return obj;
    if (Array.isArray(obj))
        return obj.map(sanitizeForFirestore).filter(v => v !== undefined);
    return Object.fromEntries(Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, sanitizeForFirestore(v)]));
}
async function handleKanbanUpdateOmni(message, userId, entityId) {
    const db = admin.firestore();
    const { source_platform, external_id, message_text, message_type, timestamp, platform_metadata } = message;
    if (!userId || !entityId) {
        throw new Error('[Omni] Critical: Missing userId/entityId.');
    }
    // --- 1. SEARCH FOR EXISTING CARD (Agnostic & Defensive) ---
    let snapshot = null;
    // Strategy A: By platform_ids.{platform} (Unified)
    try {
        const s = await db.collectionGroup('cards')
            .where(`platform_ids.${source_platform}`, '==', external_id)
            .limit(1)
            .get();
        if (!s.empty)
            snapshot = s;
    }
    catch (e) { }
    // Strategy B: Legacy contactNumber match
    if (!snapshot) {
        try {
            const s = await db.collectionGroup('cards')
                .where('contactNumber', '==', external_id)
                .limit(1)
                .get();
            if (!s.empty)
                snapshot = s;
        }
        catch (e) { }
    }
    // Strategy C: contactNumberClean match
    if (!snapshot && (source_platform === 'whatsapp' || source_platform === 'sms')) {
        const clean = external_id.replace(/\+/g, '');
        try {
            const s = await db.collectionGroup('cards')
                .where('contactNumberClean', '==', clean)
                .limit(1)
                .get();
            if (!s.empty)
                snapshot = s;
        }
        catch (e) { }
    }
    // --- 2. RESOLVE GROUPS PATH ---
    const groupsPath = `users/${userId}/entities/${entityId}/kanban-groups`;
    const groupsRef = db.collection(groupsPath);
    const allGroupsSnap = await groupsRef.get();
    if (allGroupsSnap.empty) {
        // Create default group if mission is critical
        const newGroup = await groupsRef.add({
            name: 'Bandeja de Entrada',
            color: '#3B82F6',
            order: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const snap = await newGroup.get();
        return db.runTransaction(async (transaction) => {
            const cardRef = groupsRef.doc(snap.id).collection('cards').doc();
            const data = createNewCardData(message, snap.id);
            transaction.set(cardRef, data);
            return { success: true, cardId: cardRef.id, isNew: true };
        });
    }
    const inboxGroupDoc = allGroupsSnap.docs.find(g => (g.data().name || '').toLowerCase().includes('bandeja')) || allGroupsSnap.docs[0];
    const inboxGroupId = inboxGroupDoc.id;
    // --- 3. EXECUTE TRANSACTION ---
    return db.runTransaction(async (transaction) => {
        let cardRef;
        let isNew = false;
        if (snapshot && !snapshot.empty) {
            cardRef = snapshot.docs[0].ref;
            const updatePayload = {
                lastMessage: message_text || `[${message_type.toUpperCase()}]`,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                [`platform_ids.${source_platform}`]: external_id,
                unreadCount: admin.firestore.FieldValue.increment(1),
                messages: admin.firestore.FieldValue.arrayUnion({
                    sender: 'user',
                    text: message_text,
                    type: message_type,
                    timestamp: timestamp || new Date(),
                    platform: source_platform,
                    media_url: message.media_url || null
                })
            };
            if (platform_metadata) {
                updatePayload[`platform_metadata.${source_platform}`] = sanitizeForFirestore(platform_metadata);
            }
            transaction.update(cardRef, updatePayload);
        }
        else {
            isNew = true;
            cardRef = groupsRef.doc(inboxGroupId).collection('cards').doc();
            const data = createNewCardData(message, inboxGroupId);
            transaction.set(cardRef, data);
        }
        return { success: true, cardId: cardRef.id, isNew };
    });
}
function createNewCardData(message, groupId) {
    const { source_platform, external_id, contact_name, message_text, message_type, timestamp, platform_metadata } = message;
    return {
        contactName: contact_name || 'Nuevo Contacto',
        contactNumber: source_platform === 'whatsapp' ? external_id : null,
        contactNumberClean: source_platform === 'whatsapp' ? external_id.replace(/\+/g, '') : null,
        platform_ids: { [source_platform]: external_id },
        platform_metadata: platform_metadata ? { [source_platform]: sanitizeForFirestore(platform_metadata) } : {},
        lastMessage: message_text || `[${message_type.toUpperCase()}]`,
        source: source_platform,
        primary_channel: source_platform,
        groupId: groupId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        unreadCount: 1,
        messages: [{
                sender: 'user',
                text: message_text,
                type: message_type,
                timestamp: timestamp || new Date(),
                platform: source_platform,
                media_url: message.media_url || null
            }]
    };
}
// --- Helper: UPDATE READ STATUS ---
async function updateReadStatus(recipientId, platform = 'whatsapp') {
    const db = admin.firestore();
    try {
        const snap = await db.collectionGroup('cards').where(`platform_ids.${platform}`, '==', recipientId).limit(1).get();
        if (!snap.empty) {
            await snap.docs[0].ref.update({ lastReadAt: admin.firestore.FieldValue.serverTimestamp() });
        }
    }
    catch (e) { }
}
//# sourceMappingURL=kanbanOmni.js.map