
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, serverTimestamp, query, writeBatch, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import Card from './Card';
import { Plus, Trash2, MoreVertical, Palette, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu"
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { SelectContactModal } from './SelectContactModal';
import { CreateClientModal } from './CreateClientModal';

// --- Interface para Tipado de Tarjetas ---
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
  { name: 'Predeterminado', value: 'bg-neutral-900/50', cardColor: 'bg-neutral-800' },
  { name: 'Piedra', value: 'bg-stone-900/50', cardColor: 'bg-stone-800' },
  { name: 'Naranja', value: 'bg-orange-900/50', cardColor: 'bg-orange-800' },
  { name: 'Amarillo', value: 'bg-yellow-900/50', cardColor: 'bg-yellow-800' },
  { name: 'Verde', value: 'bg-green-900/50', cardColor: 'bg-green-800' },
  { name: 'Azul', value: 'bg-blue-900/50', cardColor: 'bg-blue-800' },
  { name: 'Púrpura', value: 'bg-purple-900/50', cardColor: 'bg-purple-800' },
  { name: 'Rosa', value: 'bg-pink-900/50', cardColor: 'bg-pink-800' },
  { name: 'Rojo', value: 'bg-red-900/50', cardColor: 'bg-red-800' },
];

const Group = ({ group, allGroups = [], onCardClick, onUpdateColor, contacts = [] }: {
  group: any;
  allGroups?: any[];
  onCardClick: any;
  onUpdateColor: any;
  contacts?: any[];
}) => {
  const { currentUser, activeEntity } = useAuth();
  const getTenantPath = () => {
    if (!currentUser?.uid || !activeEntity) return '';
    return `users/${currentUser.uid}/entities/${activeEntity}`;
  };
  const [cards, setCards] = useState<CardData[]>([]);
  const [isSelectContactOpen, setIsSelectContactOpen] = useState(false);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id, data: { type: 'GROUP', group } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  useEffect(() => {
    if (!group.id) return;
    const cardsQuery = query(collection(db, `${getTenantPath()}/kanban-groups/${group.id}/cards`));

    const unsubscribe = onSnapshot(cardsQuery, (snapshot) => {
      const cardsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, groupId: group.id })) as CardData[];
      cardsData.sort((a, b) => (b.updatedAt?.toDate()?.getTime() || 0) - (a.updatedAt?.toDate()?.getTime() || 0));
      setCards(cardsData);
    });
    return () => unsubscribe();
  }, [group.id]);

  const handleAddCard = async (contact?: any) => {
    try {
      const cardData = {
        contactName: contact?.name || "Nuevo Contacto",
        contactNumber: contact?.phone || '',
        email: contact?.email || '',
        clientId: contact?.clientId || '',
        lastMessage: 'Conversación iniciada...',
        channel: contact ? 'CRM Link' : 'Manual',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messages: [],
      };

      await addDoc(collection(db, `${getTenantPath()}/kanban-groups/${group.id}/cards`), cardData);
      toast.success(contact ? `Contacto "${contact.name}" añadido.` : "Nueva conversación creada.");
      setIsSelectContactOpen(false);
    } catch (error) {
      console.error("Error adding card:", error);
      toast.error("Error al añadir contacto.");
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        alert('El archivo CSV está vacío o no tiene datos.');
        return;
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      // Expected columns: contactName, contactNumber, email, company, etc.
      const batch = writeBatch(db);
      let importCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const contact: any = {};

        headers.forEach((header, index) => {
          if (values[index]) {
            contact[header] = values[index];
          }
        });

        // Ensure required fields
        if (!contact.contactname && !contact.contactName) {
          continue; // Skip rows without name
        }

        const cardData = {
          contactName: contact.contactname || contact.contactName || 'Sin Nombre',
          contactNumber: contact.contactnumber || contact.contactNumber || contact.phone || '',
          email: contact.email || '',
          company: contact.company || contact.organization || '',
          lastMessage: 'Importado desde CSV',
          channel: 'CSV Import',
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
        alert(`✅ ${importCount} contactos importados exitosamente`);
      } catch (error) {
        console.error('Error importing contacts:', error);
        alert('❌ Error al importar contactos');
      }
    };

    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteGroup = async () => {
    // Basic protection (should already be hidden in UI, but for safety)
    if (group.name === 'Bandeja de Entrada') return;

    if (window.confirm(`¿Estás seguro de que quieres eliminar la bandeja "${group.name}"? Todas las conversaciones se moverán a la Bandeja de Entrada.`)) {
      const inbox = allGroups.find(g => g.name === 'Bandeja de Entrada');

      if (!inbox) {
        alert("No se pudo encontrar la 'Bandeja de Entrada' para mover las conversaciones.");
        return;
      }

      const batch = writeBatch(db);

      // Move all cards to the Inbox
      cards.forEach((card) => {
        // Create new card in Inbox
        const newCardRef = doc(collection(db, `${getTenantPath()}/kanban-groups/${inbox.id}/cards`));
        const { id, groupId, ...cardData } = card; // Remove old ID and groupId
        batch.set(newCardRef, {
          ...cardData,
          updatedAt: serverTimestamp() // Refresh updated time
        });

        // Delete old card
        const oldCardRef = doc(db, `${getTenantPath()}/kanban-groups/${group.id}/cards`, card.id);
        batch.delete(oldCardRef);
      });

      // Delete the group itself
      const groupRef = doc(db, `${getTenantPath()}/kanban-groups`, group.id);
      batch.delete(groupRef);

      try {
        await batch.commit();
        toast.success(`Bandeja eliminada. Las conversaciones se movieron a la ${inbox.name}.`);
      } catch (error) {
        console.error('Error migrating cards/deleting group:', error);
        toast.error('Error al eliminar la bandeja.');
      }
    }
  };

  const selectedColor = colors.find(c => c.value === group.color) || colors[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-group-id={group.id}
      className={`flex flex-col ${group.name === 'Bandeja de Entrada' ? 'w-64' : 'w-56'} flex-shrink-0 h-full bg-neutral-900/40 rounded-2xl border border-neutral-800/50 backdrop-blur-sm transition-all duration-300 ${isDragging ? 'ring-2 ring-blue-500/50 shadow-2xl scale-[1.02]' : 'hover:border-neutral-700/50'}`}
    >
      <div className={`${selectedColor.value} rounded-t-2xl p-2.5 flex flex-col border-b border-neutral-800/50`}>
        <div {...attributes} {...listeners} className="flex justify-between items-center cursor-grab touch-none group/header">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-6 rounded-sm ${selectedColor.value.replace('/50', '').replace('-900', '-500')}`}></div>
            <h2 className="font-medium text-white text-sm tracking-tight truncate">{group.name}</h2>
            <Badge variant="secondary" className="bg-black/40 text-neutral-400 border-neutral-800 font-mono text-[10px] px-2 py-0 rounded-sm">
              {cards.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1 transition-opacity">
            <Button variant="ghost" size="icon" onClick={() => setIsSelectContactOpen(true)} className="h-8 w-8 text-neutral-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-full">
              <Plus size={16} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-white shadow-2xl rounded-xl p-1 w-56">
                <DropdownMenuItem
                  onClick={() => {
                    const newName = window.prompt("Editar nombre de la bandeja:", group.name);
                    if (newName && newName !== group.name) {
                      // We'll need to lift this to kambanBoard or use a local handler if passed via props
                      // For now, I'll rely on a prop update if available or direct Firestore update
                      updateDoc(doc(db, `${getTenantPath()}/kanban-groups`, group.id), { name: newName });
                    }
                  }}
                  className="cursor-pointer hover:bg-neutral-800 rounded-lg py-2"
                >
                  <Palette className="mr-3 text-neutral-400" size={16} />
                  <span>Editar Nombre</span>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="hover:bg-neutral-800 rounded-lg">
                    <Palette className="mr-3 text-neutral-400" size={16} />
                    <span>Colores de Bandeja</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="bg-neutral-900 border-neutral-800 text-white rounded-xl p-1 ml-1">
                      {colors.map(color => (
                        <DropdownMenuItem key={color.name} onClick={() => onUpdateColor(group.id, color.value)} className="hover:bg-neutral-800 rounded-lg flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${color.value.replace('/50', '').replace('-900', '-500')}`}></div>
                          <span className="text-xs">{color.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer hover:bg-neutral-800 rounded-lg py-2">
                  <Upload className="mr-3 text-neutral-400" size={16} />
                  <span>Importar CSV</span>
                </DropdownMenuItem>
                {group.name !== 'Bandeja de Entrada' && (
                  <>
                    <div className="h-px bg-neutral-800 my-1 mx-1" />
                    <DropdownMenuItem onClick={handleDeleteGroup} className="cursor-pointer hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg py-2">
                      <Trash2 className="mr-3 text-red-400" size={16} />
                      <span>Eliminar Grupo</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImportCSV}
        style={{ display: 'none' }}
      />

      <div className="flex-grow overflow-y-auto p-2 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-neutral-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        <SortableContext items={cards.map(c => c.id)}>
          {cards.map((card) => (
            <Card key={card.id} card={card} groupId={group.id} onClick={(e) => onCardClick(card, e)} cardColor={selectedColor.cardColor} contacts={contacts} />
          ))}
        </SortableContext>
      </div>

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
    </div >
  );
};

export default Group;


