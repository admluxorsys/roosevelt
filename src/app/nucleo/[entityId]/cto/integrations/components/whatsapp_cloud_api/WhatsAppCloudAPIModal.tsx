import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, ShieldCheck, Copy, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Integration } from '../../config';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    activeIntegration: Integration | null;
}

export function WhatsAppCloudAPIModal({ isOpen, onClose, activeIntegration }: Props) {
    const { currentUser, activeEntity } = useAuth();
    const [mode, setMode] = useState<'auto' | 'manual'>('auto');
    const [waConfig, setWaConfig] = useState({
        phoneNumberId: '',
        wabaId: '',
        accessToken: '',
        verifyToken: Math.random().toString(36).substring(7),
    });

    if (!activeIntegration || activeIntegration.id !== 'whatsapp') return null;

    const saveWhatsAppConfig = async () => {
        if (!currentUser || !activeEntity) return;
        toast.loading("Guardando configuración...");
        
        try {
            const configRef = doc(db, `users/${currentUser.uid}/entities/${activeEntity}/integrations/whatsapp`);
            await setDoc(configRef, {
                ...waConfig,
                status: 'Connected',
                provider: 'whatsapp',
                updatedAt: new Date(),
            }, { merge: true });

            // Global Mapping for Webhook Routing
            if (waConfig.phoneNumberId) {
                const mappingRef = doc(db, `system_mappings/whatsapp_numbers/numbers/${waConfig.phoneNumberId}`);
                await setDoc(mappingRef, {
                    userId: currentUser.uid,
                    entityId: activeEntity,
                    updatedAt: new Date()
                }, { merge: true });
            }

            toast.dismiss();
            toast.success("WhatsApp conectado correctamente.");
            onClose();
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error("Error al guardar la configuración.");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]"
                    >
                        {/* Left Side: Branding */}
                        <div className="w-full md:w-[40%] bg-neutral-900/50 p-8 flex flex-col border-r border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-full h-full bg-blue-500 opacity-20 blur-[100px] pointer-events-none" />

                            <div className="relative z-10 h-full flex flex-col">
                                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl w-fit mb-6">
                                    {activeIntegration.icon}
                                </div>
                                <h2 className="text-2xl font-light mb-2">{activeIntegration.name}</h2>
                                <p className="text-sm text-neutral-400 font-light leading-relaxed mb-8 flex-grow">
                                    {activeIntegration.description}
                                </p>
                                
                                {mode === 'manual' && (
                                    <div className="mt-auto mb-4">
                                        <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                                            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <AlertCircle className="w-3 h-3" />
                                                Webhook Endpoint
                                            </p>
                                            <div className="flex items-center justify-between gap-2 overflow-hidden">
                                                <code className="text-[9px] text-white/60 truncate italic">https://www.byroosevelt.com/api/whatsapp/webhook</code>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText("https://www.byroosevelt.com/api/whatsapp/webhook");
                                                        toast.success("Endpoint copiado");
                                                    }}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className={mode === 'auto' ? "mt-auto" : ""}>
                                    <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                            <ShieldCheck className="w-3 h-3" />
                                            Conexión Segura
                                        </p>
                                        <p className="text-xs text-neutral-400 leading-snug">
                                            {mode === 'auto' 
                                                ? "Estás usando el flujo oficial de Meta. Tus llaves privadas se generarán y enlazarán automáticamente al finalizar." 
                                                : "Introduce las llaves de acceso obtenidas manualmente de Meta for Developers para inyectarlas directamente en el núcleo."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Flow */}
                        <div className="flex-1 p-8 overflow-y-auto no-scrollbar relative flex flex-col">
                            {/* Tabs & Close Header */}
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex bg-neutral-900/50 p-1 rounded-full border border-white/5">
                                    <button 
                                        onClick={() => setMode('auto')} 
                                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'auto' ? 'bg-[#1877F2] text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                                    >
                                        Automático
                                    </button>
                                    <button 
                                        onClick={() => setMode('manual')} 
                                        className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'manual' ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                                    >
                                        Manual
                                    </button>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-neutral-500" />
                                </button>
                            </div>

                            {/* Mode: Auto (Embedded Signup) */}
                            {mode === 'auto' && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                    className="flex-1 flex flex-col items-center justify-center text-center"
                                >
                                    <div className="w-20 h-20 bg-[#1877F2]/10 border border-[#1877F2]/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(24,119,242,0.15)]">
                                        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#1877F2]" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                    </div>
                                    <h3 className="text-xl font-medium text-white mb-2">Continuar con Facebook</h3>
                                    <p className="text-neutral-500 text-sm max-w-sm mb-8">
                                        Si ya configuraste una aplicación de desarrollador en Meta para Roosevelt, utiliza este método para vincular tu negocio de manera instantánea.
                                    </p>
                                    
                                    <button 
                                        onClick={() => {
                                            toast.success("Abriendo Meta for Developers...");
                                            window.open("https://developers.facebook.com/apps", "_blank", "noopener,noreferrer");
                                        }}
                                        className="w-full max-w-xs h-12 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold tracking-wide text-sm rounded-xl transition-all shadow-[0_4px_14px_0_rgba(24,119,242,0.39)] hover:shadow-[0_6px_20px_rgba(24,119,242,0.23)] flex items-center justify-center gap-2"
                                    >
                                        Conectar ahora
                                    </button>
                                    <p className="text-[10px] text-neutral-600 mt-4 uppercase tracking-widest font-black">
                                        Requiere SDK de Meta
                                    </p>
                                </motion.div>
                            )}

                            {/* Mode: Manual */}
                            {mode === 'manual' && (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                    className="flex-1 space-y-6"
                                >
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/50 tracking-widest uppercase">Phone Number ID</label>
                                        <input 
                                            placeholder="Ej: 10455829948271"
                                            value={waConfig.phoneNumberId}
                                            onChange={e => setWaConfig(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                                        />
                                        <p className="text-[10px] text-neutral-600">ID del número de teléfono en Meta Developer Portal.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/50 tracking-widest uppercase">WABA ID</label>
                                        <input 
                                            placeholder="Ej: 1022938847582"
                                            value={waConfig.wabaId}
                                            onChange={e => setWaConfig(prev => ({ ...prev, wabaId: e.target.value }))}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/50 tracking-widest uppercase">Verify Token <span className="text-neutral-500 font-normal lowercase">(Autogenerado)</span></label>
                                        <div className="flex gap-2">
                                            <input 
                                                readOnly
                                                value={waConfig.verifyToken}
                                                className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-neutral-500 font-mono"
                                            />
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(waConfig.verifyToken);
                                                    toast.success("Token copiado");
                                                }}
                                                className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 rounded-xl transition-all"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-neutral-600">Pega este token en tu configuración del Webhook en Meta.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/50 tracking-widest uppercase">Access Token (Permanent)</label>
                                        <textarea 
                                            placeholder="EAA..."
                                            rows={2}
                                            value={waConfig.accessToken}
                                            onChange={e => setWaConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                                        />
                                    </div>

                                    <div className="pt-4 pb-4">
                                        <button 
                                            onClick={saveWhatsAppConfig}
                                            disabled={!waConfig.accessToken || !waConfig.phoneNumberId}
                                            className="w-full h-12 bg-white hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl transition-all shadow-xl"
                                        >
                                            Inyectar Configuración
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
