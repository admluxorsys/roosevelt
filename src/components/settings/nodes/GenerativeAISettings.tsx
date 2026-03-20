// src/components/settings/nodes/GenerativeAISettings.tsx
'use client';
import React, { useCallback } from 'react';
import { Node } from 'reactflow';
import { produce } from 'immer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsSection, Field } from '../SharedComponents';
import { 
    BrainCircuit, 
    Thermometer, 
    MessageSquare, 
    FileJson, 
    History,
    Sparkles,
    Database
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface GenAIData {
    model?: string;
    systemPrompt?: string;
    temperature?: number; // 0.0 - 1.0
    contextVariables?: string; // Variables inyectadas (RAG Lite)
    includeHistory?: boolean;
    historyLimit?: number;
    outputMode?: 'text' | 'json';
    outputVariable?: string; // Donde guardar la respuesta
}

interface NodeSettingsProps {
    node: Node<GenAIData>;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

export const GenerativeAISettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    const data = node.data || {};

    const updateConfig = useCallback((fn: (draft: GenAIData) => void) => {
        const newData = produce(data, fn);
        updateNodeConfig(node.id, newData);
    }, [data, node.id, updateNodeConfig]);

    return (
        <div className="space-y-4">
            <SettingsSection title="🧠 Modelo y Comportamiento">
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Modelo" htmlFor="model">
                        <Select value={data.model || 'gpt-4o'} onValueChange={(v) => updateConfig(d => { d.model = v })}>
                            <SelectTrigger className="bg-neutral-950 border-neutral-800"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gpt-4o">GPT-4o (Omni)</SelectItem>
                                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    
                    <Field label="Modo de Salida" htmlFor="output-mode">
                        <Select value={data.outputMode || 'text'} onValueChange={(v) => updateConfig(d => { d.outputMode = v as any })}>
                            <SelectTrigger className="bg-neutral-950 border-neutral-800"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text">
                                    <span className="flex items-center gap-2"><MessageSquare size={12}/> Texto (Chat)</span>
                                </SelectItem>
                                <SelectItem value="json">
                                    <span className="flex items-center gap-2"><FileJson size={12}/> JSON (Datos)</span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                </div>

                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-orange-400" />
                            <label className="text-xs font-medium text-neutral-300">Creatividad (Temperatura)</label>
                        </div>
                        <span className="text-xs font-mono text-white">{data.temperature ?? 0.7}</span>
                    </div>
                    <Slider 
                        value={[data.temperature ?? 0.7]} 
                        min={0} 
                        max={1} 
                        step={0.1}
                        onValueChange={(val) => updateConfig(d => { d.temperature = val[0] })}
                        className="py-1"
                    />
                    <div className="flex justify-between text-[9px] text-neutral-500 uppercase font-bold">
                        <span>Preciso (0.0)</span>
                        <span>Creativo (1.0)</span>
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection title="📝 Prompting">
                <Field label="Instrucción del Sistema (System Prompt)" htmlFor="system-prompt" description="Define la personalidad y reglas.">
                    <Textarea 
                        value={data.systemPrompt || ''}
                        onChange={(e) => updateConfig(d => { d.systemPrompt = e.target.value })}
                        placeholder="Eres un asistente útil y amable..."
                        className="min-h-[120px] bg-neutral-950 border-neutral-800 text-sm"
                    />
                </Field>

                <Field 
                    label="Contexto Dinámico (RAG Lite)" 
                    htmlFor="rag-context" 
                    description="Variables a inyectar como conocimiento (separadas por coma)."
                >
                    <div className="relative">
                        <Database className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                        <Input 
                            value={data.contextVariables || ''}
                            onChange={(e) => updateConfig(d => { d.contextVariables = e.target.value })}
                            placeholder="{{historial_compras}}, {{faq_content}}"
                            className="pl-9 bg-neutral-950 border-neutral-800 font-mono text-xs text-blue-400"
                        />
                    </div>
                </Field>
            </SettingsSection>

            <SettingsSection title="🕰️ Memoria">
                <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-neutral-800 text-neutral-400 rounded-md">
                            <History size={18} />
                        </div>
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium text-white">Incluir Historial</label>
                            <p className="text-xs text-neutral-500">Enviar mensajes anteriores para contexto.</p>
                        </div>
                    </div>
                    <Switch 
                        checked={data.includeHistory !== false} 
                        onCheckedChange={(c) => updateConfig(d => { d.includeHistory = c })}
                    />
                </div>
                
                {data.includeHistory !== false && (
                    <div className="mt-3 px-1">
                        <div className="flex justify-between mb-2">
                             <label className="text-xs text-neutral-400">Mensajes a recordar</label>
                             <span className="text-xs text-white font-mono">{data.historyLimit || 5} pares</span>
                        </div>
                        <Slider 
                            value={[data.historyLimit || 5]} 
                            min={1} 
                            max={20} 
                            step={1}
                            onValueChange={(val) => updateConfig(d => { d.historyLimit = val[0] })}
                        />
                    </div>
                )}
            </SettingsSection>
            
            <SettingsSection title="💾 Salida">
                 <Field label="Guardar Respuesta en Variable" htmlFor="out-var">
                    <Input 
                        value={data.outputVariable || ''}
                        onChange={(e) => updateConfig(d => { d.outputVariable = e.target.value })}
                        placeholder="ia_respuesta"
                        className="bg-neutral-950 border-neutral-800 font-mono text-purple-400"
                    />
                </Field>
            </SettingsSection>
        </div>
    );
};
