// src/components/settings/nodes/ConditionSettings.tsx
'use client';
import React, { useCallback } from 'react';
import { Node } from 'reactflow';
import { produce } from 'immer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SettingsSection, Field } from '../SharedComponents';
import { GitBranch, Plus, Trash2, Split, CaseSensitive, MoreHorizontal, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// --- Tipos ---

type LogicalOperator = 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'gt' | 'lt' | 'gte' | 'lte' | 'is_set' | 'is_empty' | 'regex';

interface Condition {
    id: string;
    variable: string;
    operator: LogicalOperator;
    value: string;
}

interface Route {
    id: string;
    label: string; // Nombre de la salida (Handle)
    matchType: 'AND' | 'OR'; // Si cumple todas o alguna condición interna
    conditions: Condition[];
}

interface ConditionNodeData {
    routes?: Route[];
    defaultLabel?: string; // Etiqueta para el camino "Else"
    fuzzyMatch?: boolean; // Ignorar Case/Acentos
    trimWhitespace?: boolean;
}

interface NodeSettingsProps {
    node: Node<ConditionNodeData>;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

// --- Constantes ---

const OPERATORS = [
    {
        label: "Texto",
        options: [
            { value: "equals", label: "Es igual a" },
            { value: "not_equals", label: "No es igual a" },
            { value: "contains", label: "Contiene" },
            { value: "starts_with", label: "Empieza con" },
            { value: "ends_with", label: "Termina con" },
            { value: "regex", label: "Regex (Avanzado)" },
        ]
    },
    {
        label: "Numérico",
        options: [
            { value: "gt", label: "Mayor que (>)" },
            { value: "lt", label: "Menor que (<)" },
            { value: "gte", label: "Mayor o igual (>=)" },
            { value: "lte", label: "Menor o igual (<=)" },
        ]
    },
    {
        label: "Estado (Null Safety)",
        options: [
            { value: "is_set", label: "Tiene Valor (Existe)" },
            { value: "is_empty", label: "Está Vacío (Null/Undefined)" },
        ]
    }
];

export const ConditionSettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    const data = node.data || {};
    const routes = data.routes || [];

    // Helper para actualizar con Immer
    const updateState = useCallback((fn: (draft: ConditionNodeData) => void) => {
        const newData = produce(data, fn);
        updateNodeConfig(node.id, newData);
    }, [data, node.id, updateNodeConfig]);

    // --- Acciones de Rutas ---

    const addRoute = () => {
        updateState(draft => {
            if (!draft.routes) draft.routes = [];
            draft.routes.push({
                id: crypto.randomUUID(),
                label: `Caso ${draft.routes.length + 1}`,
                matchType: 'AND',
                conditions: [{ id: crypto.randomUUID(), variable: '', operator: 'equals', value: '' }]
            });
        });
    };

    const removeRoute = (routeId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        updateState(draft => {
            if (draft.routes) {
                draft.routes = draft.routes.filter(r => r.id !== routeId);
            }
        });
    };

    const updateRouteLabel = (routeId: string, label: string) => {
        updateState(draft => {
            const route = draft.routes?.find(r => r.id === routeId);
            if (route) route.label = label;
        });
    };

    // --- Acciones de Condiciones ---

    const addCondition = (routeId: string) => {
        updateState(draft => {
            const route = draft.routes?.find(r => r.id === routeId);
            if (route) {
                route.conditions.push({ id: crypto.randomUUID(), variable: '', operator: 'equals', value: '' });
            }
        });
    };

    const removeCondition = (routeId: string, conditionId: string) => {
        updateState(draft => {
            const route = draft.routes?.find(r => r.id === routeId);
            if (route) {
                route.conditions = route.conditions.filter(c => c.id !== conditionId);
            }
        });
    };

    const updateCondition = (routeId: string, conditionId: string, field: keyof Condition, value: string) => {
        updateState(draft => {
            const route = draft.routes?.find(r => r.id === routeId);
            const condition = route?.conditions.find(c => c.id === conditionId);
            if (condition) {
                // @ts-ignore
                condition[field] = value;
            }
        });
    };

    return (
        <div className="space-y-4">
            {/* 1. Sanitización Global */}
            <SettingsSection title="🧠 Lógica Difusa (Fuzzy Logic)">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <label className="text-sm font-medium text-white flex items-center gap-2">
                            <CaseSensitive className="w-4 h-4 text-purple-400"/>
                            Ignorar Mayúsculas y Acentos
                        </label>
                        <p className="text-xs text-neutral-500">
                            "HOLA" será igual a "hola" y "Canción" a "cancion".
                        </p>
                    </div>
                    <Switch 
                        checked={data.fuzzyMatch !== false} // Default true
                        onCheckedChange={(c) => updateState(d => { d.fuzzyMatch = c })}
                    />
                </div>
                <Separator className="bg-neutral-800 my-2" />
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <label className="text-sm font-medium text-white flex items-center gap-2">
                            <Split className="w-4 h-4 text-blue-400"/>
                            Trim Whitespace
                        </label>
                        <p className="text-xs text-neutral-500">
                            Elimina espacios al inicio/final antes de comparar.
                        </p>
                    </div>
                    <Switch 
                        checked={data.trimWhitespace !== false} 
                        onCheckedChange={(c) => updateState(d => { d.trimWhitespace = c })}
                    />
                </div>
            </SettingsSection>

            {/* 2. Constructor de Rutas */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                    <h4 className="font-semibold text-lg text-white">🔀 Rutas de Decisión</h4>
                    <Button size="sm" variant="secondary" onClick={addRoute} className="h-7 text-xs bg-purple-900/50 hover:bg-purple-900 text-purple-200 border border-purple-800">
                        <Plus className="w-3 h-3 mr-1" /> Nueva Ruta
                    </Button>
                </div>

                <Accordion type="single" collapsible className="w-full space-y-2">
                    {routes.map((route, index) => (
                        <AccordionItem key={route.id} value={route.id} className="border border-neutral-800 bg-neutral-900/50 rounded-lg overflow-hidden">
                            <div className="flex items-center px-3 py-2 border-b border-neutral-800 bg-neutral-900">
                                <GitBranch className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
                                <Input 
                                    className="h-7 text-sm bg-transparent border-transparent hover:border-neutral-700 focus:border-neutral-600 focus:bg-neutral-950 w-full font-medium" 
                                    value={route.label}
                                    onChange={(e) => updateRouteLabel(route.id, e.target.value)}
                                    placeholder="Nombre de la ruta (ej: VIP)"
                                />
                                <AccordionTrigger className="hover:no-underline py-0 pr-2 pl-2" />
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-neutral-500 hover:text-red-400 hover:bg-neutral-800" onClick={(e) => removeRoute(route.id, e)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            
                            <AccordionContent className="p-3 pt-4 space-y-4">
                                {route.conditions.map((condition, cIndex) => {
                                    const isNullCheck = ['is_set', 'is_empty'].includes(condition.operator);
                                    
                                    return (
                                        <div key={condition.id} className="flex flex-col gap-2 relative pl-4 border-l-2 border-neutral-800">
                                            {cIndex > 0 && (
                                                <Badge variant="outline" className="absolute -left-[19px] -top-3 bg-neutral-900 text-[10px] py-0 h-4 border-neutral-700 text-neutral-500">
                                                    {route.matchType}
                                                </Badge>
                                            )}
                                            
                                            <div className="grid grid-cols-[1fr,auto] gap-2">
                                                <Input 
                                                    placeholder="Variable {{var}}" 
                                                    value={condition.variable} 
                                                    onChange={(e) => updateCondition(route.id, condition.id, 'variable', e.target.value)}
                                                    className="h-8 font-mono text-xs text-purple-400 bg-neutral-950 border-neutral-800"
                                                />
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-600 hover:text-red-400" onClick={() => removeCondition(route.id, condition.id)}>
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>

                                            <div className={cn("grid gap-2", isNullCheck ? "grid-cols-1" : "grid-cols-[130px,1fr]")}>
                                                <Select value={condition.operator} onValueChange={(val) => updateCondition(route.id, condition.id, 'operator', val)}>
                                                    <SelectTrigger className="h-8 text-xs bg-neutral-950 border-neutral-800">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {OPERATORS.map((group) => (
                                                            <SelectGroup key={group.label}>
                                                                <SelectLabel className="text-[10px] text-neutral-500 uppercase tracking-wider">{group.label}</SelectLabel>
                                                                {group.options.map(op => (
                                                                    <SelectItem key={op.value} value={op.value} className="text-xs">
                                                                        {op.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectGroup>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                {!isNullCheck && (
                                                    <Input 
                                                        placeholder="Valor" 
                                                        value={condition.value} 
                                                        onChange={(e) => updateCondition(route.id, condition.id, 'value', e.target.value)}
                                                        className="h-8 text-xs bg-neutral-950 border-neutral-800"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                <Button variant="outline" size="sm" onClick={() => addCondition(route.id)} className="w-full h-7 text-xs border-dashed border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800">
                                    <Plus className="w-3 h-3 mr-1" /> Agregar Condición (AND)
                                </Button>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                
                {routes.length === 0 && (
                    <div className="text-center p-6 border border-dashed border-neutral-800 rounded-lg">
                        <p className="text-sm text-neutral-500 mb-2">No hay reglas definidas.</p>
                        <p className="text-xs text-neutral-600">Todo el tráfico irá a la salida "Else".</p>
                    </div>
                )}
            </div>

            {/* 3. Ruta Default (Else) */}
            <SettingsSection title="🚫 Ruta por Defecto (Else)">
                <Field label="Nombre de la Salida" htmlFor="defaultLabel" description="Si ninguna condición se cumple.">
                     <Input 
                        id="defaultLabel"
                        value={data.defaultLabel || 'Si no coincide (Else)'} 
                        onChange={(e) => updateState(d => { d.defaultLabel = e.target.value })} 
                        className="bg-neutral-950 border-neutral-800 text-neutral-400 italic"
                    />
                </Field>
            </SettingsSection>
        </div>
    );
};
