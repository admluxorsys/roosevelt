import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface TabBackgroundProps {
    contact: any;
    updateField: (field: string, value: any) => void;
    isEditing?: boolean;
}

export const TabBackground: React.FC<TabBackgroundProps> = ({ contact, updateField, isEditing = false }) => {

    const emergencyContacts = contact.emergencyContacts || [];

    const addEmergencyContact = () => {
        const newContact = { name: '', phone: '', email: '', relation: '', address: '' };
        updateField('emergencyContacts', [...emergencyContacts, newContact]);
    };

    const removeEmergencyContact = (index: number) => {
        const newContacts = emergencyContacts.filter((_: any, i: number) => i !== index);
        updateField('emergencyContacts', newContacts);
    };

    const updateEmergencyContact = (index: number, field: string, value: any) => {
        const newContacts = [...emergencyContacts];
        newContacts[index] = { ...newContacts[index], [field]: value };
        updateField('emergencyContacts', newContacts);
    };

    return (
        <fieldset disabled={!isEditing} className="space-y-6 block border-0 p-0 m-0 min-w-0">
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">Información de Fondo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">¿Por qué quieres estudiar inglés?</Label>
                        <Textarea value={contact.studyReason || ''} onChange={e => updateField('studyReason', e.target.value)} className="bg-neutral-950 border-neutral-800 rounded-md min-h-[60px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Tiempo de Estudio</Label>
                            <Select value={contact.studyDuration || ''} onValueChange={val => updateField('studyDuration', val)}>
                                <SelectTrigger className="bg-neutral-950 border-neutral-800 h-9 rounded-md">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                    <SelectItem value="3_months">3 Meses</SelectItem>
                                    <SelectItem value="6_months">6 Meses</SelectItem>
                                    <SelectItem value="12_months">12 Meses</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Semestre de Inicio</Label>
                            <Select value={contact.startSemester || ''} onValueChange={val => updateField('startSemester', val)}>
                                <SelectTrigger className="bg-neutral-950 border-neutral-800 h-9 rounded-md">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                    <SelectItem value="january">Enero</SelectItem>
                                    <SelectItem value="may">Mayo</SelectItem>
                                    <SelectItem value="september">Septiembre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Horario Preferido</Label>
                            <Select value={contact.preferredSchedule || ''} onValueChange={val => updateField('preferredSchedule', val)}>
                                <SelectTrigger className="bg-neutral-950 border-neutral-800 h-9 rounded-md">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                    <SelectItem value="morning">Mañana</SelectItem>
                                    <SelectItem value="afternoon">Tarde</SelectItem>
                                    <SelectItem value="night">Noche</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Escuela Destino</Label>
                            <Input value={contact.targetSchool || ''} onChange={e => updateField('targetSchool', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">¿Rechazo de Visa previo?</Label>
                            <Select value={contact.visaRefusal || 'no'} onValueChange={val => updateField('visaRefusal', val)}>
                                <SelectTrigger className="bg-neutral-950 border-neutral-800 h-9 rounded-md">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                    <SelectItem value="yes">Sí</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">¿Servicio Militar?</Label>
                            <Select value={contact.militaryService || 'no'} onValueChange={val => updateField('militaryService', val)}>
                                <SelectTrigger className="bg-neutral-950 border-neutral-800 h-9 rounded-md">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                    <SelectItem value="yes">Sí</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">¿Qué idiomas hablas?</Label>
                        <Input value={contact.languages || ''} onChange={e => updateField('languages', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                    </div>

                    <div className="h-px bg-neutral-800 my-2" />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Alergias</Label>
                            <Textarea value={contact.allergies || ''} onChange={e => updateField('allergies', e.target.value)} className="bg-neutral-950 border-neutral-800 rounded-md min-h-[60px]" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Condiciones Médicas</Label>
                            <Textarea value={contact.medicalConditions || ''} onChange={e => updateField('medicalConditions', e.target.value)} className="bg-neutral-950 border-neutral-800 rounded-md min-h-[60px]" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">Contactos de Emergencia (No familiares)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {emergencyContacts.map((emerg: any, index: number) => (
                        <div key={index} className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 relative">
                            <button onClick={() => removeEmergencyContact(index)} className="absolute top-2 right-2 text-neutral-500 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <h4 className="text-xs font-medium text-neutral-400 mb-3 uppercase">Contacto #{index + 1}</h4>
                            <div className="grid grid-cols-2 gap-4 mb-2">
                                <Input placeholder="Nombre Completo" value={emerg.name || ''} onChange={e => updateEmergencyContact(index, 'name', e.target.value)} className="bg-neutral-900 border-neutral-800 h-8" />
                                <Input placeholder="Relación/Amistad" value={emerg.relation || ''} onChange={e => updateEmergencyContact(index, 'relation', e.target.value)} className="bg-neutral-900 border-neutral-800 h-8" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-2">
                                <Input placeholder="Teléfono" value={emerg.phone || ''} onChange={e => updateEmergencyContact(index, 'phone', e.target.value)} className="bg-neutral-900 border-neutral-800 h-8" />
                                <Input placeholder="Email" value={emerg.email || ''} onChange={e => updateEmergencyContact(index, 'email', e.target.value)} className="bg-neutral-900 border-neutral-800 h-8" />
                            </div>
                            <Input placeholder="Dirección Completa" value={emerg.address || ''} onChange={e => updateEmergencyContact(index, 'address', e.target.value)} className="bg-neutral-900 border-neutral-800 h-8" />
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addEmergencyContact} className="w-full border-dashed border-neutral-700 hover:bg-neutral-800">
                        <Plus className="w-4 h-4 mr-2" /> Agregar Contacto de Emergencia
                    </Button>
                </CardContent>
            </Card>
        </fieldset>
    );
};

