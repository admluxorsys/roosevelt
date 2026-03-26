import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { UnifiedMessage } from '../types/message';

/**
 * OMNICHANNEL KANBAN MANAGER
 *
 * Handles Creation & Updates of Kanban Cards for ALL platforms.
 *
 * SEARCH STRATEGY (in order of priority):
 * 1. By platform_ids.{platform} (new unified approach)
 * 2. By contactNumber (legacy WhatsApp — ensures backward compat with existing cards)
 * 3. By contactNumberClean (normalized number fallback)
 *
 * Each query is wrapped in try/catch so that if a Firestore index is still
 * building (FAILED_PRECONDITION), the function degrades gracefully and still
 * creates the card instead of throwing a 500.
 */
/**
 * Removes undefined/null values from objects to prevent Firestore write failures.
 * Firestore throws if any field value is `undefined` (even nested).
 */
function sanitizeForFirestore(obj: any): any {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object' || obj instanceof Date) return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeForFirestore).filter(v => v !== undefined);
    return Object.fromEntries(
        Object.entries(obj)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, sanitizeForFirestore(v)])
    );
}

export async function handleKanbanUpdateOmni(message: UnifiedMessage, userId?: string, entityId?: string): Promise<any> {

    const db = admin.firestore();
    const {
        source_platform,
        external_id,
        contact_name,
        message_text,
        message_type,
        timestamp,
        platform_metadata
    } = message;

    // --- 1. SEARCH FOR EXISTING CARD (outside transaction, with index-safe fallbacks) ---
    let snapshot: admin.firestore.QuerySnapshot | null = null;

    // Strategy A: By platform_ids.{platform} (works for all platforms)
    try {
        const s = await db.collectionGroup('cards')
            .where(`platform_ids.${source_platform}`, '==', external_id)
            .limit(1)
            .get();
        if (!s.empty) snapshot = s;
    } catch (e: any) {
        functions.logger.warn(`[Omni] platform_ids index not ready for ${source_platform}, using fallback. (${e.code})`);
    }

    // Strategy B: Legacy contactNumber match (keeps backward compat with old WhatsApp cards)
    if (!snapshot) {
        try {
            const s = await db.collectionGroup('cards')
                .where('contactNumber', '==', external_id)
                .limit(1)
                .get();
            if (!s.empty) snapshot = s;
        } catch (e: any) {
            functions.logger.warn(`[Omni] contactNumber index not ready (${e.code})`);
        }
    }

    // Strategy C: contactNumberClean fallback
    if (!snapshot && (source_platform === 'whatsapp' || source_platform === 'sms')) {
        const cleanNumber = external_id.replace(/\+/g, '');
        try {
            const s = await db.collectionGroup('cards')
                .where('contactNumberClean', '==', cleanNumber)
                .limit(1)
                .get();
            if (!s.empty) snapshot = s;
        } catch (e: any) {
            functions.logger.warn(`[Omni] contactNumberClean index not ready (${e.code})`);
        }
    }

    // --- 2. Pre-query ALL groups OUTSIDE the transaction (no orderBy = no index needed) ---
    const groupsPath = (userId && entityId) 
        ? `users/${userId}/entities/${entityId}/kanban-groups` 
        : 'kanban-groups';

    const groupsRef = db.collection(groupsPath);
    const allGroupsSnap = await groupsRef.get();

    if (allGroupsSnap.empty) {
        functions.logger.error(`[Omni] CRITICAL: No kanban-groups found in path: ${groupsPath}`);
        // If it's a tenant vault and it's empty, we might need to create a default group or throw
        throw new Error('No Kanban groups found for this entity. Please create at least one group.');
    }

    // Find "Bandeja de Entrada" case-insensitively. Fall back to first group.
    const inboxGroupDoc = allGroupsSnap.docs.find(
        g => (g.data().name || '').toLowerCase().includes('bandeja')
    ) || allGroupsSnap.docs[0];

    const inboxGroupId = inboxGroupDoc.id;
    functions.logger.info(
        `[Omni] Inbox group resolved for ${groupsPath}: id=${inboxGroupId} name="${inboxGroupDoc.data().name}"`
    );

    // --- 3. EXECUTE TRANSACTION (Update or Create) ---
    return db.runTransaction(async (transaction) => {
        let cardRef: admin.firestore.DocumentReference;
        let isNew = false;

        if (snapshot && !snapshot.empty) {
            // -> UPDATE EXISTING CARD
            cardRef = snapshot.docs[0].ref;
            functions.logger.info(`[Omni] Updating existing card for ${source_platform}:${external_id}`);

            const updatePayload: any = {
                lastMessage: message_text,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                last_interaction_source: source_platform,
                last_interaction_type: message_type,
                // Self-healing: ensure platform_ids is populated on old cards
                [`platform_ids.${source_platform}`]: external_id,
                // Keep legacy fields up to date for backward compat
                contactNumber: (source_platform === 'whatsapp' || source_platform === 'sms') ? external_id : admin.firestore.FieldValue.delete(),
                contactNumberClean: (source_platform === 'whatsapp' || source_platform === 'sms') ? external_id.replace(/\+/g, '') : admin.firestore.FieldValue.delete(),
                unreadCount: admin.firestore.FieldValue.increment(1)
            };

            if (platform_metadata) {
                updatePayload[`platform_metadata.${source_platform}`] = sanitizeForFirestore(platform_metadata);
            }

            updatePayload.messages = admin.firestore.FieldValue.arrayUnion({
                sender: 'user',
                text: message_text,
                type: message_type,
                timestamp: timestamp || new Date(),
                platform: source_platform,
                media_url: message.media_url || null
            });

            updatePayload.unreadCount = admin.firestore.FieldValue.increment(1);

            transaction.update(cardRef, updatePayload);

        } else {
            // -> CREATE NEW CARD in Bandeja de Entrada
            isNew = true;
            cardRef = groupsRef.doc(inboxGroupId).collection('cards').doc();
            functions.logger.info(`[Omni] Creating NEW card for ${source_platform}:${external_id} in group ${inboxGroupId}`);

            const newCardData: any = {
                contactName: contact_name || 'Nuevo Contacto',
                // Legacy fields for WhatsApp backward compat
                contactNumber: (source_platform === 'whatsapp' || source_platform === 'sms') ? external_id : null,
                contactNumberClean: (source_platform === 'whatsapp' || source_platform === 'sms') ? external_id.replace(/\+/g, '') : null,

                // Unified platform identity map
                platform_ids: {
                    [source_platform]: external_id
                },
                platform_metadata: platform_metadata ? {
                    [source_platform]: sanitizeForFirestore(platform_metadata)
                } : {},

                // Standard Kanban Fields
                lastMessage: message_text,
                source: source_platform,
                channel: source_platform,          // UI icon
                primary_channel: source_platform,
                groupId: inboxGroupId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),

                // Messages Array
                messages: [{
                    sender: 'user',
                    text: message_text,
                    type: message_type,
                    timestamp: timestamp || new Date(),
                    platform: source_platform,
                    media_url: message.media_url || null
                }],
                unreadCount: 1,
            };

            transaction.set(cardRef, newCardData);
        }

        return { success: true, cardId: cardRef.id, isNew };
    });
}

// --- Helper: UPDATE READ STATUS ---
export async function updateReadStatus(recipientId: string, platform: string = 'whatsapp'): Promise<void> {
    const db = admin.firestore();

    // Try platform_ids first
    try {
        const snap = await db.collectionGroup('cards')
            .where(`platform_ids.${platform}`, '==', recipientId)
            .limit(1)
            .get();
        if (!snap.empty) {
            await snap.docs[0].ref.update({ lastReadAt: admin.firestore.FieldValue.serverTimestamp() });
            return;
        }
    } catch (e) { /* index may still be building */ }

    // Fallback: legacy contactNumber
    try {
        const snap = await db.collectionGroup('cards')
            .where('contactNumber', '==', recipientId)
            .limit(1)
            .get();
        if (!snap.empty) {
            await snap.docs[0].ref.update({ lastReadAt: admin.firestore.FieldValue.serverTimestamp() });
        }
    } catch (e) { /* ignore */ }
}
