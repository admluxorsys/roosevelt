"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleKanbanUpdateOmni = handleKanbanUpdateOmni;
exports.updateReadStatus = updateReadStatus;
const admin = require("firebase-admin");
/**
 * OMNICHANNEL KANBAN MANAGER
 *
 * Handles Creation & Updates of Kanban Cards for ALL platforms.
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
    // --- 1. RESOLVE GROUPS PATH (MANDATORY FOR ISOLATION - RULE 4) ---
    const groupsPath = `users/${userId}/entities/${entityId}/kanban-groups`;
    const groupsRef = db.collection(groupsPath);
    const allGroupsSnap = await groupsRef.get();
    let snapshot = null;
    let cardRef = null;
    // --- 2. SEARCH FOR EXISTING CARD (Priority: LOCAL VAULT) ---
    if (!allGroupsSnap.empty) {
        for (const gDoc of allGroupsSnap.docs) {
            const cards = await gDoc.ref.collection('cards')
                .where(`platform_ids.${source_platform}`, '==', external_id)
                .limit(1)
                .get();
            if (!cards.empty) {
                snapshot = cards;
                cardRef = cards.docs[0].ref;
                break;
            }
        }
    }
    // --- 3. GLOBAL FALLBACK (Only if local search failed) ---
    if (!cardRef) {
        try {
            const s = await db.collectionGroup('cards')
                .where(`platform_ids.${source_platform}`, '==', external_id)
                .limit(1)
                .get();
            if (!s.empty) {
                // VERIFY: Does it belong to CURRENT tenant? (Rule 4 Security)
                if (s.docs[0].ref.path.includes(`users/${userId}/entities/${entityId}`)) {
                    snapshot = s;
                    cardRef = s.docs[0].ref;
                }
            }
        }
        catch (e) { }
    }
    // Final strategy: simple contactNumber check
    if (!snapshot) {
        try {
            const s = await db.collectionGroup('cards')
                .where('contactNumber', '==', external_id)
                .limit(1).get();
            if (!s.empty && s.docs[0].ref.path.includes(`users/${userId}/entities/${entityId}`)) {
                snapshot = s;
                cardRef = s.docs[0].ref;
            }
        }
        catch (e) { }
    }
    // --- 4. RESOLVE GROUPS AND CARD PLACEMENT ---
    let isNew = false;
    let inboxGroupId;
    if (allGroupsSnap.empty) {
        // DEFAULT UNIFIED GROUP NAME: Inbox (Must match UI)
        const newGroup = await groupsRef.add({
            name: 'Inbox',
            color: '#3B82F6',
            order: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const snap = await newGroup.get();
        inboxGroupId = snap.id;
    }
    else {
        const inboxGroupDoc = allGroupsSnap.docs.find(g => (g.data().name || '').toLowerCase().includes('inbox')) || allGroupsSnap.docs[0];
        inboxGroupId = inboxGroupDoc.id;
    }
    // --- 5. UPDATE OR CREATE CARD ---
    if (cardRef) {
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
        await cardRef.update(updatePayload);
    }
    else {
        isNew = true;
        const newCardRef = groupsRef.doc(inboxGroupId).collection('cards').doc();
        const data = createNewCardData(message, inboxGroupId);
        await newCardRef.set(data);
        cardRef = newCardRef;
    }
    // --- 6. SYNC WITH CRM CONTACTS ---
    try {
        const contactId = cardRef.id;
        const contactRef = db.doc(`users/${userId}/entities/${entityId}/contacts/${contactId}`);
        const contactData = {
            id: contactId,
            name: message.contact_name || 'Nuevo Contacto',
            phone: message.source_platform === 'whatsapp' ? (message.external_id.startsWith('+') ? message.external_id : `+${message.external_id}`) : null,
            source: message.source_platform,
            kanbanGroupId: inboxGroupId,
            kanbanCardId: contactId,
            lastMessage: message_text,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (isNew) {
            contactData.createdAt = admin.firestore.FieldValue.serverTimestamp();
            await contactRef.set(contactData, { merge: true });
        }
        else {
            await contactRef.update({
                lastMessage: contactData.lastMessage,
                updatedAt: contactData.updatedAt
            });
        }
    }
    catch (contactErr) {
        console.warn(`[Omni] ⚠️ CRM Sync failed: ${contactErr.message}`);
    }
    return { success: true, cardId: cardRef.id, isNew };
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