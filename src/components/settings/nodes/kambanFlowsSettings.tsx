// src/components/settings/nodes/kambanFlowsSettings.tsx
'use client';
import React, { useCallback, useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { produce } from 'immer';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsSection, Field } from '../SharedComponents';
import { Button } from '@/components/ui/button';
import { 
    AppWindow, 
    ShieldCheck, 
    Database, 
    AlertTriangle, 
    CheckCircle2, 
    ArrowRight, 
    Plus, 
    Trash2,
    RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface FlowData {
    flowId?: string;
    flowName?: string;
    flowStatus?: 'DRAFT' | 'PUBLISHED';
    screenId?: string;
    tokenType?: 'auto' | 'custom';
    customToken?: string;
    initialData?: { key: string; value: string }[];
    outputVariable?: string;
}

interface NodeSettingsProps {
    node: Node<FlowData>;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

export const kambanFlowsSettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    const data = node.data || {};
    const [loadingFlows, setLoadingFlows] = useState(false);
    
    // Simulación de lista de Flows desde API
    const [availableFlows] = useState([
        { id: 'flow_123', name: 'Encuesta Satisfacción', status: 'PUBLISHED' },
        { id: 'flow_456', name: 'Registro Cliente', status: 'DRAFT' },
        { id: 'flow_789', name: 'Agendar Cita', status: 'PUBLISHED' },
    ]);

    const updateConfig = useCallback((fn: (draft: FlowData) => void) => {
        const newData = produce(data, fn);
        updateNodeConfig(node.id, newData);
    }, [data, node.id, updateNodeConfig]);

    // Data Mapping Actions
    const addDataMapping = () => {
        updateConfig(d => {
            if (!d.initialData) d.initialData = [];
            d.initialData.push({ key: '', value: '' });
        });
    };
    
    const removeDataMapping = (index: number) => {
        updateConfig(d => { if (d.initialData) d.initialData.splice(index, 1); });
    };

    const updateDataMapping = (index: number, field: 'key' | 'value', val: string) => {
        updateConfig(d => { if (d.initialData && d.initialData[index]) d.initialData[index][field] = val; });
    };

    const handleFlowSelection = (flowId: string) => {
        const flow = availableFlows.find(f => f.id === flowId);
        if (flow) {
            updateConfig(d => {
                d.flowId = flow.id;
                d.flowName = flow.name;
                // @ts-ignore
                d.flowStatus = flow.status;
            });
        }
    };

    return (
        <div className="space-y-4">
            <SettingsSection title="🌊 Selección de Flow">
                <div className="space-y-3">
                    <Field label="Flow Disponible" htmlFor="flow-select">
                        <Select value={data.flowId} onValueChange={handleFlowSelection}>
                            <SelectTrigger className="bg-neutral-950 border-neutral-800">
                                <SelectValue placeholder="Selecciona un Flow..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableFlows.map(flow => (
                                    <SelectItem key={flow.id} value={flow.id}>
                                        <div className="flex items-center gap-2">
                                            <span>{flow.name}</span>
                                            <Badge variant="outline" className={cn("text-[10px] h-4 px-1", flow.status === 'PUBLISHED' ? "border-green-800 text-green-500" : "border-yellow-800 text-yellow-500")}>
                                                {flow.status === 'PUBLISHED' ? 'PUB' : 'DRAFT'}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    {data.flowId && (
                        <div className={cn("p-3 border rounded-md flex items-start gap-2 text-xs", data.flowStatus === 'PUBLISHED' ? "bg-green-900/10 border-green-900/50 text-green-400" : "bg-yellow-900/10 border-yellow-900/50 text-yellow-500")}>
                            {data.flowStatus === 'PUBLISHED' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                            <div>
                                <p className="font-bold">{data.flowStatus === 'PUBLISHED' ? "Listo para Producción" : "Modo Borrador (Draft)"}</p>
                                <p className="opacity-80 mt-0.5">
                                    {data.flowStatus === 'PUBLISHED' 
                                        ? "Este flow funcionará correctamente para todos los usuarios." 
                                        : "Solo tú y los desarrolladores podrán ver este flow. Publicalo en Meta para usarlo."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </SettingsSection>

            <SettingsSection title="⚙️ Configuración Técnica">
                <Field label="Pantalla Inicial (Screen ID)" htmlFor="screen-id" description="Opcional. Deja vacío para abrir la pantalla por defecto.">
                    <div className="relative">
                        <AppWindow className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                        <Input 
                            value={data.screenId || ''}
                            onChange={(e) => updateConfig(d => { d.screenId = e.target.value })}
                            placeholder="ej: appointment_screen"
                            className="pl-9 bg-neutral-950 border-neutral-800 font-mono text-purple-400"
                        />
                    </div>
                </Field>

                <div className="grid grid-cols-2 gap-2 pt-2">
                    <Field label="Tipo de Token" htmlFor="token-type">
                        <Select value={data.tokenType || 'auto'} onValueChange={(v) => updateConfig(d => { d.tokenType = v as any })}>
                            <SelectTrigger className="bg-neutral-950 border-neutral-800"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="auto">Auto (UUID)</SelectItem>
                                <SelectItem value="custom">Manual (Var)</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    
                    {data.tokenType === 'custom' && (
                        <Field label="Variable de Token" htmlFor="token-val">
                             <Input 
                                value={data.customToken || ''}
                                onChange={(e) => updateConfig(d => { d.customToken = e.target.value })}
                                placeholder="{{session_id}}"
                                className="bg-neutral-950 border-neutral-800 font-mono text-xs"
                            />
                        </Field>
                    )}
                </div>
            </SettingsSection>

            <SettingsSection title="📤 Mapeo de Datos (Input)">
                <p className="text-xs text-neutral-500 mb-2">Datos que se envían al Flow al abrirse (Initial Payload).</p>
                <div className="space-y-2">
                    {data.initialData?.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Input 
                                placeholder="Key (flow_data)" 
                                value={item.key} 
                                onChange={(e) => updateDataMapping(i, 'key', e.target.value)}
                                className="h-7 text-xs bg-neutral-950 border-neutral-800 font-mono text-yellow-600"
                            />
                            <ArrowRight className="w-3 h-3 text-neutral-600" />
                            <Input 
                                placeholder="Value ({{var}})" 
                                value={item.value} 
                                onChange={(e) => updateDataMapping(i, 'value', e.target.value)}
                                className="h-7 text-xs bg-neutral-950 border-neutral-800 font-mono text-blue-400"
                            />
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-600 hover:text-red-400" onClick={() => removeDataMapping(i)}>
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addDataMapping} className="w-full h-7 text-xs border-dashed border-neutral-800 text-neutral-500 hover:text-white hover:bg-neutral-800">
                        <Plus className="w-3 h-3 mr-1" /> Agregar Dato Inicial
                    </Button>
                </div>
            </SettingsSection>

            <SettingsSection title="📥 Retorno (Output)">
                <Field 
                    label="Guardar Respuesta en Variable" 
                    htmlFor="output-var" 
                    description="El JSON completo devuelto por el Flow se guardará aquí."
                >
                    <div className="relative">
                        <Database className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                        <Input 
                            value={data.outputVariable || ''}
                            onChange={(e) => updateConfig(d => { d.outputVariable = e.target.value })}
                            placeholder="flow_response"
                            className="pl-9 bg-neutral-950 border-neutral-800 font-mono text-green-400"
                        />
                    </div>
                </Field>
            </SettingsSection>
        </div>
    );
};

