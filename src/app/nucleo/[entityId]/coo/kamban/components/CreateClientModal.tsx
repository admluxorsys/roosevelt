import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, collectionGroup, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { normalizePhoneNumber } from '@/lib/phoneUtils';

interface GroupData {
    id: string;
    name: string;
}

interface CreateClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    groups: GroupData[];
    initialGroupId?: string;
}

import { ALL_COUNTRY_CODES } from '@/lib/countryCodes';

export function CreateClientModal({ isOpen, onClose, groups, initialGroupId }: CreateClientModalProps) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+593');
    const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroupId || groups[0]?.id || '');

    React.useEffect(() => {
        if (initialGroupId) {
            setSelectedGroupId(initialGroupId);
        }
    }, [initialGroupId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("El nombre es requerido");
            return;
        }

        const fullPhone = normalizePhoneNumber(`${countryCode}${phone}`);
        if (!fullPhone) {
            toast.error("Número de teléfono inválido");
            return;
        }

        try {
            // --- PREVENT DUPLICATES ---
            const querySnapshot = await getDocs(collection(db, 'contacts'));
            const existingContact = querySnapshot.docs.find(doc => {
                const num = (doc.data().phone || '').replace(/\D/g, '');
                return num === fullPhone.replace(/\D/g, '');
            });

            if (existingContact) {
                toast.error(`Ya existe un contacto para este número: ${fullPhone}`);
                return;
            }

            const groupIdToUse = selectedGroupId || groups[0]?.id;

            // 1. Create CRM Contact first (let Firestore generate the ID)
            const contactRef = await addDoc(collection(db, 'contacts'), {
                name: name,
                phone: fullPhone,
                source: 'Manual (kamban)',
                stage: groups.find(g => g.id === groupIdToUse)?.name || 'N/A',
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp()
            });

            // Get the auto-generated Firestore ID
            const contactId = contactRef.id;

            // Derive clientId from Firestore ID (same as CRM does)
            const derivedClientId = `RY${contactId.substring(0, 5).toUpperCase()}`;

            // Update the contact with the clientId
            await updateDoc(contactRef, {
                clientId: derivedClientId
            });

            // 2. Create kamban Card linked by ID
            await addDoc(collection(db, 'kamban-groups', groupIdToUse, 'cards'), {
                contactName: name,
                contactNumber: fullPhone,
                contactId: contactId, // LINK BY FIRESTORE ID
                createdAt: serverTimestamp(),
                groupId: groupIdToUse,
                email: '',
                description: '',
                checkIns: [],
                messages: []
            });

            toast.success("Cliente creado exitosamente");
            setName('');
            setPhone('');
            onClose();
        } catch (error: any) {
            console.error("Error creating client:", error);
            toast.error("Error al crear cliente: " + error.message);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-800 text-white rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-medium uppercase tracking-tight">Crear Nuevo Cliente</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">
                            Nombre Completo
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-neutral-800 border-neutral-700 text-white h-11 rounded-xl"
                            placeholder="Ej. Juan Pérez"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">
                            Teléfono de Contacto
                        </Label>
                        <div className="flex gap-2">
                            <Select value={countryCode} onValueChange={setCountryCode}>
                                <SelectTrigger className="w-[120px] bg-neutral-800 border-neutral-700 text-white h-11 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-neutral-800 text-white max-h-[300px] overflow-y-auto">
                                    {ALL_COUNTRY_CODES.map((c, idx) => (
                                        <SelectItem key={`country-${idx}`} value={c.code}>
                                            <span className="flex items-center gap-2">
                                                <span className="text-lg">{c.flag}</span>
                                                <span className="font-mono text-xs">{c.code}</span>
                                                <span className="text-[10px] text-neutral-500 truncate max-w-[60px]">{c.country}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="flex-1 bg-neutral-800 border-neutral-700 text-white h-11 rounded-xl"
                                placeholder="123 456 7890"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="group" className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">
                            Etapa del Embudo
                        </Label>
                        <Select
                            value={selectedGroupId}
                            onValueChange={setSelectedGroupId}
                        >
                            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white h-11 rounded-xl">
                                <SelectValue placeholder="Selecciona una etapa" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                {groups.map(group => (
                                    <SelectItem key={group.id} value={group.id}>
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="mt-4 gap-2">
                        <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-neutral-800 hover:text-white rounded-xl">
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl font-medium">
                            Establecer Cliente
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


