import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';

export const useKanbanBoard = (filterTerm: string = '') => {
    const [groups, setGroups] = useState<any[]>([]);
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Load Groups
    useEffect(() => {
        const q = query(collection(db, 'kanban-groups'), orderBy('order', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const groupsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setGroups(groupsData);
        });
        return () => unsubscribe();
    }, []);

    // Load Cards
    useEffect(() => {
        if (groups.length === 0) return;
        const unsubscribes: (() => void)[] = [];

        groups.forEach(group => {
            const q = query(collection(db, 'kanban-groups', group.id, 'cards'));
            const unsub = onSnapshot(q, (snapshot) => {
                const groupCards = snapshot.docs.map(doc => ({
                    id: doc.id,
                    groupId: group.id,
                    ...doc.data()
                }));

                setCards(prev => {
                    // Robust update: remove old cards for this group, add new ones
                    const otherCards = prev.filter(c => c.groupId !== group.id);
                    return [...otherCards, ...groupCards];
                });
            });
            unsubscribes.push(unsub);
        });

        setLoading(false);
        return () => unsubscribes.forEach(u => u());
    }, [groups.length]);

    const moveCardCallable = httpsCallable(functions, 'moveCard');

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const movedCard = cards.find(c => c.id === activeId);
        if (!movedCard) return;

        const sourceGroupId = movedCard.groupId;

        // Determine dest group
        let destGroupId = overId;
        const isOverGroup = groups.some(g => g.id === overId);
        if (!isOverGroup) {
            // Dropped on a card?
            const overCard = cards.find(c => c.id === overId);
            if (overCard) destGroupId = overCard.groupId;
            else return;
        }

        if (sourceGroupId === destGroupId) return; // Reorder logic TODO

        // Optimistic Update
        setCards(prev => prev.map(c =>
            c.id === activeId ? { ...c, groupId: destGroupId } : c
        ));

        const destGroup = groups.find(g => g.id === destGroupId);

        try {
            await moveCardCallable({
                cardId: activeId,
                sourceGroupId,
                destGroupId
            });

            await updateDoc(doc(db, 'kanban-groups', destGroupId, 'cards', activeId), {
                history: arrayUnion({
                    id: `hist_${Date.now()}`,
                    type: 'status',
                    content: `Movido a ${destGroup?.name || 'Grupo'}`,
                    timestamp: Timestamp.now(),
                    author: 'Usuario'
                })
            });
            toast.success(`Movido a ${destGroup?.name}`);
        } catch (error) {
            console.error('Move failed', error);
            toast.error('Error al mover');
        }
    };

    const handleUpdateColor = async (groupId: string, color: string) => {
        try {
            await updateDoc(doc(db, 'kanban-groups', groupId), { color });
        } catch (error) {
            console.error('Error updating color:', error);
            toast.error('Error al cambiar el color.');
        }
    };

    return {
        groups,
        cards,
        loading,
        handleDragEnd,
        handleUpdateColor,
        setCards
    };
};
