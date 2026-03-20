// src/components/settings/nodes/SentimentAnalysisSettings.tsx
'use client';
import React, { useCallback } from 'react';
import { Node } from 'reactflow';
import { produce } from 'immer';
import { Input } from '@/components/ui/input';
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsSection, Field } from '../SharedComponents';
import { Smile, Frown, Meh, GitBranch, Target, AlertTriangle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface SentimentData {
    inputVariable?: string; // Variable a analizar
    threshold?: number; // Confianza mínima 0-100
    domainContext?: string; // Contexto de negocio
    routing?: {
        positive?: string; // NodeId o Action
        negative?: string;
        neutral?: string;
    }
}

interface NodeSettingsProps {
    node: Node<SentimentData>;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

export const SentimentAnalysisSettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    const data = node.data || {};

    const updateConfig = useCallback((fn: (draft: SentimentData) => void) => {
        const newData = produce(data, fn);
        updateNodeConfig(node.id, newData);
    }, [data, node.id, updateNodeConfig]);

    return (
        <div className="space-y-4">
            <SettingsSection title="🧠 Configuración de Análisis">
                <Field label="Texto a Analizar" htmlFor="input-var">
                    <Input 
                        value={data.inputVariable || ''}
                        onChange={(e) => updateConfig(d => { d.inputVariable = e.target.value })}
                        placeholder="{{ultimo_mensaje_cliente}}"
                        className="bg-neutral-950 border-neutral-800 font-mono text-purple-400"
                    />
                </Field>

                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-neutral-300">
                            <Target size={14} />
                            <label className="text-xs font-medium">Umbral de Confianza</label>
                        </div>
                        <span className="text-xs font-mono text-white">{data.threshold || 70}%</span>
                    </div>
                    <Slider 
                        value={[data.threshold || 70]} 
                        min={50} 
                        max={95} 
                        step={5}
                        onValueChange={(val) => updateConfig(d => { d.threshold = val[0] })}
                    />
                    <p className="text-[10px] text-neutral-500">
                        Solo clasifica si la certeza supera el {data.threshold || 70}%. Si no, será "Neutral".
                    </p>
                </div>

                <Field label="Contexto de Dominio (Opcional)" htmlFor="context" description="Ayuda a calibrar ironías o jerga.">
                     <Textarea 
                        value={data.domainContext || ''}
                        onChange={(e) => updateConfig(d => { d.domainContext = e.target.value })}
                        placeholder="ej: Soporte técnico de videojuegos. 'Matar' es neutro, 'Lag' es negativo."
                        className="h-16 bg-neutral-950 border-neutral-800 text-xs"
                    />
                </Field>
            </SettingsSection>

            <SettingsSection title="🔀 Enrutamiento Emocional">
                <p className="text-xs text-neutral-500 mb-3">Define qué hacer según la emoción detectada.</p>
                
                <div className="space-y-3">
                    {/* Positivo */}
                    <div className="flex items-center gap-3 p-2 bg-green-900/10 border border-green-900/30 rounded-md">
                        <Smile className="text-green-500 w-5 h-5 shrink-0" />
                        <div className="flex-1">
                            <span className="text-xs font-bold text-green-400 block mb-1">Positivo / Feliz</span>
                            <Select>
                                <SelectTrigger className="h-7 text-xs bg-neutral-950 border-neutral-800"><SelectValue placeholder="Continuar flujo..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="next">Siguiente Nodo</SelectItem>
                                    <SelectItem value="review">Pedir Review</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Negativo */}
                    <div className="flex items-center gap-3 p-2 bg-red-900/10 border border-red-900/30 rounded-md">
                        <Frown className="text-red-500 w-5 h-5 shrink-0" />
                        <div className="flex-1">
                            <span className="text-xs font-bold text-red-400 block mb-1">Negativo / Enojado</span>
                            <Select>
                                <SelectTrigger className="h-7 text-xs bg-neutral-950 border-neutral-800"><SelectValue placeholder="Continuar flujo..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="human">Transferir a Humano</SelectItem>
                                    <SelectItem value="apology">Pedir Disculpas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Neutral */}
                    <div className="flex items-center gap-3 p-2 bg-neutral-800/30 border border-neutral-800 rounded-md">
                        <Meh className="text-neutral-400 w-5 h-5 shrink-0" />
                        <div className="flex-1">
                            <span className="text-xs font-bold text-neutral-400 block mb-1">Neutral / Confuso</span>
                            <Select>
                                <SelectTrigger className="h-7 text-xs bg-neutral-950 border-neutral-800"><SelectValue placeholder="Continuar flujo..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="next">Siguiente Nodo</SelectItem>
                                    <SelectItem value="faq">Enviar a FAQ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </SettingsSection>
        </div>
    );
};
