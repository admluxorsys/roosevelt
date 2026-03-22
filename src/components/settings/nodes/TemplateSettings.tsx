// src/components/settings/nodes/TemplateSettings.tsx
'use client';
import React, { useCallback, useState } from 'react';
import { Node } from 'reactflow';
import { produce } from 'immer';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsSection, Field } from '../SharedComponents';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, XCircle, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TemplateVar {
    key: string; // {{1}}, {{2}}
    value: string;
}

interface TemplateData {
    templateName?: string;
    language?: string;
    headerUrl?: string; // Si tiene imagen
    variables?: TemplateVar[];
    status?: 'APPROVED' | 'REJECTED' | 'PENDING';
}

interface NodeSettingsProps {
    node: Node<TemplateData>;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

export const TemplateSettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    const data = node.data || {};
    const [loading, setLoading] = useState(false);

    // Mock de Templates
    const [templates] = useState([
        { name: 'hello_world', lang: 'en_US', status: 'APPROVED', params: [] },
        { name: 'shipping_update', lang: 'es_MX', status: 'APPROVED', params: ['{{1}}', '{{2}}'] }, // Nombre, Pedido
        { name: 'promo_black_friday', lang: 'es_ES', status: 'REJECTED', params: ['{{1}}'], header: 'IMAGE' },
    ]);

    const updateConfig = useCallback((fn: (draft: TemplateData) => void) => {
        const newData = produce(data, fn);
        updateNodeConfig(node.id, newData);
    }, [data, node.id, updateNodeConfig]);

    const handleTemplateSelect = (val: string) => {
        const t = templates.find(temp => temp.name === val);
        if (t) {
            updateConfig(d => {
                d.templateName = t.name;
                d.language = t.lang;
                // @ts-ignore
                d.status = t.status;
                d.variables = t.params.map(p => ({ key: p, value: '' }));
                if (!t.header) d.headerUrl = undefined;
            });
        }
    };

    const updateVar = (idx: number, val: string) => {
        updateConfig(d => { if (d.variables) d.variables[idx].value = val; });
    };

    const syncTemplates = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 1000);
    };

    const selectedTemplate = templates.find(t => t.name === data.templateName);

    return (
        <div className="space-y-4">
            <SettingsSection title="📋 Selección de Plantilla">
                <div className="flex justify-end mb-2">
                    <Button variant="ghost" size="sm" onClick={syncTemplates} className="h-6 text-[10px] text-neutral-400 gap-1 hover:text-white">
                        <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} /> Sincronizar con Meta
                    </Button>
                </div>

                <Field label="Plantilla (HSM)" htmlFor="template">
                    <Select value={data.templateName} onValueChange={handleTemplateSelect}>
                        <SelectTrigger className="bg-neutral-950 border-neutral-800"><SelectValue placeholder="Buscar plantilla..." /></SelectTrigger>
                        <SelectContent>
                            {templates.map(t => (
                                <SelectItem key={t.name} value={t.name} disabled={t.status === 'REJECTED'}>
                                    <div className="flex items-center justify-between w-full min-w-[200px]">
                                        <span>{t.name}</span>
                                        <Badge variant="outline" className={cn("text-[9px] h-4 px-1 ml-2", 
                                            t.status === 'APPROVED' ? "border-green-800 text-green-500" : "border-red-800 text-red-500")}>
                                            {t.status}
                                        </Badge>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                {data.status && (
                    <div className={cn("mt-2 p-2 border rounded text-xs flex items-center gap-2", 
                        data.status === 'APPROVED' ? "bg-green-900/10 border-green-900/30 text-green-400" : "bg-red-900/10 border-red-900/30 text-red-400")}>
                        {data.status === 'APPROVED' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                        <span className="font-mono">{data.language}</span>
                    </div>
                )}
            </SettingsSection>

            {(data.variables && data.variables.length > 0) || selectedTemplate?.header ? (
                <SettingsSection title="✏️ Personalización">
                    
                    {/* Header Image */}
                    {selectedTemplate?.header === 'IMAGE' && (
                        <div className="mb-4 space-y-2">
                             <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1">
                                <ImageIcon size={12}/> Imagen de Cabecera
                            </label>
                            <Input 
                                value={data.headerUrl || ''} 
                                onChange={(e) => updateConfig(d => { d.headerUrl = e.target.value })}
                                placeholder="https://..."
                                className="bg-neutral-950 border-neutral-800 text-xs"
                            />
                        </div>
                    )}

                    {/* Body Variables */}
                    {data.variables?.map((v, i) => (
                        <Field key={i} label={`Variable ${v.key}`} htmlFor={`var-${i}`}>
                            <Input 
                                value={v.value} 
                                onChange={(e) => updateVar(i, e.target.value)}
                                placeholder="Valor o {{variable}}"
                                className="bg-neutral-950 border-neutral-800 font-mono text-xs text-blue-400"
                            />
                        </Field>
                    ))}
                </SettingsSection>
            ) : null}

            <SettingsSection title="📱 Previsualización">
                <div className="bg-white text-black p-3 rounded-lg text-sm relative overflow-hidden shadow-sm">
                    {/* Mock Preview */}
                    {selectedTemplate?.header === 'IMAGE' && (
                        <div className="w-full h-24 bg-neutral-200 rounded mb-2 flex items-center justify-center text-neutral-400">
                             {data.headerUrl ? <img src={data.headerUrl} className="w-full h-full object-cover rounded" alt="Header" onError={(e) => e.currentTarget.style.display='none'} /> : <ImageIcon size={24}/>}
                        </div>
                    )}
                    <p>
                        {data.templateName === 'shipping_update' 
                            ? `Hola ${data.variables?.[0].value || '{{1}}'}, tu pedido ${data.variables?.[1].value || '{{2}}'} ha sido enviado.`
                            : "Selecciona una plantilla para ver el contenido."}
                    </p>
                    <div className="mt-2 text-[10px] text-neutral-400 text-right">Ahora</div>
                </div>
            </SettingsSection>
        </div>
    );
};

