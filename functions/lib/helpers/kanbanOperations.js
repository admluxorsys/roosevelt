"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveCard = void 0;
exports.handleKanbanUpdateOmni = handleKanbanUpdateOmni;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
/**
 * ROOSEVELT KANBAN MASTER OPERATIONS (FINAL SYNC)
 */
async function handleKanbanUpdateOmni(message, userId, entityId) {
    const db = admin.firestore();
    const { source_platform, external_id, message_text, message_type } = message;
    if (!userId || !entityId)
        throw new Error('[Omni] Critical: Missing userId/entityId.');
    const vaultPath = `users/${userId}/entities/${entityId}/kanban-groups`;
    const groupsRef = db.collection(vaultPath);
    const allGroupsSnap = await groupsRef.get();
    let cardRef = null;
    let inboxGroupId = null;
    // 1. RESOLVE THE REAL GROUP FROM YOUR UI (Search by name or priority)
    // We search for 'Inbox' or 'Bandeja de Entrada' - keeping consistent with Rule 1.
    const inboxGroupDoc = allGroupsSnap.docs.find(g => (g.data().name || '').toLowerCase().includes('inbox') ||
        (g.data().name || '').toLowerCase().includes('bandeja'));
    if (inboxGroupDoc) {
        inboxGroupId = inboxGroupDoc.id;
    }
    else {
        // Only if NOTHING exists, create it.
        const newGroup = await groupsRef.add({
            name: 'Inbox',
            color: '#3B82F6',
            order: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        inboxGroupId = newGroup.id;
    }
    // 2. SEARCH FOR EXISTING CARD
    const cardSearchSnap = await db.collectionGroup('cards')
        .where(`platform_ids.${source_platform}`, '==', external_id)
        .get();
    const existingCard = cardSearchSnap.docs.find(d => d.ref.path.includes(vaultPath));
    if (existingCard) {
        cardRef = existingCard.ref;
        await cardRef.update({
            lastMessage: message_text || `[${message_type.toUpperCase()}]`,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            unreadCount: admin.firestore.FieldValue.increment(1),
            messages: admin.firestore.FieldValue.arrayUnion({
                sender: 'user',
                text: message_text,
                type: message_type,
                timestamp: message.timestamp || new Date(),
                platform: source_platform
            })
        });
    }
    else {
        // 3. CREATE NEW CARD IN THE REAL GROUP
        cardRef = groupsRef.doc(inboxGroupId).collection('cards').doc();
        await cardRef.set({
            contactName: message.contact_name || 'Nuevo Contacto',
            contactNumber: source_platform === 'whatsapp' ? external_id : null,
            platform_ids: { [source_platform]: external_id },
            lastMessage: message_text || `[${message_type.toUpperCase()}]`,
            source: source_platform,
            groupId: inboxGroupId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            unreadCount: 1,
            messages: [{
                    sender: 'user',
                    text: message_text,
                    type: message_type,
                    timestamp: message.timestamp || new Date(),
                    platform: source_platform
                }]
        }, { merge: true });
        // CRM Sync (Set for New)
        const contactRef = db.doc(`users/${userId}/entities/${entityId}/contacts/${cardRef.id}`);
        await contactRef.set({
            id: cardRef.id,
            name: message.contact_name || 'Nuevo Contacto',
            phone: message.source_platform === 'whatsapp' ? (message.external_id.startsWith('+') ? message.external_id : `+${message.external_id}`) : null,
            source: message.source_platform,
            kanbanGroupId: inboxGroupId,
            kanbanCardId: cardRef.id,
            lastMessage: message_text,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    return { success: true, cardId: cardRef.id };
}
exports.moveCard = functions.https.onCall(async (data, context) => {
    var _a;
    if (!admin.apps.length)
        admin.initializeApp();
    const db = admin.firestore();
    const uid = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid)
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const { cardId, sourceGroupId, destGroupId, entityId } = data;
    const vaultPath = `users/${uid}/entities/${entityId}/kanban-groups`;
    const cardRef = db.collection(vaultPath).doc(sourceGroupId).collection('cards').doc(cardId);
    const newCardRef = db.collection(vaultPath).doc(destGroupId).collection('cards').doc(cardId);
    await db.runTransaction(async (t) => {
        const snap = await t.get(cardRef);
        if (!snap.exists)
            return;
        t.set(newCardRef, Object.assign(Object.assign({}, snap.data()), { groupId: destGroupId, updatedAt: admin.firestore.FieldValue.serverTimestamp() }), { merge: true });
        t.delete(cardRef);
    });
    return { success: true };
});
//# sourceMappingURL=kanbanOperations.js.map