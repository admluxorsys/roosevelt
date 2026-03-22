import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Trash2 } from 'lucide-react';

export interface LogEntry {
    type: 'info' | 'warn' | 'error' | 'success' | 'debug';
    message: string;
    timestamp: string;
}

interface TerminalPanelProps {
    logs: LogEntry[];
    onClear: () => void;
    isVisible: boolean;
    onClose: () => void;
}

export const TerminalPanel = ({ logs, onClear, isVisible, onClose }: TerminalPanelProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    if (!isVisible) return null;

    return (
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[#0a0a0c] border-t border-[#222] z-50 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Terminal Header */}
            <div className="h-9 px-3 bg-[#111] border-b border-[#222] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Build Terminal</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onClear}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-md transition-all"
                        title="Limpiar Consola"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-md transition-all"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Terminal Body */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1 custom-scrollbar"
            >
                {logs.length === 0 ? (
                    <div className="text-gray-700 italic">No hay logs de salida todavía. Intenta generar un preview...</div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="flex gap-3 group">
                            <span className="text-gray-600 shrink-0 select-none">[{log.timestamp}]</span>
                            <span className={`
                                ${log.type === 'error' ? 'text-red-400' :
                                    log.type === 'warn' ? 'text-yellow-400' :
                                        log.type === 'success' ? 'text-green-400' :
                                            log.type === 'info' ? 'text-blue-400' :
                                                'text-gray-400'}
                                break-all
                            `}>
                                <span className="opacity-50 mr-2">{log.type.toUpperCase()}:</span>
                                {log.message}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Terminal Footer */}
            <div className="h-6 px-3 bg-[#0a0a0c] border-t border-[#1a1a1c] flex items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">Compiler Ready</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

