import React, { useState, useRef, useEffect } from 'react';
import { User, Phone, MapPin, Mail, Globe, Tag, Clock, Calendar, ChevronRight, FileText, CheckCircle, Link, Copy, Check, X } from 'lucide-react';
import { useConversationLogic } from '../../whatsapp/components/ConversationModal/hooks/useConversationLogic';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ContactPanelProps {
    card: any;
    groups: any[];
}

export default function ContactPanel({ card, groups }: ContactPanelProps) {
    const [activeTab, setActiveTab] = useState('details'); // details, past_chats, notes
    const [copied, setCopied] = useState(false);
    const [showLabelInput, setShowLabelInput] = useState(false);
    const [showLabelDropdown, setShowLabelDropdown] = useState(false);
    const [newLabelText, setNewLabelText] = useState('');
    const labelContainerRef = useRef<HTMLDivElement>(null);

    const PREDEFINED_LABELS = ['Sales', 'Support', 'Urgent'];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (labelContainerRef.current && !labelContainerRef.current.contains(event.target as Node)) {
                setShowLabelInput(false);
                setShowLabelDropdown(false);
                setNewLabelText('');
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    
    // Initialize logic just for operations like Notes
    const logic = useConversationLogic({
        isOpen: true,
        onClose: () => {},
        card,
        groups
    });

    const contactName = card?.contactName || card?.contactNumber || 'Desconocido';
    const groupName = groups.find(g => g.id === card?.groupId)?.name;
    const assignee = logic.liveCardData?.assignedTo || card?.assignedTo || 'Unassigned';

    // Simulated list of agents (could be fetched from a 'users' collection later)
    const agents = ['Sistema', 'Unassigned'];

    return (
        <div className="w-[320px] bg-[#0d0d0d] border-l border-neutral-900 flex flex-col h-full flex-shrink-0 overflow-y-auto">

            {/* Contact Header */}
            <div className="p-4 flex flex-col items-center justify-center border-b border-neutral-900 bg-neutral-900/10">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg ring-4 ring-neutral-900 mb-2">
                    {contactName.charAt(0).toUpperCase()}
                </div>
                <h2 className="font-semibold text-white tracking-wide text-sm text-center">{contactName}</h2>
                {card?.contactEmail && <p className="text-neutral-500 text-[11px] mt-0.5">{card.contactEmail}</p>}

                <div className="flex gap-1.5 mt-3">
                    <button className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[10px] font-bold transition-colors ring-1 ring-inset ring-neutral-700/50 uppercase tracking-tight">Edit</button>
                    <button className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[10px] font-bold transition-colors ring-1 ring-inset ring-neutral-700/50 uppercase tracking-tight">Merge</button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-900 px-1 sticky top-0 bg-[#0d0d0d] z-10">
                <button
                    onClick={() => setActiveTab('details')}
                    className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'details' ? 'border-blue-500 text-blue-400' : 'border-transparent text-neutral-500 hover:text-neutral-400'}`}
                >
                    Details
                </button>
                <button
                    onClick={() => setActiveTab('past_chats')}
                    className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'past_chats' ? 'border-blue-500 text-blue-400' : 'border-transparent text-neutral-500 hover:text-neutral-400'}`}
                >
                    History
                </button>
                <button
                    onClick={() => setActiveTab('notes')}
                    className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'notes' ? 'border-blue-500 text-blue-400' : 'border-transparent text-neutral-500 hover:text-neutral-400'}`}
                >
                    Notes
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-5">

                {activeTab === 'details' && (
                    <div className="space-y-4">

                        {/* Application Link Block */}
                        <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center text-neutral-400">
                                        <Link size={13} />
                                    </div>
                                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Link de Aplicación</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
                                    onClick={async () => {
                                        let finalId = logic.crmId;
                                        if (!finalId || (typeof finalId === 'string' && finalId.startsWith('temp-'))) {
                                            try {
                                                const savedId = await logic.handleSaveNote() as unknown as string; // Reusing logic to ensure ID exists
                                                if (savedId) finalId = savedId;
                                            } catch (e) {
                                                finalId = (card?.contactNumber || logic.liveCardData?.contactNumber || '').replace(/[^\d]/g, '');
                                            }
                                        }
                                        if (finalId) {
                                            const link = `${window.location.origin}/application/${finalId}`;
                                            navigator.clipboard.writeText(link);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                            toast.success("Link copiado al portapapeles");
                                        } else {
                                            toast.error("No se pudo generar el link.");
                                        }
                                    }}
                                >
                                    {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                </Button>
                            </div>
                            <p className="text-[10px] text-neutral-600 leading-tight">
                                Envía este link al cliente para sincronizar datos automáticamente.
                            </p>
                        </div>

                        {/* Status */}
                        <div>
                            <h3 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-2">Attributes</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[12px]">
                                    <span className="text-neutral-500 flex items-center font-medium"><CheckCircle size={12} className="mr-2 opacity-50" /> Status</span>
                                    <span className="text-right bg-blue-500/10 text-blue-400 font-bold px-1.5 py-0 rounded text-[10px] uppercase ring-1 ring-inset ring-blue-500/20">{groupName || 'Abierto'}</span>
                                </div>
                                <div className="flex justify-between items-center text-[12px]">
                                    <span className="text-neutral-500 flex items-center font-medium"><User size={12} className="mr-2 opacity-50" /> Assignee</span>
                                    <select 
                                        className="bg-neutral-800 text-neutral-300 font-bold px-1.5 py-0 text-[11px] rounded cursor-pointer focus:outline-none ring-1 ring-inset ring-neutral-700/50"
                                        value={assignee}
                                        onChange={(e) => logic.handleUpdateAssignee?.(e.target.value)}
                                    >
                                        {agents.map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Custom Attributes */}
                        <div className="pt-2">
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Contact Details</h3>
                            <div className="space-y-3">
                                <div className="flex items-center text-sm">
                                    <Phone size={14} className="text-neutral-500 mr-3" />
                                    <span className="text-white font-medium">{card?.contactNumber || 'No especificado'}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Globe size={14} className="text-neutral-500 mr-3" />
                                    <span className="text-white font-medium">{card?.country || 'Desconocido'}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Clock size={14} className="text-neutral-500 mr-3" />
                                    <span className="text-white font-medium">Activo {card?.source || 'WhatsApp'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Labels */}
                        <div className="pt-2 relative" ref={labelContainerRef}>
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                                Labels
                                <button 
                                    onClick={() => {
                                        setShowLabelDropdown(!showLabelDropdown);
                                        setShowLabelInput(false);
                                    }}
                                    className="text-blue-500 hover:text-blue-400 text-2xl font-light leading-none mb-1 transition-colors"
                                >
                                    +
                                </button>
                            </h3>
                            
                            {showLabelDropdown && (
                                <div className="absolute right-0 top-8 w-40 bg-[#111] border border-neutral-800 rounded-md shadow-2xl z-20 py-1 overflow-hidden">
                                    {PREDEFINED_LABELS.filter(l => !logic.liveCardData?.labels?.includes(l)).map(label => {
                                        const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
                                        const colorClass = colors[label.length % colors.length];
                                        return (
                                            <button
                                                key={`dropdown-${label}`}
                                                onClick={() => {
                                                    logic.handleAddLabel?.(label);
                                                    setShowLabelDropdown(false);
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors flex items-center gap-2"
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${colorClass}`}></span>
                                                {label}
                                            </button>
                                        );
                                    })}
                                    {PREDEFINED_LABELS.filter(l => !logic.liveCardData?.labels?.includes(l)).length > 0 && (
                                        <div className="h-px bg-neutral-800/50 my-1"></div>
                                    )}
                                    <button
                                        onClick={() => {
                                            setShowLabelDropdown(false);
                                            setShowLabelInput(true);
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs text-blue-400 hover:bg-neutral-800 transition-colors font-medium"
                                    >
                                        + Nueva etiqueta
                                    </button>
                                </div>
                            )}

                            {showLabelInput && (
                                <div className="mb-3 flex gap-2">
                                    <input 
                                        autoFocus
                                        type="text" 
                                        value={newLabelText}
                                        onChange={(e) => setNewLabelText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newLabelText.trim()) {
                                                logic.handleAddLabel?.(newLabelText.trim());
                                                setNewLabelText('');
                                                setShowLabelInput(false);
                                            } else if (e.key === 'Escape') {
                                                setNewLabelText('');
                                                setShowLabelInput(false);
                                            }
                                        }}
                                        placeholder="Nueva etiqueta..."
                                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                                    />
                                    <button 
                                        onClick={() => {
                                            if (newLabelText.trim()) {
                                                logic.handleAddLabel?.(newLabelText.trim());
                                            }
                                            setNewLabelText('');
                                            setShowLabelInput(false);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                {(logic.liveCardData?.labels || []).map((label: string, idx: number) => {
                                    // Deterministic color logic based on string length/char to make it look colorful but consistent
                                    const colors = [
                                        'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
                                        'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
                                    ];
                                    const colorClass = colors[label.length % colors.length];

                                    return (
                                        <span 
                                            key={`${label}-${idx}`}
                                            className={`group relative ${colorClass}/20 border ${colorClass.replace('bg-', 'border-')}/30 ${colorClass.replace('bg-', 'text-')} text-xs px-2 py-1 rounded-md font-medium flex items-center ring-1 ring-inset ${colorClass.replace('bg-', 'ring-')}/10 hover:${colorClass}/30 transition-colors`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${colorClass} mr-1.5`}></span>
                                            {label}
                                            <button 
                                                onClick={() => logic.handleRemoveLabel?.(label)}
                                                className={`ml-1.5 opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:${colorClass}/40 transition-opacity`}
                                                title="Eliminar etiqueta"
                                            >
                                                <X size={10} className="stroke-[3]" />
                                            </button>
                                        </span>
                                    );
                                })}
                                {(!logic.liveCardData?.labels || logic.liveCardData.labels.length === 0) && !showLabelInput && (
                                    <span className="text-neutral-600 text-[10px] italic">Sin etiquetas</span>
                                )}
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'past_chats' && (
                    <div className="space-y-4">
                        <div className="text-sm text-neutral-400 pb-2">Activity history for this conversation.</div>
                        <div className="space-y-3">
                            {(logic.liveCardData?.history || []).slice().reverse().map((event: any) => (
                                <div key={event.id} className="p-3 border border-neutral-800 bg-neutral-900 rounded-lg">
                                    <div className="flex justify-between text-[10px] mb-1">
                                        <span className="font-bold text-blue-400 uppercase tracking-tighter">{event.type}</span>
                                        <span className="text-neutral-500">{event.timestamp?.toDate ? event.timestamp.toDate().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                    </div>
                                    <p className="text-[13px] text-neutral-300">{event.content}</p>
                                    <div className="text-[10px] text-neutral-600 mt-1.5">Por: {event.author}</div>
                                </div>
                            ))}
                            {(!logic.liveCardData?.history || logic.liveCardData.history.length === 0) && (
                                <div className="text-center py-10 text-neutral-600 italic text-sm">No activity recorded yet.</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                            {(logic.liveCardData?.notes || []).map((note: any) => (
                                <div key={note.id} className="p-3 bg-neutral-900 border border-neutral-800 rounded-md">
                                    <p className="text-xs text-white mb-1.5 whitespace-pre-wrap">{note.text}</p>
                                    <div className="flex justify-between items-center text-[10px] text-neutral-500">
                                        <span>{note.timestamp?.toDate ? note.timestamp.toDate().toLocaleDateString() : ''}</span>
                                        <span>{note.author}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <textarea
                            className="w-full h-24 bg-neutral-900 border border-neutral-800 rounded-md p-3 text-sm text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none transition-shadow"
                            placeholder="Add a private note..."
                            value={logic.newNote}
                            onChange={(e) => logic.setNewNote(e.target.value)}
                        ></textarea>
                        <button 
                            onClick={logic.handleSaveNote}
                            disabled={!logic.newNote.trim()}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md mt-3 transition-colors"
                        >
                            Save Note
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
