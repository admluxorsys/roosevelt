import React from 'react';
import { CheckCircle, CheckCheck, User, Edit2, Trash2, FileText, ChevronDown, FileSpreadsheet, ChevronRight } from 'lucide-react';
import FilePreviewModal from '../FilePreviewModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CardData, Note, CheckIn } from '../types';

interface NotesTabProps {
    liveCardData: CardData | null;
    isAddingCheckIn: boolean;
    setIsAddingCheckIn: (val: boolean) => void;
    newCheckIn: string;
    setNewCheckIn: (val: string) => void;
    handleSaveCheckIn: () => Promise<void>;
    handleToggleCheckIn: (checkIn: CheckIn) => Promise<void>;
    editingCheckInId: string | null;
    setEditingCheckInId: (id: string | null) => void;
    editText: string;
    setEditText: (val: string) => void;
    handleSaveEditedCheckIn: () => Promise<void>;
    handleEditCheckIn: (checkIn: CheckIn) => void;
    handleDeleteCheckIn: (id: string) => Promise<void>;
    isAddingNote: boolean;
    setIsAddingNote: (val: boolean) => void;
    newNote: string;
    setNewNote: (val: string) => void;
    handleSaveNote: () => Promise<void>;
    editingNoteId: string | null;
    setEditingNoteId: (id: string | null) => void;
    handleEditNote: (note: Note) => void;
    handleDeleteNote: (id: string) => Promise<void>;
    handleSaveEditedNote: () => Promise<void>;
    checklistProgress: number;
    currentGroupName: string;
}

export const NotesTab: React.FC<NotesTabProps> = ({
    liveCardData,
    isAddingCheckIn,
    setIsAddingCheckIn,
    newCheckIn,
    setNewCheckIn,
    handleSaveCheckIn,
    handleToggleCheckIn,
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
    checklistProgress,
    currentGroupName
}) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = React.useState(false);
    const [previewFile, setPreviewFile] = React.useState<{ url: string; name: string; type: string } | null>(null);

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            setShowScrollButton(scrollHeight - scrollTop > clientHeight + 50);
        }
    };

    React.useEffect(() => {
        const timer = setTimeout(checkScroll, 100);
        return () => clearTimeout(timer);
    }, [liveCardData, isAddingCheckIn, isAddingNote]);

    return (
        <div className="relative flex-1 flex flex-col min-h-0 h-full overflow-hidden">
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex-1 overflow-y-auto custom-scrollbar p-5 pb-24"
            >
                {/* New Operative Checklist Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                            <h5 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-1">
                                OPERATIVE CHECKLIST
                            </h5>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-neutral-300">
                                {checklistProgress}%
                            </span>
                            <Button
                                onClick={() => setIsAddingCheckIn(true)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-neutral-600 hover:text-white rounded-full hover:bg-neutral-800 border border-neutral-800/50"
                            >
                                <CheckCheck size={14} />
                            </Button>
                        </div>
                    </div>
                    <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800/30">
                        <div
                            className="h-full bg-neutral-600 transition-all duration-1000 ease-out"
                            style={{ width: `${checklistProgress}%` }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Columna 1: Check-ins */}
                    <div className="flex flex-col">

                        {isAddingCheckIn && (
                            <div className="mb-4 pl-2 border-l-2 border-neutral-500/50">
                                <Textarea
                                    value={newCheckIn}
                                    onChange={(e) => setNewCheckIn(e.target.value)}
                                    placeholder="Nuevo hito..."
                                    className="bg-transparent border-none min-h-[60px] p-0 text-white placeholder:text-neutral-700 text-[11px] resize-none focus:ring-0 leading-tight"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <Button variant="ghost" onClick={() => setIsAddingCheckIn(false)} className="text-[9px] h-5 font-medium text-neutral-600 uppercase tracking-wider hover:text-neutral-400 p-0">Cancel</Button>
                                    <Button variant="ghost" onClick={handleSaveCheckIn} className="text-[9px] h-5 font-medium text-neutral-400 uppercase tracking-wider hover:text-neutral-200 p-0 ml-2">Save</Button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col">
                            {Array.isArray(liveCardData?.checkIns) && liveCardData.checkIns.length > 0 ? (
                                liveCardData.checkIns.map((checkIn) => (
                                    <div key={checkIn.id} className={cn(
                                        "group flex items-start gap-3 px-3 py-2 hover:bg-white/[0.02] transition-colors rounded-xl mb-0.5",
                                        checkIn.completed ? "opacity-40" : ""
                                    )}>
                                        <button
                                            onClick={() => handleToggleCheckIn(checkIn)}
                                            className={cn(
                                                "mt-1 w-5 h-5 rounded-[4px] flex items-center justify-center flex-shrink-0 transition-all border-2",
                                                checkIn.completed
                                                    ? "bg-neutral-600 border-neutral-600 text-white"
                                                    : "bg-transparent border-neutral-800 hover:border-neutral-600 text-transparent"
                                            )}
                                        >
                                            <CheckCheck size={12} className={checkIn.completed ? "block" : "hidden"} />
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            {editingCheckInId === checkIn.id ? (
                                                <div className="w-full">
                                                    <Textarea
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        className="min-h-[40px] bg-transparent border-b border-neutral-700 p-0 text-neutral-200 resize-none text-[12px] focus:ring-0 rounded-none leading-tight"
                                                        autoFocus
                                                        onBlur={handleSaveEditedCheckIn}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1.5">
                                                    <p className={cn(
                                                        "text-[13px] leading-tight break-words font-medium transition-all px-1",
                                                        checkIn.completed ? "line-through text-neutral-600 opacity-60" : "text-neutral-200"
                                                    )}>
                                                        {checkIn.text}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                                                            {checkIn.timestamp?.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                            <button onClick={() => setEditingCheckInId(checkIn.id)} className="p-1.5 text-neutral-600 hover:text-neutral-400 transition-colors"><Edit2 size={12} /></button>
                                                            <button onClick={() => handleDeleteCheckIn(checkIn.id)} className="p-1.5 text-neutral-600 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center opacity-20 italic text-[9px] font-medium uppercase tracking-widest">No milestones</div>
                            )}
                        </div>
                    </div>

                    {/* Columna 2: Notas */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-2 sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-sm z-10 py-1 border-b border-neutral-800/50">
                            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] px-1">
                                NOTAS Y COMENTARIOS
                            </h3>
                            <Button
                                onClick={() => setIsAddingNote(true)}
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 text-neutral-600 hover:text-white rounded-full hover:bg-neutral-800"
                            >
                                <FileText size={12} />
                            </Button>
                        </div>

                        {isAddingNote && (
                            <div className="mb-4 pl-2 border-l-2 border-neutral-700/50">
                                <Textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Nueva nota..."
                                    className="bg-transparent border-none min-h-[80px] p-0 text-white placeholder:text-neutral-700 text-[11px] resize-none focus:ring-0 leading-tight"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <Button variant="ghost" onClick={() => setIsAddingNote(false)} className="text-[9px] h-5 font-medium text-neutral-600 uppercase tracking-wider hover:text-neutral-400 p-0">Cancel</Button>
                                    <Button variant="ghost" onClick={handleSaveNote} className="text-[9px] h-5 font-medium text-neutral-500 uppercase tracking-wider hover:text-neutral-300 p-0 ml-2">Save</Button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col">
                            {Array.isArray(liveCardData?.notes) && liveCardData.notes.length > 0 ? (
                                liveCardData.notes.map((note) => (
                                    <div key={note.id} className="group flex flex-col gap-1 px-2 py-4 hover:bg-white/[0.02] transition-colors rounded-md border-b border-transparent">
                                        {editingNoteId === note.id ? (
                                            <div className="space-y-2">
                                                <Textarea
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    className="min-h-[60px] bg-transparent border-b border-neutral-700 p-0 text-neutral-200 resize-none text-[10px] font-mono focus:ring-0 rounded-none leading-tight"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="ghost" onClick={() => setEditingNoteId(null)} className="text-[9px] h-4 p-0 text-neutral-600 hover:text-white">Cancel</Button>
                                                    <Button variant="ghost" onClick={handleSaveEditedNote} className="text-[9px] h-4 p-0 text-neutral-300 hover:text-white">Save</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <p className="text-[13px] text-neutral-200 font-medium leading-relaxed whitespace-pre-wrap break-words">{note.text}</p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-medium text-neutral-500 uppercase tracking-wider">{note.author || 'INTEL'}</span>
                                                        <span className="text-[9px] text-neutral-800">|</span>
                                                        <span className="text-[9px] text-neutral-500 font-medium uppercase tracking-wider">
                                                            {note.timestamp?.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditNote(note)} className="p-1 text-neutral-600 hover:text-neutral-400"><Edit2 size={10} /></button>
                                                        <button onClick={() => handleDeleteNote(note.id)} className="p-1 text-neutral-600 hover:text-red-400"><Trash2 size={10} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center opacity-20 italic text-[9px] font-medium uppercase tracking-widest">No insights</div>
                            )}
                        </div>
                    </div>

                    {/* Columna 3: Documentos (Migrated from Profile) */}
                    <div className="flex flex-col mt-4">
                        <div className="flex items-center justify-between mb-2 sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-sm z-10 py-1 border-b border-neutral-800/50">
                            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] px-1">
                                DOCUMENTOS
                            </h3>
                        </div>
                        <div className="space-y-2 mt-2">
                            {liveCardData?.documents && liveCardData.documents.length > 0 ? (
                                liveCardData.documents.map((doc, idx) => (
                                    <div
                                        key={doc.id || idx}
                                        onClick={() => setPreviewFile({ url: doc.url, name: doc.name || 'documento', type: doc.type || '' })}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/50 hover:border-neutral-700/50 hover:bg-neutral-900 transition-all group cursor-pointer"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-neutral-200 transition-colors">
                                            {doc.name?.toLowerCase().endsWith('.xls') || doc.name?.toLowerCase().endsWith('.xlsx') ? (
                                                <FileSpreadsheet size={16} />
                                            ) : (
                                                <FileText size={16} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-semibold text-neutral-200 truncate group-hover:text-white mb-0.5">{doc.name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">{doc.type?.split('/')[1] || doc.name?.split('.').pop() || 'FILE'}</span>
                                                <span className="text-[10px] text-neutral-700">•</span>
                                                <span className="text-[8px] text-neutral-500 font-medium tracking-tight">{formatBytes(doc.size || 0)}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={12} className="text-neutral-600 group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 rounded-xl border border-dashed border-neutral-800/50 flex flex-col items-center justify-center text-center gap-2 text-neutral-500 bg-neutral-900/10">
                                    <FileSpreadsheet size={18} className="opacity-10" />
                                    <p className="text-[9px] font-medium italic opacity-60 uppercase tracking-widest">No documents</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>


                {/* File Preview Modal */}
                <FilePreviewModal
                    isOpen={!!previewFile}
                    onClose={() => setPreviewFile(null)}
                    fileUrl={previewFile?.url || ''}
                    fileName={previewFile?.name || ''}
                    fileType={previewFile?.type || ''}
                />
            </div>
        </div>
    );
};
