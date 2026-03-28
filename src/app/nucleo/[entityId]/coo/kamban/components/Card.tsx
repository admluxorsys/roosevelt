
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import {
  MessageCircle,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
  Globe2,
  FileSpreadsheet
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { countryData } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const Card = ({ card, groupId, onClick, cardColor = 'bg-neutral-800', contacts = [], isCompact }: any) => {
  const { currentUser, activeEntity } = useAuth();
  const getTenantPath = () => {
    if (!currentUser?.uid || !activeEntity) return '';
    return `users/${currentUser.uid}/entities/${activeEntity}`;
  };
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: 'CARD', card: { ...card, groupId } },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleOpenDeleteDialog = (e) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeleteConfirmation('');
  };

  const handleDeleteCard = async () => {
    if (deleteConfirmation === 'delete') {
      try {
        const cardRef = doc(db, `${getTenantPath()}/kanban-groups`, groupId, 'cards', card.id);
        await deleteDoc(cardRef);
        handleCloseDeleteDialog();
      } catch (error) {
        console.error("Error deleting card: ", error);
      }
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
    const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

    return `${day} ${month} ${time}`;
  };

  const getCountryInfo = (phoneNumber) => {
    if (!phoneNumber) return { flag: '🏳️', code: 'N/A' };
    const number = phoneNumber.replace('+', '');
    const codes = Object.keys(countryData).sort((a, b) => b.length - a.length);
    for (const code of codes) {
      if (number.startsWith(code)) {
        const data = countryData[code];
        return typeof data === 'string' ? { flag: data, code: 'N/A' } : data;
      }
    }
    return { flag: '🏳️', code: 'N/A' };
  };

  const { flag, code } = getCountryInfo(card.contactNumber);

  const getChannelColor = (channel = '') => {
    const c = (channel || '').toLowerCase();
    if (c.includes('instagram')) return 'border-pink-500';
    if (c.includes('messenger') || c.includes('facebook')) return 'border-blue-600';
    if (c.includes('web')) return 'border-cyan-400';
    if (c.includes('telegram')) return 'border-sky-500';
    if (c.includes('x') || c.includes('twitter')) return 'border-neutral-400';
    if (c.includes('tiktok')) return 'border-pink-400';
    return 'border-emerald-500';
  };

  const channelColorClass = getChannelColor(card.channel || card.source);

  return (
    <TooltipProvider>
      <div
        ref={setNodeRef}
        style={style}
        data-card-id={card.id}
        onClick={onClick}
        {...attributes}
        {...listeners}
        className={cn(
          "group relative p-3 rounded-xl border border-white/5 transition-all duration-200 select-none cursor-pointer mb-2 shadow-sm",
          cardColor || "bg-[#181818]/50",
          "hover:bg-white/5 hover:border-white/10"
        )}
      >
        <div className="flex items-center justify-between min-w-0">
          <h3 className="font-semibold text-[13px] text-white/90 truncate leading-tight tracking-tight flex items-center gap-1.5">
            {(() => {
              const c = (card.channel || card.source || '').toLowerCase();
              if (c.includes('instagram')) return <Instagram size={12} className="text-pink-500" />;
              if (c.includes('messenger') || c.includes('facebook')) return <Facebook size={12} className="text-blue-600" />;
              if (c.includes('web')) return <Globe2 size={12} className="text-cyan-400" />;
              return <MessageCircle size={12} className="text-emerald-500" />;
            })()}
            {(() => {
              const contactId = (card as any).contactId;
              let linkedContact: any = null;
              if (contactId) linkedContact = (contacts as any[]).find(c => c.id === contactId);
              if (!linkedContact && card.contactNumber) {
                const normalizedCardPhone = card.contactNumber.replace(/\D/g, '');
                if (normalizedCardPhone) linkedContact = (contacts as any[]).find(c => (c.phone || '').replace(/\D/g, '') === normalizedCardPhone);
              }
              return linkedContact?.name || `${linkedContact?.firstName || ''} ${linkedContact?.lastName || ''} `.trim() || card.contactName || 'Unknown';
            })()}
          </h3>

          <div className="flex items-center gap-2">
            {card.unreadCount > 0 && (
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            )}
            
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); handleOpenDeleteDialog(e); }}
                className="h-6 w-6 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-full"
              >
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-700 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              To confirm deletion, type 'delete'.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="bg-neutral-800 border-neutral-600 focus:ring-blue-500"
              placeholder="Type 'delete'..."
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCard}
              disabled={deleteConfirmation !== 'delete'}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default Card;


