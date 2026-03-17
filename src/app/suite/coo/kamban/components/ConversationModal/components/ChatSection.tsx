import React from 'react';
import { Instagram, Facebook, Linkedin, Youtube, Twitter, Globe2, FileSpreadsheet, ChevronDown, CheckCheck, Paperclip, ImageIcon, FileText, Smile, Send, Loader2, X, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { cn } from '@/lib/utils';
import { CardData, Message } from '../types';
import { TikTokIcon, WhatsappIcon } from './SharedComponents';

interface ChatSectionProps {
    liveCardData: CardData | null;
    activePlatform: string;
    setActivePlatform: (val: string) => void;
    socialPlatforms: any[];
    currentPlatform: any;
    uploading: boolean;
    progress: number;
    selectedFile: File | null;
    filePreviewUrl: string | null;
    handleCancelPreview: () => void;
    handleDisplayFileSend: () => Promise<void>;
    isDragActive: boolean;
    getRootProps: any;
    getInputProps: any;
    groupedMessages: { [key: string]: Message[] };
    isMessageRead: (msg: Message) => boolean;
    setPreviewFile: (file: any) => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    newMessage: string;
    setNewMessage: (val: string) => void;
    handleSendMessage: () => Promise<void>;
    isSending: boolean;
    open: () => void;
    onEmojiClick: (emojiData: any) => void;
    onClose: () => void;
    chatSearchTerm?: string;
    isWithin24Hours?: boolean;
    sendTemplateMessage: (name?: string) => Promise<void>;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
    liveCardData,
    activePlatform,
    setActivePlatform,
    socialPlatforms,
    currentPlatform,
    uploading,
    progress,
    selectedFile,
    filePreviewUrl,
    handleCancelPreview,
    handleDisplayFileSend,
    isDragActive,
    getRootProps,
    getInputProps,
    groupedMessages,
    isMessageRead,
    setPreviewFile,
    messagesEndRef,
    newMessage,
    setNewMessage,
    handleSendMessage,
    isSending,
    open,
    onEmojiClick,
    onClose,
    chatSearchTerm = '',
    isWithin24Hours = true,
    sendTemplateMessage // Destructure new prop
}) => {

    // Helper functionality for search highlighting
    const highlightText = (text: string, term: string) => {
        if (!term || !text) return text;
        const parts = text.split(new RegExp(`(${term})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === term.toLowerCase()
                ? <span key={i} className="bg-yellow-500/40 text-white font-medium px-0.5 rounded">{part}</span>
                : part
        );
    };
    return (
        <div className="flex-1 flex flex-col border-r border-white/5 h-full relative overflow-hidden" {...getRootProps()}>
            <input {...getInputProps()} />

            {/* Header removed and moved to ConversationModal */}

            {activePlatform === 'WhatsApp' ? (
                <>
                    <div className="relative flex-1 overflow-hidden">
                        {uploading && <Progress value={progress} className="absolute top-0 left-0 w-full h-1 z-20" />}

                        {selectedFile ? (
                            <div className="absolute inset-0 bg-neutral-900 z-30 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
                                <div className="w-full flex justify-end mb-4">
                                    <Button variant="ghost" size="icon" onClick={handleCancelPreview} className="text-neutral-400 hover:text-white">
                                        <X size={24} />
                                    </Button>
                                </div>

                                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
                                    {filePreviewUrl ? (
                                        <div className="relative w-full aspect-video bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center mb-4">
                                            <img src={filePreviewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="w-40 h-40 bg-neutral-800 rounded-2xl flex items-center justify-center mb-6">
                                            <FileText size={64} className="text-neutral-500" />
                                        </div>
                                    )}

                                    <div className="text-center mb-8">
                                        <p className="font-medium text-lg text-white mb-1 truncate max-w-xs">{selectedFile.name}</p>
                                        <p className="text-sm text-neutral-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>

                                    <Button
                                        onClick={handleDisplayFileSend}
                                        disabled={uploading}
                                        size="lg"
                                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-full text-base transition-all"
                                    >
                                        {uploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                                        Enviar Archivo
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                        {isDragActive && (
                            <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center z-10 p-4">
                                <p>Suelta el archivo para subirlo</p>
                            </div>
                        )}

                        <div className="absolute inset-0 overflow-y-auto p-3 space-y-2 bg-[#0b141a]">
                            {/* WhatsApp Background Pattern Overlay */}
                            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"></div>
                            <div className="relative z-10 flex flex-col gap-1.5">
                                {Object.entries(groupedMessages).map(([date, messages]) => (
                                    <React.Fragment key={date}>
                                        <div className="flex justify-center my-2">
                                            <span className="text-[9px] font-medium text-neutral-400 bg-neutral-800/90 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                {date}
                                            </span>
                                        </div>
                                        {messages.map((msg, index) => (
                                            <div key={index} className={cn("flex items-end gap-2", msg.sender === 'agent' ? 'justify-end' : 'justify-start')}>
                                                <div className={cn(
                                                    "px-2.5 py-1.5 rounded-[14px] max-w-[80%] shadow-sm transition-all hover:scale-[1.01]",
                                                    msg.sender === 'agent'
                                                        ? 'bg-teal-700 text-white rounded-br-sm shadow-teal-900/10'
                                                        : 'bg-white/5 backdrop-blur-md text-white border border-white/5 rounded-bl-sm shadow-black/20'
                                                )}>
                                                    {msg.fileUrl ? (
                                                        <div className="mb-1">
                                                            {msg.fileType?.startsWith('image/') ? (
                                                                <button
                                                                    onClick={() => setPreviewFile({
                                                                        url: msg.fileUrl!,
                                                                        name: msg.fileName || 'Imagen',
                                                                        type: msg.fileType || 'image/*'
                                                                    })}
                                                                    className="block overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                                >
                                                                    <img
                                                                        src={msg.fileUrl}
                                                                        alt={msg.fileName || 'Imagen'}
                                                                        className="max-w-full h-auto object-cover max-h-48 w-full"
                                                                        loading="lazy"
                                                                    />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setPreviewFile({
                                                                        url: msg.fileUrl!,
                                                                        name: msg.fileName || 'Archivo',
                                                                        type: msg.fileType || 'application/octet-stream'
                                                                    })}
                                                                    className="flex items-center gap-2 p-2 bg-black/20 rounded-lg hover:bg-black/30 transition-colors border border-white/10 w-full text-left"
                                                                >
                                                                    <div className={cn(
                                                                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                                                        msg.fileType === 'application/pdf' ? "bg-red-500/10" :
                                                                            msg.fileType?.includes('word') || msg.fileType?.includes('document') ? "bg-blue-500/10" :
                                                                                msg.fileType?.includes('sheet') ? "bg-green-500/10" :
                                                                                    msg.fileType?.includes('presentation') ? "bg-orange-500/10" :
                                                                                        "bg-neutral-800"
                                                                    )}>
                                                                        <FileText size={16} className={cn(
                                                                            msg.fileType === 'application/pdf' ? "text-red-500" :
                                                                                msg.fileType?.includes('word') || msg.fileType?.includes('document') ? "text-blue-500" :
                                                                                    msg.fileType?.includes('sheet') ? "text-green-500" :
                                                                                        msg.fileType?.includes('presentation') ? "text-orange-500" :
                                                                                            "text-neutral-400"
                                                                        )} />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-xs font-medium truncate">{msg.fileName || 'Archivo adjunto'}</p>
                                                                        <p className="text-[9px] text-white/60">
                                                                            {msg.fileType === 'application/pdf' ? 'PDF • Clic para ver' :
                                                                                msg.fileType?.includes('word') || msg.fileType?.includes('document') ? 'DOCX • Clic para ver' :
                                                                                    'Clic para abrir'}
                                                                        </p>
                                                                    </div>
                                                                </button>
                                                            )}
                                                            {msg.text && <p className="text-xs mt-1.5 whitespace-pre-wrap leading-relaxed">{highlightText(msg.text, chatSearchTerm)}</p>}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs whitespace-pre-wrap px-0.5 leading-relaxed font-medium">{highlightText(msg.text || '', chatSearchTerm)}</p>
                                                    )}

                                                    <div className="flex items-center justify-end gap-1 mt-0.5 px-0.5">
                                                        <p className="text-[9px] text-white/50 font-medium">
                                                            {msg.timestamp?.toDate().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                        {msg.sender === 'agent' && (
                                                            <CheckCheck size={12} className={cn(isMessageRead(msg) ? "text-teal-400" : "text-neutral-400")} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>

                    <footer className="p-1.5 border-t border-neutral-800 flex-shrink-0 bg-black/60 backdrop-blur-md">
                        <div className="flex items-center bg-neutral-800/80 rounded-full px-1 py-0.5 border border-white/5">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-white rounded-full">
                                        <Paperclip size={14} />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent side="top" className="w-auto p-1 bg-neutral-800 border-neutral-700 z-[110]">
                                    <Button variant="ghost" className="w-full text-[10px] h-7 font-medium" onClick={open}>
                                        <ImageIcon className="mr-2 h-3 w-3" />Foto/Video
                                    </Button>
                                    <Button variant="ghost" className="w-full text-[10px] h-7 font-medium" onClick={open}>
                                        <FileText className="mr-2 h-3 w-3" />Documento
                                    </Button>
                                </PopoverContent>
                            </Popover>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-white rounded-full">
                                        <Smile size={14} />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent side="top" className="p-0 border-none z-[110]">
                                    <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.DARK} />
                                </PopoverContent>
                            </Popover>

                            <Textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder={!isWithin24Hours ? "Escribe un mensaje de reapertura..." : "Escribe un mensaje..."}
                                className="bg-transparent border-none text-[11px] h-7 min-h-0 resize-none py-1.5 px-2 focus-visible:ring-0 placeholder:text-neutral-600 font-medium disabled:opacity-50"
                                rows={1}
                            />

                            <Button
                                onClick={handleSendMessage}
                                disabled={isSending || !newMessage.trim()}
                                size="icon"
                                className="h-7 w-7 bg-teal-600 hover:bg-teal-500 rounded-full flex-shrink-0 transition-all shadow-md active:scale-95"
                            >
                                {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3.5 w-3.5 ml-0.5" />}
                            </Button>
                        </div>
                    </footer>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] text-neutral-500 animate-in fade-in zoom-in-95 duration-500">
                    <div className={cn(
                        "w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl transition-all hover:scale-105 duration-500",
                        activePlatform === 'TikTok' ? "bg-neutral-900 border border-white/5" : "bg-neutral-800"
                    )}>
                        <currentPlatform.icon className={activePlatform === 'TikTok' ? 'w-16 h-16 text-white' : 'w-14 h-14'} />
                    </div>
                    <h3 className="text-2xl font-medium text-white mb-3 tracking-tight">Conectar {activePlatform}</h3>
                    <p className="text-sm text-neutral-500 max-w-[280px] text-center mb-10 leading-relaxed">
                        La integración con {activePlatform} no está configurada o no hay mensajes recientes.
                    </p>
                    <Button variant="outline" className="h-12 px-8 border-neutral-800 bg-[#0A0A0A] hover:bg-neutral-800 hover:text-white text-xs font-medium uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg">
                        Configurar Integración
                    </Button>
                </div>
            )}
        </div>
    );
};
