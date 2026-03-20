import React, { useState } from 'react';
import { 
    GripVertical, MoreVertical, MoreHorizontal, Trash2, Link, FileText, 
    Calendar, Hash, Mail, Globe, MapPin, User, CheckCircle2, 
    ChevronDown, Eye, EyeOff, Tag, Type, List, X, Search, Edit2, Copy, Check 
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface PropertyRowProps {
    id: string;
    label: string;
    icon: React.ReactNode;
    onEdit: () => void;
    onDelete: () => void;
    isCustom?: boolean;
    onRename?: (newName: string) => void;
    onChangeType?: (newType: string) => void;
    onChangeVisibility?: (v: 'always' | 'hide-empty' | 'hidden') => void;
    currentVisibility?: 'always' | 'hide-empty' | 'hidden';
    currentTypeLabel?: string;
    notionTypes?: any[];
    isNaming?: boolean;
    onStopNaming?: () => void;
    onLabelEdit?: () => void;
    onIconChange?: (iconName: string) => void;
    availableIcons?: any[];
    onDuplicate?: () => void;
    children?: React.ReactNode;
    isDragging?: boolean;
    attributes?: any;
    listeners?: any;
}

export const PropertyRow: React.FC<PropertyRowProps> = ({
    id, label, icon, onEdit, onDelete, isCustom, onRename, onChangeType, 
    onChangeVisibility, currentVisibility, currentTypeLabel, notionTypes,
    isNaming, onStopNaming, onLabelEdit, onIconChange, availableIcons,
    onDuplicate, children, isDragging, attributes, listeners
}) => {
    const [tempName, setTempName] = useState(label);
    const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
    const [iconSearch, setIconSearch] = useState('');

    const handleRenameSubmit = () => {
        if (onRename && tempName && tempName !== label) {
            onRename(tempName);
        }
        if (onStopNaming) onStopNaming();
    };

    return (
        <div className={cn(
            "group/row flex items-center gap-3 py-1.5 px-2 rounded-md transition-all",
            isDragging ? "bg-neutral-800/80 shadow-xl z-50 ring-1 ring-neutral-700" : "hover:bg-white/[0.03]"
        )}>
            {/* Drag Handle */}
            <div 
                {...attributes} 
                {...listeners}
                className="opacity-0 group-hover/row:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-neutral-600 hover:text-neutral-400 p-0.5"
            >
                <GripVertical size={14} />
            </div>

            {/* Icon Section */}
            <div className="flex-shrink-0 w-5 flex justify-center">
                {isCustom ? (
                    <Popover open={isIconPopoverOpen} onOpenChange={setIsIconPopoverOpen}>
                        <PopoverTrigger asChild>
                            <div className="cursor-pointer hover:bg-neutral-800 p-1 rounded transition-colors text-neutral-500 hover:text-neutral-300">
                                {icon}
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0 bg-[#202020] border-neutral-800 shadow-2xl z-[9999]" align="start">
                            <div className="p-2 border-b border-neutral-800 flex items-center gap-2">
                                <Search size={12} className="text-neutral-500" />
                                <input 
                                    className="bg-transparent border-none outline-none text-xs text-neutral-200 w-full"
                                    placeholder="Buscar icono..."
                                    value={iconSearch}
                                    onChange={(e) => setIconSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-6 gap-1 p-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                {availableIcons?.filter(i => i.name.toLowerCase().includes(iconSearch.toLowerCase())).map((iconObj) => (
                                    <button
                                        key={iconObj.name}
                                        onClick={() => {
                                            if (onIconChange) onIconChange(iconObj.name);
                                            setIsIconPopoverOpen(false);
                                        }}
                                        className="flex items-center justify-center p-2 hover:bg-white/10 rounded transition-colors text-neutral-400 hover:text-white"
                                        title={iconObj.name}
                                    >
                                        {React.cloneElement(iconObj.icon as React.ReactElement, { size: 16 })}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                ) : (
                    <div className="text-neutral-500">
                        {icon}
                    </div>
                )}
            </div>

            {/* Label Section */}
            <div className="w-40 flex-shrink-0">
                {isNaming ? (
                    <Input
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                        className="h-6 text-[11px] bg-neutral-800 border-neutral-700 p-1 font-bold uppercase tracking-wider focus-visible:ring-1 focus-visible:ring-neutral-600"
                        autoFocus
                    />
                ) : (
                    <span 
                        className={cn(
                            "text-[11px] font-bold uppercase tracking-wider truncate block transition-colors cursor-text",
                            isCustom ? "text-neutral-400 hover:text-neutral-200" : "text-neutral-500"
                        )}
                        onClick={() => isCustom && onLabelEdit && onLabelEdit()}
                    >
                        {label}
                    </span>
                )}
            </div>

            {/* Value Section (Children) */}
            <div className="flex-1 min-w-0 flex items-center" onClick={onEdit}>
                {children}
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                {isCustom && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-500 hover:bg-neutral-800">
                                <MoreHorizontal size={14} />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-1 bg-[#202020] border-neutral-800 shadow-2xl z-[9999]" align="end">
                            <div className="space-y-0.5">
                                <button
                                    onClick={() => onLabelEdit && onLabelEdit()}
                                    className="flex items-center gap-2 w-full p-1.5 hover:bg-white/5 rounded text-[11px] text-neutral-300 transition-colors text-left"
                                >
                                    <Edit2 size={12} className="text-neutral-500" />
                                    Renombrar
                                </button>
                                <button
                                    onClick={() => onDuplicate && onDuplicate()}
                                    className="flex items-center gap-2 w-full p-1.5 hover:bg-white/5 rounded text-[11px] text-neutral-300 transition-colors text-left"
                                >
                                    <Copy size={12} className="text-neutral-500" />
                                    Duplicar
                                </button>
                                <div className="h-px bg-neutral-800 my-1" />
                                <div className="px-2 py-1">
                                    <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest mb-1">Visibilidad</p>
                                    <div className="space-y-0.5">
                                        {[
                                            { id: 'always', label: 'Siempre visible', icon: <Eye size={12} /> },
                                            { id: 'hide-empty', label: 'Ocultar si está vacío', icon: <EyeOff size={12} /> },
                                            { id: 'hidden', label: 'Ocultar siempre', icon: <X size={12} /> }
                                        ].map((v) => (
                                            <button
                                                key={v.id}
                                                onClick={() => onChangeVisibility && onChangeVisibility(v.id as any)}
                                                className={cn(
                                                    "flex items-center justify-between w-full p-1.5 rounded text-[11px] transition-colors",
                                                    currentVisibility === v.id ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {v.icon}
                                                    {v.label}
                                                </div>
                                                {currentVisibility === v.id && <Check size={10} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="h-px bg-neutral-800 my-1" />
                                <button
                                    onClick={onDelete}
                                    className="flex items-center gap-2 w-full p-1.5 hover:bg-red-500/10 rounded text-[11px] text-red-400 transition-colors text-left"
                                >
                                    <Trash2 size={12} />
                                    Eliminar
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
            </div>
        </div>
    );
};

export const SortablePropertyRow: React.FC<PropertyRowProps> = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <PropertyRow 
                {...props} 
                isDragging={isDragging} 
                attributes={attributes} 
                listeners={listeners} 
            />
        </div>
    );
};
