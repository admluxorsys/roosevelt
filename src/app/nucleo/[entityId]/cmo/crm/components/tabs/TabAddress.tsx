import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_COUNTRY_CODES, CountryCode } from '@/lib/countryCodes';

interface TabAddressProps {
    contact: any;
    updateField: (field: string, value: any) => void;
    isEditing?: boolean;
}

export const TabAddress: React.FC<TabAddressProps> = ({ contact, updateField, isEditing = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Extract country code and phone number
    const getCountryCodeAndNumber = (fullPhone: string) => {
        if (!fullPhone) return { code: '', number: '' };
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
        ALL_COUNTRY_CODES.find(c => c.code === currentCode)
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
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
        } else if (!contact.phone) {
            setSelectedCountryCode(undefined);
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
        setIsOpen(false);
        setSearchTerm('');
    };

    const filteredCountries = ALL_COUNTRY_CODES.filter(c =>
        c.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.includes(searchTerm)
    );

    return (
        <div className="space-y-6 block border-0 p-0 m-0 min-w-0">
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">Dirección de Domicilio Actual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Dirección Completa</Label>
                        <Input
                            disabled={!isEditing}
                            value={contact.address || ''}
                            onChange={e => updateField('address', e.target.value)}
                            className="bg-neutral-950 border-neutral-800 h-9 rounded-md disabled:opacity-50"
                            placeholder="Calle, Número, Depto..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Ciudad</Label>
                            <Input
                                disabled={!isEditing}
                                value={contact.city || ''}
                                onChange={e => updateField('city', e.target.value)}
                                className="bg-neutral-950 border-neutral-800 h-9 rounded-md disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Estado/Provincia</Label>
                            <Input
                                disabled={!isEditing}
                                value={contact.state || ''}
                                onChange={e => updateField('state', e.target.value)}
                                className="bg-neutral-950 border-neutral-800 h-9 rounded-md disabled:opacity-50"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">País</Label>
                            <Input
                                disabled={!isEditing}
                                value={contact.country || ''}
                                onChange={e => updateField('country', e.target.value)}
                                className="bg-neutral-950 border-neutral-800 h-9 rounded-md disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Código Postal</Label>
                            <Input
                                disabled={!isEditing}
                                value={contact.postalCode || ''}
                                onChange={e => updateField('postalCode', e.target.value)}
                                className="bg-neutral-950 border-neutral-800 h-9 rounded-md disabled:opacity-50"
                            />
                        </div>
                    </div>

                    {/* Phone Number Field with Custom Dropdown */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Teléfono Personal</Label>
                            <div className="flex gap-2 relative" ref={dropdownRef}>
                                {/* Custom Dropdown Trigger */}
                                <div className="relative w-[140px]">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={!isEditing}
                                        onClick={() => setIsOpen(!isOpen)}
                                        className="w-full justify-between bg-neutral-950 border-neutral-800 h-9 text-xs disabled:opacity-50"
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

                                    {/* Custom Dropdown Menu (Non-portaled) */}
                                    {isOpen && (
                                        <div className="absolute top-full left-0 mt-1 w-[260px] bg-neutral-950 border border-neutral-800 rounded-md shadow-2xl z-[9999] overflow-hidden">
                                            <div className="flex items-center border-b border-neutral-800 px-3 py-2">
                                                <Search className="h-3.5 w-3.5 text-neutral-500 mr-2" />
                                                <input
                                                    autoFocus
                                                    className="w-full bg-transparent text-xs outline-none text-white"
                                                    placeholder="Buscar país..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <div className="max-h-[250px] overflow-y-auto py-1 custom-scrollbar">
                                                {filteredCountries.length > 0 ? (
                                                    filteredCountries.map((country) => (
                                                        <button
                                                            key={country.iso}
                                                            type="button"
                                                            onClick={() => handleCountryCodeChange(country)}
                                                            className="w-full flex items-center px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors text-left group"
                                                        >
                                                            <div className="flex items-center flex-1">
                                                                <Check className={cn(
                                                                    "mr-2 h-3 w-3",
                                                                    selectedCountryCode?.iso === country.iso ? "opacity-100" : "opacity-0"
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
                                    disabled={!isEditing}
                                    value={currentNumber}
                                    onChange={e => handlePhoneChange(e.target.value)}
                                    className="flex-1 bg-neutral-950 border-neutral-800 h-9 rounded-md font-mono disabled:opacity-50"
                                    placeholder="963142795"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Email Personal</Label>
                            <Input
                                disabled={!isEditing}
                                value={contact.email || ''}
                                onChange={e => updateField('email', e.target.value)}
                                className="bg-neutral-950 border-neutral-800 h-9 rounded-md disabled:opacity-50"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">Información Previa en EE.UU.</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Dirección de Hospedaje en EE.UU.</Label>
                        <Input
                            disabled={!isEditing}
                            value={contact.usAddress || ''}
                            onChange={e => updateField('usAddress', e.target.value)}
                            className="bg-neutral-950 border-neutral-800 h-9 rounded-md disabled:opacity-50"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

