// src/components/settings/nodes/MapPicker.tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para íconos de Leaflet
const iconDefault = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface MapPickerProps {
    lat: number;
    lng: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

const MapPicker = ({ lat, lng, onLocationSelect }: MapPickerProps) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    // Inicialización del Mapa
    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Si ya existe una instancia, no hacemos nada (o podríamos destruirla)
        if (mapInstanceRef.current) return;

        // Coordenadas iniciales (CDMX por defecto)
        const initialLat = (lat !== 0 || lng !== 0) ? lat : 19.4326;
        const initialLng = (lat !== 0 || lng !== 0) ? lng : -99.1332;

        // 1. Crear el mapa
        const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);
        mapInstanceRef.current = map;

        // 2. Añadir capa de tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // 3. Añadir marcador inicial si hay coordenadas
        if (lat !== 0 || lng !== 0) {
            markerRef.current = L.marker([lat, lng], { icon: iconDefault }).addTo(map);
        }

        // 4. Evento Click
        map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            
            // Actualizar o crear marcador
            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
            } else {
                markerRef.current = L.marker([lat, lng], { icon: iconDefault }).addTo(map);
            }

            // Mover mapa y notificar al padre
            map.flyTo([lat, lng], map.getZoom());
            onLocationSelect(lat, lng);
        });

        // CLEANUP: Destruir el mapa al desmontar
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
        };
    }, []); // Array vacío = Solo al montar/desmontar

    // Efecto para actualizar el mapa si las props cambian externamente (ej: input manual)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (lat !== 0 || lng !== 0) {
            // Si el marcador no está en la posición nueva, moverlo
            const currentLatLng = markerRef.current?.getLatLng();
            if (!currentLatLng || currentLatLng.lat !== lat || currentLatLng.lng !== lng) {
                
                if (markerRef.current) {
                    markerRef.current.setLatLng([lat, lng]);
                } else {
                    markerRef.current = L.marker([lat, lng], { icon: iconDefault }).addTo(map);
                }
                
                map.flyTo([lat, lng], 13);
            }
        }
    }, [lat, lng]);

    return <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />;
};

export default MapPicker;

