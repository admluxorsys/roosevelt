import React, { useRef, useState, useEffect } from 'react';
import {
    Check, Search, Upload, Plus, X, RefreshCw, ChevronRight, Copy, Clock, LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { ALL_COUNTRY_CODES } from '@/lib/countryCodes';
import { toast } from 'sonner';
import { CustomPropertyMeta, FieldConfig } from './types';
import {
    STATUS_OPTIONS
} from './constants';

interface PropertyValueProps {
    fieldKey: string;
    value: any;
    isEditing: boolean;
    isCustom?: boolean;
    customMeta?: CustomPropertyMeta;
    onValueChange: (newVal: any) => void;
    finishEdit: () => void;
    hasData: (key: string) => boolean;
    getBadgeStyle: (key: string, value: string) => string;
    getColorForValue: (val: string) => string;
    cardId: string;
    groupId: string;
    crmId?: string | null;
    // Shared state from parent for phone handling
    phoneSearchTerm: string;
    setPhoneSearchTerm: (val: string) => void;
    isPhoneOpen: boolean;
    setIsPhoneOpen: (val: boolean) => void;
    editPhoneData: { code: string; number: string };
    setEditPhoneData: (data: { code: string; number: string }) => void;
    parsePhone: (fullPhone: string) => { code: string; number: string };
    onSave?: () => void;
}


import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const PropertyValue: React.FC<PropertyValueProps> = ({
    fieldKey, value, isEditing, isCustom, customMeta, onValueChange, finishEdit, hasData, getBadgeStyle, getColorForValue,
    phoneSearchTerm, setPhoneSearchTerm, isPhoneOpen, setIsPhoneOpen, editPhoneData, setEditPhoneData, parsePhone,
    cardId, groupId, crmId, onSave
}) => {
    const phoneDropdownRef = useRef<HTMLDivElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const isEmpty = value === '' || value === null || value === undefined || value === 'Vacío' || (Array.isArray(value) && value.length === 0);
    const badgeClass = getBadgeStyle(fieldKey, String(value));
    const fieldType = isCustom ? customMeta?.__type : (fieldKey.toLowerCase().includes('date') ? 'date' : (fieldKey === 'contactNumber' || fieldKey === 'phone' || fieldKey === 'sponsorPhone' ? 'phone' : 'text'));

    const handleSelectValue = (val: string) => {
        if (fieldType === 'multiselect') {
            const current = Array.isArray(value) ? value : (value ? [value] : []);
            const updated = current.includes(val) ? current.filter(v => v !== val) : [...current, val];
            onValueChange(updated);
        } else {
            onValueChange(val);
            finishEdit();
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileClick = (e: React.MouseEvent) => {
        if (fieldType === 'files' && isEmpty) {
            e.stopPropagation();
            fileInputRef.current?.click();
        }
    };

    const persistFiles = async (updatedUrls: string[]) => {
        try {
            // 1. Actualizar estado local para UI inmediata
            onValueChange(updatedUrls);

            // 2. Guardar DIRECTAMENTE en Firestore para evitar race conditions
            if (cardId && groupId && !cardId.startsWith('temp-')) {
                const cardRef = doc(db, 'kanban-groups', groupId, 'cards', cardId);
                const updateData = isCustom
                    ? { [`extraData.${fieldKey}.value`]: updatedUrls }
                    : { [fieldKey]: updatedUrls };

                await updateDoc(cardRef, updateData);
            }

            if (crmId) {
                const crmRef = doc(db, 'contacts', crmId);
                const updateData = isCustom
                    ? { [`extraData.${fieldKey}.value`]: updatedUrls }
                    : { [fieldKey]: updatedUrls };

                await updateDoc(crmRef, {
                    ...updateData,
                    lastUpdated: serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Error persisting files:", error);
            toast.error("Error al sincronizar los cambios");
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setIsUploading(true);
            const uploadToast = toast.info(`Subiendo ${files.length} archivo(s)...`, {
                icon: <Upload size={16} className="text-neutral-400 animate-bounce" />,
                duration: 10000
            });

            try {
                const uploadPromises = Array.from(files).map(async (file) => {
                    const storagePath = `profile-data/${groupId}/${cardId}/${Date.now()}-${file.name}`;
                    const storageRef = ref(storage, storagePath);
                    const snapshot = await uploadBytes(storageRef, file);
                    return await getDownloadURL(snapshot.ref);
                });

                const newDownloadUrls = await Promise.all(uploadPromises);

                const currentUrls = Array.isArray(value)
                    ? value
                    : (typeof value === 'string' && (value.includes('http') || value.includes('blob:'))
                        ? value.split(/[\s,]+/).filter(s => s.trim())
                        : []);

                const updatedUrls = [...currentUrls, ...newDownloadUrls];
                await persistFiles(updatedUrls);

                toast.success("Archivos subidos y guardados correctamente", { id: uploadToast });
            } catch (error) {
                console.error("Error uploading files:", error);
                toast.error("Error al subir los archivos", { id: uploadToast });
            } finally {
                setIsUploading(false);
                if (e.target) e.target.value = '';
            }
        }
    };

    const renderFilesDisplay = () => {
        const urls = Array.isArray(value)
            ? value
            : (typeof value === 'string' && (value.includes('http') || value.includes('blob:'))
                ? value.split(/[\s,]+/).filter(s => s.startsWith('http') || s.startsWith('blob:'))
                : []);

        if (urls.length === 0) return (
            <div className="flex items-center gap-2">
                <span className={cn("text-[13px] italic", isEmpty ? "text-neutral-600 group-hover/file-trigger:text-neutral-400 transition-colors" : "text-neutral-200")}>
                    {isEmpty ? 'Haz clic para subir archivo' : String(value)}
                </span>
                {isEmpty && <Upload size={12} className="text-neutral-700 group-hover/file-trigger:text-neutral-500 transition-colors" />}
            </div>
        );

        return (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {urls.map((url, i) => (
                    <div key={i} className="relative group/thumb shrink-0">
                        <img
                            src={url}
                            alt={`File ${i}`}
                            className="h-8 w-11 object-cover rounded border border-white/5 hover:border-neutral-500/50 transition-colors shadow-sm cursor-zoom-in"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(url, '_blank');
                            }}
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const updated = urls.filter((_, index) => index !== i);
                                persistFiles(updated);
                            }}
                            className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-neutral-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity shadow-lg border border-neutral-700"
                            title="Eliminar imagen"
                        >
                            <X size={10} strokeWidth={3} />
                        </button>
                    </div>
                ))}
                {isUploading && (
                    <div className="h-8 w-8 flex items-center justify-center rounded border border-neutral-700/30 bg-neutral-800/10 text-neutral-400 shrink-0">
                        <RefreshCw size={14} className="animate-spin" />
                    </div>
                )}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded border border-dashed border-neutral-800 hover:border-neutral-600 hover:bg-white/5 text-neutral-600 hover:text-neutral-400 transition-all shrink-0"
                    title="Añadir más imágenes"
                >
                    <Plus size={14} />
                </button>
            </div>
        );
    };

    if (isEditing) {
        return (
            <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                {fieldType === 'files' && (
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        multiple
                        accept="image/*,application/pdf"
                    />
                )}
                {fieldType === 'status' ? (
                    <Popover open={isEditing} onOpenChange={(open) => !open && finishEdit()}>
                        <PopoverTrigger asChild>
                            <div className={cn(
                                "flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase cursor-pointer transition-all",
                                STATUS_OPTIONS.find(o => o.label === value)?.color || "bg-neutral-800 text-neutral-400"
                            )}>
                                {value || 'Sin empezar'}
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0 bg-[#202020] border-neutral-800 shadow-2xl z-[9999] overflow-hidden" align="start">
                            <div className="flex flex-col divide-y divide-neutral-800/50">
                                {/* Current Status Header */}
                                <div className="p-2.5">
                                    <div className="flex items-center gap-2 p-1.5 bg-neutral-800/50 rounded border border-neutral-700/30">
                                        <Clock size={12} className="text-neutral-500" />
                                        <div className={cn(
                                            "flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                                            STATUS_OPTIONS.find(o => o.label === value)?.color || "bg-neutral-800 text-neutral-400"
                                        )}>
                                            {value || 'Sin empezar'}
                                        </div>
                                    </div>
                                </div>

                                {/* Status Sections */}
                                <div className="max-h-[300px] overflow-y-auto py-1 custom-scrollbar">
                                    {['Pendiente', 'En curso', 'Completado'].map(cat => {
                                        const items = STATUS_OPTIONS.filter(o => o.category === cat);
                                        return (
                                            <div key={cat} className="px-1 py-1">
                                                <div className="flex items-center justify-between px-2 mb-1">
                                                    <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">{cat}</p>
                                                    <Plus size={10} className="text-neutral-700 hover:text-neutral-500 cursor-pointer" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    {items.map(opt => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => { onValueChange(opt.label); finishEdit(); }}
                                                            className="flex items-center justify-between w-full p-1.5 hover:bg-white/5 rounded transition-colors group/opt"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700/50 group-hover/opt:border-neutral-600 transition-colors">
                                                                    <div className={cn("w-1.5 h-1.5 rounded-full", opt.dotColor)} />
                                                                    <span className="text-xs text-neutral-300">{opt.label}</span>
                                                                </div>
                                                            </div>
                                                            <ChevronRight size={10} className="text-neutral-700 opacity-0 group-hover/opt:opacity-100 transition-opacity" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Bottom Actions */}
                                <div className="py-1 bg-neutral-900/30">
                                    {[
                                        { label: 'Mostrar como', icon: <Search size={12} />, sub: 'Seleccionar' },
                                        { label: 'Duplicar propiedad', icon: <Copy size={12} /> },
                                        { label: 'Eliminar propiedad', icon: <X size={12} /> }
                                    ].map(action => (
                                        <button key={action.label} className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-white/5 transition-colors text-left group/action">
                                            <div className="flex items-center gap-2 text-neutral-400 group-hover/action:text-neutral-200">
                                                {action.icon}
                                                <span className="text-[11px]">{action.label}</span>
                                            </div>
                                            {action.sub && <span className="text-[9px] text-neutral-600 group-hover/action:text-neutral-500">{action.sub}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                ) : fieldType === 'select' || fieldType === 'multiselect' ? (
                    <div className="flex flex-wrap gap-1.5 p-1 bg-neutral-800/30 rounded-lg border border-neutral-700/50">
                        {['Interesado', 'En seguimiento', 'Matriculado', 'Cerrado', 'Perdido', 'Lumos', 'DS-160', 'Cita Consular'].map((opt) => (
                            <button
                                key={opt}
                                onClick={() => handleSelectValue(opt)}
                                className={cn(
                                    "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
                                    (Array.isArray(value) ? value.includes(opt) : value === opt)
                                        ? "bg-neutral-600 text-white shadow-lg shadow-black/20"
                                        : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                                )}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                ) : fieldType === 'phone' ? (
                    <div className="flex items-center gap-2 group/phone">
                        <div className="relative" ref={phoneDropdownRef}>
                            <button
                                onClick={() => setIsPhoneOpen(!isPhoneOpen)}
                                className="flex items-center gap-1.5 px-2 h-7 bg-neutral-800/50 hover:bg-neutral-700/50 rounded text-xs transition-colors border border-transparent focus:border-neutral-500/50 outline-none"
                            >
                                <span className="text-base">{ALL_COUNTRY_CODES.find(c => c.code === editPhoneData.code)?.flag || '🌍'}</span>
                                <span className="text-neutral-400 font-mono text-xs">{editPhoneData.code}</span>
                            </button>

                            {isPhoneOpen && (
                                <div className="absolute top-full left-0 mt-1 w-64 bg-[#202020] border border-neutral-800 rounded-lg shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <div className="flex items-center border-b border-neutral-800 px-3 py-2">
                                        <Search className="h-3.5 w-3.5 text-neutral-500 mr-2" />
                                        <input
                                            autoFocus
                                            className="w-full bg-transparent text-xs outline-none text-white placeholder:text-neutral-600"
                                            placeholder="Buscar país..."
                                            value={phoneSearchTerm}
                                            onChange={(e) => setPhoneSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto py-1 custom-scrollbar">
                                        {ALL_COUNTRY_CODES.filter(c =>
                                            c.country.toLowerCase().includes(phoneSearchTerm.toLowerCase()) ||
                                            c.code.includes(phoneSearchTerm)
                                        ).map((country) => (
                                            <button
                                                key={`${country.iso}-${country.code}`}
                                                type="button"
                                                onClick={() => {
                                                    setEditPhoneData({ ...editPhoneData, code: country.code });
                                                    setIsPhoneOpen(false);
                                                    setPhoneSearchTerm('');
                                                }}
                                                className="w-full flex items-center px-3 py-2 text-[11px] text-neutral-300 hover:bg-white/5 transition-colors text-left group"
                                            >
                                                <div className="flex items-center flex-1">
                                                    <Check className={cn("mr-2 h-3 w-3", editPhoneData.code === country.code ? "opacity-100" : "opacity-0")} />
                                                    <span className="text-base mr-2 shrink-0">{country.flag}</span>
                                                    <span className="flex-1 truncate">{country.country}</span>
                                                </div>
                                                <span className="font-mono text-neutral-500 ml-2">{country.code}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <Input
                            value={editPhoneData.number}
                            onChange={(e) => setEditPhoneData({ ...editPhoneData, number: e.target.value.replace(/\D/g, '') })}
                            className="h-7 flex-1 text-xs bg-neutral-800/50 border-none rounded text-neutral-200 focus-visible:ring-1 focus-visible:ring-neutral-600/50"
                            autoFocus
                            placeholder="Número"
                            onBlur={() => {
                                if (!isPhoneOpen) {
                                    const finalPhone = `${editPhoneData.code}${editPhoneData.number}`;
                                    onValueChange(finalPhone);
                                    finishEdit();
                                }
                            }}
                        />
                    </div>
                ) : fieldType === 'date' ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={value ? (typeof value === 'string' ? value : new Date(value.seconds * 1000).toISOString().split('T')[0]) : ''}
                            onChange={(e) => onValueChange(e.target.value)}
                            className="bg-neutral-800 border-none rounded px-2 py-1 text-xs text-neutral-200 outline-none w-full"
                        />
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={finishEdit}>
                            <Check size={12} />
                        </Button>
                    </div>
                ) : fieldType === 'files' ? (
                    <div onClick={e => e.stopPropagation()}>
                        {renderFilesDisplay()}
                    </div>
                ) : (
                    <Input
                        value={value || ''}
                        onChange={(e) => onValueChange(e.target.value)}
                        className="h-7 text-xs bg-neutral-800/50 border-none rounded text-neutral-200 focus-visible:ring-1 focus-visible:ring-neutral-600/50"
                        autoFocus
                        onBlur={finishEdit}
                        onKeyDown={(e) => e.key === 'Enter' && finishEdit()}
                    />
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex items-center gap-2 overflow-hidden w-full",
                fieldType === 'files' && isEmpty ? "cursor-pointer group/file-trigger" : ""
            )}
            onClick={handleFileClick}
        >
            {fieldType === 'files' && (
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    multiple
                    accept="image/*,application/pdf"
                />
            )}
            {fieldType === 'files' ? (
                renderFilesDisplay()
            ) : fieldType === 'multiselect' && Array.isArray(value) ? (
                <div className="flex flex-wrap gap-1">
                    {value.map(v => (
                        <span key={v} className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold uppercase", getColorForValue(v))}>
                            {v}
                        </span>
                    ))}
                </div>
            ) : fieldType === 'checkbox' ? (
                <div
                    className="flex-1 py-1 cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onValueChange(value === true ? false : true);
                    }}
                >
                    <div className={cn(
                        "w-4 h-4 rounded border transition-all flex items-center justify-center",
                        value === true
                            ? "bg-neutral-600 border-neutral-600 text-white shadow-lg shadow-black/20"
                            : "border-neutral-700 bg-neutral-800/50 hover:border-neutral-500"
                    )}>
                        {value === true && <Check size={12} strokeWidth={4} />}
                    </div>
                </div>
            ) : (
                <span className={cn(
                    "text-[13px] font-medium transition-colors truncate",
                    isEmpty ? "text-neutral-600 italic" : "text-neutral-200",
                    fieldType === 'status' ? cn("flex items-center gap-1.5 px-2 py-0.5 rounded border border-transparent text-[10px] font-bold uppercase", STATUS_OPTIONS.find(o => o.label === value)?.color || "bg-neutral-800 text-neutral-400") : (badgeClass ? cn("px-2 py-0.5 rounded text-[12px] font-semibold", badgeClass) : "")
                )}>
                    {fieldType === 'status' && (
                        <div className={cn("w-1.5 h-1.5 rounded-full", STATUS_OPTIONS.find(o => o.label === value)?.dotColor || "bg-neutral-500")} />
                    )}
                    {isEmpty ? 'Vacío' : (typeof value === 'object' && value instanceof Timestamp ? new Date(value.seconds * 1000).toLocaleDateString() : String(value))}
                </span>
            )}
        </div>
    );
};
