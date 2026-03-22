import React from 'react';

interface NotesTabProps {
    liveCardData: any;
    isAddingCheckIn: boolean;
    setIsAddingCheckIn: (val: boolean) => void;
    newCheckIn: string;
    setNewCheckIn: (val: string) => void;
    handleSaveCheckIn: () => Promise<any>;
    handleToggleCheckIn: (checkIn: any) => Promise<any>;
    editingCheckInId: string | null;
    setEditingCheckInId: (id: string | null) => void;
    editText: string;
    setEditText: (val: string) => void;
    handleSaveEditedCheckIn: () => Promise<any>;
    handleEditCheckIn: (checkIn: any) => void;
    handleDeleteCheckIn: (id: string) => Promise<any>;
    isAddingNote: boolean;
    setIsAddingNote: (val: boolean) => void;
    newNote: string;
    setNewNote: (val: string) => void;
    handleSaveNote: () => Promise<any>;
    editingNoteId: string | null;
    setEditingNoteId: (id: string | null) => void;
    handleEditNote: (note: any) => void;
    handleDeleteNote: (id: string) => Promise<any>;
    handleSaveEditedNote: () => Promise<any>;
    checklistProgress: number;
    currentGroupName: string;
}

export const NotesTab: React.FC<NotesTabProps> = () => {
    return (
        <div className="p-6 text-neutral-400 text-sm italic">
            Componente de Notas (Temporalmente no disponible)
        </div>
    );
};

