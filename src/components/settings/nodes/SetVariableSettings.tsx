// src/components/settings/nodes/SetVariableSettings.tsx
'use client';
import React, { useCallback } from 'react';
import { Node } from 'reactflow';
import { produce } from 'immer';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsSection, Field } from '../SharedComponents';
import { 
    Calculator, 
    Calendar, 
    Type, 
    List, 
    Database, 
    Zap, 
    ArrowRight,
    Clock
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface SetVariableData {
    variableName?: string;
    scope?: 'session' | 'user'; // 'user' persiste en DB
    operationCategory?: 'set' | 'math' | 'list' | 'date' | 'string';
    
    // Configuración específica
    operation?: string; // 'add', 'push', 'capitalize', etc.
    value?: string; // El valor a operar (ej: 5, "hola", {{var}})
    
    // Para fechas
    timeUnit?: 'days' | 'hours' | 'minutes';
    dateFormat?: string;
}

interface NodeSettingsProps {
    node: Node<SetVariableData>;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

export const SetVariableSettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    const data = node.data || {};

    const updateConfig = useCallback((path: keyof SetVariableData, value: any) => {
        const newData = produce(data, draft => {
            // @ts-ignore
            draft[path] = value;
            
            // Resetear valores si cambia la categoría
            if (path === 'operationCategory') {
                // Defaults inteligentes por categoría
                if (value === 'math') draft.operation = 'add';
                else if (value === 'list') draft.operation = 'push';
                else if (value === 'date') draft.operation = 'now';
                else if (value === 'string') draft.operation = 'capitalize';
                else draft.operation = 'assign';
                
                draft.value = '';
            }
        });
        updateNodeConfig(node.id, newData);
    }, [data, node.id, updateNodeConfig]);

    // Generar resumen visual de la operación
    const getOperationSummary = () => {
        const v = data.variableName || 'var';
        const val = data.value || 'valor';
        
        switch (data.operationCategory) {
            case 'math':
                if (data.operation === 'increment') return `${v} = ${v} + 1`;
                if (data.operation === 'decrement') return `${v} = ${v} - 1`;
                const opMap: Record<string, string> = { add: '+', subtract: '-', multiply: '*', divide: '/' };
                return `${v} = ${v} ${opMap[data.operation || 'add']} ${val}`;
            case 'list':
                if (data.operation === 'push') return `${v}.push(${val})`;
                if (data.operation === 'count') return `${v} = length(${val})`;
                return `${v}.${data.operation}(${val})`;
            case 'date':
                if (data.operation === 'now') return `${v} = NOW()`;
                if (data.operation === 'add') return `${v} = NOW + ${val} ${data.timeUnit}`;
                return `DateOp(${v})`;
            case 'string':
                if (data.operation === 'concat') return `${v} = ${v} + ${val}`;
                return `${v} = ${data.operation}(${v})`;
            default:
                return `${v} = ${val}`;
        }
    };

    return (
        <div className="space-y-4">
            {/* 1. Definición y Ámbito */}
            <SettingsSection title="🎯 Variable Objetivo">
                <Field label="Nombre de Variable" htmlFor="variableName" description="Sin espacios. Usa snake_case.">
                    <Input 
                        value={data.variableName || ''} 
                        onChange={(e) => updateConfig('variableName', e.target.value.replace(/\s+/g, '_').toLowerCase())} 
                        placeholder="ej: contador_visitas" 
                        className="font-mono text-purple-400 bg-neutral-950 border-neutral-800"
                    />
                </Field>

                <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <div className="space-y-0.5">
                        <label className="text-sm font-medium text-white flex items-center gap-2">
                            {data.scope === 'user' ? <Database className="w-4 h-4 text-blue-400"/> : <Zap className="w-4 h-4 text-yellow-400"/>}
                            {data.scope === 'user' ? 'Persistencia: Usuario' : 'Persistencia: Sesión'}
                        </label>
                        <p className="text-xs text-neutral-500 max-w-[200px]">
                            {data.scope === 'user' 
                                ? "Se guarda en la DB del usuario permanentemente." 
                                : "Se borra al terminar la conversación (RAM)."}
                        </p>
                    </div>
                    <Switch 
                        checked={data.scope === 'user'} 
                        onCheckedChange={(c) => updateConfig('scope', c ? 'user' : 'session')}
                    />
                </div>
            </SettingsSection>

            {/* 2. Tipo de Operación */}
            <SettingsSection title="⚙️ Operación">
                <Tabs value={data.operationCategory || 'set'} onValueChange={(v) => updateConfig('operationCategory', v)} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 h-9 bg-neutral-900 p-0.5">
                        <TabsTrigger value="set" className="text-xs"><ArrowRight className="w-3 h-3"/></TabsTrigger>
                        <TabsTrigger value="math" className="text-xs"><Calculator className="w-3 h-3"/></TabsTrigger>
                        <TabsTrigger value="list" className="text-xs"><List className="w-3 h-3"/></TabsTrigger>
                        <TabsTrigger value="string" className="text-xs"><Type className="w-3 h-3"/></TabsTrigger>
                        <TabsTrigger value="date" className="text-xs"><Calendar className="w-3 h-3"/></TabsTrigger>
                    </TabsList>
                    
                    <div className="mt-4 space-y-4">
                        {/* A. Asignación Simple */}
                        <TabsContent value="set" className="mt-0">
                            <Field label="Valor a Asignar" htmlFor="val-set">
                                <Input 
                                    value={data.value || ''} 
                                    onChange={(e) => updateConfig('value', e.target.value)}
                                    placeholder="Texto, número o {{otra_variable}}"
                                />
                            </Field>
                        </TabsContent>

                        {/* B. Matemáticas */}
                        <TabsContent value="math" className="mt-0 space-y-3">
                            <div className="grid grid-cols-[140px,1fr] gap-2">
                                <Select value={data.operation || 'add'} onValueChange={(v) => updateConfig('operation', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="add">Sumar (+)</SelectItem>
                                        <SelectItem value="subtract">Restar (-)</SelectItem>
                                        <SelectItem value="multiply">Multiplicar (*)</SelectItem>
                                        <SelectItem value="divide">Dividir (/)</SelectItem>
                                        <SelectItem value="increment">Incrementar (+1)</SelectItem>
                                        <SelectItem value="decrement">Decrementar (-1)</SelectItem>
                                    </SelectContent>
                                </Select>

                                {!['increment', 'decrement'].includes(data.operation || '') && (
                                    <Input 
                                        type="number"
                                        value={data.value || ''} 
                                        onChange={(e) => updateConfig('value', e.target.value)}
                                        placeholder="Valor"
                                    />
                                )}
                            </div>
                        </TabsContent>

                        {/* C. Listas */}
                        <TabsContent value="list" className="mt-0 space-y-3">
                            <Field label="Acción de Lista" htmlFor="op-list">
                                <Select value={data.operation || 'push'} onValueChange={(v) => updateConfig('operation', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="push">Añadir al final (Push)</SelectItem>
                                        <SelectItem value="remove_val">Eliminar por Valor</SelectItem>
                                        <SelectItem value="clear">Vaciar Lista</SelectItem>
                                        <SelectItem value="count">Contar Elementos (Length)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            
                            {!['clear'].includes(data.operation || '') && (
                                <Field label={data.operation === 'count' ? "Lista a Contar" : "Valor del Ítem"} htmlFor="val-list">
                                    <Input 
                                        value={data.value || ''} 
                                        onChange={(e) => updateConfig('value', e.target.value)}
                                        placeholder={data.operation === 'count' ? "{{lista_productos}}" : "Producto ID o Valor"}
                                    />
                                </Field>
                            )}
                        </TabsContent>

                        {/* D. Texto */}
                        <TabsContent value="string" className="mt-0 space-y-3">
                            <Field label="Transformación" htmlFor="op-str">
                                <Select value={data.operation || 'capitalize'} onValueChange={(v) => updateConfig('operation', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="capitalize">Capitalizar (Juan)</SelectItem>
                                        <SelectItem value="lowercase">Minúsculas (juan)</SelectItem>
                                        <SelectItem value="uppercase">Mayúsculas (JUAN)</SelectItem>
                                        <SelectItem value="trim">Limpiar Espacios (Trim)</SelectItem>
                                        <SelectItem value="concat">Concatenar (Unir)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>

                            {data.operation === 'concat' && (
                                <Field label="Texto a añadir al final" htmlFor="val-str">
                                    <Input 
                                        value={data.value || ''} 
                                        onChange={(e) => updateConfig('value', e.target.value)}
                                        placeholder=" ej: ' y apellido'"
                                    />
                                </Field>
                            )}
                        </TabsContent>

                        {/* E. Fechas */}
                        <TabsContent value="date" className="mt-0 space-y-3">
                             <Select value={data.operation || 'now'} onValueChange={(v) => updateConfig('operation', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="now">Fijar a Fecha Actual (NOW)</SelectItem>
                                    <SelectItem value="add">Sumar Tiempo a Fecha Actual</SelectItem>
                                    <SelectItem value="subtract">Restar Tiempo a Fecha Actual</SelectItem>
                                </SelectContent>
                            </Select>

                            {['add', 'subtract'].includes(data.operation || '') && (
                                <div className="grid grid-cols-[1fr,110px] gap-2">
                                    <Input 
                                        type="number"
                                        value={data.value || ''} 
                                        onChange={(e) => updateConfig('value', e.target.value)}
                                        placeholder="Cantidad"
                                    />
                                    <Select value={data.timeUnit || 'days'} onValueChange={(v) => updateConfig('timeUnit', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="minutes">Minutos</SelectItem>
                                            <SelectItem value="hours">Horas</SelectItem>
                                            <SelectItem value="days">Días</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                             <Field label="Formato de Guardado" htmlFor="date-fmt" description="Opcional. Default: ISO String">
                                <Input 
                                    value={data.dateFormat || ''} 
                                    onChange={(e) => updateConfig('dateFormat', e.target.value)}
                                    placeholder="DD/MM/YYYY HH:mm"
                                    className="font-mono text-xs"
                                />
                            </Field>
                        </TabsContent>
                    </div>
                </Tabs>
            </SettingsSection>
            
            {/* Visual Code Preview */}
            <div className="bg-neutral-900 rounded-md p-3 border border-neutral-800 flex items-center gap-3">
                <div className="bg-neutral-800 p-2 rounded text-neutral-400">
                    <SettingsSection title="" children={null}/> 
                     {/* Hack visual o usar icono directo */}
                     <Calculator className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] uppercase text-neutral-500 font-bold">Resumen de lógica</p>
                    <p className="font-mono text-sm text-green-400 truncate">{getOperationSummary()}</p>
                </div>
            </div>
        </div>
    );
};
