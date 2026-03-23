import { useState, useRef, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, Timestamp, addDoc, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { toast } from 'sonner';
import { CardData, CheckIn, Note, PaymentMethod } from '../types';
import { normalizePhoneNumber } from '@/lib/phoneUtils';
import { useAuth } from '@/contexts/AuthContext';

interface UseCardOperationsProps {
    currentCardId: string | null;
    currentGroupId: string | null;
    liveCardData: CardData | null;
    card: any;
    contactInfo: Partial<CardData>;
    setContactInfo: React.Dispatch<React.SetStateAction<Partial<CardData>>>;
    // Setters from parent if needed to update state locally after save (optional if using live listeners)
    setLiveCardData: React.Dispatch<React.SetStateAction<CardData | null>>;
    isEditing: boolean;
    setIsEditing: (v: boolean) => void;
}

export const useCardOperations = ({
    currentCardId,
    currentGroupId,
    liveCardData,
    card,
    contactInfo,
    setContactInfo,
    setLiveCardData,
    isEditing,
    setIsEditing
}: UseCardOperationsProps) => {
    const { currentUser, activeEntity } = useAuth();

    // Local State for operations
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [isAddingCheckIn, setIsAddingCheckIn] = useState(false);
    const [newCheckIn, setNewCheckIn] = useState('');
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editingCheckInId, setEditingCheckInId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const [newPayment, setNewPayment] = useState({ type: 'visa' as const, last4: '', expiry: '', brand: '' });
    const [newHistoryComment, setNewHistoryComment] = useState('');

    // Keep latest contactInfo in a ref for async/timeout access
    const latestContactInfo = useRef(contactInfo);
    useEffect(() => {
        latestContactInfo.current = contactInfo;
    }, [contactInfo]);

    const getTenantPath = () => {
        if (!currentUser?.uid || !activeEntity) return null;
        return `users/${currentUser.uid}/entities/${activeEntity}`;
    };

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setContactInfo((prev) => ({ ...prev, [name]: value }));
    };

    const handleInfoSave = async () => {
        const tenantPath = getTenantPath();
        if (!tenantPath) return null;

        const rawPhone = liveCardData?.contactNumber || card?.contactNumber;
        const originalPhone = normalizePhoneNumber(rawPhone || '');
        if (!originalPhone) return null;

        try {
            const dataToSave = latestContactInfo.current;
            // 1. Update Kanban Card
            if (currentCardId && currentGroupId && !currentCardId.startsWith('temp-')) {
                await updateDoc(doc(db, `${tenantPath}/kanban-groups`, currentGroupId, 'cards', currentCardId), dataToSave);
            }

            // 2. Update CRM Contacts
            const cleanDigits = originalPhone.replace(/\D/g, '');
            const contactsQuery = query(collection(db, `${tenantPath}/contacts`), where('phone', 'in', [`+${cleanDigits}`, cleanDigits]));
            const contactsSnapshot = await getDocs(contactsQuery);
            let contactId = dataToSave.id;

            if (!contactsSnapshot.empty) {
                contactId = contactsSnapshot.docs[0].id;
                for (const cDoc of contactsSnapshot.docs) {
                    await updateDoc(cDoc.ref, {
                        ...dataToSave,
                        phone: dataToSave.contactNumber ? normalizePhoneNumber(dataToSave.contactNumber) : cDoc.data().phone,
                        lastUpdated: serverTimestamp()
                    });
                }
            } else {
                const newContact = {
                    ...dataToSave,
                    phone: normalizePhoneNumber(originalPhone),
                    createdAt: serverTimestamp(),
                    lastUpdated: serverTimestamp(),
                    source: 'chat_restored'
                };
                const docRef = await addDoc(collection(db, `${tenantPath}/contacts`), newContact);
                contactId = docRef.id;
            }

            // 3. Log History
            if (currentCardId && currentGroupId && !currentCardId.startsWith('temp-')) {
                // (Simplified history logging for brevity, can be fully expanded if needed)
                const historyEvent = {
                    id: `hist_${Date.now()}`,
                    type: 'edit',
                    content: 'Datos de contacto actualizados',
                    timestamp: Timestamp.now(),
                    author: 'Agente'
                };
                await updateDoc(doc(db, `${tenantPath}/kanban-groups`, currentGroupId, 'cards', currentCardId), {
                    history: arrayUnion(historyEvent)
                });
            }

            toast.success('Información actualizada.');
            setIsEditing(false);
            return contactId;
        } catch (error) {
            console.error(error);
            toast.error('No se pudo actualizar.');
            return null;
        }
    };

    const handleSaveNote = async () => {
        const tenantPath = getTenantPath();
        if (!tenantPath) return;

        if (!newNote.trim() || !currentCardId || !currentGroupId || currentCardId.startsWith('temp-')) {
            toast.error("Necesitas enviar un mensaje primero.");
            return;
        }
        const noteObject: Note = {
            id: `note_${Date.now()}`,
            text: newNote,
            author: 'Agente',
            timestamp: Timestamp.now()
        };
        toast.promise(
            updateDoc(doc(db, `${tenantPath}/kanban-groups`, currentGroupId, 'cards', currentCardId), {
                notes: arrayUnion(noteObject),
                history: arrayUnion({
                    id: `hist_${Date.now()}`, type: 'comment', content: `Nota: ${newNote}`, timestamp: Timestamp.now(), author: 'Agente'
                })
            }),
            {
                loading: 'Guardando nota...',
                success: () => { setNewNote(''); setIsAddingNote(false); return 'Nota guardada.'; },
                error: 'Error al guardar.'
            }
        );
    };

    const handleSaveCheckIn = async (customText?: string) => {
        const tenantPath = getTenantPath();
        if (!tenantPath) return;

        const textToSave = customText || newCheckIn;
        if (!textToSave.trim() || !currentCardId || !currentGroupId || currentCardId.startsWith('temp-')) {
            toast.error("Necesitas enviar un mensaje primero.");
            return;
        }
        const checkInObject = { id: `checkin_${Date.now()}`, text: textToSave, author: 'Agente', timestamp: Timestamp.now() };
        toast.promise(
            updateDoc(doc(db, `${tenantPath}/kanban-groups`, currentGroupId, 'cards', currentCardId), {
                checkIns: arrayUnion(checkInObject),
                history: arrayUnion({
                    id: `hist_${Date.now()}`, type: 'status', content: `Tarea: ${textToSave}`, timestamp: Timestamp.now(), author: 'Agente'
                })
            }),
            {
                loading: 'Guardando tarea...',
                success: () => { setNewCheckIn(''); setIsAddingCheckIn(false); return 'Tarea guardada'; },
                error: 'Error'
            }
        );
    };

    const toggleChecklistItem = async (item: string) => {
        const tenantPath = getTenantPath();
        if (!tenantPath) return;

        if (!currentCardId || !currentGroupId) return;
        const newStatus = !liveCardData?.checklistStatus?.[item];
        const updatedChecklistStatus = { ...(liveCardData?.checklistStatus || {}), [item]: newStatus };

        // Optimistic update optional here as live subscription will catch it
        try {
            await updateDoc(doc(db, `${tenantPath}/kanban-groups`, currentGroupId, 'cards', currentCardId), {
                checklistStatus: updatedChecklistStatus,
                history: arrayUnion({
                    id: `hist_${Date.now()}`, type: 'checklist', content: `${newStatus ? 'Completado' : 'Pendiente'}: ${item}`, timestamp: Timestamp.now(), author: 'Agente'
                })
            });
        } catch (e) { console.error(e); }
    };

    const handleToggleCheckIn = async (checkIn: CheckIn) => {
        const tenantPath = getTenantPath();
        if (!tenantPath) return;

        if (!currentCardId || !currentGroupId) return;
        const newStatus = !liveCardData?.checkIns?.find(c => c.id === checkIn.id)?.completed;
        const updatedCheckIns = liveCardData?.checkIns?.map(c => c.id === checkIn.id ? { ...c, completed: newStatus } : c) || [];
        await updateDoc(doc(db, `${tenantPath}/kanban-groups`, currentGroupId, 'cards', currentCardId), {
            checkIns: updatedCheckIns
        });
    };

    const handleSavePaymentMethod = async () => {
        const tenantPath = getTenantPath();
        if (!tenantPath) return;

        if (!currentCardId || !currentGroupId || !newPayment.last4 || currentCardId.startsWith('temp-')) return;
        const paymentMethodObject = {
            id: `pm_${Date.now()}`, ...newPayment, isDefault: (liveCardData?.paymentMethods?.length || 0) === 0
        };
        await updateDoc(doc(db, `${tenantPath}/kanban-groups`, currentGroupId, 'cards', currentCardId), {
            paymentMethods: arrayUnion(paymentMethodObject)
        });
        setIsAddingPayment(false);
        setNewPayment({ type: 'visa', last4: '', expiry: '', brand: '' });
    };

    const handleEditCheckIn = (checkIn: CheckIn) => {
        setEditingCheckInId(checkIn.id);
        setEditText(checkIn.text);
    };

    const handleSaveEditedCheckIn = async () => {
        const tenantPath = getTenantPath();
        if (!tenantPath) return;

        if (!currentCardId || !currentGroupId || !editingCheckInId) return;
        const updatedCheckIns = liveCardData?.checkIns?.map(c =>
            c.id === editingCheckInId ? { ...c, text: editText } : c
        ) || [];
        await updateDoc(doc(db, `${tenantPath}/kanban-groups`, currentGroupId, 'cards', currentCardId), {
            checkIns: updatedCheckIns,
            history: arrayUnion({
                id: `hist_${Date.now()}`, type: 'status', content: `Check-in editado: ${editText}`, timestamp: Timestamp.now(), author: 'Agente'
            })
        });
        setEditingCheckInId(null);
        setEditText('');
    };

    const handleEditNote = (note: Note) => {
        setEditingNoteId(note.id);
        setEditText(note.text);
    };

    const handleSaveEditedNote = async () => {
        const tenantPath = getTenantPath();
        if (!tenantPath) return;

        if (!currentCardId || !currentGroupId || !editingNoteId) return;
        const updatedNotes = liveCardData?.notes?.map(n =>
            n.id === editingNoteId ? { ...n, text: editText } : n
        ) || [];
        await updateDoc(doc(db, `${tenantPath}/kanban-groups`, currentGroupId, 'cards', currentCardId), {
            notes: updatedNotes,
            history: arrayUnion({
                id: `hist_${Date.now()}`, type: 'comment', content: `Nota editada: ${editText}`, timestamp: Timestamp.now(), author: 'Agente'
            })
        });
        setEditingNoteId(null);
        setEditText('');
    };

    const handleDeleteNote = async (noteId: string) => {
        const tenantPath = getTenantPath();
        if (!tenantPath) return;

        if (!currentCardId || !currentGroupId) return;
        await updateDoc(doc(db, `${tenantPath}/kanban-groups`, currentGroupId, 'cards', currentCardId), {
            notes: liveCardData?.notes?.filter(n => n.id !== noteId)
        });
    };

    const handleDeleteCheckIn = async (checkInId: string) => {
        const tenantPath = getTenantPath();
        if (!tenantPath) return;

        if (!currentCardId || !currentGroupId) return;
        await updateDoc(doc(db, `${tenantPath}/kanban-groups`, currentGroupId, 'cards', currentCardId), {
            checkIns: liveCardData?.checkIns?.filter(n => n.id !== checkInId)
        });
    };

    const handleSaveHistoryComment = async () => {
        const tenantPath = getTenantPath();
        if (!tenantPath) return;

        if (!currentCardId || !currentGroupId) return;
        await updateDoc(doc(db, `${tenantPath}/kanban-groups`, currentGroupId, 'cards', currentCardId), {
            history: arrayUnion({
                id: `hist_${Date.now()}`, type: 'comment', content: newHistoryComment, timestamp: Timestamp.now(), author: 'Agente'
            })
        });
        setNewHistoryComment('');
    };

    const handleSaveMute = async (duration: string | null) => {
        const tenantPath = getTenantPath();
        if (!tenantPath) return;

        if (!currentCardId || !currentGroupId) return;
        let mutedUntil: Timestamp | null = null;
        if (duration) {
            const now = new Date();
            if (duration === '8h') now.setHours(now.getHours() + 8);
            if (duration === '1w') now.setDate(now.getDate() + 7);
            if (duration === 'always') now.setFullYear(now.getFullYear() + 100);
            mutedUntil = Timestamp.fromDate(now);
        }
        await updateDoc(doc(db, `${tenantPath}/kanban-groups`, currentGroupId, 'cards', currentCardId), { mutedUntil });
        toast.success(duration ? 'Silenciado' : 'Reactivado');
    };

    const handleUpdateAssignee = async (agentName: string) => {
        const tenantPath = getTenantPath();
        if (!tenantPath) return;

        if (!currentCardId || !currentGroupId || currentCardId.startsWith('temp-')) return;
        
        try {
            await updateDoc(doc(db, `${tenantPath}/kanban-groups`, currentGroupId, 'cards', currentCardId), {
                assignedTo: agentName,
                history: arrayUnion({
                    id: `hist_${Date.now()}`,
                    type: 'edit',
                    content: `Asignado a: ${agentName}`,
                    timestamp: Timestamp.now(),
                    author: 'Sistemas'
                })
            });
            toast.success(`Asignado a ${agentName}`);
        } catch (error) {
            console.error(error);
            toast.error('Error al asignar agente');
        }
    };

    const handleAddLabel = async (label: string) => {
        const tenantPath = getTenantPath();
        if (!tenantPath) return;

        if (!currentCardId || !currentGroupId || currentCardId.startsWith('temp-')) return;
        try {
            await updateDoc(doc(db, `${tenantPath}/kanban-groups`, currentGroupId, 'cards', currentCardId), {
                labels: arrayUnion(label),
                history: arrayUnion({
                    id: `hist_${Date.now()}`,
                    type: 'edit',
                    content: `Etiqueta añadida: ${label}`,
                    timestamp: Timestamp.now(),
                    author: 'Agente'
                })
            });
            toast.success(`Etiqueta añadida: ${label}`);
        } catch (error) {
            console.error(error);
            toast.error('Error al añadir etiqueta');
        }
    };

    const handleRemoveLabel = async (label: string) => {
        const tenantPath = getTenantPath();
        if (!tenantPath) return;

        if (!currentCardId || !currentGroupId || currentCardId.startsWith('temp-')) return;
        try {
            await updateDoc(doc(db, `${tenantPath}/kanban-groups`, currentGroupId, 'cards', currentCardId), {
                labels: arrayRemove(label),
                history: arrayUnion({
                    id: `hist_${Date.now()}`,
                    type: 'edit',
                    content: `Etiqueta eliminada: ${label}`,
                    timestamp: Timestamp.now(),
                    author: 'Agente'
                })
            });
            toast.success(`Etiqueta eliminada: ${label}`);
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar etiqueta');
        }
    };

    const handleToggleBlock = async () => {
        const tenantPath = getTenantPath();
        if (!tenantPath) return;

        if (!currentCardId || !currentGroupId || currentCardId.startsWith('temp-')) return;
        const newStatus = !liveCardData?.isBlocked;
        try {
            await updateDoc(doc(db, `${tenantPath}/kanban-groups`, currentGroupId, 'cards', currentCardId), {
                isBlocked: newStatus,
                history: arrayUnion({
                    id: `hist_${Date.now()}`,
                    type: 'status',
                    content: newStatus ? 'Contacto bloqueado' : 'Contacto desbloqueado',
                    timestamp: Timestamp.now(),
                    author: 'Agente'
                })
            });
            toast.success(newStatus ? 'Contacto bloqueado' : 'Contacto desbloqueado');
        } catch (error) {
            console.error(error);
            toast.error('Error al cambiar estado de bloqueo');
        }
    };

    return {
        isAddingNote, setIsAddingNote, newNote, setNewNote,
        isAddingCheckIn, setIsAddingCheckIn, newCheckIn, setNewCheckIn,
        editingNoteId, setEditingNoteId, editingCheckInId, setEditingCheckInId,
        editText, setEditText,
        isAddingPayment, setIsAddingPayment, newPayment, setNewPayment,
        newHistoryComment, setNewHistoryComment,
        handleInfoChange, handleInfoSave, handleSaveNote, handleSaveCheckIn, toggleChecklistItem,
        handleToggleCheckIn, handleSavePaymentMethod, handleDeleteNote, handleDeleteCheckIn,
        handleSaveHistoryComment, handleSaveMute, handleUpdateAssignee,
        handleEditCheckIn, handleSaveEditedCheckIn, handleEditNote, handleSaveEditedNote,
        handleAddLabel, handleRemoveLabel, handleToggleBlock
    };
};
