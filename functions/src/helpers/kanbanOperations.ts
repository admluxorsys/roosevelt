import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { UnifiedMessage } from '../types/message';

/**
 * ROOSEVELT KANBAN MASTER OPERATIONS (FINAL SYNC)
 */

export async function handleKanbanUpdateOmni(message: UnifiedMessage, userId?: string, entityId?: string): Promise<any> {
    const db = admin.firestore();
    const { source_platform, external_id, message_text, message_type } = message;

    if (!userId || !entityId) throw new Error('[Omni] Critical: Missing userId/entityId.');

    const vaultPath = `users/${userId}/entities/${entityId}/kanban-groups`;
    const groupsRef = db.collection(vaultPath);
    const allGroupsSnap = await groupsRef.get();

    let cardRef: admin.firestore.DocumentReference | null = null;
    let inboxGroupId: string | null = null;

    // 1. RESOLVE THE REAL GROUP FROM YOUR UI (Search by name or priority)
    // We search for 'Inbox' or 'Bandeja de Entrada' - keeping consistent with Rule 1.
    const inboxGroupDoc = allGroupsSnap.docs.find(g => 
        (g.data().name || '').toLowerCase().includes('inbox') || 
        (g.data().name || '').toLowerCase().includes('bandeja')
    );

    if (inboxGroupDoc) {
        inboxGroupId = inboxGroupDoc.id;
    } else {
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
    } else {
        // 3. CREATE NEW CARD IN THE REAL GROUP
        cardRef = groupsRef.doc(inboxGroupId!).collection('cards').doc();
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

export const moveCard = functions.https.onCall(async (data, context) => {
    if (!admin.apps.length) admin.initializeApp();
    const db = admin.firestore();
    const uid = context.auth?.uid;
    if (!uid) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    const { cardId, sourceGroupId, destGroupId, entityId } = data;
    const vaultPath = `users/${uid}/entities/${entityId}/kanban-groups`;
    const cardRef = db.collection(vaultPath).doc(sourceGroupId).collection('cards').doc(cardId);
    const newCardRef = db.collection(vaultPath).doc(destGroupId).collection('cards').doc(cardId);
    await db.runTransaction(async (t) => {
        const snap = await t.get(cardRef);
        if(!snap.exists) return;
        t.set(newCardRef, { ...snap.data(), groupId: destGroupId, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        t.delete(cardRef);
    });
    return { success: true };
});
