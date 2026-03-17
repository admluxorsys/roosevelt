import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Merge, Trash2, AlertTriangle, CheckCircle2, RefreshCw, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { db } from '@/lib/firebase';
import { deleteDoc, doc, updateDoc, serverTimestamp, collection, collectionGroup, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DuplicateManagerProps {
    isOpen: boolean;
    onClose: () => void;
    contacts: any[];
    onContactsUpdated: (updatedContacts: any[]) => void;
}

export const DuplicateManager: React.FC<DuplicateManagerProps> = ({
    isOpen,
    onClose,
    contacts,
    onContactsUpdated
}) => {
    const [analyzing, setAnalyzing] = useState(false);
    const [duplicates, setDuplicates] = useState<any[]>([]); // Array of groups
    const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    // NEW: Manual merge mode
    const [mode, setMode] = useState<'auto' | 'manual'>('auto');
    const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);

    // Grouping Logic - Detect by ID duplicates AND phone duplicates
    const analyzeDuplicates = () => {
        setAnalyzing(true);
        setTimeout(() => {
            const groups: any[] = [];
            const processedIds = new Set();

            // First, group by Firestore ID (detect database duplicates)
            // Fix: Only group if it's the SAME document appearing multiple times in the array
            // (Internal memory duplication)
            const idGroups = new Map<string, any[]>();
            contacts.forEach(contact => {
                if (!contact.id) return;
                if (!idGroups.has(contact.id)) {
                    idGroups.set(contact.id, []);
                }
                idGroups.get(contact.id)!.push(contact);
            });

            // Add ID-based duplicates to groups
            idGroups.forEach((contactsWithSameId, id) => {
                if (contactsWithSameId.length > 1) {
                    // Logic fix: Don't show these as mergeable duplicates (they are the same doc)
                    // Instead, we just mark them as processed to avoid double dipping
                    contactsWithSameId.forEach(c => processedIds.add(c.id));
                }
            });

            // Then, group by phone number (for different contacts with same phone)
            contacts.forEach(contact => {
                if (processedIds.has(contact.id)) return;
                if (!contact.phone) return;

                // Smart Normalization: 
                // 1. Remove non-digits
                // 2. Handle double prefixes (e.g., 1593...)
                let normalizedPhone = contact.phone.replace(/\D/g, '');
                if (normalizedPhone.startsWith('1') && normalizedPhone.length > 11) {
                    normalizedPhone = normalizedPhone.substring(1); // Strip leading 1 if it looks like double prefix
                }

                const matches = contacts.filter(c => {
                    if (c.id === contact.id) return false;
                    if (processedIds.has(c.id)) return false;
                    if (!c.phone) return false;

                    let cNormalized = c.phone.replace(/\D/g, '');
                    if (cNormalized.startsWith('1') && cNormalized.length > 11) {
                        cNormalized = cNormalized.substring(1);
                    }

                    const isMatch = cNormalized === normalizedPhone;
                    return isMatch;
                });

                if (matches.length > 0) {
                    const group = [contact, ...matches];
                    groups.push(group);
                    group.forEach(g => processedIds.add(g.id));
                }
            });

            setDuplicates(groups);
            setAnalyzing(false);
        }, 500);
    };

    // Auto-analyze on open or when contacts change
    React.useEffect(() => {
        if (isOpen) analyzeDuplicates();
    }, [isOpen, contacts]);

    const handleMerge = async (group: any[], primaryContactId: string) => {
        if (!primaryContactId || processing) return;
        setProcessing(true);

        try {
            const primaryContact = group.find(c => c.id === primaryContactId);
            const others = group.filter(c => c.id !== primaryContactId);

            // Merge Data strategy:
            // 1. Tags: Union
            // 2. Empty fields in primary: Fill from others
            const mergedTags = new Set(primaryContact.tags || []);
            const updates: any = {};

            others.forEach(other => {
                (other.tags || []).forEach((t: string) => mergedTags.add(t));

                if (!primaryContact.email && other.email) updates.email = other.email;
                if (!primaryContact.company && other.company) updates.company = other.company;
                if (!primaryContact.address && other.address) updates.address = other.address;
                // Add more fields as needed
            });

            updates.tags = Array.from(mergedTags);
            updates.lastUpdated = serverTimestamp();

            // Execute Updates
            // 1. Update Primary (if it still exists)
            const primaryRef = doc(db, 'contacts', primaryContactId);
            const primarySnap = await getDocs(query(collection(db, 'contacts'), where('__name__', '==', primaryContactId)));

            if (primarySnap.empty) {
                toast.error("El contacto principal ya no existe.");
                analyzeDuplicates(); // Refresh
                setProcessing(false);
                return;
            }

            await updateDoc(primaryRef, updates);

            // 2. Delete Others (only if they exist)
            for (const other of others) {
                const otherRef = doc(db, 'contacts', other.id);
                // We try a silent delete to be fast, but verify first if possible
                await deleteDoc(otherRef).catch(err => console.error("Error deleting duplicate:", err));
            }

            // --- DEEP MERGE: kamban DATA (HYBRID: ID + PHONE) ---
            const allContactIds = group.map(c => c.id);
            const allPhones = group.map(c => c.phone ? c.phone.replace(/\D/g, '') : '').filter(Boolean);

            // Also get last 10 digits (to handle different country code formats)
            const allPhonesLast10 = allPhones.map(p => p.slice(-10)).filter(p => p.length === 10);

            const cardsToMerge: any[] = [];

            console.log('[DuplicateManager] Searching for kamban cards...');
            console.log('  Contact IDs:', allContactIds);
            console.log('  Phones (full):', allPhones);
            console.log('  Phones (last 10):', allPhonesLast10);

            if (allContactIds.length > 0 || allPhones.length > 0) {
                // 1. Fetch all groups first (infallible method, no index needed)
                const groupsSnapshot = await getDocs(collection(db, 'kamban-groups'));

                for (const groupDoc of groupsSnapshot.docs) {
                    const cardsSnapshot = await getDocs(collection(db, 'kamban-groups', groupDoc.id, 'cards'));
                    cardsSnapshot.forEach(docSnap => {
                        const cardData = docSnap.data() as any;

                        console.log(`  Checking card: ${cardData.contactName}, contactId=${cardData.contactId}, phone=${cardData.contactNumber}`);

                        // PRIORITY 1: Search by contactId (new system)
                        if (cardData.contactId && allContactIds.includes(cardData.contactId)) {
                            console.log(`    ✅ FOUND by contactId: ${cardData.contactId}`);
                            cardsToMerge.push({ id: docSnap.id, ref: docSnap.ref, ...cardData });
                            return; // Found by ID, no need to check phone
                        }

                        // FALLBACK: Search by phone (legacy system)
                        const cardPhone = (cardData.contactNumber || '').replace(/\D/g, '');
                        const cardPhoneLast10 = cardPhone.slice(-10);

                        // Match by full phone OR last 10 digits
                        const phoneMatch = allPhones.includes(cardPhone) ||
                            (cardPhoneLast10.length === 10 && allPhonesLast10.includes(cardPhoneLast10));

                        if (cardPhone && phoneMatch) {
                            console.log(`    ✅ FOUND by phone: ${cardPhone} (matched: ${allPhones.includes(cardPhone) ? 'full' : 'last 10'})`);
                            cardsToMerge.push({ id: docSnap.id, ref: docSnap.ref, ...cardData });
                        }
                    });
                }
            }

            console.log(`[DuplicateManager] Found ${cardsToMerge.length} cards to merge`);

            if (cardsToMerge.length > 0) {
                // Determine primary card (prefer one with more messages or first one)
                const sortedCards = [...cardsToMerge].sort((a, b) => (b.messages?.length || 0) - (a.messages?.length || 0));
                const primaryCard = sortedCards[0];
                const secondaryCards = sortedCards.slice(1);

                const mergedMessages = [...(primaryCard.messages || [])];
                const mergedNotes = [...(primaryCard.notes || [])];
                const mergedCheckIns = [...(primaryCard.checkIns || [])];
                const mergedPayments = [...(primaryCard.paymentMethods || [])];

                secondaryCards.forEach(card => {
                    if (card.messages) mergedMessages.push(...card.messages);
                    if (card.notes) mergedNotes.push(...card.notes);
                    if (card.checkIns) mergedCheckIns.push(...card.checkIns);
                    if (card.paymentMethods) mergedPayments.push(...card.paymentMethods);
                });

                // Helper to get consistent milliseconds from any timestamp format
                const getMs = (ts: any) => {
                    if (!ts) return 0;
                    if (typeof ts.toMillis === 'function') return ts.toMillis();
                    if (ts.seconds !== undefined) return ts.seconds * 1000;
                    if (ts instanceof Date) return ts.getTime();
                    if (typeof ts === 'string') return new Date(ts).getTime();
                    return 0;
                };

                // Dedup by content+time and Sort Messages
                const uniqueMessagesMap = new Map();
                mergedMessages.forEach(m => {
                    const key = `${m.sender}-${m.text}-${getMs(m.timestamp)}`;
                    uniqueMessagesMap.set(key, m);
                });

                const finalMessages = Array.from(uniqueMessagesMap.values())
                    .sort((a, b) => getMs(a.timestamp) - getMs(b.timestamp));

                // IMPORTANT: Update primary card with merged data AND link to primary contact
                await updateDoc(primaryCard.ref, {
                    contactId: primaryContactId, // ← CRITICAL: Link to primary contact
                    contactName: primaryContact.name, // SYNC NAME
                    email: primaryContact.email || primaryCard.email || '', // Sync email
                    messages: finalMessages,
                    notes: Array.from(new Map(mergedNotes.map(n => [n.id || JSON.stringify(n), n])).values()),
                    checkIns: Array.from(new Map(mergedCheckIns.map(c => [c.id || JSON.stringify(c), c])).values()),
                    paymentMethods: Array.from(new Map(mergedPayments.map(p => [p.id || JSON.stringify(p), p])).values()),
                    updatedAt: serverTimestamp()
                });

                // Delete secondary cards if any
                for (const sCard of secondaryCards) {
                    await deleteDoc(sCard.ref);
                }
            }

            toast.success(`Fusionado exitosamente. ${others.length} duplicados y su historial unificado.`);

            // Remove group from UI
            const newContacts = contacts.filter(c => !others.find(o => o.id === c.id));
            // Update the primary in list locally
            const updatedPrimary = { ...primaryContact, ...updates };
            const finalContacts = newContacts.map(c => c.id === primaryContactId ? updatedPrimary : c);

            onContactsUpdated(finalContacts);
            setDuplicates(prev => prev.filter((_, idx) => idx !== selectedGroupIndex));
            setSelectedGroupIndex(null);

        } catch (error) {
            console.error("Merge error:", error);
            toast.error("Error al fusionar contactos.");
        } finally {
            setProcessing(false);
        }
    };

    // Handler for manual merge
    const handleManualMerge = () => {
        if (selectedForMerge.length < 2) {
            toast.error('Selecciona al menos 2 contactos para fusionar');
            return;
        }
        const group = contacts.filter(c => selectedForMerge.includes(c.id));
        handleMerge(group, selectedForMerge[0]);
    };

    // Toggle contact selection
    const toggleContactSelection = (contactId: string) => {
        setSelectedForMerge(prev =>
            prev.includes(contactId)
                ? prev.filter(id => id !== contactId)
                : [...prev, contactId]
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-[#0b141a] border-neutral-800 text-white sm:max-w-5xl p-0 overflow-hidden outline-none max-h-[85vh]">
                <DialogHeader className="p-6 border-b border-white/5 bg-neutral-900/50">
                    <DialogTitle className="text-xl font-medium flex items-center gap-2">
                        <Merge className="text-blue-500" />
                        Gestor de Duplicados
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Detecta y fusiona contactos duplicados automáticamente o selecciona manualmente cuáles fusionar.
                    </DialogDescription>
                </DialogHeader>

                {/* Mode Tabs */}
                <div className="px-6 pt-4 flex gap-2 border-b border-white/5">
                    <Button
                        variant={mode === 'auto' ? 'default' : 'ghost'}
                        onClick={() => setMode('auto')}
                        className={cn(
                            "rounded-t-lg rounded-b-none",
                            mode === 'auto' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-white/5'
                        )}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Auto-Detectados ({duplicates.length})
                    </Button>
                    <Button
                        variant={mode === 'manual' ? 'default' : 'ghost'}
                        onClick={() => setMode('manual')}
                        className={cn(
                            "rounded-t-lg rounded-b-none",
                            mode === 'manual' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-white/5'
                        )}
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Fusión Manual
                    </Button>
                </div>

                <div className="p-6 h-[500px] overflow-y-auto custom-scrollbar">
                    {mode === 'auto' ? (
                        <div className="flex gap-6">
                            {/* Groups List */}
                            <div className="w-1/3 border-r border-white/5 pr-6 space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                        {duplicates.length} Grupos Encontrados
                                    </span>
                                    <Button variant="ghost" size="sm" onClick={analyzeDuplicates} disabled={analyzing}>
                                        <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>

                                {duplicates.length === 0 && !analyzing && (
                                    <div className="text-center py-10 text-neutral-500 text-sm">
                                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
                                        <p>Todo limpio. No se encontraron duplicados.</p>
                                    </div>
                                )}

                                {duplicates.map((group, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedGroupIndex(idx)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedGroupIndex === idx ? 'bg-blue-500/10 border-blue-500/50' : 'bg-neutral-900/50 border-white/5 hover:border-white/10'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="outline" className="bg-neutral-950 text-neutral-400 border-neutral-800">
                                                {group.length} Contactos
                                            </Badge>
                                        </div>
                                        <p className="font-medium text-sm truncate">{group[0].name}</p>
                                        <p className="text-xs text-neutral-500 truncate">{group[0].phone}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Merge Area */}
                            <div className="flex-1 pl-2">
                                {selectedGroupIndex !== null && duplicates[selectedGroupIndex] ? (
                                    <MergeView
                                        group={duplicates[selectedGroupIndex]}
                                        onMerge={(primaryId) => handleMerge(duplicates[selectedGroupIndex], primaryId)}
                                        processing={processing}
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-neutral-600 text-sm">
                                        Selecciona un grupo para revisar
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Manual Mode */
                        <div className="space-y-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-start gap-3">
                                <Users className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-blue-200/90 font-medium mb-1">Modo de Fusión Manual</p>
                                    <p className="text-xs text-blue-200/70 leading-relaxed">
                                        Selecciona 2 o más contactos para fusionarlos. Todos los chats, mensajes y datos se combinarán sin pérdida de información.
                                    </p>
                                </div>
                            </div>

                            {selectedForMerge.length > 0 && (
                                <div className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-lg border border-white/5">
                                    <span className="text-sm text-neutral-400">
                                        {selectedForMerge.length} contacto(s) seleccionado(s)
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedForMerge([])}
                                            className="text-xs"
                                        >
                                            Limpiar
                                        </Button>
                                        <Button
                                            onClick={handleManualMerge}
                                            disabled={selectedForMerge.length < 2 || processing}
                                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
                                        >
                                            {processing ? (
                                                <RefreshCw className="w-3 h-3 animate-spin mr-2" />
                                            ) : (
                                                <Merge className="w-3 h-3 mr-2" />
                                            )}
                                            Fusionar Seleccionados
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                                {contacts.map(contact => (
                                    <div
                                        key={contact.id}
                                        onClick={() => toggleContactSelection(contact.id)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                                            selectedForMerge.includes(contact.id)
                                                ? "bg-blue-500/10 border-blue-500/50"
                                                : "bg-neutral-900/30 border-white/5 hover:bg-neutral-900/50 hover:border-white/10"
                                        )}
                                    >
                                        <Checkbox
                                            checked={selectedForMerge.includes(contact.id)}
                                            onCheckedChange={() => toggleContactSelection(contact.id)}
                                            className="border-neutral-600"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-white truncate">{contact.name || 'Sin Nombre'}</p>
                                            <div className="flex items-center gap-3 text-xs text-neutral-400">
                                                <span className="truncate">{contact.phone || 'Sin teléfono'}</span>
                                                {contact.email && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="truncate">{contact.email}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {contact.tags && contact.tags.length > 0 && (
                                            <div className="flex gap-1">
                                                {contact.tags.slice(0, 2).map((tag: string) => (
                                                    <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0 bg-neutral-800 border-neutral-700">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {contact.tags.length > 2 && (
                                                    <span className="text-[9px] text-neutral-500">+{contact.tags.length - 2}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const MergeView = ({ group, onMerge, processing }: { group: any[], onMerge: (id: string) => void, processing: boolean }) => {
    const [primaryIndex, setPrimaryIndex] = useState<number>(0); // Use index instead of ID

    return (
        <div className="space-y-6">
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-200/80 leading-relaxed">
                    Selecciona el <strong>Contacto Principal</strong>. Los datos de los otros contactos (como etiquetas faltantes) se fusionarán en el principal, y los duplicados serán <strong>eliminados permanentemente</strong>.
                </p>
            </div>

            <div className="space-y-3">
                {group.map((contact, idx) => (
                    <div
                        key={`${contact.id}-${idx}`} // Use composite key for duplicates
                        onClick={() => setPrimaryIndex(idx)}
                        className={`relative p-4 rounded-xl border transition-all cursor-pointer ${primaryIndex === idx ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500' : 'bg-neutral-900 border-white/5 hover:bg-neutral-800'}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${primaryIndex === idx ? 'border-blue-500 bg-blue-500' : 'border-neutral-600'}`}>
                                    {primaryIndex === idx && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-white">{contact.name}</p>
                                    <p className="text-xs text-neutral-400">{contact.phone} • {contact.email || 'Sin Email'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-medium text-neutral-500 uppercase">Tags</span>
                                <div className="flex gap-1 justify-end mt-1">
                                    {(contact.tags || []).slice(0, 3).map((t: string) => (
                                        <div key={t} className="w-2 h-2 rounded-full bg-neutral-600" title={t} />
                                    ))}
                                    {(contact.tags?.length || 0) > 3 && <span className="text-[10px] text-neutral-500">+{contact.tags.length - 3}</span>}
                                </div>
                            </div>
                        </div>
                        {primaryIndex === idx && (
                            <Badge className="absolute -top-2 -right-2 bg-blue-600 hover:bg-blue-600 border-none text-[10px]">
                                PRINCIPAL
                            </Badge>
                        )}
                    </div>
                ))}
            </div>

            <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
                <Button
                    onClick={() => onMerge(group[primaryIndex].id)}
                    disabled={processing}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium"
                >
                    {processing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Merge className="w-4 h-4 mr-2" />}
                    Fusionar y Eliminar Duplicados
                </Button>
            </div>
        </div>
    );
};

