import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Search, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_COUNTRY_CODES, CountryCode } from '@/lib/countryCodes';

interface TabStudentInfoProps {
    contact: any;
    updateField: (field: string, value: any) => void;
    isEditing?: boolean;
}

export const TabStudentInfo: React.FC<TabStudentInfoProps> = ({ contact, updateField, isEditing = false }) => {
    const [isPhoneOpen, setIsPhoneOpen] = useState(false);
    const [phoneSearchTerm, setPhoneSearchTerm] = useState('');
    const phoneDropdownRef = useRef<HTMLDivElement>(null);

    // Extract country code and phone number
    const getCountryCodeAndNumber = (fullPhone: string) => {
        if (!fullPhone) return { code: '', number: '' };
        // Sort by length typical for some systems, but here we just find the longest matching prefix
        const matchedCountry = [...ALL_COUNTRY_CODES]
            .sort((a, b) => b.code.length - a.code.length)
            .find(c => fullPhone.startsWith(c.code));

        if (matchedCountry) {
            return {
                code: matchedCountry.code,
                number: fullPhone.substring(matchedCountry.code.length)
            };
        }
        return { code: '', number: fullPhone };
    };

    const { code: currentCode, number: currentNumber } = getCountryCodeAndNumber(contact.phone || '');
    const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode | undefined>(
        ALL_COUNTRY_CODES.find(c => c.code === currentCode) || ALL_COUNTRY_CODES.find(c => c.iso === 'US')
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(event.target as Node)) {
                setIsPhoneOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync selectedCountryCode when contact changes
    useEffect(() => {
        const { code } = getCountryCodeAndNumber(contact.phone || '');
        if (code) {
            const matchedCountry = ALL_COUNTRY_CODES.find(c => c.code === code);
            if (matchedCountry) setSelectedCountryCode(matchedCountry);
        }
    }, [contact.phone]);

    const handlePhoneChange = (value: string) => {
        const cleanNumber = value.replace(/[^\d]/g, '');
        const prefix = selectedCountryCode ? selectedCountryCode.code : '';
        const fullPhone = prefix ? `${prefix}${cleanNumber}` : cleanNumber;
        updateField('phone', fullPhone);
    };

    const handleCountryCodeChange = (country: CountryCode) => {
        setSelectedCountryCode(country);
        const { number } = getCountryCodeAndNumber(contact.phone || '');
        const fullPhone = `${country.code}${number}`;
        updateField('phone', fullPhone);
        setIsPhoneOpen(false);
        setPhoneSearchTerm('');
    };

    const filteredCountries = ALL_COUNTRY_CODES.filter(c =>
        c.country.toLowerCase().includes(phoneSearchTerm.toLowerCase()) ||
        c.code.includes(phoneSearchTerm)
    );
    return (
        <fieldset disabled={!isEditing} className="space-y-6 block border-0 p-0 m-0 min-w-0">
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Nombres</Label>
                            <Input value={contact.firstName || ''} onChange={e => updateField('firstName', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Apellidos</Label>
                            <Input value={contact.lastName || ''} onChange={e => updateField('lastName', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                    </div>
                    {/* Fallback for legacy 'name' field if firstName/lastName not set */}
                    {!contact.firstName && !contact.lastName && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Nombre Completo (Legacy)</Label>
                            <Input value={contact.name || ''} onChange={e => updateField('name', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Fecha de Nacimiento</Label>
                            <Input type="date" value={contact.birthDate || ''} onChange={e => updateField('birthDate', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Lugar de Nacimiento</Label>
                            <Input value={contact.birthPlace || ''} onChange={e => updateField('birthPlace', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Nacionalidad</Label>
                            <Input value={contact.nationality || ''} onChange={e => updateField('nationality', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Ciudad (Nacimiento)</Label>
                            <Input value={contact.birthCity || ''} onChange={e => updateField('birthCity', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Estado/Provincia</Label>
                            <Input value={contact.birthState || ''} onChange={e => updateField('birthState', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">País</Label>
                            <Input value={contact.birthCountry || ''} onChange={e => updateField('birthCountry', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Número de Identificación Nacional (DNI/CURP)</Label>
                        <Input value={contact.nationalId || ''} onChange={e => updateField('nationalId', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Teléfono Personal</Label>
                            <div className="flex gap-2 relative" ref={phoneDropdownRef}>
                                {/* Custom Dropdown Trigger */}
                                <div className="relative w-[120px] shrink-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsPhoneOpen(!isPhoneOpen)}
                                        className="w-full justify-between bg-neutral-950 border-neutral-800 h-9 text-xs"
                                    >
                                        {selectedCountryCode ? (
                                            <span className="flex items-center gap-1.5 overflow-hidden">
                                                <span className="text-base shrink-0">{selectedCountryCode.flag}</span>
                                                <span className="font-mono truncate">{selectedCountryCode.code}</span>
                                            </span>
                                        ) : (
                                            <span className="text-neutral-500">País...</span>
                                        )}
                                        <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                                    </Button>

                                    {/* Custom Dropdown Menu */}
                                    {isPhoneOpen && (
                                        <div className="absolute left-0 bottom-full mb-1 w-[260px] bg-neutral-950 border border-neutral-800 rounded-md shadow-2xl z-[9999] overflow-hidden">
                                            <div className="flex items-center border-b border-neutral-800 px-3 py-2">
                                                <Search className="h-3.5 w-3.5 text-neutral-500 mr-2" />
                                                <input
                                                    autoFocus
                                                    className="w-full bg-transparent text-xs outline-none text-white"
                                                    placeholder="Buscar país..."
                                                    value={phoneSearchTerm}
                                                    onChange={(e) => setPhoneSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <div className="max-h-[200px] overflow-y-auto py-1 custom-scrollbar">
                                                {filteredCountries.length > 0 ? (
                                                    filteredCountries.map((country) => (
                                                        <button
                                                            key={`${country.iso}-${country.code}`}
                                                            type="button"
                                                            onClick={() => handleCountryCodeChange(country)}
                                                            className="w-full flex items-center px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors text-left group"
                                                        >
                                                            <div className="flex items-center flex-1">
                                                                <Check className={cn(
                                                                    "mr-2 h-3 w-3",
                                                                    selectedCountryCode?.iso === country.iso && selectedCountryCode?.code === country.code ? "opacity-100" : "opacity-0"
                                                                )} />
                                                                <span className="text-base mr-2 shrink-0">{country.flag}</span>
                                                                <span className="flex-1 truncate">{country.country}</span>
                                                            </div>
                                                            <span className="font-mono text-neutral-500 ml-2">{country.code}</span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-4 text-xs text-neutral-500 text-center">No se encontró el país.</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Input
                                    value={currentNumber}
                                    onChange={e => handlePhoneChange(e.target.value)}
                                    className="flex-1 bg-neutral-950 border-neutral-800 h-9 rounded-md font-mono"
                                    placeholder="Número de teléfono"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Email Personal</Label>
                            <Input
                                value={contact.email || ''}
                                onChange={e => updateField('email', e.target.value)}
                                className="bg-neutral-950 border-neutral-800 h-9 rounded-md"
                                placeholder="ejemplo@correo.com"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">¿Otra Nacionalidad?</Label>
                            <Select value={contact.hasOtherNationality || 'no'} onValueChange={val => updateField('hasOtherNationality', val)}>
                                <SelectTrigger className="bg-neutral-950 border-neutral-800 h-9 rounded-md">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                    <SelectItem value="yes">Sí</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {contact.hasOtherNationality === 'yes' && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">¿Qué país?</Label>
                                <Input value={contact.otherNationalityCountry || ''} onChange={e => updateField('otherNationalityCountry', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">¿Residente Permanente de otro país?</Label>
                            <Select value={contact.isPermanentResidentOther || 'no'} onValueChange={val => updateField('isPermanentResidentOther', val)}>
                                <SelectTrigger className="bg-neutral-950 border-neutral-800 h-9 rounded-md">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                    <SelectItem value="yes">Sí</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {contact.isPermanentResidentOther === 'yes' && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">¿Qué país?</Label>
                                <Input value={contact.permanentResidentCountry || ''} onChange={e => updateField('permanentResidentCountry', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">Estado Civil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Estado Civil</Label>
                        <Select value={contact.maritalStatus || 'single'} onValueChange={val => updateField('maritalStatus', val)}>
                            <SelectTrigger className="bg-neutral-950 border-neutral-800 h-9 rounded-md">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                <SelectItem value="single">Soltero(a)</SelectItem>
                                <SelectItem value="married">Casado(a)</SelectItem>
                                <SelectItem value="divorced">Divorciado(a)</SelectItem>
                                <SelectItem value="widowed">Viudo(a)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {contact.maritalStatus === 'married' && (
                        <div className="space-y-4 pl-4 border-l-2 border-blue-600">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Nombre del Cónyuge</Label>
                                <Input value={contact.spouseName || ''} onChange={e => updateField('spouseName', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Fecha de Matrimonio</Label>
                                    <Input type="date" value={contact.marriageDate || ''} onChange={e => updateField('marriageDate', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Fecha Nac. Cónyuge</Label>
                                    <Input type="date" value={contact.spouseBirthDate || ''} onChange={e => updateField('spouseBirthDate', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Ciudad (Cónyuge)</Label>
                                    <Input value={contact.spouseCity || ''} onChange={e => updateField('spouseCity', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Estado (Cónyuge)</Label>
                                    <Input value={contact.spouseState || ''} onChange={e => updateField('spouseState', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">País (Cónyuge)</Label>
                                    <Input value={contact.spouseCountry || ''} onChange={e => updateField('spouseCountry', e.target.value)} className="bg-neutral-950 border-neutral-800 h-9 rounded-md" />
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </fieldset>
    );
};

