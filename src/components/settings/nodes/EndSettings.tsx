// src/components/settings/nodes/EndSettings.tsx
'use client';
import React, { useCallback, useState } from 'react';
import { Node } from 'reactflow';
import { produce } from 'immer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsSection, Field } from '../SharedComponents';
import { 
    Flag, 
    Trash2, 
    MessageCircle, 
    RefreshCcw, 
    Webhook, 
    Star,
    CheckCircle2,
    XCircle,
    MinusCircle
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface EndNodeData {
    outcome?: 'success' | 'failure' | 'neutral';
    outcomeLabel?: string;
    clearVariables?: string; // Lista separada por comas
    triggerCsat?: boolean;
    sessionReset?: 'hard' | 'soft';
    finalWebhookUrl?: string;
}

interface NodeSettingsProps {
    node: Node<EndNodeData>;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

export const EndSettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    const data = node.data || {};
    
    // Estado local para la UI de Outcome
    const [outcome, setOutcome] = useState<EndNodeData['outcome']>(data.outcome || 'neutral');

    const updateConfig = useCallback((fn: (draft: EndNodeData) => void) => {
        const newData = produce(data, draft => {
            fn(draft);
        });
        updateNodeConfig(node.id, newData);
    }, [data, node.id, updateNodeConfig]);

    const handleOutcomeChange = (val: EndNodeData['outcome']) => {
        setOutcome(val);
        updateConfig(d => { d.outcome = val });
    };

    return (
        <div className="space-y-4">
            {/* 1. Categorización de Resultado */}
            <SettingsSection title="🏁 Resultado de la Sesión">
                <div className="grid grid-cols-3 gap-2 mb-3">
                    <button
                        onClick={() => handleOutcomeChange('success')}
                        className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-1",
                            outcome === 'success' 
                                ? "bg-green-500/20 border-green-500 text-green-400" 
                                : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:bg-neutral-800"
                        )}
                    >
                        <CheckCircle2 size={20} />
                        <span className="text-[10px] font-bold uppercase">Éxito</span>
                    </button>
                    <button
                        onClick={() => handleOutcomeChange('failure')}
                        className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-1",
                            outcome === 'failure' 
                                ? "bg-red-500/20 border-red-500 text-red-400" 
                                : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:bg-neutral-800"
                        )}
                    >
                        <XCircle size={20} />
                        <span className="text-[10px] font-bold uppercase">Fallo</span>
                    </button>
                    <button
                        onClick={() => handleOutcomeChange('neutral')}
                        className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-1",
                            outcome === 'neutral' 
                                ? "bg-neutral-700/50 border-neutral-500 text-white" 
                                : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:bg-neutral-800"
                        )}
                    >
                        <MinusCircle size={20} />
                        <span className="text-[10px] font-bold uppercase">Neutral</span>
                    </button>
                </div>
                
                <Field label="Etiqueta Analítica" htmlFor="outcomeLabel" description="Nombre para reportes (ej: 'Venta Completada').">
                    <Input 
                        value={data.outcomeLabel || ''} 
                        onChange={(e) => updateConfig(d => { d.outcomeLabel = e.target.value })}
                        placeholder={outcome === 'success' ? "Venta Realizada" : "Abandono"}
                        className="bg-neutral-950 border-neutral-800"
                    />
                </Field>
            </SettingsSection>

            {/* 2. Acciones Automáticas */}
            <SettingsSection title="🤖 Acciones de Cierre">
                
                {/* CSAT Trigger */}
                <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3 opacity-50 select-none">
                        <div className="p-2 bg-yellow-900/20 text-yellow-500 rounded-md">
                            <Star size={16} />
                        </div>
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-white">Encuesta CSAT</label>
                                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] h-4">PRÓXIMAMENTE</Badge>
                            </div>
                            <p className="text-xs text-neutral-500">Pedir calificación (1-5) antes de cerrar.</p>
                        </div>
                    </div>
                    <Switch 
                        disabled
                        checked={false}
                    />
                </div>
                
                <Separator className="bg-neutral-800 my-2" />

                {/* Session Reset */}
                <div className="space-y-3 pt-2">
                    <Field label="Comportamiento Próxima Sesión" htmlFor="reset">
                        <Select value={data.sessionReset || 'hard'} onValueChange={(v) => updateConfig(d => { d.sessionReset = v as any })}>
                            <SelectTrigger className="bg-neutral-950 border-neutral-800">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hard">
                                    <span className="font-bold text-red-400">Hard Reset:</span> Volver al Inicio (Welcome)
                                </SelectItem>
                                <SelectItem value="soft">
                                    <span className="font-bold text-blue-400">Soft Reset:</span> Mantener contexto previo
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <p className="text-[10px] text-neutral-500 -mt-2">
                        {data.sessionReset === 'hard' 
                            ? "Si el usuario escribe de nuevo, el bot olvidará todo lo ocurrido en esta sesión." 
                            : "El bot intentará retomar la conversación donde se quedó si no ha expirado."}
                    </p>
                </div>
            </SettingsSection>

            {/* 3. Limpieza de Datos */}
            <SettingsSection title="🧹 Garbage Collection">
                <Field 
                    label="Limpiar Variables Temporales" 
                    htmlFor="clearVars" 
                    description="Variables a borrar (separadas por coma) para no ensuciar la próxima sesión."
                >
                    <div className="relative">
                        <Trash2 className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                        <Input 
                            value={data.clearVariables || ''} 
                            onChange={(e) => updateConfig(d => { d.clearVariables = e.target.value })}
                            placeholder="temp_opcion, intentos_login, carrito_id"
                            className="pl-9 bg-neutral-950 border-neutral-800 font-mono text-xs text-neutral-400"
                        />
                    </div>
                </Field>
            </SettingsSection>

            {/* 4. Webhook Final */}
            <div className="pt-2">
                <div className="flex items-center gap-2 mb-2 px-1 opacity-50 select-none">
                    <Webhook className="w-3 h-3 text-purple-500" />
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Webhook Silencioso (Opcional)</span>
                    <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-[8px] h-4 ml-auto">BETA</Badge>
                </div>
                <Input 
                    disabled
                    value={''} 
                    placeholder="https://api.crm.com/hooks/close-ticket"
                    className="bg-neutral-900 border-dashed border-neutral-700 text-xs text-neutral-300 opacity-30"
                />
            </div>
        </div>
    );
};

