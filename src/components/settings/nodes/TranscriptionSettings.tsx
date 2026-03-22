// src/components/settings/nodes/TranscriptionSettings.tsx
'use client';
import React, { useCallback } from 'react';
import { Node } from 'reactflow';
import { produce } from 'immer';
import { Input } from '@/components/ui/input';
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SettingsSection, Field } from '../SharedComponents';
import { Mic, Languages, VolumeX, Clock, AlertCircle } from 'lucide-react';

interface TranscriptionData {
    language?: string; // 'auto', 'es', 'en', etc.
    detectSilence?: boolean;
    maxDurationSeconds?: number;
    outputVariable?: string;
    fallbackMessage?: string;
}

interface NodeSettingsProps {
    node: Node<TranscriptionData>;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

export const TranscriptionSettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    const data = node.data || {};

    const updateConfig = useCallback((fn: (draft: TranscriptionData) => void) => {
        const newData = produce(data, fn);
        updateNodeConfig(node.id, newData);
    }, [data, node.id, updateNodeConfig]);

    return (
        <div className="space-y-4">
            <SettingsSection title="🎙️ Configuración de Audio">
                <Field label="Idioma Esperado" htmlFor="language">
                    <Select value={data.language || 'auto'} onValueChange={(v) => updateConfig(d => { d.language = v })}>
                        <SelectTrigger className="bg-neutral-950 border-neutral-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto"><span className="flex items-center gap-2"><Languages size={14}/> Auto-detectar</span></SelectItem>
                            <SelectItem value="es">Español (ES)</SelectItem>
                            <SelectItem value="en">Inglés (EN)</SelectItem>
                            <SelectItem value="pt">Portugués (PT)</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>

                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-neutral-300">
                            <Clock size={14} />
                            <label className="text-xs font-medium">Límite de Duración</label>
                        </div>
                        <span className="text-xs font-mono text-white">{data.maxDurationSeconds || 60}s</span>
                    </div>
                    <Slider 
                        value={[data.maxDurationSeconds || 60]} 
                        min={10} 
                        max={300} 
                        step={10}
                        onValueChange={(val) => updateConfig(d => { d.maxDurationSeconds = val[0] })}
                    />
                    <p className="text-[10px] text-neutral-500">Audios más largos serán rechazados para controlar costos.</p>
                </div>
            </SettingsSection>

            <SettingsSection title="🔇 Calidad y VAD">
                <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-neutral-800 text-neutral-400 rounded-md">
                            <VolumeX size={18} />
                        </div>
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium text-white">Ignorar Silencios (VAD)</label>
                            <p className="text-xs text-neutral-500">Rechazar audios vacíos o solo ruido.</p>
                        </div>
                    </div>
                    <Switch 
                        checked={data.detectSilence !== false} 
                        onCheckedChange={(c) => updateConfig(d => { d.detectSilence = c })}
                    />
                </div>
            </SettingsSection>

            <SettingsSection title="💾 Salida y Errores">
                 <Field label="Guardar Texto en Variable" htmlFor="out-var">
                    <Input 
                        value={data.outputVariable || ''}
                        onChange={(e) => updateConfig(d => { d.outputVariable = e.target.value })}
                        placeholder="audio_transcrito"
                        className="bg-neutral-950 border-neutral-800 font-mono text-purple-400"
                    />
                </Field>
                
                <Field label="Mensaje de Error (Fallback)" htmlFor="fallback" description="Si el audio es ininteligible o muy largo.">
                    <Input 
                        value={data.fallbackMessage || ''}
                        onChange={(e) => updateConfig(d => { d.fallbackMessage = e.target.value })}
                        placeholder="No pude entender el audio. Por favor escribe."
                        className="bg-neutral-950 border-neutral-800 text-xs"
                    />
                </Field>
            </SettingsSection>
        </div>
    );
};

