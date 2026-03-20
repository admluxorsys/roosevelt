import React from 'react';
import { Save, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ProfileTab } from '../tabs/ProfileTab';
import { PaymentsTab } from '../tabs/PaymentsTab';
import { NotesTab } from '../tabs/NotesTab';
import { HistoryTab } from '../tabs/HistoryTab';
import { CardData, Note, CheckIn } from '../types';

interface SidebarProps {
    activeTab: 'perfil' | 'pagos' | 'notas' | 'historial' | null;
    setActiveTab: (tab: 'perfil' | 'pagos' | 'notas' | 'historial' | null) => void;
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
    liveCardData: CardData | null;
    contactInfo: Partial<CardData>;
    handleInfoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleInfoSave: () => Promise<any>;
    setContactInfo: React.Dispatch<React.SetStateAction<Partial<CardData>>>;
    currentGroupName: string;
    toggleChecklistItem: (item: string) => Promise<any>;
    handleToggleCheckIn: (checkIn: CheckIn) => Promise<any>;
    checklistProgress: number;
    isAddingPayment: boolean;
    setIsAddingPayment: (val: boolean) => void;
    newPayment: any;
    setNewPayment: any;
    handleSavePaymentMethod: () => Promise<any>;
    isAddingCheckIn: boolean;
    setIsAddingCheckIn: (val: boolean) => void;
    newCheckIn: string;
    setNewCheckIn: (val: string) => void;
    handleSaveCheckIn: () => Promise<any>;
    editingCheckInId: string | null;
    setEditingCheckInId: (id: string | null) => void;
    editText: string;
    setEditText: (val: string) => void;
    handleSaveEditedCheckIn: () => Promise<any>;
    handleEditCheckIn: (checkIn: CheckIn) => void;
    handleDeleteCheckIn: (id: string) => Promise<any>;
    isAddingNote: boolean;
    setIsAddingNote: (val: boolean) => void;
    newNote: string;
    setNewNote: (val: string) => void;
    handleSaveNote: () => Promise<any>;
    editingNoteId: string | null;
    setEditingNoteId: (id: string | null) => void;
    handleEditNote: (note: Note) => void;
    handleDeleteNote: (id: string) => Promise<any>;
    handleSaveEditedNote: () => Promise<any>;
    newHistoryComment: string;
    setNewHistoryComment: (val: string) => void;
    handleSaveHistoryComment: () => Promise<any>;
    crmId: string | null | undefined;
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    setActiveTab,
    isEditing,
    setIsEditing,
    liveCardData,
    contactInfo,
    handleInfoChange,
    handleInfoSave,
    setContactInfo,
    currentGroupName,
    toggleChecklistItem,
    handleToggleCheckIn,
    checklistProgress,
    isAddingPayment,
    setIsAddingPayment,
    newPayment,
    setNewPayment,
    handleSavePaymentMethod,
    isAddingCheckIn,
    setIsAddingCheckIn,
    newCheckIn,
    setNewCheckIn,
    handleSaveCheckIn,
    editingCheckInId,
    setEditingCheckInId,
    editText,
    setEditText,
    handleSaveEditedCheckIn,
    handleEditCheckIn,
    handleDeleteCheckIn,
    isAddingNote,
    setIsAddingNote,
    newNote,
    setNewNote,
    handleSaveNote,
    editingNoteId,
    setEditingNoteId,
    handleEditNote,
    handleDeleteNote,
    handleSaveEditedNote,
    newHistoryComment,
    setNewHistoryComment,
    handleSaveHistoryComment,
    crmId
}) => {
    const renderSidebarContent = () => {
        switch (activeTab) {
            case 'perfil':
                return (
                    <ProfileTab
                        liveCardData={liveCardData}
                        contactInfo={contactInfo}
                        isEditing={isEditing}
                        handleInfoChange={handleInfoChange}
                        handleInfoSave={handleInfoSave}
                        setIsEditing={setIsEditing}
                        setContactInfo={setContactInfo}
                        currentGroupName={currentGroupName}
                        toggleChecklistItem={toggleChecklistItem}
                        handleToggleCheckIn={handleToggleCheckIn}
                        checklistProgress={checklistProgress}
                        crmId={crmId}
                    />
                );
            case 'pagos':
                return (
                    <PaymentsTab
                        liveCardData={liveCardData}
                        isAddingPayment={isAddingPayment}
                        setIsAddingPayment={setIsAddingPayment}
                        newPayment={newPayment}
                        setNewPayment={setNewPayment}
                        handleSavePaymentMethod={handleSavePaymentMethod}
                        serviceType={contactInfo.serviceType as string}
                        setServiceType={(type) => setContactInfo(prev => ({ ...prev, serviceType: type }))}
                        serviceDetails={contactInfo.serviceDetails as string}
                        setServiceDetails={(val) => setContactInfo(prev => ({ ...prev, serviceDetails: val }))}
                    />
                );
            case 'notas':
                return (
                    <NotesTab
                        liveCardData={liveCardData}
                        isAddingCheckIn={isAddingCheckIn}
                        setIsAddingCheckIn={setIsAddingCheckIn}
                        newCheckIn={newCheckIn}
                        setNewCheckIn={setNewCheckIn}
                        handleSaveCheckIn={handleSaveCheckIn}
                        handleToggleCheckIn={handleToggleCheckIn}
                        editingCheckInId={editingCheckInId}
                        setEditingCheckInId={setEditingCheckInId}
                        editText={editText}
                        setEditText={setEditText}
                        handleSaveEditedCheckIn={handleSaveEditedCheckIn}
                        handleEditCheckIn={handleEditCheckIn}
                        handleDeleteCheckIn={handleDeleteCheckIn}
                        isAddingNote={isAddingNote}
                        setIsAddingNote={setIsAddingNote}
                        newNote={newNote}
                        setNewNote={setNewNote}
                        handleSaveNote={handleSaveNote}
                        editingNoteId={editingNoteId}
                        setEditingNoteId={setEditingNoteId}
                        handleEditNote={handleEditNote}
                        handleDeleteNote={handleDeleteNote}
                        handleSaveEditedNote={handleSaveEditedNote}
                        checklistProgress={checklistProgress}
                        currentGroupName={currentGroupName}
                    />
                );
            case 'historial':
                return (
                    <HistoryTab
                        liveCardData={liveCardData}
                        newHistoryComment={newHistoryComment}
                        setNewHistoryComment={setNewHistoryComment}
                        handleSaveHistoryComment={handleSaveHistoryComment}
                    />
                );
            default:
                return null;
        }
    };
    return (
        <div className="flex flex-col h-full w-full bg-neutral-900/40">
            {/* Header - Fixed (Hidden per user request) */}
            <div className="hidden">
                <h2 className="font-bold text-xs text-neutral-400 uppercase tracking-[0.2em]">
                    {activeTab === 'perfil' && 'PERFIL'}
                    {activeTab === 'pagos' && 'PAGOS'}
                    {activeTab === 'notas' && 'NOTAS'}
                    {activeTab === 'historial' && 'HISTORIAL'}
                </h2>
                <button
                    onClick={() => setActiveTab(null)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-500 hover:text-white transition-colors"
                    title="Minimizar panel lateral"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 min-h-0 bg-neutral-950">
                <AnimatePresence initial={false}>
                    {activeTab && (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="h-full w-full"
                        >
                            {renderSidebarContent()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

        </div>
    );
};
