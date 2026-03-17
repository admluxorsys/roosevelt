import { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, getDoc, query, collection, where, getDocs, orderBy } from 'firebase/firestore';
import { CardData, ConversationModalProps } from '../types';
import { normalizePhoneNumber } from '@/lib/phoneUtils';

export const useCardSubscription = ({ card, groups = [], groupName }: ConversationModalProps) => {
    const [liveCardData, setLiveCardData] = useState<CardData | null>(null);
    const [contactInfo, setContactInfo] = useState<Partial<CardData>>({});
    const [crmData, setCrmData] = useState<Partial<CardData> | null>(null);
    const [forcedCardId, setForcedCardId] = useState<string | null>(null);
    const [forcedGroupId, setForcedGroupId] = useState<string | null>(null);

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
        if (!card && !forcedCardId) {
            setLiveCardData(null);
            return;
        }

        let isMounted = true;
        let unsubscribe: (() => void) | null = null;
        let unsubscribeCRM: (() => void) | null = null;

        const initLogic = async () => {
            try {
                if (!isMounted) return;

                // Priority 1: Forced ID
                if (forcedCardId && forcedGroupId) {
                    const cardRef = doc(db, 'kanban-groups', forcedGroupId, 'cards', forcedCardId);
                    const unsub = onSnapshot(cardRef, (docSnap) => {
                        if (!isMounted) return;
                        if (docSnap.exists()) {
                            const data = docSnap.data() as CardData;
                            setLiveCardData({ ...data, id: docSnap.id, groupId: forcedGroupId });
                        }
                    });
                    unsubscribe = unsub;
                    return;
                }

                // Priority 2: Standard Search
                if (!card?.id) return;

                let finalGroups = groups;
                if (!finalGroups || finalGroups.length === 0) {
                    const groupsSnap = await getDocs(query(collection(db, 'kanban-groups'), orderBy('order', 'asc')));
                    if (!isMounted) return;
                    finalGroups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                }

                const findAndSubscribe = async (cardIdToFind?: string, phoneNumberToFind?: string): Promise<boolean> => {
                    for (const group of finalGroups) {
                        if (!isMounted) return false;
                        try {
                            let cardRef = cardIdToFind ? doc(db, 'kanban-groups', group.id, 'cards', cardIdToFind) : null;
                            let cardSnap = cardRef ? await getDoc(cardRef) : null;

                            if ((!cardSnap || !cardSnap.exists()) && phoneNumberToFind) {
                                const allCardsSnap = await getDocs(collection(db, 'kanban-groups', group.id, 'cards'));
                                if (!isMounted) return false;

                                const phoneVariants = [
                                    phoneNumberToFind,
                                    phoneNumberToFind.startsWith('+') ? phoneNumberToFind : `+${phoneNumberToFind}`,
                                    phoneNumberToFind.replace(/\D/g, ''),
                                ];
                                const digitsOnly = phoneNumberToFind.replace(/\D/g, '');
                                if (digitsOnly.length >= 9 && !digitsOnly.startsWith('593')) {
                                    phoneVariants.push(`+593${digitsOnly}`);
                                    phoneVariants.push(`593${digitsOnly}`);
                                }

                                for (const cardDoc of allCardsSnap.docs) {
                                    const cData = cardDoc.data();
                                    const cPhone = cData.contactNumber || '';
                                    if (phoneVariants.some(v => v.replace(/\D/g, '') === cPhone.replace(/\D/g, ''))) {
                                        cardSnap = cardDoc;
                                        cardRef = cardDoc.ref;
                                        break;
                                    }
                                }
                            }

                            if (cardSnap && cardSnap.exists() && cardRef) {
                                const unsub = onSnapshot(cardRef, (docSnap) => {
                                    if (!isMounted) return;
                                    if (docSnap.exists()) {
                                        const data = docSnap.data() as CardData;
                                        setLiveCardData({ ...data, id: docSnap.id, groupId: group.id });
                                        setForcedCardId(docSnap.id);
                                        setForcedGroupId(group.id);
                                    }
                                });
                                if (isMounted) {
                                    if (unsubscribe) unsubscribe();
                                    unsubscribe = unsub;
                                } else {
                                    unsub();
                                }
                                return true;
                            }
                        } catch (e) {
                            if (isMounted) console.warn('Group search error:', e);
                        }
                    }
                    return false;
                };

                const isTempId = card.id?.startsWith('temp-');
                const phoneToSearch = card.contactNumber || (card as any).phone;
                let found = false;
                if (!isTempId) found = await findAndSubscribe(card.id, phoneToSearch);
                if (!found && phoneToSearch && isMounted) found = await findAndSubscribe(undefined, phoneToSearch);

                if (!found && isMounted && !isTempId) {
                    // Initial state logic for non-found cards if needed
                }

            } catch (error) {
                if (isMounted) console.error("Error in initLogic:", error);
            }
        };

        const initCRM = async () => {
            const phone = card?.contactNumber || (card as any)?.phone;
            let targetId = (card?.id && !card.id.startsWith('temp-') && (card as any).contactId) || null;
            if (card?.id && !card.id.startsWith('temp-') && (card as any).contactId) targetId = (card as any).contactId;

            if (!targetId && phone) {
                const digits = phone.replace(/\D/g, '');
                const crmQuery = query(collection(db, 'contacts'), where('phone', 'in', [`+${digits}`, digits]));
                const snap = await getDocs(crmQuery);
                if (!snap.empty) targetId = snap.docs[0].id;
            }

            if (targetId && isMounted) {
                const unsub = onSnapshot(doc(db, 'contacts', targetId), (snap) => {
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
    }, [card?.id, card?.groupId, groups, card?.contactNumber, forcedCardId, forcedGroupId]);

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
