import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface TabFamilyProps {
    contact: any;
    updateField: (field: string, value: any) => void;
    isEditing?: boolean;
}

export const TabFamily: React.FC<TabFamilyProps> = ({ contact, updateField, isEditing = false }) => {

    // Helper for children array
    const children = contact.children || [];

    const addChild = () => {
        const newChild = { lastName: '', firstName: '', birthDate: '', passportNumber: '' };
        updateField('children', [...children, newChild]);
    };

    const removeChild = (index: number) => {
        const newChildren = children.filter((_: any, i: number) => i !== index);
        updateField('children', newChildren);
    };

    const updateChild = (index: number, field: string, value: any) => {
        const newChildren = [...children];
        newChildren[index] = { ...newChildren[index], [field]: value };
        updateField('children', newChildren);
    };

    return (
        <fieldset disabled={!isEditing} className="space-y-6 block border-0 p-0 m-0 min-w-0">
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">Patrocinador / Sponsor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">¿Tienes Patrocinador?</Label>
                        <Select value={contact.hasSponsor || 'no'} onValueChange={val => updateField('hasSponsor', val)}>
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 h-9 rounded-md">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                <SelectItem value="yes">Sí</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {contact.hasSponsor === 'yes' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Nombres</Label>
                                    <Input value={contact.sponsorFirstName || ''} onChange={e => updateField('sponsorFirstName', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Apellidos</Label>
                                    <Input value={contact.sponsorLastName || ''} onChange={e => updateField('sponsorLastName', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Celular</Label>
                                    <Input value={contact.sponsorPhone || ''} onChange={e => updateField('sponsorPhone', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Email</Label>
                                    <Input value={contact.sponsorEmail || ''} onChange={e => updateField('sponsorEmail', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Parentesco (Papá, Tío, etc)</Label>
                                <Input value={contact.sponsorRelation || ''} onChange={e => updateField('sponsorRelation', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">Hijos que viajarán contigo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">¿Tienes hijos que vendrán?</Label>
                        <Select value={contact.hasChildrenTraveling || 'no'} onValueChange={val => updateField('hasChildrenTraveling', val)}>
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 h-9 rounded-md">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                <SelectItem value="yes">Sí</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {contact.hasChildrenTraveling === 'yes' && (
                        <div className="space-y-4">
                            {children.map((child: any, index: number) => (
                                <div key={index} className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 relative">
                                    <button onClick={() => removeChild(index)} className="absolute top-2 right-2 text-neutral-500 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <h4 className="text-xs font-medium text-neutral-400 mb-3 uppercase">Hijo #{index + 1}</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-2">
                                        <Input placeholder="Nombres" value={child.firstName || ''} onChange={e => updateChild(index, 'firstName', e.target.value)} className="bg-neutral-900 border-neutral-800 h-8" />
                                        <Input placeholder="Apellidos" value={child.lastName || ''} onChange={e => updateChild(index, 'lastName', e.target.value)} className="bg-neutral-900 border-neutral-800 h-8" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-[9px] uppercase text-neutral-500">Fecha Nacimiento</Label>
                                            <Input type="date" value={child.birthDate || ''} onChange={e => updateChild(index, 'birthDate', e.target.value)} className="bg-neutral-900 border-neutral-800 h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] uppercase text-neutral-500">Pasaporte</Label>
                                            <Input placeholder="Num. Pasaporte" value={child.passportNumber || ''} onChange={e => updateChild(index, 'passportNumber', e.target.value)} className="bg-neutral-900 border-neutral-800 h-8" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addChild} className="w-full border-dashed border-neutral-700 hover:bg-neutral-800">
                                <Plus className="w-4 h-4 mr-2" /> Agregar Hijo
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">Datos de los Padres</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Nombre Completo de la Madre</Label>
                        <Input value={contact.motherName || ''} onChange={e => updateField('motherName', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Fecha Nac. Madre</Label>
                        <Input type="date" value={contact.motherBirthDate || ''} onChange={e => updateField('motherBirthDate', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                    </div>
                    <div className="h-px bg-neutral-800 my-2" />
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Nombre Completo del Padre</Label>
                        <Input value={contact.fatherName || ''} onChange={e => updateField('fatherName', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Fecha Nac. Padre</Label>
                        <Input type="date" value={contact.fatherBirthDate || ''} onChange={e => updateField('fatherBirthDate', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                    </div>
                </CardContent>
            </Card>
        </fieldset>
    );
};

