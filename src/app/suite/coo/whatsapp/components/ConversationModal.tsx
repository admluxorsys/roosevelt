import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/components/SidebarContext';
import { useConversationLogic } from './ConversationModal/hooks/useConversationLogic';
import { ChatSection } from './ConversationModal/components/ChatSection';
import { Sidebar } from './ConversationModal/components/Sidebar';
import { ConversationModalProps } from './ConversationModal/types';
import { socialPlatforms } from './ConversationModal/constants';
import { User, CreditCard, FileText, Clock, Phone, ChevronDown, X, CheckCheck, Search, MoreVertical, Filter, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import FilePreviewModal from './ConversationModal/FilePreviewModal';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { GripVertical } from 'lucide-react';

import { WhatsappIcon } from './ConversationModal/components/SharedComponents';

export default function ConversationModal(props: ConversationModalProps) {
  const logic = useConversationLogic(props);
  const [isInboxCollapsed, setIsInboxCollapsed] = React.useState(false);
  const { isCollapsed } = useSidebar();
  const [searchTerm, setSearchTerm] = React.useState(''); // Inbox search

  // Header Feature States
  const [chatSearchTerm, setChatSearchTerm] = React.useState('');
  const [isChatSearchOpen, setIsChatSearchOpen] = React.useState(false);
  const [muteDuration, setMuteDuration] = React.useState<string | null>(null);

  // Resize State
  const [sidebarWidth, setSidebarWidth] = React.useState(450);
  const [isResizing, setIsResizing] = React.useState(false);

  const startResizing = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 350 && newWidth < 900) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // If there's a file preview open, don't close the main modal, the preview modal handle it
        if (!logic.previewFile) {
          logic.handleInfoSave();
          props.onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [logic, props.onClose]);

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // Keep it open by default and set active tab
  React.useEffect(() => {
    if (props.isOpen && !logic.activeTab) {
      logic.setActiveTab('perfil');
    }
    if (props.isOpen) {
      setIsInboxCollapsed(false);
    }
  }, [props.isOpen, logic.activeTab]);

  if (!props.isOpen) return null;

  const filteredConversations = props.allConversations?.filter(conv => {
    const matchesSearch = conv.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.contactNumber?.includes(searchTerm) ||
      conv.name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by Active Platform (normalize to lowercase, default to whatsapp)
    const convSource = (conv.source || 'whatsapp').toLowerCase();
    const activeSource = (logic.activePlatform || 'whatsapp').toLowerCase();
    const matchesPlatform = convSource === activeSource;

    return matchesSearch && matchesPlatform;
  }) || [];

  const activePlatformData = socialPlatforms.find(p => p.name === logic.activePlatform) || socialPlatforms[0];

  const floatingStyle: React.CSSProperties = {
    position: 'fixed',
    right: '0px',
    top: '0px',
    bottom: '0px',
    zIndex: 1000,
    width: `${sidebarWidth}px`,
    backgroundColor: '#0a0a0a', // Solid black background
    borderLeft: '1px solid rgba(255,255,255,0.1)',
    transition: isResizing ? 'none' : 'width 0.1s ease-out',
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={cn("text-white flex font-sans overflow-hidden fixed shadow-[-10px_0_30px_rgba(0,0,0,0.5)]")}
      style={floatingStyle}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={startResizing}
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize z-[1001] transition-colors group",
          isResizing ? "bg-neutral-500/30" : "hover:bg-neutral-500/20"
        )}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={16} className="text-neutral-500/60" />
        </div>
      </div>

      {/* Container with solid background and layout */}
      <div className="flex w-full h-full bg-[#111] border-l border-white/10">
        {/* Main Content Area: Sidebar based on activeTab */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-900/20 relative">
          {/* Close Button at top right */}
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              await logic.handleInfoSave();
              props.onClose();
            }}
            className="absolute top-4 right-4 z-[1002] h-8 w-8 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            title="Cerrar panel"
          >
            <X size={18} />
          </Button>

          <Sidebar
            activeTab={logic.activeTab || 'perfil'}
            setActiveTab={logic.setActiveTab}
            isEditing={logic.isEditing}
            setIsEditing={logic.setIsEditing}
            liveCardData={logic.liveCardData}
            contactInfo={logic.contactInfo}
            handleInfoChange={logic.handleInfoChange}
            handleInfoSave={async () => { await logic.handleInfoSave(); }}
            setContactInfo={logic.setContactInfo}
            currentGroupName={logic.currentGroupName}
            toggleChecklistItem={logic.toggleChecklistItem}
            handleToggleCheckIn={logic.handleToggleCheckIn}
            checklistProgress={logic.checklistProgress}
            isAddingPayment={logic.isAddingPayment}
            setIsAddingPayment={logic.setIsAddingPayment}
            newPayment={logic.newPayment}
            setNewPayment={logic.setNewPayment}
            handleSavePaymentMethod={logic.handleSavePaymentMethod}
            isAddingCheckIn={logic.isAddingCheckIn}
            setIsAddingCheckIn={logic.setIsAddingCheckIn}
            newCheckIn={logic.newCheckIn}
            setNewCheckIn={logic.setNewCheckIn}
            handleSaveCheckIn={logic.handleSaveCheckIn}
            editingCheckInId={logic.editingCheckInId}
            setEditingCheckInId={logic.setEditingCheckInId}
            editText={logic.editText}
            setEditText={logic.setEditText}
            handleSaveEditedCheckIn={logic.handleSaveEditedCheckIn}
            handleEditCheckIn={logic.handleEditCheckIn}
            handleDeleteCheckIn={logic.handleDeleteCheckIn}
            isAddingNote={logic.isAddingNote}
            setIsAddingNote={logic.setIsAddingNote}
            newNote={logic.newNote}
            setNewNote={logic.setNewNote}
            handleSaveNote={logic.handleSaveNote}
            editingNoteId={logic.editingNoteId}
            setEditingNoteId={logic.setEditingNoteId}
            handleEditNote={logic.handleEditNote}
            handleDeleteNote={logic.handleDeleteNote}
            handleSaveEditedNote={logic.handleSaveEditedNote}
            newHistoryComment={logic.newHistoryComment}
            setNewHistoryComment={logic.setNewHistoryComment}
            handleSaveHistoryComment={logic.handleSaveHistoryComment}
            crmId={logic.crmId}
          />
        </div>

        {/* Right Action/Icon Bar (Hidden per user request) */}
        <div className="hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={props.onClose}
            className="mb-8 h-10 w-10 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <X size={20} />
          </Button>

          {[
            { id: 'perfil', icon: User, label: 'Perfil' },
            { id: 'notas', icon: FileText, label: 'Notas' },
            { id: 'pagos', icon: CreditCard, label: 'Pagos' },
            { id: 'historial', icon: Clock, label: 'Historial' },
          ].map((item: any) => (
            <button
              key={item.id}
              onClick={() => {
                if (logic.activeTab === item.id) {
                  logic.setActiveTab(null);
                } else {
                  logic.setActiveTab(item.id as any);
                  logic.setIsEditing(false);
                }
              }}
              className={cn(
                "relative group flex flex-col items-center transition-all duration-300 w-full px-2",
                (logic.activeTab || 'perfil') === item.id
                  ? "text-neutral-200"
                  : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300 mb-1",
                (logic.activeTab || 'perfil') === item.id
                  ? "bg-neutral-500/10 text-neutral-300 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                  : "bg-transparent"
              )}>
                <item.icon size={22} strokeWidth={(logic.activeTab || 'perfil') === item.id ? 2.5 : 1.5} />
              </div>

              <span className={cn(
                "text-[9px] font-bold uppercase transition-all duration-300 tracking-wider",
                (logic.activeTab || 'perfil') === item.id ? "text-neutral-200" : "text-neutral-600"
              )}>
                {item.label}
              </span>

              {(logic.activeTab || 'perfil') === item.id && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-neutral-500 rounded-l-full shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {logic.previewFile && (
          <FilePreviewModal
            isOpen={!!logic.previewFile}
            onClose={() => logic.setPreviewFile(null)}
            fileUrl={logic.previewFile.url}
            fileName={logic.previewFile.name}
            fileType={logic.previewFile.type}
          />
        )}
      </AnimatePresence>
    </motion.div >
  );
}
