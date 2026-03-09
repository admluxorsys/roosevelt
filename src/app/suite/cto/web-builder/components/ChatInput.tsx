import React, { useRef, useEffect, useState } from "react";
import { ArrowUp, Loader2, Plus, ChevronDown, Sparkles, X } from "lucide-react";
import { ReasoningLevel } from "../types";

interface ChatInputProps {
    input: string;
    setInput: (val: string) => void;
    handleGenerate: () => void;
    isGenerating: boolean;
    statusMessage?: string;
    projectOpen: boolean;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    reasoningLevel: ReasoningLevel;
    setReasoningLevel: (level: ReasoningLevel) => void;
    selectedImages: { id: string, url: string, file?: File }[];
    setSelectedImages: React.Dispatch<React.SetStateAction<{ id: string, url: string, file?: File }[]>>;
    cancelGeneration?: () => void;
}

export const ChatInput = ({
    input, setInput, handleGenerate, isGenerating, projectOpen,
    selectedModel, setSelectedModel, reasoningLevel, setReasoningLevel,
    selectedImages, setSelectedImages, cancelGeneration, statusMessage
}: ChatInputProps) => {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [showReasoningDropdown, setShowReasoningDropdown] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    // Handle click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowModelDropdown(false);
                setShowReasoningDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        }
    };

    const toggleModelDropdown = () => {
        setShowModelDropdown(!showModelDropdown);
        setShowReasoningDropdown(false);
    };

    const toggleReasoningDropdown = () => {
        setShowReasoningDropdown(!showReasoningDropdown);
        setShowModelDropdown(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newImages = Array.from(files).map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                url: URL.createObjectURL(file),
                file
            }));
            setSelectedImages(prev => [...prev, ...newImages]);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const newImages: { id: string, url: string, file: File }[] = [];

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    newImages.push({
                        id: Math.random().toString(36).substr(2, 9),
                        url: URL.createObjectURL(file),
                        file
                    });
                }
            }
        }

        if (newImages.length > 0) {
            setSelectedImages(prev => [...prev, ...newImages]);
        }
    };

    const removeImage = (id: string) => {
        setSelectedImages(prev => prev.filter(img => img.id !== id));
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="p-3 bg-[#09090b] relative z-20 border-t border-[#1a1a1a]" ref={containerRef}>
            <div className={`flex flex-col bg-[#1e1e1e] rounded-2xl border border-[#333] focus-within:border-[#444] transition-all duration-300 shadow-lg ${!projectOpen ? 'opacity-40 grayscale blur-[0.5px] pointer-events-none' : ''
                }`}>

                {/* Text Area - Pure content, grows upwards */}
                <div className="relative">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        onPaste={handlePaste}
                        placeholder="Describe los cambios que necesitas..."
                        className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm text-[#d1d1d1] resize-none p-3 custom-scrollbar placeholder:text-[#525252] min-h-[44px]"
                        disabled={isGenerating || !projectOpen}
                    />

                    {/* Hard Lock Overlay */}
                    {isGenerating && (
                        <div className="absolute inset-0 bg-[#1e1e1e]/20 backdrop-blur-[1px] z-50 cursor-not-allowed flex items-center justify-center rounded-t-2xl">
                        </div>
                    )}
                </div>

                {/* Image Previews */}
                {selectedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-4 pb-2">
                        {selectedImages.map(img => (
                            <div key={img.id} className="relative group w-12 h-12">
                                <div className="w-full h-full rounded-lg overflow-hidden border border-[#333] bg-[#111]">
                                    <img src={img.url} className="w-full h-full object-cover" alt="preview" />
                                </div>
                                <button
                                    onClick={() => removeImage(img.id)}
                                    className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-xl z-10 font-bold"
                                    title="Eliminar imagen"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Status Message Overlay */}
                {isGenerating && statusMessage && (
                    <div className="px-4 pb-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                        <div className="flex items-center gap-2 text-[10px] text-blue-400/80 font-medium bg-blue-500/5 border border-blue-500/10 rounded-full px-3 py-1 w-fit">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            <span className="animate-pulse">{statusMessage}</span>
                        </div>
                    </div>
                )}

                {/* Fixed Control Bar - At the bottom, never covered by text */}
                <div className="flex items-center justify-between px-3 py-2 bg-[#161618] border-t border-[#2a2a2c] relative">
                    <div className="flex items-center gap-1">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/*"
                            multiple
                        />
                        <button
                            onClick={handleFileClick}
                            className="p-1.5 text-[#5e5e62] hover:text-white hover:bg-white/5 rounded-md transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>

                        <div className="h-4 w-[1px] bg-[#2a2a2c] mx-1"></div>

                        {/* Model Selector */}
                        <div className="relative">
                            <button
                                onClick={toggleModelDropdown}
                                className="flex items-center gap-1 pr-1.5 py-1 text-[9px] font-bold text-[#a1a1aa] hover:bg-white/5 rounded-lg transition-all uppercase tracking-tight"
                            >
                                <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                                {selectedModel.split(' ')[0]}
                                <ChevronDown className="w-2.5 h-2.5 opacity-30" />
                            </button>
                            {showModelDropdown && (
                                <div className="absolute bottom-full left-0 mb-3 w-64 bg-[#18181b] border border-[#27272a] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-1 z-[100] animate-in fade-in slide-in-from-bottom-2">
                                    <div className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider border-b border-[#27272a]">Modelos Disponibles</div>
                                    {[
                                        { id: 'Multi-AI (Consensus)', label: 'Multi-AI (Consensus)' },
                                        { id: 'Gemini 3.0 (Preview)', label: 'Gemini 3.0 (Preview) 🚀' },
                                        { id: 'Gemini 2.0 Flash', label: 'Gemini 2.0 Flash' },
                                        { id: 'Gemini 2.0 Pro', label: 'Gemini 2.0 Pro' },
                                        { id: 'Gemini 1.5 Flash', label: 'Gemini 1.5 Flash ⭐' },
                                        { id: 'Gemini 1.5 Pro', label: 'Gemini 1.5 Pro ⭐' },
                                        { id: 'Claude 3.5 Sonnet', label: 'Claude 3.5 Sonnet' },
                                        { id: 'GPT-4o', label: 'GPT-4o' },
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => { setSelectedModel(m.id); setShowModelDropdown(false); }}
                                            className={`w-full text-left px-3 py-2 text-xs hover:bg-[#27272a] transition-colors flex items-center justify-between ${selectedModel === m.id ? 'text-blue-400 bg-blue-400/5' : 'text-gray-300'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Sparkles className={`w-3.5 h-3.5 ${selectedModel === m.id ? 'text-blue-400' : 'text-gray-500'}`} />
                                                <span className="font-medium">{m.label}</span>
                                            </div>
                                            {selectedModel === m.id && <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)]"></div>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Reasoning Level */}
                        <div className="relative">
                            <button
                                onClick={toggleReasoningDropdown}
                                className="flex items-center gap-1 px-1.5 py-1 text-[9px] font-bold text-[#a1a1aa] hover:bg-white/5 rounded-lg transition-all uppercase tracking-tight"
                            >
                                {reasoningLevel}
                                <ChevronDown className="w-2.5 h-2.5 opacity-30" />
                            </button>
                            {showReasoningDropdown && (
                                <div className="absolute bottom-full left-0 mb-3 w-32 bg-[#18181b] border border-[#27272a] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-1 z-[100] animate-in fade-in slide-in-from-bottom-2">
                                    {(['low', 'medium', 'high'] as ReasoningLevel[]).map(l => (
                                        <button
                                            key={l}
                                            onClick={() => { setReasoningLevel(l); setShowReasoningDropdown(false); }}
                                            className={`w-full text-left px-3 py-2 text-[10px] hover:bg-[#27272a] transition-colors capitalize ${reasoningLevel === l ? 'text-blue-400' : 'text-gray-400'}`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={isGenerating && cancelGeneration ? cancelGeneration : handleGenerate}
                        disabled={!isGenerating && (!input.trim() || !projectOpen)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isGenerating
                            ? 'bg-red-500 text-white shadow-lg hover:bg-red-600 hover:scale-105 active:scale-95'
                            : (!input.trim() || !projectOpen)
                                ? 'bg-[#2d2d30] text-[#5e5e62]'
                                : 'bg-white text-black shadow-lg hover:scale-105 active:scale-95'
                            }`}
                        title={isGenerating ? 'Detener generación' : 'Enviar mensaje'}
                    >
                        {isGenerating ? <X className="w-4 h-4 stroke-[3px]" /> : <ArrowUp className="w-4 h-4 stroke-[3px]" />}
                    </button>
                </div>
            </div>
        </div>
    );
};
