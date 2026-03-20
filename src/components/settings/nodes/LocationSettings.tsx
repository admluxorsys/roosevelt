// src/components/settings/nodes/LocationSettings.tsx
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Node } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, ExternalLink, AlertTriangle } from 'lucide-react';
import { SettingsSection, Field } from '../SharedComponents';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Carga dinámica del mapa para evitar errores de SSR
const MapPicker = dynamic(() => import('./MapPicker'), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full bg-neutral-900 animate-pulse rounded flex items-center justify-center text-neutral-500">Cargando Mapa...</div>
});

interface NodeSettingsProps {
    node: Node;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

export const LocationSettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    const [config, setConfig] = useState({
        latitude: node.data.latitude || '',
        longitude: node.data.longitude || '',
        name: node.data.name || '',
        address: node.data.address || '',
    });

    const [errors, setErrors] = useState({ lat: '', lng: '' });

    // Validar Coordenadas (o permitir variables)
    const validateCoord = (val: string, type: 'lat' | 'lng') => {
        if (!val) return '';
        if (val.includes('{{')) return ''; // Es variable, válido
        
        const num = parseFloat(val);
        if (isNaN(num)) return 'Debe ser un número o {{variable}}';
        
        if (type === 'lat' && (num < -90 || num > 90)) return 'Latitud inválida (-90 a 90)';
        if (type === 'lng' && (num < -180 || num > 180)) return 'Longitud inválida (-180 a 180)';
        
        return '';
    };

    useEffect(() => {
        setErrors({
            lat: validateCoord(config.latitude, 'lat'),
            lng: validateCoord(config.longitude, 'lng')
        });
    }, [config.latitude, config.longitude]);

    const update = (updates: any) => {
        const newConfig = { ...config, ...updates };
        setConfig(newConfig);
        updateNodeConfig(node.id, newConfig);
    };

    const handleMapClick = (lat: number, lng: number) => {
        update({ 
            latitude: lat.toFixed(6), 
            longitude: lng.toFixed(6) 
        });
    };

    // Link de Respaldo
    const gmapsLink = useMemo(() => {
        const lat = config.latitude;
        const lng = config.longitude;
        if (!lat || !lng || lat.includes('{{') || lng.includes('{{')) return 'https://maps.google.com';
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }, [config.latitude, config.longitude]);

    return (
        <div className="space-y-6">
            
            {/* 1. METADATOS DE TARJETA */}
            <SettingsSection title="1. Tarjeta de Ubicación">
                <div className="space-y-3">
                    <Field label="Nombre del Lugar" htmlFor="loc-name" description="Aparece en negrita en el mensaje.">
                        <Input 
                            id="loc-name"
                            value={config.name} 
                            onChange={(e) => update({ name: e.target.value })} 
                            placeholder="Ej: Sede Central - Torre A"
                            className="bg-neutral-950 font-medium"
                        />
                    </Field>
                    <Field label="Dirección Física" htmlFor="loc-address" description="Subtítulo de la tarjeta.">
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 text-neutral-500 h-4 w-4" />
                            <Input 
                                id="loc-address"
                                value={config.address} 
                                onChange={(e) => update({ address: e.target.value })} 
                                placeholder="Ej: Av. Principal 123, Ciudad"
                                className="pl-9 bg-neutral-950"
                            />
                        </div>
                    </Field>
                </div>
            </SettingsSection>

            {/* 2. COORDENADAS Y MAPA */}
            <SettingsSection title="2. Coordenadas Geográficas">
                
                {/* Mapa Interactivo */}
                <div className="mb-4 rounded-lg overflow-hidden border border-neutral-700 h-[200px] relative">
                    <MapPicker 
                        lat={parseFloat(config.latitude) || 0} // Default 0 si es variable
                        lng={parseFloat(config.longitude) || 0}
                        onLocationSelect={handleMapClick}
                    />
                    {/* Overlay si hay variables */}
                    {(config.latitude.includes('{{') || config.longitude.includes('{{')) && (
                        <div className="absolute inset-0 bg-neutral-950/80 flex items-center justify-center p-4 text-center z-[1000]">
                            <p className="text-sm text-yellow-400 font-mono">
                                Mapa desactivado: Usando variables dinámicas
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs text-neutral-400">Latitud</Label>
                        <Input 
                            value={config.latitude}
                            onChange={(e) => update({ latitude: e.target.value })}
                            placeholder="-12.046..."
                            className={cn("font-mono text-xs h-9", errors.lat && "border-red-500 text-red-400")}
                        />
                        {errors.lat && <p className="text-[10px] text-red-500">{errors.lat}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-neutral-400">Longitud</Label>
                        <Input 
                            value={config.longitude}
                            onChange={(e) => update({ longitude: e.target.value })}
                            placeholder="-77.042..."
                            className={cn("font-mono text-xs h-9", errors.lng && "border-red-500 text-red-400")}
                        />
                        {errors.lng && <p className="text-[10px] text-red-500">{errors.lng}</p>}
                    </div>
                </div>

                <div className="mt-3 p-2 bg-blue-950/20 border border-blue-900/50 rounded flex items-start gap-2">
                    <Navigation size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] text-blue-300 font-semibold mb-1">Link de Respaldo Generado:</p>
                        <a href={gmapsLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 underline truncate block hover:text-blue-200 flex items-center gap-1">
                            {gmapsLink} <ExternalLink size={10}/>
                        </a>
                        <p className="text-[10px] text-neutral-500 mt-1">
                            Usa <code>{'{{location_url}}'}</code> para enviar este link.
                        </p>
                    </div>
                </div>
            </SettingsSection>
        </div>
    );
};
