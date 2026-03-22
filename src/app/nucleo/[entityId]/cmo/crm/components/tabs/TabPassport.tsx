import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TabPassportProps {
    contact: any;
    updateField: (field: string, value: any) => void;
    isEditing?: boolean;
}

export const TabPassport: React.FC<TabPassportProps> = ({ contact, updateField, isEditing = false }) => {
    return (
        <fieldset disabled={!isEditing} className="space-y-6 block border-0 p-0 m-0 min-w-0">
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">Información del Pasaporte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Número de Pasaporte</Label>
                            <Input value={contact.passportNumber || ''} onChange={e => updateField('passportNumber', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md font-mono" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">País de Emisión</Label>
                            <Input value={contact.passportCountry || ''} onChange={e => updateField('passportCountry', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Ciudad de Emisión</Label>
                            <Input value={contact.passportCity || ''} onChange={e => updateField('passportCity', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Estado/Provincia</Label>
                            <Input value={contact.passportState || ''} onChange={e => updateField('passportState', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Fecha de Emisión</Label>
                            <Input type="date" value={contact.passportIssuedDate || ''} onChange={e => updateField('passportIssuedDate', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Fecha de Expiración</Label>
                            <Input type="date" value={contact.passportExpiryDate || ''} onChange={e => updateField('passportExpiryDate', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">¿Has perdido tu pasaporte alguna vez?</Label>
                        <Select value={contact.passportLost || 'no'} onValueChange={val => updateField('passportLost', val)}>
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 h-9 rounded-md">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                <SelectItem value="yes">Sí</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">Visado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">¿Tienes visa de turista actual?</Label>
                        <Select value={contact.hasTouristVisa || 'no'} onValueChange={val => updateField('hasTouristVisa', val)}>
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 h-9 rounded-md">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                <SelectItem value="yes">Sí</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {contact.hasTouristVisa === 'yes' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Fecha de Emisión Visa</Label>
                                <Input type="date" value={contact.visaIssuedDate || ''} onChange={e => updateField('visaIssuedDate', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Fecha de Expiración Visa</Label>
                                <Input type="date" value={contact.visaExpiryDate || ''} onChange={e => updateField('visaExpiryDate', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </fieldset>
    );
};

