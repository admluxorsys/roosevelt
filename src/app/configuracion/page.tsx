'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Users, CreditCard, Cpu, Shield, 
    User, FlaskConical, Book, Zap,
    ArrowLeft
} from 'lucide-react';
import { FloatingOrbitNav } from '@/components/FloatingOrbitNav';
import { useRouter } from 'next/navigation';

const CONFIG_ITEMS = [
    { label: "People", icon: Users, href: "/configuracion/people" },
    { label: "Plans & credits", icon: CreditCard, href: "/configuracion/plans" },
    { label: "Cloud & AI balance", icon: Cpu, href: "/configuracion/balance" },
    { label: "Privacy & security", icon: Shield, href: "/configuracion/security" },
    { label: "Account", icon: User, href: "/perfil" },
    { label: "Labs", icon: FlaskConical, href: "/configuracion/labs" },
    { label: "Knowledge", icon: Book, href: "/configuracion/knowledge" },
    { label: "Connectors", icon: Zap, href: "/configuracion/connectors" },
];

export default function ConfigurationPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 overflow-hidden relative">
            
            {/* Órbita de Navegación en la Parte Superior */}
            <FloatingOrbitNav 
                items={CONFIG_ITEMS} 
                title="Account Settings" 
                colorClass="bg-blue-600"
            />

            {/* Contenido Central: Negro Total */}
            <main className="flex flex-col items-center justify-center min-h-screen relative z-10 px-6">
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="text-center"
                >
                    <h1 className="text-4xl md:text-6xl font-extralight tracking-[0.5em] uppercase text-white/90 mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        Account Settings
                    </h1>
                    <div className="w-16 h-[1px] bg-blue-500 mx-auto mb-16" />
                    
                    <p className="text-[10px] font-bold tracking-[0.8em] uppercase text-white/20 animate-pulse">
                        Sincronizando Nexus...
                    </p>
                </motion.div>

                {/* Grid de Accesos Rápidos (Opcional, pero ayuda a llenar el vacío) */}
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mt-24 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    {/* Aquí podrían ir tarjetas minimalistas si se desea, por ahora mantenemos el negro total solicitado */}
                </motion.div>

            </main>

            {/* Fondo Cinematográfico (Sutil) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* Footer Navigation */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
            >
                <button 
                    onClick={() => router.push('/nucleo')}
                    className="flex items-center gap-4 text-white/20 hover:text-white transition-all group p-4"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
                    <span className="text-[10px] font-bold tracking-[0.4em] uppercase">Gateway</span>
                </button>
            </motion.div>
        </div>
    );
}
