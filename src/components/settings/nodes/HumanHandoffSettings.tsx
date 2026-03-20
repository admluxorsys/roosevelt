// src/components/settings/nodes/HumanHandoffSettings.tsx
'use client';
import React, { useCallback } from 'react';
import { Node } from 'reactflow';
import { produce } from 'immer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsSection, Field } from '../SharedComponents';
import { UserCheck, Clock, MessageSquare, Briefcase, Moon, PauseCircle } from 'lucide-react';

interface HandoffData {
    department?: string; // 'sales', 'support'
    agentId?: string; // Opcional (Directo)
    muteBot?: boolean; // Pausar automatización
    whisperNote?: string; // Nota interna
    checkBusinessHours?: boolean;
    offHoursMessage?: string;
}

interface NodeSettingsProps {
    node: Node<HandoffData>;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

export const HumanHandoffSettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    const data = node.data || {};

    const updateConfig = useCallback((fn: (draft: HandoffData) => void) => {
        const newData = produce(data, fn);
        updateNodeConfig(node.id, newData);
    }, [data, node.id, updateNodeConfig]);

    return (
        <div className="space-y-4">
            <SettingsSection title="👩‍💼 Enrutamiento">
                <Field label="Departamento / Cola" htmlFor="dept">
                    <Select value={data.department || 'support'} onValueChange={(v) => updateConfig(d => { d.department = v })}>
                        <SelectTrigger className="bg-neutral-950 border-neutral-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="support"><span className="flex items-center gap-2"><Briefcase size={12}/> Soporte General</span></SelectItem>
                            <SelectItem value="sales">Ventas</SelectItem>
                            <SelectItem value="billing">Facturación</SelectItem>
                            <SelectItem value="tier2">Soporte Nivel 2</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>

                <Field label="ID Agente Específico (Opcional)" htmlFor="agent">
                    <Input 
                        value={data.agentId || ''}
                        onChange={(e) => updateConfig(d => { d.agentId = e.target.value })}
                        placeholder="ej: agent_007"
                        className="bg-neutral-950 border-neutral-800 text-xs font-mono"
                    />
                </Field>
            </SettingsSection>

            <SettingsSection title="🤫 Transición Suave">
                <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-neutral-800 text-neutral-400 rounded-md">
                            <PauseCircle size={18} />
                        </div>
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium text-white">Pausar Bot</label>
                            <p className="text-xs text-neutral-500">El bot no responderá mientras hable el humano.</p>
                        </div>
                    </div>
                    <Switch 
                        checked={data.muteBot !== false} 
                        onCheckedChange={(c) => updateConfig(d => { d.muteBot = c })}
                    />
                </div>

                <div className="mt-4">
                    <Field label="Nota Interna (Whisper)" htmlFor="whisper" description="Contexto invisible para el agente.">
                        <Textarea 
                            value={data.whisperNote || ''}
                            onChange={(e) => updateConfig(d => { d.whisperNote = e.target.value })}
                            placeholder="Cliente VIP. Viene enojado por retraso en envío..."
                            className="bg-neutral-950 border-neutral-800 text-xs min-h-[80px]"
                        />
                    </Field>
                </div>
            </SettingsSection>

            <SettingsSection title="🌙 Horario y Disponibilidad">
                <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <label className="text-xs font-medium text-neutral-300">Validar Horario Comercial</label>
                    </div>
                    <Switch 
                        checked={data.checkBusinessHours || false} 
                        onCheckedChange={(c) => updateConfig(d => { d.checkBusinessHours = c })}
                    />
                </div>
                
                {data.checkBusinessHours && (
                    <div className="pl-6 border-l-2 border-neutral-800">
                        <Field label="Mensaje Fuera de Horario" htmlFor="off-msg">
                            <Textarea 
                                value={data.offHoursMessage || ''}
                                onChange={(e) => updateConfig(d => { d.offHoursMessage = e.target.value })}
                                placeholder="Nuestros agentes descansan. Te contactaremos mañana."
                                className="bg-neutral-900 border-neutral-800 text-xs"
                            />
                        </Field>
                    </div>
                )}
            </SettingsSection>
        </div>
    );
};
