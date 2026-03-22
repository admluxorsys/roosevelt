import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TabEducationProps {
    contact: any;
    updateField: (field: string, value: any) => void;
    isEditing?: boolean;
}

export const TabEducation: React.FC<TabEducationProps> = ({ contact, updateField, isEditing = false }) => {
    return (
        <fieldset disabled={!isEditing} className="space-y-6 block border-0 p-0 m-0 min-w-0">
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">Estudios - Secundaria / High School</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Nombre Institución</Label>
                        <Input value={contact.schoolName || ''} onChange={e => updateField('schoolName', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Dirección</Label>
                        <Input value={contact.schoolAddress || ''} onChange={e => updateField('schoolAddress', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Programa / Curso</Label>
                        <Input value={contact.schoolProgram || ''} onChange={e => updateField('schoolProgram', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Fecha Inicio</Label>
                            <Input type="date" value={contact.schoolStartDate || ''} onChange={e => updateField('schoolStartDate', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Fecha Término</Label>
                            <Input type="date" value={contact.schoolEndDate || ''} onChange={e => updateField('schoolEndDate', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">Estudios - Universitario / Instituto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Nombre Institución</Label>
                        <Input value={contact.universityName || ''} onChange={e => updateField('universityName', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Dirección</Label>
                        <Input value={contact.universityAddress || ''} onChange={e => updateField('universityAddress', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Programa / Curso</Label>
                        <Input value={contact.universityProgram || ''} onChange={e => updateField('universityProgram', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Fecha Inicio</Label>
                            <Input type="date" value={contact.universityStartDate || ''} onChange={e => updateField('universityStartDate', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Fecha Término</Label>
                            <Input type="date" value={contact.universityEndDate || ''} onChange={e => updateField('universityEndDate', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </fieldset>
    );
};

