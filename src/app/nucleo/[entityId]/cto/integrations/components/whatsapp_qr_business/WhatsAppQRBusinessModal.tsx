'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, QrCode } from 'lucide-react';
import { Integration } from '../../config';
import { useAuth } from '@/contexts/AuthContext';
import QRCode from 'react-qr-code';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    activeIntegration: Integration | null;
}

export function WhatsAppQRBusinessModal({ isOpen, onClose, activeIntegration }: Props) {
    const { currentUser, activeEntity } = useAuth();
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'GENERATING' | 'READY' | 'CONNECTED'>('IDLE');

    useEffect(() => {
        if (!isOpen || !currentUser || !activeEntity) return;

        let intervalId: NodeJS.Timeout;

        const startSession = async () => {
            try {
                console.log('[QR Modal Business] Iniciando sesión REST...');
                await fetch('/api/internal/start-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUser.uid, entityId: activeEntity, type: 'business' })
                });

                intervalId = setInterval(async () => {
                    try {
                        const res = await fetch(`/api/internal/qr/${activeEntity}`);
                        const data = await res.json();
                        
                        if (data.status === 'CONNECTED') {
                            setStatus('CONNECTED');
                            clearInterval(intervalId);
                            setTimeout(() => {
                                onClose();
                            }, 2000);
                        } else if (data.qr) {
                            setQrCode(data.qr);
                            setStatus('READY');
                        }
                    } catch (e) {
                        console.error('[QR Modal Polling] Error leyendo QR', e);
                    }
                }, 2000);

            } catch (err) {
                console.error('[QR Modal Business] Error de conexión', err);
            }
        };

        startSession();

        return () => {
            if (intervalId) clearInterval(intervalId);
            setQrCode(null);
            setStatus('IDLE');
        };
    }, [isOpen, currentUser, activeEntity]);

    if (!activeIntegration || activeIntegration.id !== 'whatsapp_qr_business') return null;

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
                        className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[500px]"
                    >
                        {/* Left Side: General Info or Branding */}
                        <div className="w-full md:w-[40%] bg-neutral-900/50 p-8 flex flex-col border-r border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-full h-full bg-green-500 opacity-20 blur-[100px] pointer-events-none" />

                            <div className="relative z-10 h-full flex flex-col">
                                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl w-fit mb-6">
                                    {activeIntegration.icon}
                                </div>
                                <h2 className="text-2xl font-light mb-2">{activeIntegration.name}</h2>
                                <p className="text-sm text-neutral-400 font-light leading-relaxed mb-8 flex-grow">
                                    {activeIntegration.description}
                                </p>
                            </div>
                        </div>

                        {/* Right Side: Setup Flow */}
                        <div className="flex-1 p-8 overflow-y-auto no-scrollbar relative flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-2 text-neutral-500 text-[10px] tracking-widest font-black uppercase">
                                    <Lock className="w-3 h-3" />
                                    <span>Proceso de Autenticación</span>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-neutral-500" />
                                </button>
                            </div>

                            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8">
                                <div className="flex-1 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-white/10 text-white text-xs flex items-center justify-center font-bold font-mono shrink-0">1</div>
                                            <p className="text-sm text-neutral-300 pt-0.5">Abre <span className="text-white font-medium">WhatsApp Business</span> en tu teléfono.</p>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-white/10 text-white text-xs flex items-center justify-center font-bold font-mono shrink-0">2</div>
                                            <p className="text-sm text-neutral-300 pt-0.5">Toca el ícono de <span className="text-white font-medium">Menú</span> o <span className="text-white font-medium">Configuración</span> y selecciona <span className="text-white font-medium">Dispositivos vinculados</span>.</p>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-white/10 text-white text-xs flex items-center justify-center font-bold font-mono shrink-0">3</div>
                                            <p className="text-sm text-neutral-300 pt-0.5">Toca <span className="text-white font-medium">Vincular un dispositivo</span>.</p>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center font-bold font-mono shrink-0 border border-green-500/30">4</div>
                                            <p className="text-sm text-neutral-300 pt-0.5">Apunta con la cámara de tu teléfono a esta pantalla para <span className="text-green-400 font-medium tracking-wide">escanear el código QR</span>.</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="w-[200px] h-[200px] bg-white rounded-2xl p-2 shrink-0 relative flex items-center justify-center group overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                                    {qrCode && status !== 'CONNECTED' ? (
                                        <div className="w-full h-full bg-white rounded-xl flex items-center justify-center p-2">
                                            <QRCode value={qrCode} size={160} level="L" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="absolute inset-0 border-4 border-green-500/50 rounded-2xl m-2 opacity-0 group-hover:opacity-100 transition-opacity blur-[1px]" />
                                            <QrCode className="w-32 h-32 text-neutral-200" strokeWidth={1} />
                                            {status !== 'CONNECTED' && (
                                                <motion.div 
                                                    animate={{ top: ['0%', '100%', '0%'] }}
                                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                    className="absolute left-0 w-full h-0.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] z-10"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/5 flex items-center justify-center backdrop-blur-[1px]">
                                                <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white border text-center ${status === 'CONNECTED' ? 'bg-green-500/80 border-green-500/50' : 'bg-black/80 border-white/10'}`}>
                                                    {status === 'CONNECTED' ? '✅ CONECTADO' : 'Generando QR...'}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
