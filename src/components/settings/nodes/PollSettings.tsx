// src/components/settings/nodes/PollSettings.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, GripVertical, AlertCircle, CheckCircle2, ListChecks } from 'lucide-react';
import { SettingsSection, Field } from '../SharedComponents';
import { cn } from '@/lib/utils';
import { produce } from 'immer';

interface PollOption {
    id: string;
    text: string;
}

interface NodeSettingsProps {
    node: Node;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 12;
const MAX_OPTION_CHARS = 100;
const MAX_QUESTION_CHARS = 1024; // Límite generoso para el body, pero buena práctica validar

export const PollSettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    const [config, setConfig] = useState({
        question: node.data.question || '',
        allowMultipleAnswers: node.data.allowMultipleAnswers || false,
        options: (node.data.options || [
            { id: 'opt_1', text: '' },
            { id: 'opt_2', text: '' }
        ]) as PollOption[]
    });

    // Validaciones en tiempo real
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        // Sincronización básica
        // Nota: Si sincronizamos demasiado agresivamente con props, podemos perder foco.
        // Confiamos en el estado local para la edición.
    }, []);

    const validate = (currentConfig: typeof config) => {
        const newErrors: { [key: string]: string } = {};
        
        // 1. Integridad de Pregunta
        if (!currentConfig.question.trim()) {
            newErrors['question'] = 'La pregunta es obligatoria.';
        }

        // 2. Regla 2-12
        if (currentConfig.options.length < MIN_OPTIONS) {
            newErrors['global'] = `Mínimo ${MIN_OPTIONS} opciones requeridas.`;
        }

        // 3. Duplicados y Longitud
        const texts = new Set();
        currentConfig.options.forEach((opt, idx) => {
            if (!opt.text.trim()) {
                 // Opcional: marcar vacías si se quiere ser estricto
            }
            if (opt.text.length > MAX_OPTION_CHARS) {
                newErrors[`opt_${idx}`] = 'Máximo 100 caracteres.';
            }
            if (texts.has(opt.text.trim().toLowerCase()) && opt.text.trim() !== '') {
                newErrors[`opt_${idx}_dup`] = 'Opción duplicada.';
            }
            texts.add(opt.text.trim().toLowerCase());
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const update = (updates: any) => {
        const newConfig = { ...config, ...updates };
        setConfig(newConfig);
        validate(newConfig);
        updateNodeConfig(node.id, newConfig);
    };

    // --- Manejo de Opciones ---

    const addOption = () => {
        if (config.options.length >= MAX_OPTIONS) return;
        const newConfig = produce(config, draft => {
            draft.options.push({ id: `opt_${Date.now()}`, text: '' });
        });
        update(newConfig);
    };

    const updateOption = (index: number, text: string) => {
        const newConfig = produce(config, draft => {
            draft.options[index].text = text;
        });
        update(newConfig);
    };

    const removeOption = (index: number) => {
        const newConfig = produce(config, draft => {
            draft.options.splice(index, 1);
        });
        update(newConfig);
    };

    const hasDuplicate = (text: string, currentIndex: number) => {
        return config.options.some((opt, idx) => idx !== currentIndex && opt.text.trim().toLowerCase() === text.trim().toLowerCase() && text !== '');
    };

    return (
        <div className="space-y-6">
            
            {/* SECCIÓN 1: CONFIGURACIÓN DE LA PREGUNTA */}
            <SettingsSection title="1. Pregunta de la Encuesta">
                <div className="space-y-2">
                    <Field label="Texto de la Pregunta" htmlFor="poll-question">
                        <Textarea 
                            id="poll-question"
                            placeholder="Ej: ¿Qué día prefieres para la reunión?"
                            value={config.question}
                            onChange={(e) => update({ question: e.target.value })}
                            className={cn("min-h-[100px] resize-none font-medium", !config.question.trim() && "border-yellow-500/50")}
                        />
                    </Field>
                    {!config.question.trim() && (
                        <p className="text-[10px] text-yellow-500 flex items-center gap-1">
                            <AlertCircle size={10} /> Este campo no puede estar vacío.
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800 mt-4">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-medium text-white">Selección Múltiple</Label>
                        <p className="text-[10px] text-neutral-500">Permite al usuario marcar varias casillas.</p>
                    </div>
                    <Switch 
                        checked={config.allowMultipleAnswers}
                        onCheckedChange={(checked) => update({ allowMultipleAnswers: checked })}
                    />
                </div>
            </SettingsSection>

            {/* SECCIÓN 2: OPCIONES */}
            <SettingsSection title="2. Opciones de Respuesta">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-neutral-400">
                        {config.options.length} / {MAX_OPTIONS} Opciones
                    </span>
                    {config.options.length < MIN_OPTIONS && (
                        <span className="text-[10px] text-red-400 font-bold bg-red-950/30 px-2 py-0.5 rounded">
                            Mínimo {MIN_OPTIONS} requeridas
                        </span>
                    )}
                </div>

                <div className="space-y-3">
                    {config.options.map((opt, idx) => {
                        const isDup = hasDuplicate(opt.text, idx);
                        const isTooLong = opt.text.length > MAX_OPTION_CHARS;
                        const hasError = isDup || isTooLong;

                        return (
                            <div key={opt.id} className="group flex items-start gap-2">
                                <div className="mt-2.5 text-neutral-600 cursor-grab active:cursor-grabbing">
                                    <ListChecks size={14} />
                                </div>
                                
                                <div className="flex-1 relative">
                                    <Input 
                                        value={opt.text}
                                        onChange={(e) => updateOption(idx, e.target.value)}
                                        placeholder={`Opción ${idx + 1}`}
                                        className={cn(
                                            "h-9 bg-neutral-950 pr-12 transition-colors", 
                                            hasError ? "border-red-500 focus:border-red-500 text-red-200" : "border-neutral-800"
                                        )}
                                    />
                                    
                                    {/* Contador dentro del input */}
                                    <span className={cn(
                                        "absolute right-2 top-2.5 text-[10px] font-mono pointer-events-none",
                                        isTooLong ? "text-red-500 font-bold" : "text-neutral-500"
                                    )}>
                                        {opt.text.length}/{MAX_OPTION_CHARS}
                                    </span>

                                    {/* Mensajes de Error Específicos */}
                                    {isDup && <p className="text-[10px] text-red-500 mt-1 ml-1">🚫 Esta opción ya existe.</p>}
                                </div>

                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => removeOption(idx)}
                                    disabled={config.options.length <= MIN_OPTIONS && false /* Permitimos borrar pero mostramos warning global */}
                                    className="text-neutral-500 hover:text-red-500 h-9 w-9"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        );
                    })}
                </div>

                {config.options.length < MAX_OPTIONS ? (
                    <Button 
                        onClick={addOption} 
                        variant="secondary" 
                        className="w-full mt-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 border-dashed"
                    >
                        <Plus size={16} className="mr-2"/> Añadir Opción
                    </Button>
                ) : (
                    <div className="mt-4 p-2 bg-neutral-900 border border-neutral-700 rounded text-center">
                        <p className="text-xs text-neutral-500">Límite máximo de {MAX_OPTIONS} opciones alcanzado.</p>
                    </div>
                )}
            </SettingsSection>
        </div>
    );
};

