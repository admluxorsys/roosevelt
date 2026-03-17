import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
// Removed ScrollArea import as it doesn't exist

interface Contact {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    clientId?: string;
}

interface SelectContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (contact: Contact) => void;
    onAddNew: () => void;
}

export function SelectContactModal({ isOpen, onClose, onSelect, onAddNew }: SelectContactModalProps) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchContacts();
        }
    }, [isOpen]);

    const fetchContacts = async () => {
        setIsLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'contacts'));
            const contactsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Contact[];

            // Deduplicate contacts by ID (same logic as CRM page)
            const seenIds = new Set<string>();
            const deduplicated = contactsData.filter(contact => {
                if (!contact.id || seenIds.has(contact.id)) return false;
                seenIds.add(contact.id);
                return true;
            });

            setContacts(deduplicated);
        } catch (error) {
            console.error("Error fetching contacts:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredContacts = contacts.filter(c =>
        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone || '').includes(searchQuery) ||
        (c.clientId || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] bg-neutral-950 border-neutral-800 text-white rounded-2xl p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-medium uppercase tracking-tight">Seleccionar Contacto</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 my-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <Input
                            placeholder="Buscar por nombre, teléfono o ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-neutral-900 border-neutral-800 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl h-11"
                        />
                    </div>

                    <div className="h-[350px] pr-4 overflow-y-auto custom-scrollbar">
                        <div className="space-y-2">
                            {filteredContacts.length > 0 ? (
                                filteredContacts.map(contact => (
                                    <div
                                        key={contact.id}
                                        onClick={() => onSelect(contact)}
                                        className="p-3 bg-neutral-900/50 hover:bg-neutral-800 border border-neutral-800 rounded-xl cursor-pointer transition-all group flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500 font-medium text-sm">
                                                {contact.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm group-hover:text-blue-400 transition-colors">
                                                    {contact.name || 'Sin Nombre'}
                                                </p>
                                                <p className="text-[10px] text-neutral-500 flex items-center gap-2">
                                                    {contact.clientId && <span className="font-mono text-blue-500/70">{contact.clientId}</span>}
                                                    {contact.phone && <span>• {contact.phone}</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-neutral-500">
                                    {isLoading ? "Cargando contactos..." : "No se encontraron contactos."}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 border-t border-neutral-800 pt-4">
                    <Button
                        variant="ghost"
                        onClick={onAddNew}
                        className="w-full sm:w-auto text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 flex items-center gap-2 rounded-xl"
                    >
                        <UserPlus size={16} />
                        Crear Nuevo
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full sm:w-auto text-neutral-400 hover:text-white rounded-xl"
                    >
                        Cancelar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
