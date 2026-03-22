
// src/components/settings/nodes/TextMessageSettings.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Node } from 'reactflow';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
    Bold,
    Italic,
    Code,
    Smile,
    Link as LinkIcon,
    Clock,
    Strikethrough,
    Type
} from 'lucide-react';
import { SettingsSection } from '../SharedComponents';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NodeSettingsProps {
    node: Node;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

const COMMON_VARIABLES = [
    { label: 'Nombre Contacto', value: '{{name}}' },
    { label: 'Teléfono', value: '{{phone}}' },
];

export const TextMessageSettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    const [content, setContent] = useState(node.data.content || '');
    const [previewUrl, setPreviewUrl] = useState(node.data.previewUrl !== false);
    // Nuevo estado: por defecto true (humano), false = máquina rápida
    const [typingSimulation, setTypingSimulation] = useState(node.data.typingSimulation !== false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setContent(node.data.content || '');
        if (node.data.previewUrl !== undefined) setPreviewUrl(node.data.previewUrl);
        if (node.data.typingSimulation !== undefined) setTypingSimulation(node.data.typingSimulation);
    }, [node.data]);

    const handleUpdate = (updates: any) => {
        updateNodeConfig(node.id, { ...node.data, ...updates });
    };

    const insertText = (textToInsert: string, wrap: boolean = false) => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = content;
        let newText = '';
        let newCursorPos = 0;

        if (wrap) {
            const selectedText = text.substring(start, end);
            const wrapper = textToInsert;
            newText = text.substring(0, start) + wrapper + selectedText + wrapper + text.substring(end);
            newCursorPos = end + (wrapper.length * 2);
            if (selectedText.length === 0) newCursorPos = start + wrapper.length;
        } else {
            newText = text.substring(0, start) + textToInsert + text.substring(end);
            newCursorPos = start + textToInsert.length;
        }

        setContent(newText);
        handleUpdate({ content: newText });

        setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    return (
        <SettingsSection title="💬 Mensaje de Texto">
            <div className="space-y-4">

                {/* Toolbar */}
                <div className="flex items-center justify-between bg-neutral-900/50 px-2 py-1 border border-neutral-800/50 rounded-t-lg">
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-500 hover:text-white" onClick={() => insertText('*', true)}><Bold size={12} /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-500 hover:text-white" onClick={() => insertText('_', true)}><Italic size={12} /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-500 hover:text-white" onClick={() => insertText('~', true)}><Strikethrough size={12} /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-500 hover:text-white" onClick={() => insertText('```', true)}><Code size={12} /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-500 hover:text-white" onClick={() => insertText('*', true)}><Type size={12} /></Button>
                        <div className="w-px h-3 bg-neutral-800 mx-1 self-center" />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-yellow-600 hover:text-yellow-500"><Smile size={12} /></Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none" side="right" align="start">
                                <EmojiPicker onEmojiClick={(e) => insertText(e.emoji)} theme={Theme.DARK} lazyLoadEmojis={true} height={300} width={280} />
                            </PopoverContent>
                        </Popover>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] text-purple-500 hover:text-purple-400 gap-1 font-bold uppercase tracking-wider"><span className="font-mono text-[11px]">{`{}`}</span> Vars</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-neutral-900 border-neutral-800 text-white max-h-[300px] overflow-y-auto">
                                <div className="px-2 py-1.5 border-b border-neutral-800">
                                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Globales</span>
                                </div>
                                {COMMON_VARIABLES.map((v) => (
                                    <DropdownMenuItem key={v.value} onClick={() => insertText(v.value)} className="hover:bg-neutral-800 cursor-pointer flex justify-between gap-4 py-1.5">
                                        <span className="text-[10px] font-bold uppercase">{v.label}</span><span className="font-mono text-neutral-500 text-[9px]">{v.value}</span>
                                    </DropdownMenuItem>
                                ))}
                                
                                {allNodes.filter(n => (n.type === 'captureInputNode' || n.type === 'setVariableNode') && n.data?.variableName).length > 0 && (
                                    <>
                                        <div className="px-2 py-1.5 border-b border-neutral-800 mt-1">
                                            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Capturadas en el flujo</span>
                                        </div>
                                        {allNodes
                                            .filter(n => (n.type === 'captureInputNode' || n.type === 'setVariableNode') && n.data?.variableName)
                                            .map((n) => {
                                                const varName = n.data.variableName;
                                                const label = n.data.label || (n.type === 'captureInputNode' ? 'Entrada' : 'Variable');
                                                return (
                                                    <DropdownMenuItem key={n.id} onClick={() => insertText(`{{${varName}}}`)} className="hover:bg-neutral-800 cursor-pointer flex justify-between gap-4 py-1.5">
                                                        <span className="text-[10px] font-bold uppercase">{label}</span>
                                                        <span className="font-mono text-purple-500 text-[9px]">{`{{${varName}}}`}</span>
                                                    </DropdownMenuItem>
                                                );
                                            })
                                        }
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Text Area */}
                <div className="relative">
                    <Textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            handleUpdate({ content: e.target.value });
                        }}
                        placeholder="Escribe el mensaje aquí..."
                        className="min-h-[140px] rounded-t-none border-neutral-800/50 font-medium text-xs resize-none p-3 pr-2 pb-8 bg-neutral-900/20 focus-visible:ring-0 leading-relaxed"
                    />
                    <div className="absolute bottom-2 right-3 text-[9px] font-black text-neutral-600 bg-transparent pl-2 uppercase tracking-tight">
                        {content.length} caracteres
                    </div>
                </div>

                {/* Configuration Toggles */}
                <div className="flex flex-col pt-2 border-t border-neutral-800/50 mt-2">
                    {/* Link Preview */}
                    <div className="flex items-center justify-between px-2 py-3 hover:bg-white/[0.02] transition-colors group rounded-md">
                        <div className="flex items-center gap-3">
                            <LinkIcon size={14} className="text-neutral-500 group-hover:text-neutral-300" />
                            <div className="flex flex-col">
                                <Label className="text-[11px] font-bold text-neutral-300 uppercase tracking-tight">PREVISUALIZAR ENLACES</Label>
                                <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest mt-0.5">Muestra miniatura del link</span>
                            </div>
                        </div>
                        <Switch
                            checked={previewUrl}
                            onCheckedChange={(checked) => {
                                setPreviewUrl(checked);
                                handleUpdate({ previewUrl: checked });
                            }}
                            className="scale-75"
                        />
                    </div>

                    {/* Human Typing Simulation */}
                    <div className="flex items-center justify-between px-2 py-3 hover:bg-white/[0.02] transition-colors group rounded-md">
                        <div className="flex items-center gap-3">
                            <Clock size={14} className={cn("text-neutral-500 group-hover:text-neutral-300", typingSimulation && "text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]")} />
                            <div className="flex flex-col">
                                <Label className="text-[11px] font-bold text-neutral-300 uppercase tracking-tight">MODO HUMANO (DELAY)</Label>
                                <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest mt-0.5">
                                    {typingSimulation ? "SIMULA ESCRITURA MANUAL" : "ENVÍO INSTANTÁNEO"}
                                </span>
                            </div>
                        </div>
                        <Switch
                            checked={typingSimulation}
                            onCheckedChange={(checked) => {
                                setTypingSimulation(checked);
                                handleUpdate({ typingSimulation: checked });
                            }}
                            className="scale-75 data-[state=checked]:bg-emerald-600"
                        />
                    </div>
                </div>

                {/* REAL-TIME PREVIEW */}
                <div className="mt-4 pt-4 border-t border-neutral-800/50 pb-2">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">VISTA PREVIA (WHATSAPP)</span>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-neutral-800" />
                            <div className="w-1 h-1 rounded-full bg-neutral-800" />
                            <div className="w-1 h-1 rounded-full bg-neutral-800" />
                        </div>
                    </div>
                    
                    <div className="bg-[#0b141a] rounded-xl p-4 border border-white/5 shadow-inner relative overflow-hidden group/preview">
                        <div className="absolute inset-0 bg-[url('https://w0.peakpx.com/wallpaper/580/650/wallpaper-dark-whatsapp.jpg')] opacity-[0.03] pointer-events-none grayscale" />
                        
                        <div className="relative z-10 flex flex-col items-end">
                            <div className={cn(
                                "max-w-[90%] bg-[#005c4b] text-[#e9edef] p-2.5 rounded-lg rounded-tr-none shadow-md relative group transition-all duration-300",
                                content ? "opacity-100 scale-100" : "opacity-40 scale-95 italic text-[11px]"
                            )}>
                                <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap break-words">
                                    {content || "Escribe algo para ver la vista previa..."}
                                </p>
                                
                                <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                                    <span className="text-[9px]">20:18</span>
                                    <svg viewBox="0 0 16 11" width="14" height="11" fill="currentColor" className="text-sky-400">
                                        <path d="M11.053 1.053a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l1.25-1.25a.75.75 0 1 0-1.06-1.06l-.72.72-2.97-2.97ZM1.053 6.053a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l8-8a.75.75 0 0 0-1.06-1.06L3.5 8.94 1.053 6.053Z" />
                                    </svg>
                                </div>
                                
                                <div className="absolute -right-2 top-0 w-0 h-0 border-t-[8px] border-t-[#005c4b] border-r-[8px] border-r-transparent" />
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-[9px] text-neutral-600 font-bold uppercase text-center mt-3 tracking-tighter opacity-50">
                        El diseño real puede variar según el dispositivo
                    </p>
                </div>
            </div>
        </SettingsSection>
    );
};

