import React, { useState, useEffect } from 'react';
import {
    Activity, Calendar, Check, CheckCircle, ChevronDown, ChevronRight, Clock, Copy, HelpCircle, ImageIcon, Link, Mail, Phone, Plus, Search, User, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { ProfileTabProps, CustomPropertyMeta, CardData } from './types';
import { FIXED_FIELDS, OPTIONAL_FIELDS, NOTION_TYPES, AVAILABLE_ICONS } from './constants';
import { PropertyRow, SortablePropertyRow } from './PropertyRow';
import { PropertyValue } from './PropertyValue';

export const ProfileTab: React.FC<ProfileTabProps> = ({
    liveCardData,
    contactInfo,
    isEditing,
    handleInfoChange,
    handleInfoSave,
    setIsEditing,
    setContactInfo,
    currentGroupName,
    toggleChecklistItem,
    handleToggleCheckIn,
    checklistProgress,
    crmId
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [addedFields, setAddedFields] = useState<string[]>([]);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [namingField, setNamingField] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [propSearch, setPropSearch] = useState('');
    const [isPropMenuOpen, setIsPropMenuOpen] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
    const [showHidden, setShowHidden] = useState(false);

    // Shared state for phone editing (needed by PropertyValue)
    const [editPhoneData, setEditPhoneData] = useState({ code: '+593', number: '' });
    const [isPhoneOpen, setIsPhoneOpen] = useState(false);
    const [phoneSearchTerm, setPhoneSearchTerm] = useState('');

    // Dnd Kit Setup
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Reorder properties logic
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const extraData = contactInfo.extraData || {};
        const allKeys = [
            ...FIXED_FIELDS.map(f => f.key),
            ...OPTIONAL_FIELDS.map(f => f.key),
            ...Object.keys(extraData)
        ];

        // Current order from state or default
        const currentOrder = contactInfo.propertyOrder || allKeys;
        const oldIndex = currentOrder.indexOf(String(active.id));
        const newIndex = currentOrder.indexOf(String(over.id));

        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
            setContactInfo(prev => ({ ...prev, propertyOrder: newOrder }));
        }
    };

    const getIconByName = (name: string, defaultIcon: React.ReactNode) => {
        const found = AVAILABLE_ICONS.find(i => i.name === name);
        if (!found) return defaultIcon;
        return React.cloneElement(found.icon as React.ReactElement, { size: 14 });
    };

    const changeCustomPropertyIcon = (name: string, newIconName: string) => {
        setContactInfo(prev => ({
            ...prev,
            extraData: {
                ...(prev.extraData || {}),
                [name]: {
                    ...(prev.extraData?.[name] || { value: '', __type: 'text' }),
                    iconName: newIconName
                }
            }
        }));
    };

    const duplicateCustomProperty = (oldName: string) => {
        const extraData = contactInfo.extraData || {};
        const oldProp = extraData[oldName];
        if (!oldProp) return;

        const baseName = `${oldName} (copia)`;
        let key = baseName;
        let counter = 1;
        while (extraData[key]) {
            key = `${baseName} ${counter}`;
            counter++;
        }

        setContactInfo(prev => ({
            ...prev,
            extraData: {
                ...(prev.extraData || {}),
                [key]: { ...oldProp }
            }
        }));
        setNamingField(key);
        toast.success(`Propiedad "${oldName}" duplicada`);
    };

    const hasData = (key: string) => {
        const val = contactInfo[key as keyof CardData];
        if (key === 'birthDate' || key.includes('Date')) return !!val;
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === 'object' && val !== null && !(val instanceof Timestamp)) return Object.keys(val).length > 0;
        return val !== undefined && val !== null && val !== '' && val !== 'Vacío';
    };

    const getBadgeStyle = (key: string, value: string) => {
        if (!value || value === 'Vacío') return '';
        const lowerKey = key.toLowerCase();
        const lowerVal = String(value).toLowerCase();
        if (lowerKey.includes('status') || lowerKey.includes('estado')) return 'bg-neutral-800 text-neutral-300 border border-neutral-700';
        if (lowerKey.includes('school') || lowerKey.includes('escuela') || lowerVal.includes('lumos')) return 'bg-neutral-800/50 text-neutral-400 border border-neutral-700/50';
        if (lowerKey.includes('ds160') || lowerKey.includes('ds 160')) return 'bg-neutral-800 text-neutral-300 border border-neutral-700';
        if (lowerVal.includes('xlsx') || lowerVal.includes('pdf') || lowerVal.includes('doc')) return 'bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono text-[11px]';
        return 'bg-neutral-800/30 text-neutral-400 border border-neutral-700/30';
    };

    const COLORS = [
        'bg-neutral-800 text-neutral-300 border border-neutral-700',
        'bg-neutral-800/50 text-neutral-400 border border-neutral-700/50',
        'bg-neutral-700 text-neutral-200 border border-neutral-600',
        'bg-neutral-900 text-neutral-500 border border-neutral-800',
        'bg-neutral-800 text-neutral-100 border border-neutral-600',
        'bg-neutral-700 text-neutral-400 border border-neutral-500/30',
        'bg-neutral-800/20 text-neutral-500 border border-neutral-700/20',
        'bg-neutral-600 text-neutral-200 border border-neutral-500',
        'bg-neutral-700 text-neutral-300 border border-neutral-600/50',
        'bg-neutral-800/40 text-neutral-400 border border-neutral-700/40',
    ];

    const getColorForValue = (val: string) => {
        let hash = 0;
        for (let i = 0; i < val.length; i++) {
            hash = val.charCodeAt(i) + ((hash << 5) - hash);
        }
        return COLORS[Math.abs(hash) % COLORS.length];
    };

    const addCustomProperty = (name: string, type: string = 'text') => {
        const baseName = name || 'Nueva propiedad';
        let key = baseName.trim();
        const extraData = contactInfo.extraData || {};
        let counter = 1;
        while (extraData[key]) {
            key = `${baseName} ${counter}`;
            counter++;
        }
        setContactInfo(prev => {
            const propertyOrder = prev.propertyOrder || [
                ...FIXED_FIELDS.map(f => f.key),
                ...OPTIONAL_FIELDS.map(f => f.key),
                ...Object.keys(prev.extraData || {})
            ];
            return {
                ...prev,
                extraData: { ...(prev.extraData || {}), [key]: { __type: type, value: '' } },
                propertyOrder: [...propertyOrder, key]
            };
        });
        setNamingField(key);
        setIsPropMenuOpen(false);
        setPropSearch('');
    };

    const deleteCustomField = (key: string) => {
        setContactInfo(prev => {
            const newData = { ...(prev.extraData || {}) };
            delete newData[key];
            const propertyOrder = prev.propertyOrder ? prev.propertyOrder.filter((k: string) => k !== key) : null;
            return { ...prev, extraData: newData, ...(propertyOrder ? { propertyOrder } : {}) };
        });
    };

    const renameCustomProperty = (oldName: string, newName: string) => {
        if (!newName || oldName === newName) return;
        setContactInfo(prev => {
            const newData = { ...(prev.extraData || {}) };
            const propData = newData[oldName];
            delete newData[oldName];
            newData[newName] = propData;
            const propertyOrder = prev.propertyOrder
                ? prev.propertyOrder.map((k: string) => k === oldName ? newName : k)
                : null;
            return { ...prev, extraData: newData, ...(propertyOrder ? { propertyOrder } : {}) };
        });
    };

    const changeCustomPropertyType = (name: string, newType: string) => {
        setContactInfo(prev => ({
            ...prev,
            extraData: {
                ...(prev.extraData || {}),
                [name]: { ...(prev.extraData?.[name] || { value: '' }), __type: newType as CustomPropertyMeta['__type'] }
            }
        }));
    };

    const changeCustomPropertyVisibility = (name: string, visibility: 'always' | 'hide-empty' | 'hidden') => {
        setContactInfo(prev => ({
            ...prev,
            extraData: {
                ...(prev.extraData || {}),
                [name]: {
                    ...(prev.extraData?.[name] || { value: '', __type: 'text' }),
                    visibility
                }
            }
        }));
    };

    const toggleSection = (title: string) => {
        setCollapsedSections(prev => ({ ...prev, [title]: !prev[title] }));
    };

    const parsePhone = (fullPhone: string) => {
        if (!fullPhone) return { code: '+593', number: '' };
        const clean = fullPhone.replace(/\D/g, '');
        if (!clean) return { code: '+593', number: '' };
        return { code: '+593', number: clean }; // Simple rescue version for now
    };

    useEffect(() => {
        if (editingField) {
            const isExtraField = editingField.startsWith('extra-');
            const actualKey = isExtraField ? editingField.replace('extra-', '') : editingField;
            const val = isExtraField
                ? contactInfo.extraData?.[actualKey]?.value
                : contactInfo[actualKey as keyof CardData];

            if (actualKey === 'contactNumber' || actualKey === 'phone' || actualKey === 'sponsorPhone' || (isExtraField && contactInfo.extraData?.[actualKey]?.__type === 'phone')) {
                setEditPhoneData(parsePhone(String(val || '')));
            }
        }
    }, [editingField, contactInfo]);

    return (
        <div className="h-full w-full overflow-y-auto overflow-x-hidden p-6 pt-4 space-y-4 pb-32 bg-[#191919] text-neutral-200 custom-scrollbar">
            {/* Header section... (skipped for brevity but included in full) */}
            <div className="space-y-4 px-2">
                <div className="pt-2">
                    {isEditing ? (
                        <Input
                            name="contactName"
                            value={contactInfo.contactName || ''}
                            onChange={handleInfoChange}
                            className="h-12 text-4xl font-bold bg-transparent border-none p-0 focus-visible:ring-0 placeholder:opacity-20"
                            placeholder="Sin nombre"
                            autoFocus
                        />
                    ) : (
                        <h1
                            className="text-4xl font-bold text-white tracking-tight hover:bg-white/5 px-1 py-1 -ml-1 rounded cursor-text transition-colors"
                            onClick={() => setIsEditing(true)}
                        >
                            {contactInfo.contactName || 'Sin nombre'}
                        </h1>
                    )}
                    <p className="text-xs text-neutral-500 mt-2 font-medium tracking-wide uppercase">{currentGroupName || 'General'}</p>
                </div>
            </div>

            {/* Share link section */}
            <div className="mx-1 p-2.5 bg-neutral-500/10 border border-white/5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-neutral-400">
                            <Link size={14} />
                        </div>
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Link de Aplicación</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-neutral-400 hover:bg-white/10"
                        onClick={async () => {
                            let finalId = crmId;
                            if (!finalId || (typeof finalId === 'string' && finalId.startsWith('temp-'))) {
                                try {
                                    const savedId = await handleInfoSave() as unknown as string;
                                    if (savedId) finalId = savedId;
                                } catch (e) {
                                    finalId = (contactInfo.contactNumber || liveCardData?.contactNumber || '').replace(/[^\d]/g, '');
                                }
                            }
                            if (finalId) {
                                const link = `${window.location.origin}/application/${finalId}`;
                                navigator.clipboard.writeText(link);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            } else {
                                toast.error("No se pudo generar el link. Asegúrate de que el contacto tenga un número.");
                            }
                        }}
                    >
                        {copied ? <Check size={10} /> : <Copy size={10} />}
                    </Button>
                </div>
                <p className="text-[10px] text-neutral-500 leading-snug">
                    Envía este link al cliente para sincronizar datos automáticamente.
                </p>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="space-y-3">
                    {[
                        { title: 'RESUMEN', fields: FIXED_FIELDS.map(f => ({ ...f, key: f.key, type: 'fixed' as const })) },
                        {
                            title: 'INFORMACIÓN PERSONAL',
                            fields: OPTIONAL_FIELDS.filter(f => ['Info Básica', 'Estudiante', 'Dirección'].includes(f.section || '')).map(f => ({ ...f, type: 'optional' as const }))
                        },
                        {
                            title: 'DOCUMENTACIÓN',
                            fields: OPTIONAL_FIELDS.filter(f => f.section === 'Pasaporte').map(f => ({ ...f, type: 'optional' as const }))
                        },
                        {
                            title: 'ENTORNO FAMILIAR',
                            fields: OPTIONAL_FIELDS.filter(f => f.section === 'Familia').map(f => ({ ...f, type: 'optional' as const }))
                        },
                        {
                            title: 'HISTORIAL PROFESIONAL',
                            fields: OPTIONAL_FIELDS.filter(f => ['Empleo', 'Estudios'].includes(f.section || '')).map(f => ({ ...f, type: 'optional' as const }))
                        },
                        {
                            title: 'ANTECEDENTES Y SALUD',
                            fields: OPTIONAL_FIELDS.filter(f => f.section === 'Antecedentes').map(f => ({ ...f, type: 'optional' as const }))
                        },
                        { title: 'INFO BÁSICA', fields: OPTIONAL_FIELDS.filter(f => f.section === 'Info Básica').map(f => ({ ...f, type: 'optional' as const })) },
                        { title: 'PROPIEDADES EXTRA', fields: Object.keys(contactInfo.extraData || {}).map(key => ({ key, label: key, type: 'custom' as const })) }
                    ].map((sectionData, sIdx) => {
                        const visibleFields = sectionData.fields.filter(f => {
                            const meta = f.type === 'custom' ? contactInfo.extraData?.[f.key] : null;
                            const visibility = meta?.visibility || 'always';

                            if (visibility === 'hidden') return false;
                            if (visibility === 'hide-empty' && !hasData(f.key) && editingField !== (f.type === 'custom' ? `extra-${f.key}` : f.key)) return false;

                            if (f.type === 'fixed') return true;
                            if (f.type === 'optional') return hasData(f.key) || editingField === f.key;
                            return true;
                        });

                        // Sort visible fields based on propertyOrder
                        const propertyOrder = contactInfo.propertyOrder || [];
                        if (propertyOrder.length > 0) {
                            visibleFields.sort((a, b) => {
                                const aIdx = propertyOrder.indexOf(a.key);
                                const bIdx = propertyOrder.indexOf(b.key);
                                if (aIdx === -1 && bIdx === -1) return 0;
                                if (aIdx === -1) return 1;
                                if (bIdx === -1) return -1;
                                return aIdx - bIdx;
                            });
                        }

                        if (visibleFields.length === 0) return null;

                        return (
                            <div key={sectionData.title || sIdx} className="space-y-1">
                                {sectionData.title && (
                                    <div
                                        className="flex items-center gap-2 group/header px-2 py-1 cursor-pointer hover:bg-white/5 rounded transition-colors"
                                        onClick={() => toggleSection(sectionData.title)}
                                    >
                                        <div className="text-neutral-600">
                                            {collapsedSections[sectionData.title] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                        </div>
                                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] px-1 text-neutral-500/80">
                                            {sectionData.title}
                                        </h3>
                                        <span className="ml-auto text-[8px] font-mono text-neutral-600 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                            {visibleFields.length}
                                        </span>
                                    </div>
                                )}
                                {!collapsedSections[sectionData.title] && (
                                    <SortableContext items={visibleFields.map(f => f.key)} strategy={verticalListSortingStrategy}>
                                        {visibleFields.map(field => (
                                            <SortablePropertyRow
                                                key={field.key}
                                                id={field.key}
                                                label={field.label}
                                                icon={
                                                    field.type === 'custom'
                                                        ? contactInfo.extraData?.[field.key]?.iconName
                                                            ? getIconByName(contactInfo.extraData?.[field.key]?.iconName as string, <HelpCircle size={14} />)
                                                            : (NOTION_TYPES.find(t => t.id === contactInfo.extraData?.[field.key]?.__type)?.icon || <HelpCircle size={14} />)
                                                        : field.icon
                                                }
                                                onEdit={() => setEditingField(field.type === 'custom' ? `extra-${field.key}` : field.key)}
                                                onDelete={() => field.type === 'custom' ? deleteCustomField(field.key) : setContactInfo(prev => ({ ...prev, [field.key as keyof CardData]: '' }))}
                                                isCustom={field.type === 'custom'}
                                                onRename={(newName) => renameCustomProperty(field.key, newName)}
                                                onChangeType={(newType) => changeCustomPropertyType(field.key, newType)}
                                                onChangeVisibility={(v) => changeCustomPropertyVisibility(field.key, v)}
                                                currentVisibility={contactInfo.extraData?.[field.key]?.visibility || 'always'}
                                                currentTypeLabel={field.type === 'custom' ? NOTION_TYPES.find(t => t.id === contactInfo.extraData?.[field.key]?.__type)?.label || 'Texto' : 'Texto'}
                                                notionTypes={NOTION_TYPES}
                                                isNaming={namingField === field.key}
                                                onStopNaming={() => setNamingField(null)}
                                                onLabelEdit={() => setNamingField(field.key)}
                                                onIconChange={(newName) => changeCustomPropertyIcon(field.key, newName)}
                                                availableIcons={AVAILABLE_ICONS}
                                                onDuplicate={() => duplicateCustomProperty(field.key)}
                                            >
                                                <PropertyValue
                                                    fieldKey={field.key}
                                                    value={field.type === 'custom' ? contactInfo.extraData?.[field.key]?.value : contactInfo[field.key as keyof CardData]}
                                                    isEditing={editingField === (field.type === 'custom' ? `extra-${field.key}` : field.key)}
                                                    isCustom={field.type === 'custom'}
                                                    customMeta={field.type === 'custom' ? contactInfo.extraData?.[field.key] : undefined}
                                                    onValueChange={(newVal) => {
                                                        if (field.type === 'custom') {
                                                            setContactInfo(prev => ({
                                                                ...prev,
                                                                extraData: { ...(prev.extraData || {}), [field.key]: { ...(prev.extraData?.[field.key] || {}), value: newVal } }
                                                            }));
                                                        } else {
                                                            setContactInfo(prev => ({ ...prev, [field.key as keyof CardData]: newVal }));
                                                        }
                                                    }}
                                                    finishEdit={() => setEditingField(null)}
                                                    hasData={hasData}
                                                    getBadgeStyle={getBadgeStyle}
                                                    getColorForValue={getColorForValue}
                                                    phoneSearchTerm={phoneSearchTerm}
                                                    setPhoneSearchTerm={setPhoneSearchTerm}
                                                    isPhoneOpen={isPhoneOpen}
                                                    setIsPhoneOpen={setIsPhoneOpen}
                                                    editPhoneData={editPhoneData}
                                                    setEditPhoneData={setEditPhoneData}
                                                    parsePhone={parsePhone}
                                                    cardId={liveCardData?.id || ''}
                                                    groupId={liveCardData?.groupId || ''}
                                                    crmId={crmId}
                                                    onSave={handleInfoSave}
                                                />
                                            </SortablePropertyRow>
                                        ))}
                                    </SortableContext>
                                )}
                            </div>
                        );
                    })}
                </div>
            </DndContext>

            {/* Hidden Properties Manager */}
            {(() => {
                const allFields = [
                    ...FIXED_FIELDS.map(f => ({ ...f, type: 'fixed' as const })),
                    ...OPTIONAL_FIELDS.map(f => ({ ...f, type: 'optional' as const })),
                    ...Object.keys(contactInfo.extraData || {}).map(k => ({ key: k, type: 'custom' as const }))
                ];

                const hiddenFields = allFields.filter(f => {
                    const meta = f.type === 'custom' ? contactInfo.extraData?.[f.key] : null;
                    const visibility = meta?.visibility || 'always';

                    if (visibility === 'hidden') return true;
                    if (visibility === 'hide-empty' && !hasData(f.key) && editingField !== (f.type === 'custom' ? `extra-${f.key}` : f.key)) return true;
                    // For optional fields that are not in extraData but are hidden because no data
                    if (f.type === 'optional' && !hasData(f.key) && editingField !== f.key) return true;
                    return false;
                });

                if (hiddenFields.length === 0) return null;

                return (
                    <div className="px-2">
                        <button
                            onClick={() => setShowHidden(!showHidden)}
                            className="text-[11px] text-neutral-600 hover:text-neutral-400 font-medium transition-colors flex items-center gap-2 px-1 py-1"
                        >
                            {showHidden ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            {showHidden ? 'Ocultar propiedades no utilizadas' : `${hiddenFields.length} ${hiddenFields.length === 1 ? 'propiedad oculta' : 'propiedades ocultas'}`}
                        </button>

                        {showHidden && (
                            <div className="mt-2 space-y-1 pl-4 border-l border-neutral-800">
                                {[
                                    ...OPTIONAL_FIELDS.filter(f => !hasData(f.key) && editingField !== f.key),
                                    ...Object.keys(contactInfo.extraData || {}).filter(k => {
                                        const meta = contactInfo.extraData?.[k];
                                        return meta?.visibility === 'hidden' || (meta?.visibility === 'hide-empty' && !hasData(k));
                                    }).map(k => ({ key: k, label: k, type: 'custom' as const }))
                                ].map((field: any) => (
                                    <div key={field.key} className="flex items-center justify-between group/hidden-row py-1 text-[12px] text-neutral-500">
                                        <div className="flex items-center gap-2">
                                            <div className="opacity-50">
                                                {field.type === 'custom'
                                                    ? getIconByName((contactInfo.extraData?.[field.key])?.iconName, <HelpCircle size={12} />)
                                                    : React.cloneElement(field.icon as React.ReactElement, { size: 12 })
                                                }
                                            </div>
                                            <span>{field.label}</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (field.type === 'custom') {
                                                    changeCustomPropertyVisibility(field.key, 'always');
                                                } else {
                                                    setEditingField(field.key);
                                                }
                                            }}
                                            className="text-[10px] text-neutral-600/0 group-hover/hidden-row:text-neutral-400 transition-colors uppercase font-bold tracking-tighter"
                                        >
                                            Mostrar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Add property button */}
            <div className="px-2 pt-2">
                <Popover open={isPropMenuOpen} onOpenChange={setIsPropMenuOpen}>
                    <PopoverTrigger asChild>
                        <button type="button" className="flex items-center gap-3 px-2 py-1.5 w-full text-neutral-500 hover:bg-white/5 rounded-md transition-colors text-xs font-medium group text-left outline-none">
                            <Plus size={16} className="group-hover:text-neutral-400" />
                            <span className="group-hover:text-neutral-400">Añadir una propiedad</span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0 bg-[#202020] border-neutral-800 shadow-2xl z-[9999] animate-in zoom-in-95 duration-100" align="start" side="bottom" sideOffset={5}>
                        <div className="flex flex-col max-h-[400px]">
                            <div className="flex items-center gap-2 p-2.5 border-b border-neutral-800">
                                <Search size={14} className="text-neutral-500" />
                                <input placeholder="Nombre de la propiedad" className="bg-transparent border-none outline-none text-sm text-neutral-200 w-full placeholder:text-neutral-600 focus:ring-0" value={propSearch} onChange={(e) => setPropSearch(e.target.value)} autoFocus />
                            </div>
                            <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
                                <div className="px-1 py-1">
                                    <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest mb-1 px-2">Sugeridas</p>
                                    <div className="space-y-0.5">
                                        {OPTIONAL_FIELDS.filter(f => !hasData(f.key) && f.label.toLowerCase().includes(propSearch.toLowerCase())).map(field => (
                                            <button key={field.key} type="button" onClick={() => { setEditingField(field.key); setIsPropMenuOpen(false); setPropSearch(''); }} className="flex items-center gap-2.5 w-full p-1.5 hover:bg-white/5 rounded text-[13px] text-neutral-300 transition-colors text-left">
                                                <div className="text-neutral-500 w-4 flex justify-center">{React.cloneElement(field.icon as React.ReactElement, { size: 14 })}</div>
                                                <span className="truncate text-xs">{field.label.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="h-px bg-neutral-800 my-1 mx-2" />
                                {(() => {
                                    const categories = ['Básicas', 'Avanzado', 'Conexiones'];
                                    return categories.map(cat => {
                                        const items = NOTION_TYPES.filter(t => (t.category || 'Básicas') === cat && t.label.toLowerCase().includes(propSearch.toLowerCase()));
                                        if (items.length === 0) return null;
                                        return (
                                            <div key={cat} className="px-1 py-1">
                                                <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest mb-1 px-2">{cat}</p>
                                                <div className="space-y-0.5">
                                                    {items.map(type => (
                                                        <button key={type.id} type="button" onClick={() => { addCustomProperty(propSearch || 'Nueva Propiedad', type.id); setIsPropMenuOpen(false); setPropSearch(''); }} className="flex items-center gap-2.5 w-full p-1.5 hover:bg-white/5 rounded text-[13px] text-neutral-300 transition-colors text-left group/prop-item">
                                                            <div className="w-5 flex justify-center text-neutral-500 group-hover/prop-item:text-neutral-400">{type.icon}</div>
                                                            <span className="text-xs">{type.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                {cat !== 'Conexiones' && <div className="h-px bg-neutral-800/50 my-1 mx-2" />}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};
