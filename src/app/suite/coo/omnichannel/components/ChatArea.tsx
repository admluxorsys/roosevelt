import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Info, Send, Paperclip, Smile, Image as ImageIcon, FileText, Loader2, Zap, User, XCircle, Ban, Mic, X, Plus, MapPin, Contact2, AlertCircle, RefreshCw } from 'lucide-react';
import { useConversationLogic } from '../../whatsapp/components/ConversationModal/hooks/useConversationLogic';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ChatAreaProps {
    card: any;
    groups: any[];
    groupName: string;
    allConversations: any[];
    toggleContactPanel: () => void;
}

const QUICK_REPLIES = [
    { id: 'greet', label: 'Saludo Inicial', text: '¡Hola! ¿En qué podemos ayudarte hoy?' },
    { id: 'wait', label: 'Esperar un Momento', text: 'Un momento por favor, estoy revisando tu solicitud...' },
    { id: 'pricing', label: 'Info Precios', text: 'Nuestros planes comienzan desde $50/mes. ¿Te gustaría ver el catálogo completo?' },
    { id: 'bye', label: 'Despedida', text: '¡Gracias por contactarnos! Que tengas un excelente día.' },
];

export default function ChatArea({ card, groups, groupName, allConversations, toggleContactPanel }: ChatAreaProps) {
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const moreMenuRef = useRef<HTMLDivElement>(null);
    const attachmentsRef = useRef<HTMLDivElement>(null);

    // --- Audio Recording State --- //
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const formatRecordingTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `Audio-${Date.now()}.webm`, { type: 'audio/webm' });
                
                
                logic.setSelectedFile(audioFile);
                logic.setFilePreviewUrl(URL.createObjectURL(audioFile));
                
                // stream.getTracks().forEach(track => track.stop());
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (error) {
            console.error('Error al acceder al micrófono:', error);
            toast.error('No se pudo acceder al micrófono para grabar.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop(); 
            audioChunksRef.current = []; // Discard
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    // Close menus when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setShowMoreMenu(false);
            }
            if (attachmentsRef.current && !attachmentsRef.current.contains(event.target as Node)) {
                setShowAttachments(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Clear unread count when conversation is opened
    useEffect(() => {
        const hasUnread = (card?.unreadCount || 0) > 0;
        const hasFocus = document.hasFocus();
        
        if (card?.id && hasUnread && hasFocus) {
            console.log(`[ChatArea] Resetting unreadCount for ${card.id} (Current: ${card.unreadCount})`);
            const cardRef = doc(db, 'kanban-groups', card.groupId, 'cards', card.id);
            updateDoc(cardRef, { unreadCount: 0 }).catch(err => {
                console.error("[ChatArea] Error clearing unread count:", err);
            });
        } else if (card?.id && hasUnread) {
            console.log(`[ChatArea] Card ${card.id} has unread but NO FOCUS. Skipping reset.`);
        }
    }, [card?.id, card?.unreadCount, card?.groupId]);
    const logic = useConversationLogic({
        isOpen: true,
        onClose: () => {},
        card: card,
        groupName: groupName,
        groups: groups,
        allConversations: allConversations
    });

    // Auto-scroll to bottom
    useEffect(() => {
        if (logic.messagesEndRef.current) {
            logic.messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
    }, [card?.id, logic.liveCardData?.messages?.length]);

    const contactName = card?.contactName || card?.contactNumber || 'Desconocido';
    const isOnline = card?.isOnline ?? true; // Use real status if available

    const handleSelectQuickReply = (text: string) => {
        logic.setNewMessage(text);
        setShowQuickReplies(false);
    };

    const handleCloseConversation = () => {
        toast.info('Cerrando conversación...');
        setShowMoreMenu(false);
        // Implement logic to update card status in Firebase to 'closed'
    };

    const handleBlockContact = () => {
        logic.handleToggleBlock();
        setShowMoreMenu(false);
    };

    return (
        <div className="flex-1 flex flex-col h-full relative">

            {/* Header */}
            <div className="h-12 border-b border-neutral-800 bg-[#111] flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white text-[11px] shadow-sm">
                        {contactName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="font-semibold text-white tracking-tight text-[13px]">{contactName}</h2>
                        <div className="flex items-center text-[10px] text-neutral-500 min-h-[16px]">
                            {card?.presence === 'typing' ? (
                                <span className="text-blue-500 italic animate-pulse font-medium">Escribiendo...</span>
                            ) : card?.presence === 'recording' ? (
                                <span className="text-blue-500 italic animate-pulse font-medium flex items-center gap-1">
                                    <Mic size={10} /> Grabando audio...
                                </span>
                            ) : (
                                <>
                                    <span className={`w-1 h-1 rounded-full mr-1.5 inline-block ${isOnline ? 'bg-green-500' : 'bg-neutral-500'}`}></span>
                                    {isOnline ? 'Online' : 'Offline'}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-1 text-neutral-500">
                    <button className="p-1.5 hover:bg-neutral-800 rounded transition-colors" title="Mark as Unread">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </button>
                    <button className="p-1.5 hover:bg-neutral-800 rounded transition-colors" title="Contact Info" onClick={toggleContactPanel}>
                        <Info size={16} />
                    </button>
                    <div className="relative" ref={moreMenuRef}>
                        <button 
                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                            className={`p-2 transition-colors rounded-md ${showMoreMenu ? 'text-white bg-neutral-800' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                            title="More Actions"
                        >
                            <MoreVertical size={20} />
                        </button>

                        {/* More Menu Popover */}
                        {showMoreMenu && (
                            <div className="absolute top-full right-0 mt-2 w-52 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-1">
                                    <button 
                                        className="w-full flex items-center px-3 py-2.5 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors rounded-md group text-left"
                                        onClick={() => {
                                            setShowMoreMenu(false);
                                            toggleContactPanel();
                                        }}
                                    >
                                        <User size={14} className="mr-3 text-neutral-500 group-hover:text-blue-400" />
                                        Ver Perfil del Contacto
                                    </button>
                                    <div className="h-px bg-neutral-800 my-1 mx-2" />
                                    <button 
                                        className="w-full flex items-center px-3 py-2.5 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors rounded-md group text-left"
                                        onClick={handleCloseConversation}
                                    >
                                        <XCircle size={14} className="mr-3 text-neutral-500 group-hover:text-yellow-500" />
                                        Finalizar Conversación
                                    </button>
                                    <button 
                                        className={`w-full flex items-center px-3 py-2.5 text-xs transition-colors rounded-md group text-left ${logic.liveCardData?.isBlocked ? 'text-green-400 hover:bg-green-500/10' : 'text-red-400 hover:bg-red-500/10'}`}
                                        onClick={handleBlockContact}
                                    >
                                        <Ban size={14} className={`mr-3 group-hover:text-current ${logic.liveCardData?.isBlocked ? 'text-green-500' : 'text-red-500'}`} />
                                        {logic.liveCardData?.isBlocked ? 'Desbloquear Contacto' : 'Bloquear Contacto'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#0a0a0a] space-y-3 no-scrollbar">
                {Object.entries(logic.groupedMessages).map(([date, msgs], dateIdx) => (
                    <React.Fragment key={date}>
                        <div className="text-center text-[10px] text-neutral-600 my-4 uppercase tracking-widest font-bold opacity-60">{date}</div>

                        {(msgs as any[]).map((msg: any, msgIdx: number) => (
                            <div key={msgIdx} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender !== 'agent' && (
                                    <div className="w-6 h-6 rounded-full bg-neutral-800 mr-2 flex-shrink-0 self-end mb-1 flex items-center justify-center text-[10px] font-bold text-neutral-500">
                                        {contactName.charAt(0).toUpperCase()}
                                    </div>
                                )}

                                <div className={`max-w-[75%] group ${msg.sender === 'agent' ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>

                                    <div className={`px-2.5 py-1.5 rounded-xl relative ${msg.sender === 'agent'
                                            ? 'bg-blue-600 text-white rounded-br-none shadow-lg'
                                            : 'bg-neutral-800 text-neutral-200 rounded-bl-none shadow-sm'
                                        }`}>
                                        
                                        {/* File Support */}
                                        {msg.fileUrl && (
                                            <div className="mb-1.5">
                                                {msg.fileType?.startsWith('image/') ? (
                                                    <img src={msg.fileUrl} alt={msg.fileName} className="max-w-full rounded max-h-40" />
                                                ) : (
                                                    <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 underline text-[11px] opacity-80 hover:opacity-100">
                                                        <FileText size={12} /> {msg.fileName || 'Archivo'}
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        <p className="text-[13px] leading-snug whitespace-pre-wrap">{msg.text}</p>
                                    </div>

                                    <div className="flex items-center mt-0.5 text-[9px] text-neutral-600 px-1 font-bold">
                                        <span>{msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                        {msg.sender === 'agent' && (
                                            msg.status === 'sending' ? (
                                                <Loader2 size={10} className="ml-1 animate-spin text-neutral-500" />
                                            ) : msg.status === 'failed' ? (
                                                <div className="ml-2 flex items-center gap-1 bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded cursor-pointer hover:bg-red-500/20 transition-colors" onClick={() => logic.retryMessage?.(msg)}>
                                                    <AlertCircle size={10} />
                                                    <span>Error - Reintentar</span>
                                                    <RefreshCw size={10} className="ml-0.5" />
                                                </div>
                                            ) : (
                                                <span className={`ml-1 flex items-center ${msg.status === 'read' ? 'text-blue-400' : 'text-neutral-600'}`}>
                                                    {msg.status === 'sent' && <span>✓</span>}
                                                    {msg.status === 'delivered' && <span>✓✓</span>}
                                                    {msg.status === 'read' && <span>✓✓</span>}
                                                    {!msg.status && <span>✓</span>}
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>

                                {msg.sender === 'agent' && (
                                    <div className="w-6 h-6 rounded-full bg-neutral-800 ml-2 flex-shrink-0 self-end mb-1 ring-1 ring-neutral-700/50 flex items-center justify-center text-neutral-500">
                                        <User size={14} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </React.Fragment>
                ))}
                <div ref={logic.messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#111] border-t border-neutral-800 flex-shrink-0 relative">
                
                {/* File Preview Overlay */}
                {logic.filePreviewUrl && (
                    <div className="absolute bottom-full left-4 mb-4 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 w-72">
                        <div className="relative group">
                            {logic.selectedFile?.type.startsWith('image/') ? (
                                <img src={logic.filePreviewUrl} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
                            ) : (
                                <div className="w-full h-20 bg-neutral-800 rounded-xl flex items-center justify-center gap-3 px-4">
                                    <FileText className="text-blue-500" size={24} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-bold text-white truncate uppercase tracking-widest">{logic.selectedFile?.name}</div>
                                        <div className="text-[10px] text-neutral-500">{(logic.selectedFile?.size || 0) / 1024 > 1024 ? `${((logic.selectedFile?.size || 0) / (1024 * 1024)).toFixed(1)} MB` : `${((logic.selectedFile?.size || 0) / 1024).toFixed(1)} KB`}</div>
                                    </div>
                                </div>
                            )}
                            <button 
                                onClick={logic.handleCancelPreview}
                                className="absolute -top-2 -right-2 bg-neutral-950 text-white rounded-full p-1 border border-neutral-800 hover:bg-red-500 transition-colors shadow-lg"
                            >
                                <MoreVertical className="w-3 h-3 rotate-45" />
                            </button>
                        </div>
                        {logic.uploading && (
                            <div className="mt-3 space-y-1.5">
                                <div className="flex justify-between text-[8px] font-black text-neutral-500 uppercase tracking-widest px-1">
                                    <span>Subiendo archivo...</span>
                                    <span>{logic.progress}%</span>
                                </div>
                                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${logic.progress}%` }} />
                                </div>
                            </div>
                        )}
                        {!logic.uploading && (
                            <div className="mt-3 flex gap-2">
                                <Button 
                                    size="sm" 
                                    className="flex-1 h-8 bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase tracking-widest rounded-lg"
                                    onClick={logic.handleDisplayFileSend}
                                >
                                    Enviar Archivo
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Quick Replies Popover */}
                {showQuickReplies && (
                    <div className="absolute bottom-full left-4 mb-2 w-64 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="p-2 border-b border-neutral-800 bg-neutral-950 text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-3 flex justify-between items-center">
                            Quick Replies
                            <button onClick={() => setShowQuickReplies(false)} className="hover:text-white">✕</button>
                        </div>
                        <div className="max-h-60 overflow-y-auto no-scrollbar">
                            {QUICK_REPLIES.map(reply => (
                                <button 
                                    key={reply.id}
                                    onClick={() => handleSelectQuickReply(reply.text)}
                                    className="w-full text-left px-4 py-3 hover:bg-neutral-800 border-b border-neutral-800/50 last:border-0 transition-colors group"
                                >
                                    <div className="text-xs font-semibold text-blue-400 mb-0.5">{reply.label}</div>
                                    <div className="text-xs text-neutral-400 truncate group-hover:text-neutral-200">{reply.text}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-end bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 transition-shadow relative">
                    
                    {logic.liveCardData?.isBlocked && (
                        <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-[2px] z-20 flex items-center justify-center gap-3 animate-in fade-in duration-300">
                            <Ban size={16} className="text-red-500" />
                            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Contacto Bloqueado</span>
                            <button 
                                onClick={logic.handleToggleBlock}
                                className="ml-2 text-blue-500 hover:text-blue-400 text-[10px] font-black uppercase tracking-widest border-b border-blue-500/30 transition-all hover:border-blue-400"
                            >
                                Desbloquear
                            </button>
                        </div>
                    )}

                    <button 
                        disabled={logic.liveCardData?.isBlocked}
                        onClick={() => setShowQuickReplies(!showQuickReplies)}
                        className={`p-3 transition-colors ${showQuickReplies ? 'text-blue-500 bg-blue-500/10' : 'text-neutral-400 hover:text-white'} disabled:opacity-30`}
                        title="Quick Replies"
                    >
                        <Zap size={20} fill={showQuickReplies ? 'currentColor' : 'none'} />
                    </button>

                    {/* Attachment Menu */}
                    <div className="relative" ref={attachmentsRef}>
                        <button 
                            onClick={() => setShowAttachments(!showAttachments)}
                            className={`p-3 transition-colors ${showAttachments ? 'text-blue-500 bg-blue-500/10' : 'text-neutral-400 hover:text-white'}`}
                            title="Adjuntos"
                        >
                            <Plus size={20} className={`transition-transform duration-300 ${showAttachments ? 'rotate-45' : ''}`} />
                        </button>

                        {showAttachments && (
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 py-1">
                                <button onClick={() => { logic.open(); setShowAttachments(false); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors text-[11px] font-medium">
                                    <ImageIcon size={14} className="text-blue-400" />
                                    <span>Fotos y Videos</span>
                                </button>
                                <button onClick={() => { logic.open(); setShowAttachments(false); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors text-[11px] font-medium">
                                    <FileText size={14} className="text-purple-400" />
                                    <span>Documento</span>
                                </button>
                                <button onClick={() => { alert('Funcionalidad de Envío de Ubicación en desarrollo.'); setShowAttachments(false); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors text-[11px] font-medium">
                                    <MapPin size={14} className="text-green-400" />
                                    <span>Ubicación</span>
                                </button>
                                <button onClick={() => { alert('Funcionalidad de Envío de Contacto (vCard) en desarrollo.'); setShowAttachments(false); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors text-[11px] font-medium">
                                    <Contact2 size={14} className="text-orange-400" />
                                    <span>Contacto</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {isRecording ? (
                        <div className="flex-1 flex items-center gap-3 px-4 h-[44px] animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                            <span className="text-red-500 font-mono text-[13px] tracking-wider">{formatRecordingTime(recordingTime)}</span>
                            <span className="text-neutral-500 text-[11px] uppercase tracking-widest font-bold hidden sm:block">Grabando Audio...</span>
                        </div>
                    ) : (
                        <textarea
                            disabled={logic.liveCardData?.isBlocked}
                            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-white py-3 resize-none max-h-32 min-h-[44px] disabled:opacity-30 no-scrollbar"
                            placeholder={logic.liveCardData?.isBlocked ? "Contacto bloqueado" : "Type your reply here... (Shift + Enter for new line)"}
                            rows={1}
                            value={logic.newMessage}
                            onChange={(e) => logic.setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    logic.handleSendMessage();
                                }
                            }}
                        />
                    )}

                    <div className="flex items-center px-2 pb-2 h-[44px]">
                        <input {...logic.getInputProps()} />
                        
                        {isRecording ? (
                            <>
                                <button 
                                    onClick={cancelRecording}
                                    className="p-2 text-neutral-500 hover:text-red-400 transition-colors mx-1"
                                    title="Cancelar grabación"
                                >
                                    <X size={18} />
                                </button>
                                <button 
                                    onClick={stopRecording}
                                    className="ml-2 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-transform hover:scale-105 flex items-center justify-center w-8 h-8"
                                    title="Enviar Audio PTT"
                                >
                                    <Send size={14} className="translate-x-[1px] translate-y-[-1px]" />
                                </button>
                            </>
                        ) : (
                            logic.newMessage.trim().length > 0 || logic.selectedFile ? (
                                <button
                                    onClick={logic.handleSendMessage}
                                    disabled={logic.isSending || (!logic.newMessage.trim() && !logic.selectedFile)}
                                    className="ml-2 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-transform hover:scale-105 flex items-center justify-center w-8 h-8"
                                >
                                    {logic.isSending || logic.uploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} className="translate-x-[1px] translate-y-[-1px]" />}
                                </button>
                            ) : (
                                <button
                                    onClick={startRecording}
                                    className="ml-2 p-2 rounded-full bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors flex items-center justify-center w-8 h-8"
                                    title="Grabar nota de voz"
                                >
                                    <Mic size={16} />
                                </button>
                            )
                        )}
                    </div>

                </div>

                <div className="flex justify-between items-center mt-2 px-2 text-[11px] font-medium text-neutral-500 uppercase tracking-widest">
                    <span>Press Enter to send</span>
                    <div className="flex gap-4">
                        <span className="hover:text-neutral-300 cursor-pointer">Private Note</span>
                        <span className="text-blue-500 hover:text-blue-400 cursor-pointer">Reply</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
