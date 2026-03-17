// src/components/settings/nodes/QuickReplySettings.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
    Trash2, Plus, GripVertical, Image as ImageIcon,
    Type, FileText, Film, AlertCircle, Settings2, ArrowDown, ArrowUp
} from 'lucide-react';
import { SettingsSection, Field, FileUploader } from '../SharedComponents';
import { cn } from '@/lib/utils';
import { produce } from 'immer';

interface ButtonItem {
    id: string;
    title: string;
    payload?: string;
}

interface NodeSettingsProps {
    node: Node;
    updateNodeConfig: (nodeId: string, data: object) => void;
}

const MAX_BUTTONS = 3;
const MAX_TITLE_CHARS = 20;
const MAX_HEADER_CHARS = 60;
const MAX_BODY_CHARS = 1024;
const MAX_FOOTER_CHARS = 60;

export const QuickReplySettings = ({ node, updateNodeConfig }: NodeSettingsProps) => {
    // Estado inicial complejo para soportar todas las features
    const [config, setConfig] = useState({
        headerType: node.data.headerType || 'none', // none, text, image, video, document
        headerText: node.data.headerText || '',
        headerMediaUrl: node.data.headerMediaUrl || '',
        headerMediaFilename: node.data.headerMediaFilename || '',
        bodyText: node.data.bodyText || '',
        footerText: node.data.footerText || '',
        buttons: (node.data.buttons || []).map((b: any) =>
            typeof b === 'string' ? { id: crypto.randomUUID(), title: b, payload: b } : b
        ) as ButtonItem[]
    });

    const [showPayloads, setShowPayloads] = useState(false);

    // Sincronización y Migración
    useEffect(() => {
        if (!config.bodyText && (node.data.text || node.data.body)) {
            update({ bodyText: node.data.text || node.data.body });
        }
    }, [node.data]);

    const update = (updates: any) => {
        const newConfig = { ...config, ...updates };
        setConfig(newConfig);
        updateNodeConfig(node.id, newConfig);
    };

    // --- Manejo de Botones ---

    const addButton = () => {
        if (config.buttons.length >= MAX_BUTTONS) return;
        const newBtn = {
            id: crypto.randomUUID(),
            title: '',
            payload: ''
        };
        update({ buttons: [...config.buttons, newBtn] });
    };

    const updateButton = (index: number, field: keyof ButtonItem, value: string) => {
        const newButtons = produce(config.buttons, draft => {
            draft[index][field] = value;
            // Auto-generar payload si está vacío y editamos título
            if (field === 'title' && (!draft[index].payload || draft[index].payload === '')) {
                draft[index].payload = value.toUpperCase().replace(/\s+/g, '_').substring(0, 30);
            }
        });
        update({ buttons: newButtons });
    };

    const removeButton = (index: number) => {
        const newButtons = config.buttons.filter((_, i) => i !== index);
        update({ buttons: newButtons });
    };

    const moveButton = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === config.buttons.length - 1) return;

        const newButtons = [...config.buttons];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newButtons[index], newButtons[targetIndex]] = [newButtons[targetIndex], newButtons[index]];
        update({ buttons: newButtons });
    };

    // --- Render Helpers ---

    const CharCounter = ({ current, max }: { current: number, max: number }) => (
        <span className={cn("text-[10px] ml-auto font-mono", current > max ? "text-red-500 font-bold" : "text-neutral-500")}>
            {current}/{max}
        </span>
    );

    return (
        <div className="space-y-6">

            {/* SECCIÓN 1: ENCABEZADO (HEADER) */}
            <SettingsSection title="1. Encabezado (Opcional)">
                <div className="space-y-4">
                    <Select value={config.headerType} onValueChange={(v) => update({ headerType: v })}>
                        <SelectTrigger className="bg-neutral-900 border-neutral-700">
                            <SelectValue placeholder="Tipo de Encabezado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sin Encabezado</SelectItem>
                            <SelectItem value="text"><div className="flex items-center gap-2"><Type size={14} /> Texto</div></SelectItem>
                            <SelectItem value="image"><div className="flex items-center gap-2"><ImageIcon size={14} /> Imagen</div></SelectItem>
                            <SelectItem value="video"><div className="flex items-center gap-2"><Film size={14} /> Video</div></SelectItem>
                            <SelectItem value="document"><div className="flex items-center gap-2"><FileText size={14} /> Documento</div></SelectItem>
                        </SelectContent>
                    </Select>

                    {config.headerType === 'text' && (
                        <div className="space-y-1">
                            <Input
                                placeholder="Título en negrita (ej: ¡Oferta Especial!)"
                                value={config.headerText || ''}
                                onChange={(e) => update({ headerText: e.target.value })}
                                maxLength={MAX_HEADER_CHARS}
                                className={cn("bg-neutral-950", config.headerText.length > MAX_HEADER_CHARS && "border-red-500")}
                            />
                            <div className="flex justify-end"><CharCounter current={config.headerText.length} max={MAX_HEADER_CHARS} /></div>
                        </div>
                    )}

                    {['image', 'video', 'document'].includes(config.headerType) && (
                        <div className="bg-neutral-950 rounded-lg border border-neutral-800 p-2">
                            <FileUploader
                                onUploadSuccess={(url, name) => update({ headerMediaUrl: url, headerMediaFilename: name })}
                                initialUrl={config.headerMediaUrl}
                                initialFilename={config.headerMediaFilename}
                            />
                            <p className="text-[10px] text-neutral-500 mt-2 text-center">
                                El archivo se mostrará en la cabecera del mensaje.
                            </p>
                        </div>
                    )}
                </div>
            </SettingsSection>

            {/* SECCIÓN 2: CUERPO (BODY) */}
            <SettingsSection title="2. Mensaje Principal">
                <div className="space-y-1">
                    <Textarea
                        placeholder="Escribe aquí el contenido principal de tu mensaje..."
                        value={config.bodyText || ''}
                        onChange={(e) => update({ bodyText: e.target.value })}
                        className="min-h-[120px] bg-neutral-900 border-neutral-700 resize-none font-medium"
                    />
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] text-neutral-500">Soporta variables y formato.</span>
                        <CharCounter current={config.bodyText.length} max={MAX_BODY_CHARS} />
                    </div>
                </div>
            </SettingsSection>

            {/* SECCIÓN 3: PIE DE PÁGINA (FOOTER) */}
            <SettingsSection title="3. Pie de Página (Opcional)">
                <div className="space-y-1">
                    <Input
                        placeholder="Texto gris pequeño (ej: Responde para salir)"
                        value={config.footerText || ''}
                        onChange={(e) => update({ footerText: e.target.value })}
                        maxLength={MAX_FOOTER_CHARS}
                        className="text-xs text-neutral-400 bg-neutral-900 border-neutral-800"
                    />
                    <div className="flex justify-end"><CharCounter current={config.footerText.length} max={MAX_FOOTER_CHARS} /></div>
                </div>
            </SettingsSection>

            {/* SECCIÓN 4: BOTONES (INTERACTIVE) */}
            <SettingsSection title="4. Botones de Respuesta">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-neutral-400">Máximo 3 botones.</p>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="adv-mode" className="text-[10px] uppercase font-bold text-neutral-500 cursor-pointer">Modo Pro</Label>
                        <Switch id="adv-mode" checked={showPayloads} onCheckedChange={setShowPayloads} className="scale-75" />
                    </div>
                </div>

                <div className="space-y-3">
                    {config.buttons.map((btn, idx) => (
                        <div key={btn.id} className="group relative bg-neutral-950 border border-neutral-800 rounded-lg p-3 transition-all hover:border-purple-500/50">
                            {/* Visual Stack Indicator */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-800 rounded-l-lg group-hover:bg-purple-500 transition-colors"></div>

                            <div className="flex gap-3 items-start pl-2">
                                {/* Order Controls */}
                                <div className="flex flex-col gap-1 pt-1">
                                    <button onClick={() => moveButton(idx, 'up')} disabled={idx === 0} className="text-neutral-600 hover:text-white disabled:opacity-30"><ArrowUp size={14} /></button>
                                    <button onClick={() => moveButton(idx, 'down')} disabled={idx === config.buttons.length - 1} className="text-neutral-600 hover:text-white disabled:opacity-30"><ArrowDown size={14} /></button>
                                </div>

                                {/* Inputs */}
                                <div className="flex-1 space-y-2">
                                    <div className="space-y-1">
                                        <Input
                                            value={btn.title || ''}
                                            onChange={(e) => updateButton(idx, 'title', e.target.value)}
                                            placeholder={`Botón ${idx + 1}`}
                                            className={cn("h-9 font-medium", btn.title.length > MAX_TITLE_CHARS && "border-red-500 text-red-500")}
                                        />
                                        <div className="flex justify-between items-center">
                                            {btn.title.length > MAX_TITLE_CHARS && (
                                                <span className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> Muy largo</span>
                                            )}
                                            <CharCounter current={btn.title.length} max={MAX_TITLE_CHARS} />
                                        </div>
                                    </div>

                                    {/* Payload Field (Conditional) */}
                                    {showPayloads && (
                                        <div className="flex items-center gap-2 bg-neutral-900/50 p-1.5 rounded border border-neutral-800 border-dashed">
                                            <Settings2 size={12} className="text-purple-400" />
                                            <span className="text-[10px] font-mono text-neutral-500">ID:</span>
                                            <Input
                                                value={btn.payload || ''}
                                                onChange={(e) => updateButton(idx, 'payload', e.target.value)}
                                                className="h-6 text-[10px] font-mono border-none bg-transparent focus-visible:ring-0 p-0"
                                                placeholder="BTN_ID"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Delete Action */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeButton(idx)}
                                    className="text-neutral-500 hover:text-red-500 h-8 w-8"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Button Action */}
                {config.buttons.length < MAX_BUTTONS ? (
                    <Button
                        onClick={addButton}
                        variant="outline"
                        className="w-full mt-4 border-dashed border-neutral-700 hover:bg-neutral-800 hover:border-neutral-500 text-neutral-400"
                    >
                        <Plus size={16} className="mr-2" /> Añadir Opción
                    </Button>
                ) : (
                    <div className="mt-4 p-2 bg-yellow-900/20 border border-yellow-900/50 rounded text-center">
                        <p className="text-xs text-yellow-500">Has alcanzado el límite de 3 botones de kamban.</p>
                    </div>
                )}
            </SettingsSection>
        </div>
    );
};

