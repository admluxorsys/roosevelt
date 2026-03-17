import React, { useState } from 'react';
import { CardData } from '../types';
import { Clock, MessageSquare, Phone, FileText, Edit, ArrowRight, CheckSquare, CreditCard, Timer, Paperclip, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryTabProps {
    liveCardData: CardData | null;
    newHistoryComment: string;
    setNewHistoryComment: (val: string) => void;
    handleSaveHistoryComment: () => Promise<void>;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
    liveCardData,
    newHistoryComment,
    setNewHistoryComment,
    handleSaveHistoryComment
}) => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    // 1. Get real messages
    const messages = liveCardData?.messages || [];
    const messageEvents = messages.map((msg: any, index: number) => ({
        id: `msg-${index}`,
        type: 'message',
        content: msg.text || (msg.file ? 'Archivo enviado' : 'Mensaje'),
        timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(),
        icon: MessageSquare,
        color: 'text-blue-500',
        details: undefined
    }));

    // 2. Get real history events (Profile updates, manual comments, etc.)
    const historyEvents = (liveCardData?.history || []).map((ev: any) => {
        let icon = MessageSquare;
        let color = 'text-purple-500';

        switch (ev.type) {
            case 'edit':
                icon = Edit;
                color = 'text-yellow-500';
                break;
            case 'comment':
                icon = FileText;
                color = 'text-green-500';
                break;
            case 'status':
                icon = ArrowRight;
                color = 'text-purple-500';
                break;
            case 'checklist':
                icon = CheckSquare;
                color = 'text-emerald-500';
                break;
            case 'payment':
                icon = CreditCard;
                color = 'text-pink-500';
                break;
            case 'system':
                icon = Timer;
                color = 'text-neutral-500';
                break;
            case 'file':
                icon = Paperclip;
                color = 'text-blue-500';
                break;
        }

        return {
            id: ev.id,
            type: ev.type,
            content: ev.content,
            details: ev.details, // Include details
            timestamp: ev.timestamp?.toDate ? ev.timestamp.toDate() : new Date(),
            icon,
            color,
        };
    });

    // Merge and sort
    const allInteractions = [...messageEvents, ...historyEvents].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = (now.getTime() - date.getTime()) / 1000;

        if (diff < 60) return 'Ahora';
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return `${Math.floor(diff / 86400)}d`;
    };

    const creationDate = (liveCardData as any)?.createdAt?.seconds
        ? new Date((liveCardData as any).createdAt.seconds * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
        : 'Reciente';

    const renderDetails = (item: any) => {
        if (!item.details) return null;

        if (item.type === 'edit' && Array.isArray(item.details)) {
            return (
                <div className="space-y-4">
                    {item.details.map((change: any, i: number) => (
                        <div key={i} className="space-y-2 last:mb-0">
                            <div className="flex items-center justify-between text-[9px] font-black text-neutral-500 uppercase tracking-[0.15em]">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40"></span>
                                    <span>CAMPO: {change.field}</span>
                                </div>
                                <span className="bg-white/5 px-1.5 py-0.5 rounded text-[8px] opacity-70">
                                    PÁGINA: {change.page || 'Perfil de Contacto'}
                                </span>
                            </div>

                            <div className="bg-neutral-950/80 rounded-lg p-3 border border-white/5 shadow-inner group/detail">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[8px] text-neutral-600 font-bold uppercase tracking-wider">Cambio Final</span>
                                    <span className="text-[8px] text-blue-500/50 font-bold uppercase">Actualizado</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] text-neutral-500 line-through opacity-40 truncate mb-1">
                                            {change.old}
                                        </p>
                                        <p className="text-[11px] text-white font-bold break-words leading-relaxed group-hover/detail:text-blue-200 transition-colors">
                                            {change.new}
                                        </p>
                                    </div>
                                    <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20">
                                        <ArrowRight size={10} className="text-blue-500" />
                                    </div>
                                </div>
                            </div>
                            {i < item.details.length - 1 && <div className="h-px bg-white/5 mx-2" />}
                        </div>
                    ))}
                </div>
            );
        }

        if (item.type === 'payment' && typeof item.details === 'object') {
            const { type, brand, last4, expiry } = item.details;
            return (
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="bg-neutral-950/40 p-2 rounded-lg border border-white/5">
                        <span className="text-[8px] text-neutral-500 font-bold uppercase block mb-1">Tipo</span>
                        <span className="text-[10px] text-neutral-200 font-medium uppercase">{type}</span>
                    </div>
                    <div className="bg-neutral-950/40 p-2 rounded-lg border border-white/5">
                        <span className="text-[8px] text-neutral-500 font-bold uppercase block mb-1">Marca</span>
                        <span className="text-[10px] text-neutral-200 font-medium capitalize">{brand}</span>
                    </div>
                    <div className="bg-neutral-950/40 p-2 rounded-lg border border-white/5">
                        <span className="text-[8px] text-neutral-500 font-bold uppercase block mb-1">Tarjeta</span>
                        <span className="text-[10px] text-neutral-200 font-medium">**** {last4}</span>
                    </div>
                    <div className="bg-neutral-950/40 p-2 rounded-lg border border-white/5">
                        <span className="text-[8px] text-neutral-500 font-bold uppercase block mb-1">Expira</span>
                        <span className="text-[10px] text-neutral-200 font-medium">{expiry}</span>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="h-full flex flex-col overflow-hidden bg-black/20">
            {/* Header Sticky */}
            <div className="flex-shrink-0 px-4 py-4 border-b border-white/5 bg-neutral-900/40 backdrop-blur-md z-10">
                <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-4">
                    REGISTRO DE ACTIVIDAD
                </h3>

                <div className="space-y-2">
                    <div className="relative group">
                        <textarea
                            value={newHistoryComment || ''}
                            onChange={(e) => setNewHistoryComment(e.target.value)}
                            placeholder="Escribe un comentario en el historial..."
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-[11px] text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 transition-all resize-none min-h-[60px]"
                        />
                        <button
                            onClick={handleSaveHistoryComment}
                            className={cn(
                                "absolute bottom-2 right-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                                (newHistoryComment || '').trim()
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                    : "bg-neutral-800 text-neutral-500 pointer-events-none"
                            )}
                        >
                            Log Item
                        </button>
                    </div>
                </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-4 space-y-1">
                {allInteractions.length > 0 ? (
                    allInteractions.map((item) => {
                        const isExpanded = expandedIds.has(item.id);
                        const hasDetails = !!item.details;

                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    "group flex items-start px-4 py-3 transition-all duration-300 rounded-xl relative",
                                    hasDetails ? "cursor-pointer" : "",
                                    isExpanded ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                                )}
                                onClick={() => hasDetails && toggleExpand(item.id)}
                            >
                                <div className="w-16 flex-shrink-0 pt-1">
                                    <span className="text-[10px] text-neutral-600 font-bold block leading-tight">
                                        {formatDate(item.timestamp)}
                                    </span>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className="flex items-start gap-3">
                                        <div className="pt-1">
                                            <item.icon size={11} className={cn("opacity-70", item.color)} />
                                        </div>

                                        <div className="flex-1">
                                            <p className={cn(
                                                "text-[12px] leading-snug break-words flex items-center gap-2",
                                                item.type === 'comment' || isExpanded ? "text-neutral-100 font-medium" : "text-neutral-400"
                                            )}>
                                                {item.content}
                                                {hasDetails && (
                                                    <ChevronDown
                                                        size={10}
                                                        className={cn(
                                                            "transition-transform duration-300 opacity-40",
                                                            isExpanded ? "rotate-180" : ""
                                                        )}
                                                    />
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Expandable Details Box */}
                                    <AnimatePresence>
                                        {isExpanded && hasDetails && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-[#141414] border border-white/10 rounded-xl p-4 shadow-2xl relative mb-2">
                                                    {/* Arrow Pointer */}
                                                    <div className="absolute -top-1 left-4 w-2 h-2 bg-[#141414] border-l border-t border-white/10 rotate-45"></div>
                                                    {renderDetails(item)}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="py-20 text-center opacity-20">
                        <Clock size={32} className="mx-auto mb-3" />
                        <p className="text-[10px] uppercase font-bold tracking-widest">No activity found</p>
                    </div>
                )}

                {/* Initial Creation (Bottom) */}
                <div className="group flex items-start px-4 py-6 opacity-30 border-t border-white/5 mt-4">
                    <div className="w-16 flex-shrink-0">
                        <span className="text-[10px] text-neutral-600 font-bold block">
                            {creationDate}
                        </span>
                    </div>
                    <div className="flex-1 flex items-start gap-3">
                        <Clock size={11} className="text-neutral-500 mt-1" />
                        <p className="text-[11px] text-neutral-500 uppercase font-bold tracking-wider">
                            Conversación iniciada
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

