// src/components/settings/nodes/CaptureInputSettings.tsx
'use client';
import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Node } from 'reactflow';
import { produce } from 'immer';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsSection, Field } from '../SharedComponents';
import { Clock, AlertTriangle, CornerDownRight, ShieldAlert } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface CaptureInputData {
    variableName?: string;
    inputType?: string; // 'text', 'email', 'phone', 'date', 'url', 'number', 'regex', 'image', 'document'
    validationRegex?: string;
    errorMessage?: string;
    maxRetries?: number;
    timeoutSeconds?: number;
    timeoutMessage?: string;
    exitKeywords?: string;
    isMedia?: boolean;
}

interface NodeSettingsProps {
    node: Node<CaptureInputData>;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

const REGEX_TEMPLATES: Record<string, string> = {
    email: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
    phone: "^\\+?[1-9]\\d{7,14}$",
    date: "^\\d{2}/\\d{2}/\\d{4}$",
    url: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)",
    number: "^\\d+$",
    cpf: "^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$"
};

export const CaptureInputSettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    // Estado inicial seguro
    const data = node.data || {};

    // Función centralizada de actualización con Immer
    const updateConfig = useCallback((path: keyof CaptureInputData, value: any) => {
        const newData = produce(data, draft => {
            // @ts-ignore - Immer maneja el tipado dinámico
            draft[path] = value;
        });
        updateNodeConfig(node.id, newData);
    }, [data, node.id, updateNodeConfig]);

    // Manejo especial para cambio de tipo de input
    const handleTypeChange = (value: string) => {
        const isMedia = ['image', 'document', 'audio', 'video'].includes(value);
        const templateRegex = REGEX_TEMPLATES[value] || '';

        const newData = produce(data, draft => {
            draft.inputType = value;
            draft.isMedia = isMedia;
            if (!isMedia && templateRegex) {
                draft.validationRegex = templateRegex;
            }
            // Si cambia a custom o texto simple, podríamos limpiar el regex o dejarlo
            if (value === 'text') draft.validationRegex = '';
        });
        updateNodeConfig(node.id, newData);
    };

    const getVariableError = (name: string) => {
        if (!name) return null;
        if (/\s/.test(name)) return "No puede contener espacios.";
        if (/[A-Z]/.test(name)) return "No puede contener mayúsculas.";
        if (/\./.test(name)) return "No puede contener puntos.";
        if (/[^a-z0-9_]/.test(name)) return "Solo se permiten letras minúsculas, números y guiones bajos (_).";
        return null;
    };

    const varError = getVariableError(data.variableName || '');

    return (
        <div className="space-y-3">
            <Tabs defaultValue="validation" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-neutral-900/50 h-8 p-1 border border-neutral-800/50 rounded-lg">
                    <TabsTrigger value="validation" className="text-[10px] uppercase font-black tracking-widest data-[state=active]:bg-neutral-800 data-[state=active]:text-white">Validación</TabsTrigger>
                    <TabsTrigger value="logic" className="text-[10px] uppercase font-black tracking-widest data-[state=active]:bg-neutral-800 data-[state=active]:text-white">Lógica</TabsTrigger>
                </TabsList>

                {/* --- TAB: VALIDACIÓN Y VARIABLE --- */}
                <TabsContent value="validation" className="space-y-4 mt-4">
                    <SettingsSection title="📦 Almacenamiento">
                        <Field
                            label="Nombre de la Variable"
                            htmlFor="variableName"
                            description="Se utilizará para recuperar el dato en otros nodos."
                        >
                            <div className="space-y-1.5 flex flex-col">
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-neutral-500 font-mono text-xs">@</span>
                                    <Input
                                        id="variableName"
                                        value={data.variableName || ''}
                                        onChange={(e) => updateConfig('variableName', e.target.value)}
                                        placeholder="ej: email_cliente"
                                        className={cn(
                                            "pl-7 font-mono text-purple-400 bg-neutral-900/20 border-neutral-800/50 focus:border-purple-500/50",
                                            varError && "border-red-500/50 focus:border-red-500/50 text-red-400"
                                        )}
                                    />
                                </div>
                                {varError && (
                                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-tight ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                        ⚠️ {varError}
                                    </span>
                                )}
                            </div>
                        </Field>
                    </SettingsSection>

                    <SettingsSection title="🛡️ Reglas de Entrada">
                        <Field label="Tipo de Dato Esperado" htmlFor="inputType">
                            <Select value={data.inputType || 'text'} onValueChange={handleTypeChange}>
                                <SelectTrigger className="bg-neutral-950 border-neutral-800">
                                    <SelectValue placeholder="Selecciona un tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Texto Libre (Cualquiera)</SelectItem>
                                    <SelectItem value="email">📧 Email</SelectItem>
                                    <SelectItem value="phone">📱 Teléfono</SelectItem>
                                    <SelectItem value="number">🔢 Número Entero</SelectItem>
                                    <SelectItem value="date">📅 Fecha (DD/MM/AAAA)</SelectItem>
                                    <SelectItem value="url">🔗 URL / Link</SelectItem>
                                    <SelectItem value="cpf">🆔 CPF / DNI (Formato)</SelectItem>
                                    <SelectItem value="regex">🛠️ Regex Personalizado</SelectItem>
                                    <Separator className="my-1 bg-neutral-800" />
                                    <SelectItem value="image">📷 Imagen (Media)</SelectItem>
                                    <SelectItem value="document">📄 Documento (PDF/Doc)</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>

                        {!data.isMedia && (
                            <div className="space-y-3 pt-2">
                                <Field
                                    label="Expresión Regular (Regex)"
                                    htmlFor="regex"
                                    description={data.inputType !== 'regex' ? "Información: En este modo la validación es flexible." : "Define tu propia validación estricta."}
                                >
                                    <Input
                                        id="regex"
                                        value={data.validationRegex || ''}
                                        onChange={(e) => updateConfig('validationRegex', e.target.value)}
                                        disabled={data.inputType !== 'regex'}
                                        className="font-mono text-xs text-yellow-500 bg-neutral-950 border-neutral-800 disabled:opacity-30"
                                        placeholder={REGEX_TEMPLATES[data.inputType || ''] || "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$"}
                                    />
                                </Field>

                                <Field
                                    label="Mensaje de Error"
                                    htmlFor="errorMessage"
                                    description="Se enviará si la validación falla."
                                >
                                    <div className="space-y-2">
                                        <Textarea
                                            id="errorMessage"
                                            value={data.errorMessage || ''}
                                            onChange={(e) => updateConfig('errorMessage', e.target.value)}
                                            placeholder="Formato inválido. Por favor intenta de nuevo..."
                                            className="min-h-[80px] bg-neutral-950 border-neutral-800 resize-none"
                                        />
                                        {data.inputType === 'text' && data.errorMessage && (
                                            <div className="flex items-center gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                                                <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                                                <span className="text-[9px] text-amber-200/80 leading-tight">
                                                    Nota: En "Texto Libre", este mensaje solo se enviará si la respuesta es detectada como inválida o vacía.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Field>
                            </div>
                        )}

                        {data.isMedia && (
                            <div className="flex items-start gap-3 px-2 py-3 bg-blue-500/5 border-l-2 border-blue-500 rounded-r-md">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
                                <p className="text-[11px] text-blue-300 font-medium">El bot esperará un archivo adjunto. El enlace público del archivo se guardará en la variable.</p>
                            </div>
                        )}
                    </SettingsSection>
                </TabsContent>

                {/* --- TAB: LÓGICA DE REINTENTO Y SALIDA --- */}
                <TabsContent value="logic" className="space-y-4 mt-4">
                    <SettingsSection title="🔄 Bucle de Reintentos">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Intentos Máximos" htmlFor="maxRetries">
                                <Input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={data.maxRetries || 3}
                                    onChange={(e) => updateConfig('maxRetries', parseInt(e.target.value))}
                                    className="bg-neutral-950 border-neutral-800"
                                />
                            </Field>
                            <div className="flex items-end pb-2">
                                <p className="text-xs text-neutral-500">
                                    Si falla {data.maxRetries || 3} veces, el flujo continuará por la salida de "Fallo".
                                </p>
                            </div>
                        </div>
                    </SettingsSection>

                    <SettingsSection title="⏳ Anti-Ghosting (Timeouts)">
                        <Field
                            label="Tiempo de Espera (Segundos)"
                            htmlFor="timeout"
                            description="Si no responde en este tiempo, se cancela la espera."
                        >
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                                <Input
                                    type="number"
                                    min={30}
                                    value={data.timeoutSeconds || 300}
                                    onChange={(e) => updateConfig('timeoutSeconds', parseInt(e.target.value))}
                                    className="pl-9 bg-neutral-950 border-neutral-800"
                                />
                            </div>
                        </Field>

                        <Field label="Mensaje de Timeout" htmlFor="timeoutMsg">
                            <Textarea
                                value={data.timeoutMessage || ''}
                                onChange={(e) => updateConfig('timeoutMessage', e.target.value)}
                                placeholder="La sesión ha expirado por inactividad."
                                className="min-h-[60px] bg-neutral-950 border-neutral-800"
                            />
                        </Field>
                    </SettingsSection>

                    <SettingsSection title="🚪 Salida Inteligente">
                        <Field
                            label="Palabras Clave de Cancelación"
                            htmlFor="exitKeywords"
                            description="Separadas por coma. Permiten al usuario salir del formulario."
                        >
                            <div className="relative">
                                <CornerDownRight className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                                <Input
                                    value={data.exitKeywords || ''}
                                    onChange={(e) => updateConfig('exitKeywords', e.target.value)}
                                    placeholder="cancelar, salir, menú, stop"
                                    className="pl-9 bg-neutral-950 border-neutral-800"
                                />
                            </div>
                        </Field>

                        <div className="flex items-start gap-3 px-2 py-3 bg-amber-500/5 border-l-2 border-amber-500 rounded-r-md">
                            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                            <p className="text-[11px] text-amber-200/70 font-medium">
                                Estas palabras interrumpirán la captura inmediatamente y desviarán el flujo.
                            </p>
                        </div>
                    </SettingsSection>
                </TabsContent>
            </Tabs>
        </div>
    );
};

