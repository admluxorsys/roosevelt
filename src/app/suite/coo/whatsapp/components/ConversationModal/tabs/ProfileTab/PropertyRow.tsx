import React, { useState, useEffect } from 'react';
import {
    Copy, Edit2, ImageIcon, RefreshCw, X, GripVertical, Eye, EyeOff, Sparkles
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { NotionType } from './types';

interface PropertyRowProps {
    label: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    onEdit?: () => void;
    onDelete?: () => void;
    isEmpty?: boolean;
    className?: string;
    isCustom?: boolean;
    onRename?: (newName: string) => void;
    onChangeType?: (newType: string) => void;
    currentTypeLabel?: string;
    notionTypes?: NotionType[];
    isNaming?: boolean;
    onStopNaming?: () => void;
    onLabelEdit?: () => void;
    onIconChange?: (iconName: string) => void;
    availableIcons?: { name: string, icon: React.ReactNode }[];
    onDuplicate?: () => void;
    dragHandleRef?: any;
    dragHandleListeners?: any;
    onChangeVisibility?: (v: 'always' | 'hide-empty' | 'hidden') => void;
    currentVisibility?: 'always' | 'hide-empty' | 'hidden';
}

export const PropertyRow: React.FC<PropertyRowProps> = ({
    label, icon, children, onEdit, onDelete, isEmpty, className, isCustom, onRename, onChangeType, currentTypeLabel, notionTypes, isNaming, onStopNaming, onLabelEdit, onIconChange, availableIcons, onDuplicate, dragHandleRef, dragHandleListeners, currentVisibility, onChangeVisibility
}) => {
    const [localName, setLocalName] = useState(label);

    useEffect(() => {
        // Si estamos empezando a nombrar y el nombre es el por defecto, lo vaciamos para usar el placeholder
        if (isNaming && /^nueva propiedad( \d+)?$/i.test(label)) {
            setLocalName('');
        } else {
            setLocalName(label);
        }
    }, [label, isNaming]);

    const menuContent = (
        <DropdownMenuContent className="w-64 bg-[#202020] border-neutral-800 text-neutral-300 shadow-2xl z-[9999] p-2" align="start">
            {isCustom && (
                <div className="flex items-center gap-2 mb-2 p-1 bg-white/5 rounded border border-neutral-700/50">
                    <div className="w-5 flex justify-center text-neutral-400">
                        {icon}
                    </div>
                    <input
                        className="bg-transparent border-none outline-none text-sm text-neutral-100 w-full placeholder:text-neutral-600 focus:ring-0"
                        value={localName}
                        placeholder="Nombre de la propiedad"
                        onChange={(e) => setLocalName(e.target.value)}
                        onBlur={() => {
                            if (localName !== label) onRename?.(localName);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onRename?.(localName);
                                (e.target as HTMLInputElement).blur();
                            }
                            if (e.key === 'Escape') {
                                setLocalName(label);
                                (e.target as HTMLInputElement).blur();
                            }
                        }}
                        autoFocus
                    />
                    <div className="text-[10px] text-neutral-500 bg-neutral-800 px-1 rounded">i</div>
                </div>
            )}

            {!isCustom && (
                <DropdownMenuItem className="gap-2 py-2 cursor-pointer focus:bg-white/5 focus:text-white" onClick={onEdit}>
                    <Edit2 size={14} className="text-neutral-500" />
                    <span>Renombrar</span>
                </DropdownMenuItem>
            )}

            {isCustom && notionTypes && (
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2 py-2 cursor-pointer focus:bg-white/5 focus:text-white justify-between">
                        <div className="flex items-center gap-2">
                            <RefreshCw size={14} className="text-neutral-500" />
                            <span>Tipo</span>
                        </div>
                        <span className="text-xs text-neutral-500">{currentTypeLabel}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-[#202020] border-neutral-800 text-neutral-300 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {notionTypes.map(t => (
                            <DropdownMenuItem key={t.id} className="gap-2 py-2 cursor-pointer focus:bg-white/5" onClick={() => onChangeType?.(t.id)}>
                                <div className="w-4 flex justify-center">{t.icon}</div>
                                <span>{t.label}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            )}

            {isCustom && availableIcons && (
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2 py-2 cursor-pointer focus:bg-white/5 focus:text-white justify-between">
                        <div className="flex items-center gap-2">
                            <ImageIcon size={14} className="text-neutral-500" />
                            <span>Icono</span>
                        </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-[#202020] border-neutral-800 text-neutral-300 p-2 shadow-2xl z-[9999]">
                        <div className="grid grid-cols-5 gap-1">
                            {availableIcons.map(item => (
                                <DropdownMenuItem
                                    key={item.name}
                                    className="p-2 hover:bg-white/10 rounded flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                    onClick={() => onIconChange?.(item.name)}
                                >
                                    {React.cloneElement(item.icon as React.ReactElement, { size: 16 })}
                                </DropdownMenuItem>
                            ))}
                        </div>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            )}

            {isCustom && (
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2 py-2 cursor-pointer focus:bg-white/5 focus:text-white justify-between">
                        <div className="flex items-center gap-2">
                            <Eye size={14} className="text-neutral-500" />
                            <span>Visibilidad</span>
                        </div>
                        <span className="text-[10px] text-neutral-500 uppercase">
                            {currentVisibility === 'always' ? 'Siempre' : currentVisibility === 'hide-empty' ? 'Si hay dato' : 'Oculto'}
                        </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-[#202020] border-neutral-800 text-neutral-300">
                        <DropdownMenuItem className="gap-2 py-2 cursor-pointer focus:bg-white/5" onClick={() => onChangeVisibility?.('always')}>
                            <Eye size={14} className={cn(currentVisibility === 'always' ? "text-neutral-400" : "text-neutral-500")} />
                            <span>Mostrar siempre</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 py-2 cursor-pointer focus:bg-white/5" onClick={() => onChangeVisibility?.('hide-empty')}>
                            <EyeOff size={14} className={cn(currentVisibility === 'hide-empty' ? "text-neutral-400" : "text-neutral-500")} />
                            <span>Ocultar si está vacío</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 py-2 cursor-pointer focus:bg-white/5" onClick={() => onChangeVisibility?.('hidden')}>
                            <X size={14} className={cn(currentVisibility === 'hidden' ? "text-neutral-400" : "text-neutral-500")} />
                            <span>Ocultar siempre</span>
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            )}

            <DropdownMenuItem className="gap-2 py-2 cursor-pointer focus:bg-white/5 focus:text-white group/ai" onClick={() => {
                toast.info("Analizando el chat con IA...", {
                    description: "Buscando información relevante para esta propiedad.",
                    icon: <Sparkles className="text-neutral-400 animate-pulse" size={16} />
                });
                // Simulación de IA por ahora
                setTimeout(() => {
                    toast.error("IA: No se encontró información suficiente en los mensajes recientes.");
                }, 2000);
            }}>
                <Sparkles size={14} className="text-blue-400 group-hover/ai:animate-pulse" />
                <span className="text-blue-100/90">Autocompletar con IA</span>
                <span className="ml-auto text-[8px] bg-neutral-700 text-neutral-400 px-1 rounded font-bold uppercase tracking-tighter border border-neutral-600/50">BETA</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-neutral-800" />

            <DropdownMenuItem className="gap-2 py-2 cursor-pointer focus:bg-white/5 focus:text-white" onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.();
            }}>
                <Copy size={14} className="text-neutral-500" />
                <span>Duplicar propiedad</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="gap-2 py-2 cursor-pointer focus:bg-white/5 text-red-400 focus:text-red-300" onClick={(e) => { e.stopPropagation(); onDelete?.(); }}>
                <X size={14} />
                <span>Eliminar propiedad</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    );

    return (
        <div className={cn("group relative flex items-center gap-3 px-2 py-0.75 hover:bg-white/5 rounded-md transition-colors", className)}>
            {/* Drag Handle Indicator */}
            <div
                ref={dragHandleRef}
                {...dragHandleListeners}
                className="absolute -left-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-neutral-700 cursor-grab active:cursor-grabbing hover:text-neutral-500 z-10"
            >
                <GripVertical size={14} />
            </div>

            <div className="w-5 flex justify-center text-neutral-500 group-hover:text-neutral-400 ml-2" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <button className="outline-none flex items-center justify-center hover:bg-white/10 p-1 rounded transition-colors">
                            {icon ? React.cloneElement(icon as React.ReactElement, { size: 16 }) : null}
                        </button>
                    </DropdownMenuTrigger>
                    {menuContent}
                </DropdownMenu>
            </div>

            <div className="w-32 text-[11px] text-neutral-500/80 font-medium truncate" onClick={(e) => {
                if (isCustom) {
                    e.stopPropagation();
                    onLabelEdit?.();
                }
            }}>
                {isNaming && isCustom ? (
                    <input
                        className="bg-neutral-800/80 border border-neutral-700/50 rounded px-1.5 py-0.5 outline-none text-neutral-200 w-full text-xs focus:ring-1 focus:ring-neutral-600/50 placeholder:text-neutral-500"
                        value={localName}
                        placeholder="Nombre de la propiedad"
                        onChange={(e) => setLocalName(e.target.value)}
                        onBlur={() => {
                            if (localName !== label) onRename?.(localName);
                            onStopNaming?.();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (localName !== label) onRename?.(localName);
                                onStopNaming?.();
                            }
                            if (e.key === 'Escape') {
                                setLocalName(label);
                                onStopNaming?.();
                            }
                        }}
                        autoFocus
                    />
                ) : (
                    <span className={cn(isCustom && "hover:text-neutral-300 transition-colors cursor-text")}>
                        {label.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                    </span>
                )}
            </div>

            <div className="flex-1 flex items-center min-w-0 ml-2 cursor-pointer" onClick={(e) => {
                e.stopPropagation();
                if (!isNaming) onEdit?.();
            }}>
                {children}
            </div>
        </div>
    );
};

export const SortablePropertyRow: React.FC<PropertyRowProps & { id: string }> = ({ id, ...props }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <PropertyRow {...props} dragHandleRef={setActivatorNodeRef} dragHandleListeners={listeners} />
        </div>
    );
};
