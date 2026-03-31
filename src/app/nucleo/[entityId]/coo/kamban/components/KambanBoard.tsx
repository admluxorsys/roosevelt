import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useKambanBoard } from '../hooks/useKambanBoard';
import { KambanHeader } from './KambanHeader';
import KambanColumn from './KambanColumn';
import Card from './Card';
import ConversationModal from './ConversationModal';
import { useSidebar } from '@/components/SidebarContext';
import { SelectContactModal } from './SelectContactModal';
import { CreateClientModal } from './CreateClientModal';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
export default function KambanBoard() {
    const { currentUser, activeEntity } = useAuth();
    const getTenantPath = () => {
        if (!currentUser?.uid || !activeEntity) return '';
        return `users/${currentUser.uid}/entities/${activeEntity}`;
    };

  const [searchTerm, setSearchTerm] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'unassigned'>('all');
  const [isCompact, setIsCompact] = useState(true);

  const [isGlobalSelectContactOpen, setIsGlobalSelectContactOpen] = useState(false);
  const [isGlobalCreateClientOpen, setIsGlobalCreateClientOpen] = useState(false);
  const router = useRouter();

  const { isCollapsed, toggleSidebar } = useSidebar();
  const { groups, cards, loading, handleDragEnd, handleUpdateColor, handleAddGroup } = useKambanBoard(searchTerm);

  const onAddGroup = async () => {
    const name = window.prompt('New group name:');
    if (name) await handleAddGroup(name);
  };

  const handleGlobalAddCard = async (contact?: any) => {
    // Adds to the first group (Inbox)
    const firstGroup = groups[0];
    if (!firstGroup) {
      toast.error("Crea una bandeja primero");
      return;
    }
    try {
      const cardData: any = {
        contactName: contact?.name || 'New Contact',
        contactNumber: contact?.phone || '',
        email: contact?.email || '',
        clientId: contact?.clientId || '',
        lastMessage: 'Conversation started...',
        channel: contact ? 'CRM Link' : 'Manual',
        source: 'manual',
        groupId: firstGroup.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messages: [],
      };
      await addDoc(collection(db, `${getTenantPath()}/kanban-groups/${firstGroup.id}/cards`), cardData);
      toast.success(contact ? `Contact "${contact.name}" added.` : 'New conversation created.');
      setIsGlobalSelectContactOpen(false);
    } catch (error) {
      console.error('Error adding card:', error);
      toast.error('Error adding contact.');
    }
  };

  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      const matchesSearch = !searchTerm ||
        card.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (filter === 'unread') return card.unreadCount > 0;
      if (filter === 'unassigned') return !card.assignedTo;

      return true;
    });
  }, [cards, searchTerm, filter]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleCardClick = (card: any) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const activeCard = useMemo(() => cards.find(c => c.id === activeId), [cards, activeId]);

  const channelStats = useMemo(() => {
    const stats = {
      whatsapp: 0, instagram: 0, messenger: 0, web: 0, facebook: 0,
      snapchat: 0, x: 0, tiktok: 0, telegram: 0, others: 0
    };
    cards.forEach(card => {
      const channel = (card.channel || card.source || card.primary_channel || '').toLowerCase();
      const hasNumber = !!card.contactNumber;

      if (channel.includes('whatsapp') || channel === 'manual' || (hasNumber && !channel.includes('instagram') && !channel.includes('telegram'))) {
        stats.whatsapp++;
      } else if (channel.includes('instagram')) stats.instagram++;
      else if (channel.includes('messenger')) stats.messenger++;
      else if (channel.includes('web')) stats.web++;
      else if (channel.includes('facebook')) stats.facebook++;
      else if (channel.includes('snapchat')) stats.snapchat++;
      else if (channel.includes('x') || channel.includes('twitter')) stats.x++;
      else if (channel.includes('tiktok')) stats.tiktok++;
      else if (channel.includes('telegram')) stats.telegram++;
      else stats.others++;
    });
    return stats;
  }, [cards]);

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] overflow-hidden">
      <KambanHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filter={filter}
        setFilter={setFilter}
        channelStats={channelStats}
        isSidebarCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        onNewChat={() => setIsGlobalSelectContactOpen(true)}
        onSettings={() => router.push(`/nucleo/${activeEntity}/cto/integrations`)}
      />

      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex min-h-full min-w-max p-2 pt-1 pb-4 gap-2">
            {groups.map(group => (
              <KambanColumn
                key={group.id}
                group={group}
                allGroups={groups}
                cards={filteredCards.filter(c => c.groupId === group.id)}
                onCardClick={handleCardClick}
                onUpdateColor={handleUpdateColor}
                isCompact={isCompact}
              />
            ))}

            {/* Add Group Button */}
            <button
              onClick={onAddGroup}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-white/5 text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-all h-fit w-72 flex-shrink-0"
            >
              <Plus size={16} />
              <span className="text-[13px] font-medium">Add group</span>
            </button>
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeCard ? <Card card={activeCard} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <ConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        card={selectedCard}
        groupName={groups.find(g => g.id === selectedCard?.groupId)?.name}
        groups={groups}
        allConversations={cards}
        onSelectConversation={(card) => setSelectedCard(card)}
        stats={{ totalConversations: cards.length, totalGroups: groups.length }}
      />

      {/* Global Modals */}
      <SelectContactModal
        isOpen={isGlobalSelectContactOpen}
        onClose={() => setIsGlobalSelectContactOpen(false)}
        onSelect={(contact) => handleGlobalAddCard(contact)}
        onAddNew={() => {
          setIsGlobalSelectContactOpen(false);
          setIsGlobalCreateClientOpen(true);
        }}
      />

      <CreateClientModal
        isOpen={isGlobalCreateClientOpen}
        onClose={() => setIsGlobalCreateClientOpen(false)}
        groups={groups}
        initialGroupId={groups[0]?.id}
      />
    </div>
  );
}

