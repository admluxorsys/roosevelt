'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, deleteDoc, updateDoc, serverTimestamp, writeBatch, Timestamp } from 'firebase/firestore';
import Card from './Card';
import { Plus, Trash2, MoreVertical, Palette, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { SelectContactModal } from './SelectContactModal';
import { CreateClientModal } from './CreateClientModal';

// --- Types ---
interface CardData {
    id: string;
    groupId: string;
    contactName: string;
    lastMessage: string;
    channel: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    messages: any[];
}

const colors = [
    { name: 'Default', value: 'bg-[#161616]', cardColor: 'bg-[#1e1e1e]', textColor: 'text-neutral-400', pill: 'bg-neutral-800 text-neutral-200' },
    { name: 'Gray', value: 'bg-[#1f1f1f]', cardColor: 'bg-[#272727]', textColor: 'text-neutral-400', pill: 'bg-[#3a3a3a] text-neutral-200' },
    { name: 'Orange', value: 'bg-[#331c0e]', cardColor: 'bg-[#27150a]', textColor: 'text-orange-400', pill: 'bg-[#7a3b1f] text-orange-50' },
    { name: 'Yellow', value: 'bg-[#332b0e]', cardColor: 'bg-[#27210a]', textColor: 'text-yellow-400', pill: 'bg-[#7a651f] text-yellow-50' },
    { name: 'Green', value: 'bg-[#123122]', cardColor: 'bg-[#0e2419]', textColor: 'text-emerald-400', pill: 'bg-[#1a5b3d] text-emerald-50' },
    { name: 'Blue', value: 'bg-[#0c2438]', cardColor: 'bg-[#081a29]', textColor: 'text-blue-400', pill: 'bg-[#1a4a75] text-blue-50' },
    { name: 'Purple', value: 'bg-[#2f1c34]', cardColor: 'bg-[#241527]', textColor: 'text-purple-400', pill: 'bg-[#6b3576] text-purple-50' },
    { name: 'Pink', value: 'bg-[#38111e]', cardColor: 'bg-[#290c16]', textColor: 'text-pink-400', pill: 'bg-[#82193f] text-pink-50' },
    { name: 'Red', value: 'bg-[#3b1212]', cardColor: 'bg-[#2b0d0d]', textColor: 'text-rose-400', pill: 'bg-[#8c1818] text-rose-50' },
];

interface kambanColumnProps {
    group: any;
    cards: any[];
    allGroups?: any[];
    onCardClick: (card: any) => void;
    onUpdateColor?: (groupId: string, color: string) => void;
    contacts?: any[];
    isCompact?: boolean;
}

export const kambanColumn = ({
    group,
    cards,
    allGroups = [],
    onCardClick,
    onUpdateColor,
    contacts = [],
    isCompact
}: kambanColumnProps) => {
    const { currentUser, activeEntity } = useAuth();
    const getTenantPath = () => {
        if (!currentUser?.uid || !activeEntity) return '';
        return `users/${currentUser.uid}/entities/${activeEntity}`;
    };
    const [isSelectContactOpen, setIsSelectContactOpen] = useState(false);
    const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Droppable for receiving cards
    const { setNodeRef } = useDroppable({
        id: group.id,
        data: { type: 'group', group }
    });

    // --- ADD CARD ---
    const handleAddCard = async (contact?: any) => {
        try {
            const cardData: any = {
                contactName: contact?.name || 'New Contact',
                contactNumber: contact?.phone || '',
                email: contact?.email || '',
                clientId: contact?.clientId || '',
                lastMessage: 'Conversation started...',
                channel: contact ? 'CRM Link' : 'Manual',
                source: 'manual',
                groupId: group.id,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                messages: [],
            };
            await addDoc(collection(db, `${getTenantPath()}/kanban-groups/${group.id}/cards`), cardData);
            toast.success(contact ? `Contact "${contact.name}" added.` : 'New conversation created.');
            setIsSelectContactOpen(false);
        } catch (error) {
            console.error('Error adding card:', error);
            toast.error('Error adding contact.');
        }
    };

    // --- IMPORT CSV ---
    const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
                alert('CSV file is empty or has no data.');
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const batch = writeBatch(db);
            let importCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                const contact: any = {};
                headers.forEach((header, index) => { if (values[index]) contact[header] = values[index]; });

                if (!contact.contactname && !contact.contactName) continue;

                const cardData = {
                    contactName: contact.contactname || contact.contactName || 'No Name',
                    contactNumber: contact.contactnumber || contact.contactNumber || contact.phone || '',
                    email: contact.email || '',
                    company: contact.company || contact.organization || '',
                    lastMessage: 'Imported from CSV',
                    channel: 'CSV Import',
                    source: 'csv',
                    groupId: group.id,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    messages: [],
                };

                const newCardRef = doc(collection(db, `${getTenantPath()}/kanban-groups/${group.id}/cards`));
                batch.set(newCardRef, cardData);
                importCount++;
            }

            try {
                await batch.commit();
                toast.success(`✅ ${importCount} contacts imported successfully`);
            } catch (error) {
                console.error('Error importing contacts:', error);
                toast.error('❌ Error importing contacts');
            }
        };

        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- DELETE GROUP ---
    const handleDeleteGroup = async () => {
        if (allGroups.length <= 1) {
            toast.error("No puedes eliminar la única bandeja que queda.");
            return;
        }

        if (!window.confirm(`¿Estás seguro de eliminar "${group.name}"? Todas las conversaciones se moverán a la bandeja Inbox.`)) return;

        const inbox = allGroups.find(g => g.id === 'default_inbox') || 
                      allGroups.find(g => g.name === 'Inbox' && g.id !== group.id) ||
                      allGroups.find(g => (g.name === 'Inbox' || g.name === 'Bandeja de Entrada') && g.id !== group.id) ||
                      allGroups.find(g => g.id !== group.id);

        if (!inbox) {
            alert("No se encontró una bandeja de destino válida.");
            return;
        }

        const batch = writeBatch(db);

        cards.forEach((card) => {
            const newCardRef = doc(collection(db, `${getTenantPath()}/kanban-groups/${inbox.id}/cards`));
            const { id, groupId, ...cardData } = card;
            batch.set(newCardRef, { ...cardData, groupId: inbox.id, updatedAt: serverTimestamp() });
            batch.delete(doc(db, `${getTenantPath()}/kanban-groups/${group.id}/cards`, card.id));
        });

        batch.delete(doc(db, `${getTenantPath()}/kanban-groups`, group.id));

        try {
            await batch.commit();
            toast.success(`Columna eliminada. Conversaciones movidas a ${inbox.name}.`);
        } catch (error) {
            console.error('Error deleting group:', error);
            toast.error('Error deleting column.');
        }
    };

    const selectedColor = colors.find(c => c.value === group.color) || colors[0];

    return (
        <div
            ref={setNodeRef}
            data-group-id={group.id}
            className={cn(
                "flex flex-col flex-shrink-0 h-fit rounded-2xl border border-white/5 transition-all duration-300 hover:border-white/10 shadow-lg overflow-hidden pb-2 mb-8",
                isCompact ? 'w-72' : 'w-80',
                selectedColor.value
            )}
        >
            {/* Header */}
            <div className="p-3 pb-1 flex flex-col">
                <div className="flex justify-between items-center group/header">
                <div className="flex items-center gap-2 px-1">
                    <div className={cn("px-2 py-0.5 rounded-md text-[11px] font-bold tracking-tight truncate text-white", selectedColor.pill)}>
                        {group.name === 'Inbox' || group.name === 'Bandeja de Entrada' ? 'Inbox' : group.name}
                    </div>
                    <span className={cn("font-medium text-[12px] opacity-40", selectedColor.textColor.replace('text-', 'text-'))}>
                        {cards.length}
                    </span>
                </div>


                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors ml-auto">
                                    <MoreVertical size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-white shadow-2xl rounded-xl p-1 w-56">
                                {/* Edit Name */}
                                <DropdownMenuItem
                                    onClick={() => {
                                        const newName = window.prompt('Editar nombre de la bandeja:', group.name);
                                        if (newName && newName !== group.name) {
                                            updateDoc(doc(db, `${getTenantPath()}/kanban-groups`, group.id), { name: newName });
                                        }
                                    }}
                                    className="cursor-pointer hover:bg-neutral-800 rounded-lg py-2"
                                >
                                    <Palette className="mr-3 text-neutral-400" size={16} />
                                    <span>Edit Name</span>
                                </DropdownMenuItem>

                                {/* Color Picker */}
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="hover:bg-blue-600 focus:bg-blue-600 data-[state=open]:bg-blue-600 rounded-lg transition-colors py-2">
                                        <Palette className="mr-3 text-neutral-400" size={16} />
                                        <span className="font-medium">Column Colors</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent className="bg-neutral-900 border-neutral-800 text-white shadow-2xl rounded-xl p-1 ml-1 w-48">
                                            {colors.map(color => (
                                                <DropdownMenuItem
                                                    key={color.name}
                                                    onClick={() => onUpdateColor?.(group.id, color.value)}
                                                    className="hover:bg-neutral-800 focus:bg-neutral-800 rounded-lg flex items-center gap-3 py-2 cursor-pointer transition-colors"
                                                >
                                                    <div className={cn("w-3.5 h-3.5 rounded-full border border-white/10", color.cardColor.replace('/40', ''))}></div>
                                                    <span className="text-xs font-medium">{color.name}</span>
                                                    {group.color === color.value && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>

                                {/* Import CSV */}
                                <DropdownMenuItem
                                    onClick={() => fileInputRef.current?.click()}
                                    className="cursor-pointer hover:bg-neutral-800 rounded-lg py-2"
                                >
                                    <Upload className="mr-3 text-neutral-400" size={16} />
                                    <span>Import CSV</span>
                                </DropdownMenuItem>

                                {/* Delete Group (only if not the last one) */}
                                {allGroups.length > 1 && (
                                    <>
                                        <div className="h-px bg-neutral-800 my-1 mx-1" />
                                        <DropdownMenuItem
                                            onClick={handleDeleteGroup}
                                            className="cursor-pointer hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg py-2"
                                        >
                                            <Trash2 className="mr-3 text-red-400" size={16} />
                                            <span>Delete Column</span>
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                </div>
            </div>

            {/* Hidden CSV input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                style={{ display: 'none' }}
            />

            {/* Cards */}
            <div className="p-2 space-y-1">
                <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {cards.map((card) => (
                        <Card
                            key={card.id}
                            card={card}
                            groupId={group.id}
                            onClick={(e: any) => onCardClick(card)}
                            cardColor={selectedColor.cardColor}
                            contacts={contacts}
                            isCompact={isCompact}
                        />
                    ))}
                </SortableContext>

                {cards.length === 0 && (
                    <div className={cn("flex flex-col items-center justify-center py-6 px-4 text-center rounded-xl border border-dashed border-white/5 opacity-20")}>
                        <span className="text-[10px] font-medium">Empty</span>
                    </div>
                )}

                {/* Bottom Add Link */}
                <button
                    onClick={() => setIsSelectContactOpen(true)}
                    className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-all mt-1 group-hover:opacity-100",
                        cards.length > 0 ? "opacity-40" : "opacity-100"
                    )}
                >
                    <Plus size={14} />
                    <span className="text-[12px] font-medium">New conversation</span>
                </button>
            </div>

            {/* Modals */}
            <SelectContactModal
                isOpen={isSelectContactOpen}
                onClose={() => setIsSelectContactOpen(false)}
                onSelect={(contact) => handleAddCard(contact)}
                onAddNew={() => {
                    setIsSelectContactOpen(false);
                    setIsCreateClientOpen(true);
                }}
            />

            <CreateClientModal
                isOpen={isCreateClientOpen}
                onClose={() => setIsCreateClientOpen(false)}
                groups={allGroups}
                initialGroupId={group.id}
            />
        </div>
    );
};

export default kambanColumn;
