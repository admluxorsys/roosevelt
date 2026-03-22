// src/components/settings/nodes/ContactSettings.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, User, Phone, Building2, Globe, Mail, Briefcase } from 'lucide-react';
import { SettingsSection, Field } from '../SharedComponents';
import { produce } from 'immer';
import { cn } from '@/lib/utils';

interface PhoneEntry {
    number: string;
    type: 'CELL' | 'WORK' | 'MAIN' | 'HOME';
    wa_id: boolean;
}

interface NodeSettingsProps {
    node: Node;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

export const ContactSettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    const [config, setConfig] = useState({
        firstName: node.data.firstName || '',
        lastName: node.data.lastName || '',
        formattedName: node.data.formattedName || '',
        organization: node.data.organization || '',
        email: node.data.email || '',
        website: node.data.website || '',
        phones: (node.data.phones || [{ number: '', type: 'WORK', wa_id: true }]) as PhoneEntry[]
    });

    // Auto-generar Formatted Name si está vacío y hay datos de nombre
    useEffect(() => {
        if (!config.formattedName && (config.firstName || config.lastName)) {
            const autoFormat = `${config.firstName} ${config.lastName}`.trim();
            // Solo actualizamos si no contiene variables (para evitar romper lógica dinámica)
            if (!autoFormat.includes('{{')) {
                update({ formattedName: autoFormat });
            }
        }
    }, [config.firstName, config.lastName]);

    const update = (updates: any) => {
        const newConfig = { ...config, ...updates };
        setConfig(newConfig);
        updateNodeConfig(node.id, newConfig);
    };

    // --- Gestión de Teléfonos ---
    const addPhone = () => {
        update({ phones: [...config.phones, { number: '', type: 'CELL', wa_id: false }] });
    };

    const updatePhone = (index: number, field: keyof PhoneEntry, value: any) => {
        const newPhones = produce(config.phones, draft => {
            (draft[index] as any)[field] = value;
            // Si marcamos este como WA ID, desmarcamos los otros (solo 1 ID principal)
            if (field === 'wa_id' && value === true) {
                draft.forEach((p, i) => { if (i !== index) p.wa_id = false; });
            }
        });
        update({ phones: newPhones });
    };

    const removePhone = (index: number) => {
        const newPhones = config.phones.filter((_, i) => i !== index);
        update({ phones: newPhones });
    };

    return (
        <div className="space-y-6">
            
            {/* 1. IDENTIDAD (Nombre) */}
            <SettingsSection title="1. Identidad del Contacto">
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <Field label="Nombre (Given Name)" htmlFor="first-name">
                        <Input 
                            value={config.firstName} 
                            onChange={(e) => update({ firstName: e.target.value })} 
                            placeholder="Ej: Juan"
                            className="bg-neutral-950"
                        />
                    </Field>
                    <Field label="Apellido (Family Name)" htmlFor="last-name">
                        <Input 
                            value={config.lastName} 
                            onChange={(e) => update({ lastName: e.target.value })} 
                            placeholder="Ej: Pérez"
                            className="bg-neutral-950"
                        />
                    </Field>
                </div>
                <Field label="Nombre Mostrado (Full Name)" htmlFor="formatted-name" description="Cómo se guardará en la agenda del celular.">
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 text-neutral-500 h-4 w-4" />
                        <Input 
                            value={config.formattedName} 
                            onChange={(e) => update({ formattedName: e.target.value })} 
                            placeholder="Ej: Juan Pérez - Soporte"
                            className="pl-9 font-medium"
                        />
                    </div>
                </Field>
            </SettingsSection>

            {/* 2. TELÉFONOS */}
            <SettingsSection title="2. Teléfonos">
                <div className="space-y-3">
                    {config.phones.map((phone, idx) => (
                        <div key={idx} className="bg-neutral-950 p-2 rounded-lg border border-neutral-800 space-y-2">
                            <div className="flex gap-2">
                                <Select value={phone.type} onValueChange={(v) => updatePhone(idx, 'type', v)}>
                                    <SelectTrigger className="w-[100px] h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WORK">Trabajo</SelectItem>
                                        <SelectItem value="CELL">Celular</SelectItem>
                                        <SelectItem value="MAIN">Principal</SelectItem>
                                        <SelectItem value="HOME">Casa</SelectItem>
                                    </SelectContent>
                                </Select>
                                
                                <div className="flex-1 relative">
                                    <Phone className="absolute left-3 top-2.5 text-neutral-500 h-4 w-4" />
                                    <Input 
                                        value={phone.number} 
                                        onChange={(e) => updatePhone(idx, 'number', e.target.value)} 
                                        placeholder="+51 999..."
                                        className="pl-9 h-9 font-mono text-sm"
                                    />
                                </div>

                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => removePhone(idx)} 
                                    disabled={config.phones.length === 1}
                                    className="h-9 w-9 text-neutral-500 hover:text-red-500"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                            
                            <div className="flex items-center gap-2 pl-1">
                                <Checkbox 
                                    id={`wa-id-${idx}`} 
                                    checked={phone.wa_id} 
                                    onCheckedChange={(c) => updatePhone(idx, 'wa_id', c === true)}
                                />
                                <Label htmlFor={`wa-id-${idx}`} className="text-[10px] text-neutral-400 cursor-pointer select-none">
                                    Usar para "Enviar Mensaje" (Click-to-Chat)
                                </Label>
                            </div>
                        </div>
                    ))}
                    <Button onClick={addPhone} variant="outline" size="sm" className="w-full border-dashed text-xs">
                        <Plus size={14} className="mr-2"/> Añadir otro número
                    </Button>
                </div>
            </SettingsSection>

            {/* 3. METADATOS CORPORATIVOS */}
            <SettingsSection title="3. Información Corporativa">
                <div className="space-y-3">
                    <Field label="Organización / Empresa" htmlFor="org">
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-2.5 text-neutral-500 h-4 w-4" />
                            <Input 
                                id="org"
                                value={config.organization} 
                                onChange={(e) => update({ organization: e.target.value })} 
                                placeholder="Ej: Mi Empresa S.A.C."
                                className="pl-9 bg-neutral-950"
                            />
                        </div>
                    </Field>
                    
                    <Field label="Correo Electrónico" htmlFor="email">
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 text-neutral-500 h-4 w-4" />
                            <Input 
                                id="email"
                                value={config.email} 
                                onChange={(e) => update({ email: e.target.value })} 
                                placeholder="contacto@empresa.com"
                                className="pl-9 bg-neutral-950 font-mono text-sm"
                            />
                        </div>
                    </Field>

                    <Field label="Sitio Web" htmlFor="website">
                        <div className="relative">
                            <Globe className="absolute left-3 top-2.5 text-neutral-500 h-4 w-4" />
                            <Input 
                                id="website"
                                value={config.website} 
                                onChange={(e) => update({ website: e.target.value })} 
                                placeholder="https://www.empresa.com"
                                className="pl-9 bg-neutral-950 font-mono text-sm text-blue-400"
                            />
                        </div>
                    </Field>
                </div>
            </SettingsSection>
            
            <p className="text-[10px] text-neutral-500 text-center italic">
                Tip: Puedes usar variables como <code>{'{{agente_nombre}}'}</code> en cualquier campo.
            </p>
        </div>
    );
};

