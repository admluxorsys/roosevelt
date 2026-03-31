import { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, getDoc, query, collection, where, getDocs, orderBy } from 'firebase/firestore';
import { CardData, ConversationModalProps } from '../types';
import { normalizePhoneNumber } from '@/lib/phoneUtils';
import { useAuth } from '@/contexts/AuthContext';

export const useCardSubscription = ({ card, groups = [], groupName }: ConversationModalProps) => {
    const { currentUser, activeEntity } = useAuth();
    const [liveCardData, setLiveCardData] = useState<CardData | null>(null);
    const [contactInfo, setContactInfo] = useState<Partial<CardData>>({});
    const [crmData, setCrmData] = useState<Partial<CardData> | null>(null);
    const [forcedCardId, setForcedCardId] = useState<string | null>(null);
    const [forcedGroupId, setForcedGroupId] = useState<string | null>(null);

    const getTenantPath = () => {
        if (!currentUser?.uid || !activeEntity) return null;
        return `users/${currentUser.uid}/entities/${activeEntity}`;
    };

    // Reset state and forced IDs when props change to prevent data leak
    useEffect(() => {
        setForcedCardId(null);
        setForcedGroupId(null);
        setLiveCardData(null);
        setContactInfo({});
        setCrmData(null);
    }, [card?.id]);

    const currentGroupId = useMemo(() => {
        return forcedGroupId || liveCardData?.groupId || card?.groupId;
    }, [forcedGroupId, liveCardData?.groupId, card?.groupId]);

    const currentCardId = useMemo(() => {
        return forcedCardId || liveCardData?.id || card?.id;
    }, [forcedCardId, liveCardData?.id, card?.id]);

    const currentGroupName = useMemo(() => {
        if (!currentGroupId || !groups.length) return groupName || 'default';
        const currentGroup = groups.find(g => g.id === currentGroupId);
        return currentGroup?.name || groupName || 'default';
    }, [currentGroupId, groups, groupName]);

    useEffect(() => {
        const tenantPath = getTenantPath();
        if (!card && !forcedCardId) {
            setLiveCardData(null);
            return;
        }

        let isMounted = true;
        let unsubscribe: any = null;
        let unsubscribeCRM: any = null;

        const performDynamicSearch = async (cardIdToFind: string) => {
            if (!isMounted || !tenantPath) return;
            console.log(`[useCardSubscription] 🔍 Performing dynamic search for card ID: ${cardIdToFind}`);

            try {
                let finalGroups = groups;
                if (!finalGroups || finalGroups.length === 0) {
                    const groupsSnap = await getDocs(query(collection(db, `${tenantPath}/kanban-groups`), orderBy('order', 'asc')));
                    if (!isMounted) return;
                    finalGroups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                }

                console.log(`[useCardSubscription] 🔍 Searching card ${cardIdToFind} across ${finalGroups.length} groups...`);
                for (const group of finalGroups) {
                    if (!isMounted) break;
                    console.log(`[useCardSubscription] 📂 Checking group: ${group.id} (${group.name || 'Sin nombre'})`);
                    const cardRef = doc(db, `${tenantPath}/kanban-groups/${group.id}/cards/${cardIdToFind}`);
                    const cardSnap = await getDoc(cardRef);

                    if (cardSnap.exists() && isMounted) {
                        console.log(`[useCardSubscription] 🎯 Found card ${cardIdToFind} in group ${group.id}. Establishing subscription.`);

                        const unsub = onSnapshot(cardRef, (docSnap) => {
                            if (!isMounted) return;
                            if (docSnap.exists()) {
                                const data = docSnap.data() as CardData;
                                console.log(`[useCardSubscription] ✅ (Fallback) Snapshot received for ${cardIdToFind}. Messages: ${data.messages?.length || 0}`);
                                setLiveCardData({ ...data, id: docSnap.id, groupId: group.id });
                            }
                        });
                        if (unsubscribe) unsubscribe();
                        unsubscribe = unsub;
                        return;
                    }
                }
                console.warn(`[useCardSubscription] ❌ Card ${cardIdToFind} not found in any group.`);
            } catch (err) {
                console.error("[useCardSubscription] Dynamic search failed:", err);
            }
        };

        const initLogic = async () => {
            try {
                if (!isMounted || !tenantPath) return;

                // 1. Resolve target IDs: Prioritize props (source of truth from the list)
                const targetCardId = card?.id || forcedCardId;
                const targetGroupId = card?.groupId || forcedGroupId;

                if (!targetCardId || targetCardId.startsWith('temp-')) {
                    setLiveCardData(null);
                    return;
                }

                // 2. Direct Subscription (Agnostic & Efficient)
                if (targetGroupId) {
                    const fullPath = `${tenantPath}/kanban-groups/${targetGroupId}/cards/${targetCardId}`;
                    console.log(`[useCardSubscription] 📡 Subscribing to direct path: ${fullPath}`);
                    const cardRef = doc(db, fullPath);

                    const unsub = onSnapshot(cardRef, (docSnap) => {
                        if (!isMounted) return;
                        if (docSnap.exists()) {
                            const data = docSnap.data() as CardData;
                            console.log(`[useCardSubscription] ✅ Snapshot received for ${targetCardId}. Messages: ${data.messages?.length || 0}`);
                            setLiveCardData({ ...data, id: docSnap.id, groupId: targetGroupId });
                        } else {
                            console.warn(`[useCardSubscription] ⚠️ Document not found at path: ${cardRef.path}. Card may have moved or been deleted.`);
                            // Trigger dynamic search as a fallback
                            performDynamicSearch(targetCardId);
                        }
                    }, (error) => {
                        console.error(`[useCardSubscription] ❌ Snapshot error for ${targetCardId}:`, error);
                    });

                    unsubscribe = unsub;
                } else {
                    // If no groupId provided in props/state, we MUST search
                    performDynamicSearch(targetCardId);
                }

            } catch (error) {
                if (isMounted) console.error("[useCardSubscription] Error in initLogic:", error);
            }
        };


        const initCRM = async () => {
            if (!tenantPath) return;
            const phone = card?.contactNumber || (card as any)?.phone;
            let targetId = (card?.id && !card.id.startsWith('temp-') && (card as any).contactId) || null;
            if (card?.id && !card.id.startsWith('temp-') && (card as any).contactId) targetId = (card as any).contactId;

            if (!targetId && phone) {
                const digits = phone.replace(/\D/g, '');
                const crmQuery = query(collection(db, `${tenantPath}/contacts`), where('phone', 'in', [`+${digits}`, digits]));
                const snap = await getDocs(crmQuery);
                if (!snap.empty) targetId = snap.docs[0].id;
            }

            if (targetId && isMounted) {
                const unsub = onSnapshot(doc(db, `${tenantPath}/contacts`, targetId), (snap) => {
                    if (!isMounted) return;
                    if (snap.exists()) {
                        const data = snap.data();
                        setCrmData(data);
                        setContactInfo(prev => ({
                            ...prev,
                            ...data,
                            id: snap.id,
                            contactName: data.name || prev.contactName,
                            contactNumber: data.phone || prev.contactNumber
                        }));
                    }
                });
                unsubscribeCRM = unsub;
            }
        };

        initLogic();
        initCRM();

        return () => {
            isMounted = false;
            if (unsubscribe) unsubscribe();
            if (unsubscribeCRM) unsubscribeCRM();
        };
    }, [card?.id, card?.groupId, groups, card?.contactNumber, currentUser?.uid, activeEntity]);

    return {
        liveCardData,
        setLiveCardData,
        contactInfo,
        setContactInfo,
        crmData,
        currentCardId,
        currentGroupId,
        currentGroupName,
        setForcedCardId,
        setForcedGroupId,
        setCrmData
    };
};
