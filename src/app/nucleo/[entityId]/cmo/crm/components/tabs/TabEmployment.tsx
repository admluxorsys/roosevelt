import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TabEmploymentProps {
    contact: any;
    updateField: (field: string, value: any) => void;
    isEditing?: boolean;
}

export const TabEmployment: React.FC<TabEmploymentProps> = ({ contact, updateField, isEditing = false }) => {
    return (
        <fieldset disabled={!isEditing} className="space-y-6 block border-0 p-0 m-0 min-w-0">
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">Situación Laboral Actual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Ocupación Actual</Label>
                        <Select value={contact.occupationData || ''} onValueChange={val => updateField('occupationData', val)}>
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 h-9 rounded-md">
                                <SelectValue placeholder="Seleccionar Rol" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                <SelectItem value="employed">Empleado</SelectItem>
                                <SelectItem value="self_employed">Independiente</SelectItem>
                                <SelectItem value="student">Estudiante</SelectItem>
                                <SelectItem value="unemployed">Desempleado</SelectItem>
                                <SelectItem value="business_owner">Dueño de Negocio</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Empresa</Label>
                        <Input value={contact.currentEmployer || ''} onChange={e => updateField('currentEmployer', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Dirección Empresa</Label>
                        <Input value={contact.employerAddress || ''} onChange={e => updateField('employerAddress', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Ciudad</Label>
                            <Input value={contact.employerCity || ''} onChange={e => updateField('employerCity', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Estado</Label>
                            <Input value={contact.employerState || ''} onChange={e => updateField('employerState', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">País</Label>
                            <Input value={contact.employerCountry || ''} onChange={e => updateField('employerCountry', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Teléfono Empresa</Label>
                            <Input value={contact.employerPhone || ''} onChange={e => updateField('employerPhone', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Fecha Inicio</Label>
                            <Input type="date" value={contact.jobStartDate || ''} onChange={e => updateField('jobStartDate', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Salario Mensual</Label>
                            <Input value={contact.monthlySalary || ''} onChange={e => updateField('monthlySalary', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Descripción del Rol</Label>
                        <Textarea value={contact.jobDescription || ''} onChange={e => updateField('jobDescription', e.target.value)} className="bg-neutral-950 border-neutral-800 rounded-md min-h-[80px]" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">¿Otras fuentes de ingreso?</Label>
                        <Textarea value={contact.otherIncomeSource || ''} onChange={e => updateField('otherIncomeSource', e.target.value)} className="bg-neutral-950 border-neutral-800 rounded-md min-h-[80px]" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">Empleo Anterior</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">¿Tuviste un empleo anterior?</Label>
                        <Select value={contact.hasPreviousJob || 'no'} onValueChange={val => updateField('hasPreviousJob', val)}>
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 h-9 rounded-md">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                <SelectItem value="yes">Sí</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {contact.hasPreviousJob === 'yes' && (
                        <div className="space-y-4 border-l-2 border-neutral-700 pl-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Empresa Anterior</Label>
                                <Input value={contact.prevEmployer || ''} onChange={e => updateField('prevEmployer', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Título / Cargo</Label>
                                    <Input value={contact.prevJobTitle || ''} onChange={e => updateField('prevJobTitle', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Supervisor</Label>
                                    <Input value={contact.prevSupervisor || ''} onChange={e => updateField('prevSupervisor', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Fecha Inicio</Label>
                                    <Input type="date" value={contact.prevJobStartDate || ''} onChange={e => updateField('prevJobStartDate', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Fecha Término</Label>
                                    <Input type="date" value={contact.prevJobEndDate || ''} onChange={e => updateField('prevJobEndDate', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Descripción</Label>
                                <Textarea value={contact.prevJobDescription || ''} onChange={e => updateField('prevJobDescription', e.target.value)} className="bg-neutral-950 border-neutral-800 rounded-md min-h-[60px]" />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </fieldset>
    );
};

