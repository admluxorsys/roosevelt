import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Info, X } from 'lucide-react';

interface TabDynamicOtherProps {
    contact: any;
    updateField: (field: string, value: any) => void;
    isEditing?: boolean;
}

export const TabDynamicOther: React.FC<TabDynamicOtherProps> = ({ contact, updateField, isEditing = false }) => {
    const extraData = contact.extraData || {};
    const keys = Object.keys(extraData);

    if (keys.length === 0) return null;

    const handleExtraFieldChange = (key: string, newValue: any) => {
        const currentValue = extraData[key];
        let updatedValue;

        if (currentValue && typeof currentValue === 'object' && '__type' in currentValue) {
            updatedValue = { ...currentValue, value: newValue };
        } else {
            updatedValue = newValue;
        }

        const updatedExtra = { ...extraData, [key]: updatedValue };
        updateField('extraData', updatedExtra);
    };

    const isImageUrl = (url: string) => {
        if (typeof url !== 'string') return false;
        return url.startsWith('http') || url.startsWith('blob:');
    };

    const renderValue = (val: any, key: string) => {
        // Handle { __type, value } structure
        let actualValue = val;
        if (val && typeof val === 'object' && '__type' in val) {
            actualValue = val.value;
        }

        if (!actualValue || (Array.isArray(actualValue) && actualValue.length === 0)) return '---';

        // Handle array of values (like images)
        if (Array.isArray(actualValue)) {
            const hasImages = actualValue.some(v => isImageUrl(String(v)));
            if (hasImages) {
                return (
                    <div className="flex flex-wrap gap-2 mt-1">
                        {actualValue.map((url, i) => (
                            isImageUrl(String(url)) ? (
                                <div key={i} className="relative group/thumb shrink-0">
                                    <img
                                        src={String(url)}
                                        alt={`Preview ${i}`}
                                        className="h-10 w-14 object-cover rounded border border-white/10 hover:border-neutral-500/50 transition-all cursor-zoom-in"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(String(url), '_blank');
                                        }}
                                    />
                                    {isEditing && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const updated = actualValue.filter((_, index) => index !== i);
                                                handleExtraFieldChange(key, updated);
                                            }}
                                            className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity shadow-lg"
                                            title="Eliminar imagen"
                                        >
                                            <X size={10} strokeWidth={3} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <span key={i} className="text-xs bg-neutral-800 px-2 py-1 rounded text-neutral-400">{String(url)}</span>
                            )
                        ))}
                    </div>
                );
            }
            return actualValue.join(', ');
        }

        // Handle single image URL
        if (isImageUrl(String(actualValue))) {
            return (
                <div className="relative group/thumb shrink-0 w-fit">
                    <img
                        src={String(actualValue)}
                        className="h-10 w-14 object-cover rounded border border-white/10 hover:border-neutral-500/50 transition-all cursor-zoom-in mt-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(String(actualValue), '_blank');
                        }}
                    />
                    {isEditing && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleExtraFieldChange(key, '');
                            }}
                            className="absolute top-0 -right-1 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity shadow-lg"
                            title="Eliminar imagen"
                        >
                            <X size={10} strokeWidth={3} />
                        </button>
                    )}
                </div>
            );
        }

        return String(actualValue);
    };

    return (
        <fieldset disabled={!isEditing} className="space-y-6 block border-0 p-0 m-0 min-w-0">
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader className="flex flex-row items-center space-x-2">
                    <Info className="w-4 h-4 text-neutral-500" />
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">
                        Información Adicional (Importada)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {keys.map((key) => (
                            <div key={key} className="space-y-2 bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/50 hover:border-neutral-700/50 transition-colors">
                                <Label className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 block mb-1">
                                    {key}
                                </Label>
                                {isEditing ? (
                                    <Input
                                        value={(() => {
                                            const val = extraData[key]?.value ?? extraData[key];
                                            if (val === null || val === undefined) return '';
                                            if (typeof val === 'object') return JSON.stringify(val);
                                            return String(val);
                                        })()}
                                        onChange={(e) => handleExtraFieldChange(key, e.target.value)}
                                        className="bg-neutral-950 border-neutral-800 h-9 rounded-lg text-sm focus:ring-neutral-500/50"
                                    />
                                ) : (
                                    <div className="text-sm text-neutral-200 font-medium break-words">
                                        {renderValue(extraData[key], key)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </fieldset>
    );
};

