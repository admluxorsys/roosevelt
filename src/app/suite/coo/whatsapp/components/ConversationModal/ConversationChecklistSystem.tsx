'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCheck, CheckCircle, User, Edit2, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// --- TYPES ---
export interface ChecklistItem {
    id: string;
    text: string;
    completed?: boolean;
    author?: string;
    timestamp?: any;
}

// --- CONSTANTS ---
export const COLUMN_CHECKLISTS: Record<string, string[]> = {
    'Bandeja de Entrada': ['Primer contacto realizado', 'Interés verificado', 'Datos básicos completados'],
    'Aplicar a Escuela': ['Documentación solicitada', 'Entrevista agendada', 'Formulario enviado'],
    'Seguimiento': ['Recordatorio enviado', 'Dudas resueltas', 'Nueva cita propuesta'],
    'Cierre': ['Propuesta enviada', 'Negociación final', 'Contrato firmado'],
    'default': ['Revisar perfil', 'Actualizar datos', 'Verificar estado']
};

// --- COMPONENTS ---

/**
 * Global Checklist for Lane/Bandeja (Shown in Profile Tab)
 */
export const LaneChecklist = ({
    groupName,
    checklistStatus = {},
    dynamicItems = [],
    onToggle,
    onToggleDynamic,
    progress,
    hideHeader = false
}: {
    groupName?: string,
    checklistStatus?: Record<string, boolean>,
    dynamicItems?: ChecklistItem[],
    onToggle: (item: string) => void,
    onToggleDynamic?: (item: ChecklistItem) => void,
    progress: number,
    hideHeader?: boolean
}) => {
    const staticChecklist = (groupName && COLUMN_CHECKLISTS[groupName]) ? COLUMN_CHECKLISTS[groupName] : COLUMN_CHECKLISTS['default'];
    const hasItems = staticChecklist.length > 0 || dynamicItems.length > 0;

    return (
        <div className={cn(
            !hideHeader && "p-8 bg-white/[0.02] rounded-[2.5rem] border border-white/5 shadow-inner"
        )}>
            {!hideHeader && (
                <>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col">
                            <h5 className="text-[10px] font-medium text-neutral-500 uppercase tracking-[0.2em] mb-1">
                                Operative Checklist
                            </h5>
                            <p className="text-sm font-medium text-white uppercase tracking-tight">{groupName || 'General Flow'}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-medium text-blue-500 tracking-tighter">{progress}%</span>
                            <p className="text-[9px] font-medium text-neutral-500 uppercase tracking-widest mt-1">Efficiency</p>
                        </div>
                    </div>

                    <div className="mb-8 relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="absolute top-0 left-0 h-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                            transition={{ duration: 0.7, ease: "easeOut" }}
                        />
                    </div>
                </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dynamicItems.map((item) => {
                    const isChecked = item.completed || false;
                    return (
                        <motion.div
                            whileHover={{ x: 5 }}
                            key={`dynamic-${item.id}`}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                                isChecked
                                    ? "bg-blue-600/5 border-blue-500/20"
                                    : "bg-white/[0.03] border-white/5 hover:bg-white/5"
                            )}
                            onClick={() => onToggleDynamic && onToggleDynamic(item)}
                        >
                            <div className={cn(
                                "w-6 h-6 rounded-lg border flex items-center justify-center transition-all shadow-lg",
                                isChecked
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-black/40 border-white/10 text-transparent group-hover:border-blue-500/50"
                            )}>
                                {isChecked && <CheckCheck size={14} className="animate-in zoom-in-50 duration-300" />}
                            </div>
                            <span className={cn(
                                "text-xs font-medium tracking-tight transition-colors",
                                isChecked ? "text-neutral-500 line-through" : "text-neutral-200"
                            )}>
                                {item.text}
                            </span>
                        </motion.div>
                    );
                })}

                {!hasItems && (
                    <div className="col-span-full py-8 text-center opacity-30 border border-dashed border-white/10 rounded-[1.5rem]">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] italic">No active milestones</p>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Individual/Custom Checklist (Shown in Notes Tab)
 */
export const IndividualChecklist = ({
    items = [],
    onToggle,
    onDelete,
    onEdit,
    onAdd
}: {
    items: ChecklistItem[],
    onToggle: (item: ChecklistItem) => void,
    onDelete: (id: string) => void,
    onEdit: (item: ChecklistItem) => void,
    onAdd: (text: string) => void
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [text, setText] = useState('');

    const handleAdd = () => {
        if (!text.trim()) return;
        onAdd(text);
        setText('');
        setIsAdding(false);
    };

    return (
        <div className="p-6 bg-white/[0.02] rounded-[2rem] border border-white/5 relative overflow-hidden group h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                        <CheckCircle size={16} />
                    </div>
                    <p className="text-xs font-medium text-white uppercase tracking-tight">Checklist Individual</p>
                </div>
                <Button
                    onClick={() => setIsAdding(true)}
                    className="h-8 px-5 bg-blue-600 hover:bg-blue-700 text-[8px] font-medium uppercase tracking-widest rounded-xl shadow-xl shadow-blue-600/20 transition-all"
                >
                    + Nueva Tarea
                </Button>
            </div>

            {isAdding && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Ej: Enviar presupuesto personalizado..."
                        className="bg-black/40 border-white/10 min-h-[100px] rounded-[1.2rem] p-4 text-white placeholder:text-neutral-600 text-sm italic focus:ring-blue-500 resize-none"
                    />
                    <div className="flex justify-end gap-3 mt-3">
                        <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="text-[10px] uppercase tracking-widest text-neutral-500">Cancelar</Button>
                        <Button size="sm" onClick={handleAdd} className="bg-blue-600 px-6 rounded-lg uppercase text-[10px] tracking-widest">Añadir</Button>
                    </div>
                </motion.div>
            )}

            <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                {items.length > 0 ? (
                    items.map((item) => (
                        <div key={item.id} className={cn(
                            "group relative p-4 rounded-xl border transition-all",
                            item.completed
                                ? "bg-white/[0.01] border-white/5 opacity-50 grayscale"
                                : "bg-white/[0.03] border-white/10 hover:border-blue-500/30 shadow-md shadow-black/20"
                        )}>
                            <div className="flex items-start gap-4">
                                <button
                                    onClick={() => onToggle(item)}
                                    className={cn(
                                        "w-8 h-8 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                        item.completed ? "bg-blue-600 border-blue-600 text-white" : "bg-black/40 border-white/10 text-transparent hover:border-blue-500"
                                    )}
                                >
                                    {item.completed && <CheckCheck size={14} />}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className={cn("text-sm font-medium tracking-tight mb-2", item.completed ? "line-through text-neutral-500" : "text-neutral-100")}>
                                        {item.text}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-[9px] font-medium text-neutral-500 uppercase tracking-widest">
                                            <User size={12} className="text-blue-500/50" />
                                            <span>{item.author || 'Agente'}</span>
                                            <span className="opacity-30">|</span>
                                            <span>{item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Reciente'}</span>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-600/20 text-blue-400"><Edit2 size={12} /></button>
                                            <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-600/20 text-red-400"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-30">
                        <Plus size={32} className="mb-2" />
                        <p className="text-[10px] font-medium uppercase tracking-[0.3em]">No hay tareas pendientes</p>
                    </div>
                )}
            </div>
        </div>
    );
};