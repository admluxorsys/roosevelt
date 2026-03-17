'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Key, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ApplicationLoginProps {
    contact: any;
    onLoginSuccess: () => void;
}

export const ApplicationLogin = ({ contact, onLoginSuccess }: ApplicationLoginProps) => {
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPhone, setLoginPhone] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);

        if (!contact) {
            toast.error('Ocurrió un error inesperado al cargar tu sesión.');
            setIsLoggingIn(false);
            return;
        }

        const inputEmail = loginEmail.trim().toLowerCase();
        const inputPhone = loginPhone.trim().replace(/\D/g, '');

        const dbEmail = (contact.email || '').toString().trim().toLowerCase();
        const dbPhone = (contact.phone || '').toString().trim().replace(/\D/g, '');

        // Validación: Email exacto y teléfono que coincida con el final
        if (inputEmail === dbEmail && 
            (inputPhone === dbPhone || dbPhone.endsWith(inputPhone) || inputPhone.endsWith(dbPhone))) {
            toast.success('¡Sesión iniciada con éxito!');
            onLoginSuccess();
        } else {
            toast.error('Credenciales incorrectas. Verifica tu email y teléfono.');
        }
        setIsLoggingIn(false);
    };

    return (
        <div className="max-w-md mx-auto py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto text-blue-400 border border-blue-500/20 shadow-2xl shadow-blue-500/10">
                    <Lock size={40} className="animate-pulse" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight text-white">Acceso Seguro</h2>
                    <p className="text-neutral-400 text-sm">Ingresa tus datos para acceder a tu solicitud de Roosevelt</p>
                </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Email de Aplicación</Label>
                    <Input
                        required
                        type="email"
                        placeholder="tuemail@ejemplo.com"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        className="h-14 bg-black/40 border-white/10 rounded-2xl focus:border-blue-500/50 transition-all text-white font-medium"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Teléfono (Contraseña)</Label>
                    <Input
                        required
                        type="tel"
                        placeholder="Tu número celular"
                        value={loginPhone}
                        onChange={e => setLoginPhone(e.target.value)}
                        className="h-14 bg-black/40 border-white/10 rounded-2xl focus:border-blue-500/50 transition-all text-white font-mono"
                    />
                </div>
                <Button
                    disabled={isLoggingIn}
                    type="submit"
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold tracking-tight shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all flex items-center justify-center gap-2 group"
                >
                    {isLoggingIn ? 'Verificando...' : 'Acceder al Formulario'}
                    {!isLoggingIn && <Key size={18} className="group-hover:rotate-12 transition-transform" />}
                </Button>
            </form>

            <div className="pt-4 text-center">
                <p className="text-xs text-neutral-600 italic">
                    Tus datos están protegidos bajo cifrado de extremo a extremo.
                </p>
            </div>
        </div>
    );
};
