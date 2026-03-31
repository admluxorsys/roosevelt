import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, ChevronLeft, Settings, Copy, ShieldCheck, QrCode, Lock, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { Integration } from '../../config';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, onSnapshot, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    activeIntegration: Integration | null;
}

export function WhatsAppCloudAPIModal({ isOpen, onClose, activeIntegration }: Props) {
    const { currentUser, activeEntity } = useAuth();
    const [step, setStep] = useState<number>(1);
    const [isEditing, setIsEditing] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [updatedAt, setUpdatedAt] = useState<any>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [tempConfig, setTempConfig] = useState<any>(null);

    // Meta Wizard States
    const [connectionMode, setConnectionMode] = useState<'meta' | 'manual'>('meta');
    const [accountAction, setAccountAction] = useState<'new' | 'existing'>('new');
    const [phoneStatus, setPhoneStatus] = useState<'new' | 'personal' | 'none' | null>(null);
    const [showGuide, setShowGuide] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const [devMode, setDevMode] = useState(false);


    const [waConfig, setWaConfig] = useState({
        phoneNumberId: '',
        wabaId: '',
        accessToken: '',
        displayPhoneNumber: '',
        verifyToken: Math.random().toString(36).substring(7),
        appId: process.env.NEXT_PUBLIC_META_APP_ID || '',
    });

    // Validations
    const validateField = (name: string, value: string) => {
        let error = '';
        const bareValue = value.replace(/\s/g, ''); 

        switch (name) {
            case 'phoneNumberId':
            case 'wabaId':
                if (value.includes(' ')) error = 'No se permiten espacios';
                break;
            case 'displayPhoneNumber':
                if (!value.startsWith('+') && value.length > 0) error = 'Debe empezar con +';
                else if (value.replace(/\D/g, '').length < 10 && value.length > 0) error = 'Mínimo 10 dígitos';
                break;
            case 'accessToken':
                if (value.length > 0 && !value.startsWith('EAA')) error = 'Debe empezar con EAA';
                else if (value.length > 0 && value.includes(' ')) error = 'No se permiten espacios';
                break;
        }
        setFormErrors(prev => ({ ...prev, [name]: error }));
        return error === '';
    };

    // Firestore Sync
    useEffect(() => {
        if (!isOpen || !currentUser || !activeEntity) return;
        setInitialLoading(true);

        const configRef = doc(db, `users/${currentUser.uid}/entities/${activeEntity}/integrations/whatsapp`);
        const internalConfigRef = doc(db, `users/${currentUser.uid}/entities/${activeEntity}/integrations/whatsapp_internal`);
        
        let unsubInternal: any = null;

        const unsub = onSnapshot(configRef, (snap) => {
            if (snap.exists()) {
                if (unsubInternal) { unsubInternal(); unsubInternal = null; }
                const data = snap.data();
                if ((data.status === 'Connected' || data.status === 'Internal') && data.phoneNumberId) {
                    setStep(4);
                    setUpdatedAt(data.updatedAt);
                    setWaConfig(prev => ({ ...prev, ...data, displayPhoneNumber: data.displayPhoneNumber || '' }));
                }
                setTimeout(() => setInitialLoading(false), 500);
            } else {
                // Fallback to internal if standard doesn't exist
                if (!unsubInternal) {
                    unsubInternal = onSnapshot(internalConfigRef, (internalSnap) => {
                        if (internalSnap.exists()) {
                            const data = internalSnap.data();
                            if ((data.status === 'Connected' || data.status === 'Internal') && data.phoneNumberId) {
                                setStep(4);
                                setUpdatedAt(data.updatedAt);
                                setWaConfig(prev => ({ ...prev, ...data, displayPhoneNumber: data.displayPhoneNumber || '' }));
                            }
                        } else {
                            setStep(1);
                        }
                        setTimeout(() => setInitialLoading(false), 500);
                    });
                } else {
                    setStep(1);
                    setTimeout(() => setInitialLoading(false), 500);
                }
            }
        });

        return () => {
            unsub();
            if (unsubInternal) unsubInternal();
        };
    }, [isOpen, currentUser, activeEntity]);

    if (!activeIntegration || activeIntegration.id !== 'whatsapp') return null;

    const saveWhatsAppConfig = async () => {
        if (!currentUser || !activeEntity) return;

        // Final validation before save
        const errors = {
            phoneNumberId: validateField('phoneNumberId', waConfig.phoneNumberId) ? '' : formErrors.phoneNumberId,
            wabaId: validateField('wabaId', waConfig.wabaId) ? '' : formErrors.wabaId,
            displayPhoneNumber: validateField('displayPhoneNumber', waConfig.displayPhoneNumber) ? '' : formErrors.displayPhoneNumber,
            accessToken: validateField('accessToken', waConfig.accessToken) ? '' : formErrors.accessToken,
        };

        if (Object.values(errors).some(e => e !== '') || !waConfig.phoneNumberId || !waConfig.accessToken) {
            toast.error("Revisa los campos marcados en rojo.");
            return;
        }

        const toastId = toast.loading("Verificando credenciales...");

        try {
            const validationRes = await fetch('/api/whatsapp/validate-phone-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumberId: waConfig.phoneNumberId,
                    userId: currentUser.uid,
                    entityId: activeEntity
                })
            });
            const validationData = await validationRes.json();

            if (!validationData.valid) {
                toast.error(validationData.message || "El número ya está vinculado a otra cuenta.", { id: toastId });
                return;
            }
        } catch (error) {
            console.error("Validation error:", error);
            toast.error("Hubo un problema verificando el número.", { id: toastId });
            return;
        }

        toast.loading("Guardando configuración...", { id: toastId });
        try {
            const configRef = doc(db, `users/${currentUser.uid}/entities/${activeEntity}/integrations/whatsapp`);
            await setDoc(configRef, {
                ...waConfig,
                status: 'Connected',
                provider: 'whatsapp',
                updatedAt: new Date(),
            }, { merge: true });

            toast.success("¡WhatsApp conectado!", { id: toastId });
            setIsEditing(false);
            setStep(4);
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar.", { id: toastId });
        }
    };

    const handleConnectFacebook = async () => {
        if (devMode) {
            setStep(4);
            return;
        }

        const facebookAppId = process.env.NEXT_PUBLIC_META_APP_ID;
        const configRef = doc(db, `users/${currentUser?.uid}/entities/${activeEntity}/integrations/whatsapp`);

        const configDoc = {
            status: 'Connected',
            step: 4,
            provider: 'whatsapp',
            updatedAt: new Date(),
        };

        // Simulated popup flow or redirection logic
        toast.promise(
            new Promise(async (resolve) => {
                await setDoc(configRef, configDoc, { merge: true });
                setTimeout(resolve, 2000);
            }),
            {
                loading: 'Vinculando con Meta...',
                success: '¡Conexión exitosa!',
                error: 'Error al vincular.',
            }
        );
    };

    const handleDeleteConfig = async () => {

        if (!currentUser || !activeEntity) return;
        if (!confirm("¿Seguro que quieres desconectar WhatsApp?")) return;

        const toastId = toast.loading("Desconectando...");
        try {
            const configRef = doc(db, `users/${currentUser.uid}/entities/${activeEntity}/integrations/whatsapp`);
            const internalConfigRef = doc(db, `users/${currentUser.uid}/entities/${activeEntity}/integrations/whatsapp_internal`);
            
            await Promise.all([
                deleteDoc(configRef),
                deleteDoc(internalConfigRef)
            ]);

            // Turn off any active chatbots
            const botsRef = collection(db, `users/${currentUser.uid}/entities/${activeEntity}/chatbots`);
            
            // Handle both true and 'true' just in case
            const qReal = query(botsRef, where('isActive', '==', true));
            const qStr = query(botsRef, where('isActive', '==', 'true'));
            
            const [snapsReal, snapsStr] = await Promise.all([getDocs(qReal), getDocs(qStr)]);
            
            const updatePromises: Promise<void>[] = [];
            snapsReal.forEach(bot => updatePromises.push(updateDoc(bot.ref, { isActive: false })));
            snapsStr.forEach(bot => updatePromises.push(updateDoc(bot.ref, { isActive: false })));
            
            await Promise.all(updatePromises);

            setWaConfig({
                phoneNumberId: '', wabaId: '', accessToken: '', displayPhoneNumber: '',
                verifyToken: Math.random().toString(36).substring(7),
                appId: process.env.NEXT_PUBLIC_META_APP_ID || '',
            });
            setStep(1);
            setIsEditing(false);
            toast.success("Desconectado.", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Error al desconectar.", { id: toastId });
        }
    };

    const renderManualForm = () => (
        <div className="flex-1 flex flex-col pt-2 overflow-y-auto pr-2 no-scrollbar">
            <div className="space-y-5 mb-8 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex justify-between px-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">PHONE ID (15 DÍGITOS)</label>
                            <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer" className="text-[8px] text-blue-500 font-bold uppercase italic tracking-tighter">¿DÓNDE ENCONTRARLO?</a>
                        </div>
                        <input
                            type="text" placeholder="Ej: 676837795516836"
                            value={waConfig.phoneNumberId}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setWaConfig({ ...waConfig, phoneNumberId: val });
                                validateField('phoneNumberId', val);
                            }}
                            className={`w-full h-11 bg-white/[0.02] border ${formErrors.phoneNumberId ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'} rounded-xl px-4 text-xs text-white focus:border-blue-500/50 transition-all outline-none font-light`}
                        />
                        {formErrors.phoneNumberId && <p className="text-[8px] text-red-500 mt-1 font-bold italic pl-1">{formErrors.phoneNumberId}</p>}
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between px-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">TU NÚMERO DE TELÉFONO</label>
                             <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer" className="text-[8px] text-blue-500 font-bold uppercase italic tracking-tighter">EXPLORADOR API</a>
                        </div>
                        <input
                            type="text" placeholder="Ej: +1 385 888 2799"
                            value={waConfig.displayPhoneNumber}
                            onChange={(e) => {
                                setWaConfig({ ...waConfig, displayPhoneNumber: e.target.value });
                                validateField('displayPhoneNumber', e.target.value);
                            }}
                            className={`w-full h-11 bg-white/[0.02] border ${formErrors.displayPhoneNumber ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'} rounded-xl px-4 text-xs text-white focus:border-blue-500/50 transition-all outline-none`}
                        />
                        {formErrors.displayPhoneNumber && <p className="text-[8px] text-red-500 mt-1 font-bold italic pl-1">{formErrors.displayPhoneNumber}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between px-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">WABA ID (WHATSAPP BUSINESS ACCOUNT)</label>
                        <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer" className="text-[8px] text-blue-500 font-bold uppercase italic tracking-tighter">¿DÓNDE ENCONTRARLO?</a>
                    </div>
                    <input
                        type="text" placeholder="Ej: 25304791939521"
                        value={waConfig.wabaId}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setWaConfig({ ...waConfig, wabaId: val });
                            validateField('wabaId', val);
                        }}
                        className={`w-full h-11 bg-white/[0.02] border ${formErrors.wabaId ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'} rounded-xl px-4 text-xs text-white focus:border-blue-500/50 transition-all outline-none font-light`}
                    />
                    {formErrors.wabaId && <p className="text-[8px] text-red-500 mt-1 font-bold italic pl-1">{formErrors.wabaId}</p>}
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between px-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">TOKEN DE ACCESO (PERMANENTE)</label>
                        <a href="https://business.facebook.com/latest/settings/system_users" target="_blank" rel="noreferrer" className="text-[8px] text-blue-500 font-bold uppercase italic tracking-tighter">¿CÓMO CREARLO?</a>
                    </div>
                    <div className="relative">
                        <input
                            type="password" placeholder="••••••••••••••••••••••••••••••••••••"
                            value={waConfig.accessToken}
                            onChange={(e) => {
                                setWaConfig({ ...waConfig, accessToken: e.target.value });
                                validateField('accessToken', e.target.value);
                            }}
                            className={`w-full h-11 bg-white/[0.02] border ${formErrors.accessToken ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'} rounded-xl px-4 pr-12 text-xs text-white focus:border-blue-500/50 transition-all outline-none font-mono`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Lock className="w-3.5 h-3.5 text-neutral-600" />
                        </div>
                    </div>
                    {formErrors.accessToken && <p className="text-[8px] text-red-500 mt-1 font-bold italic pl-1">{formErrors.accessToken}</p>}
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 mb-8 relative overflow-hidden group text-left">
                <div className="absolute top-0 right-0 w-[200px] h-full bg-blue-500/5 blur-[50px] pointer-events-none" />
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg"><QrCode className="w-4 h-4 text-blue-400" /></div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Para configurar el Webhook en Meta:</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[8px] font-black uppercase text-neutral-500">URL DE CALLBACK</span>
                            <button onClick={() => { navigator.clipboard.writeText(`https://roosevelt-api.com/webhook/${currentUser?.uid}`); toast.success("URL copiada"); }} className="p-1 hover:bg-white/5 rounded-md"><Copy className="w-3 h-3 text-blue-500" /></button>
                        </div>
                        <p className="text-[9px] font-mono text-blue-300 truncate tracking-tighter">https://roosevelt-api.com/webhook/{currentUser?.uid}</p>
                    </div>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[8px] font-black uppercase text-neutral-500">VERIFY TOKEN</span>
                            <button onClick={() => { navigator.clipboard.writeText(waConfig.verifyToken); toast.success("Token copiado"); }} className="p-1 hover:bg-white/5 rounded-md"><Copy className="w-3 h-3 text-blue-500" /></button>
                        </div>
                        <p className="text-[9px] font-mono text-blue-300">{waConfig.verifyToken}</p>
                    </div>
                </div>
            </div>

            {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => {
                            setWaConfig(tempConfig);
                            setIsEditing(false);
                            setFormErrors({});
                        }}
                        className="h-14 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all"
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={saveWhatsAppConfig}
                        className="h-14 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-600/20"
                    >
                        GUARDAR CAMBIOS
                    </button>
                </div>
            ) : (
                <button
                    onClick={saveWhatsAppConfig}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    GUARDAR Y CONECTAR
                </button>
            )}
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]"
                    >
                        {/* Left Branding */}
                        <div className="hidden md:flex w-[35%] bg-neutral-900/50 p-8 flex-col border-r border-white/5 relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 w-full h-full bg-blue-500 opacity-20 blur-[100px] pointer-events-none" />
                            <div className="relative z-10 h-full flex flex-col">
                                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl w-fit mb-6">{activeIntegration.icon}</div>
                                <h2 className="text-2xl font-light mb-2">{activeIntegration.name}</h2>
                                <p className="text-sm text-neutral-400 font-light leading-relaxed mb-8">Conecta WhatsApp Business API a través de Meta para facilitar la atención al cliente masiva.</p>
                                <div className="mt-auto">
                                    <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><AlertCircle className="w-3 h-3" />Conexión Segura</p>
                                        <p className="text-xs text-neutral-400 leading-snug">El proceso de vinculación se realiza directamente en los servidores de Meta.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Content */}
                        <div className="flex-1 p-8 overflow-y-auto no-scrollbar relative flex flex-col h-full bg-[#0a0a0a]">
                            <div className="flex justify-between items-center mb-8 h-10 shrink-0 relative z-50">
                                <div className="w-20">
                                    {(step > 1 && step < 4) ? (
                                        <button
                                            onClick={() => setStep(step - 1)}
                                            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Atrás
                                        </button>
                                    ) : isEditing ? (
                                        <button
                                            onClick={() => {
                                                setWaConfig(tempConfig);
                                                setIsEditing(false);
                                                setFormErrors({});
                                            }}
                                            className="flex items-center gap-1.5 text-neutral-500 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest"
                                        >
                                            <ChevronLeft className="w-3 h-3" /> Cancelar
                                        </button>
                                    ) : <div />}
                                </div>

                                {step === 1 && !isEditing && (
                                    <div className="flex bg-white/5 p-1 rounded-xl w-64 h-9">
                                        <button
                                            onClick={() => setConnectionMode('meta')}
                                            className={`flex-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${connectionMode === 'meta' ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                                        >
                                            Meta
                                        </button>
                                        <button
                                            onClick={() => setConnectionMode('manual')}
                                            className={`flex-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${connectionMode === 'manual' ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                                        >
                                            Manual
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center gap-1.5">
                                    {step === 4 && !isEditing && (
                                        <button
                                            onClick={() => {
                                                setTempConfig({...waConfig});
                                                setIsEditing(true);
                                            }}
                                            className="p-2 hover:bg-white/5 rounded-full transition-colors text-neutral-400 hover:text-blue-500"
                                        ><Settings className="w-4 h-4" /></button>
                                    )}
                                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5 text-neutral-500 hover:text-white" /></button>
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {initialLoading ? (
                                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                                        <p className="text-xs text-neutral-500 font-medium uppercase tracking-widest">Verificando conexión...</p>
                                    </motion.div>
                                ) : (step === 1 || isEditing) ? (
                                    <motion.div key={isEditing ? "edit" : "step1"} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                                        
                                        {isEditing || connectionMode === 'manual' ? (
                                            <>
                                                <h3 className="text-xl font-medium text-white mb-6 text-left">{isEditing ? 'Editar Configuración' : 'Configuración Manual'}</h3>
                                                {renderManualForm()}
                                            </>
                                        ) : (
                                            <>
                                                <h3 className="text-xl font-medium text-white mb-6 text-left">Conectar vía Meta (Public)</h3>
                                                <div className="space-y-4 flex-1">
                                                    <button
                                                        onClick={() => setAccountAction('new')}
                                                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 ${accountAction === 'new' ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}`}
                                                    >
                                                        <div className="mt-1">
                                                            {accountAction === 'new' ? <CheckCircle2 className="w-5 h-5 text-blue-500" /> : <Circle className="w-5 h-5 text-neutral-600" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white text-sm mb-1">Crear y conectar una nueva cuenta de WhatsApp Business</p>
                                                            <p className="text-xs text-neutral-500">Ideal si aún no tienes una App de Meta configurada.</p>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => setAccountAction('existing')}
                                                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 ${accountAction === 'existing' ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}`}
                                                    >
                                                        <div className="mt-1">
                                                            {accountAction === 'existing' ? <CheckCircle2 className="w-5 h-5 text-blue-500" /> : <Circle className="w-5 h-5 text-neutral-600" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white text-sm mb-1">Conectar una cuenta existente</p>
                                                            <p className="text-xs text-neutral-500">Usa tu aplicación de Meta ya configurada.</p>
                                                        </div>
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-6 mt-8">
                                                    <button onClick={() => setStep(2)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-medium transition-colors">Continuar</button>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                ) : step === 2 ? (
                                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                                        <h3 className="text-xl font-medium text-white mb-6 text-left">Estado del número de teléfono</h3>
                                        <div className="space-y-4">
                                            <button
                                                onClick={() => setPhoneStatus('new')}
                                                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 ${phoneStatus === 'new' ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}`}
                                            >
                                                <div className="mt-1">
                                                    {phoneStatus === 'new' ? <CheckCircle2 className="w-5 h-5 text-blue-500" /> : <Circle className="w-5 h-5 text-neutral-600" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white text-sm mb-1">Es un número de teléfono nuevo</p>
                                                    <p className="text-xs text-neutral-500">Aún no se ha utilizado en la API de WhatsApp.</p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => setPhoneStatus('personal')}
                                                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 ${phoneStatus === 'personal' ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}`}
                                            >
                                                <div className="mt-1">
                                                    {phoneStatus === 'personal' ? <CheckCircle2 className="w-5 h-5 text-blue-500" /> : <Circle className="w-5 h-5 text-neutral-600" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white text-sm mb-1">Es un número de WhatsApp personal</p>
                                                    <p className="text-xs text-neutral-500">Deberás eliminar la cuenta de WhatsApp en tu móvil antes.</p>
                                                </div>
                                            </button>
                                        </div>
                                        <div className="mt-auto pt-8">
                                            <button onClick={() => setStep(3)} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-3 rounded-xl text-sm font-medium transition-colors">Siguiente</button>
                                        </div>
                                    </motion.div>
                                ) : step === 3 ? (
                                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                                            <ShieldCheck className="w-10 h-10 text-blue-500" />
                                        </div>
                                        <h3 className="text-xl font-medium text-white mb-2">Todo listo para vincular</h3>
                                        <p className="text-sm text-neutral-400 mb-8">Te redirigiremos al portal oficial de Meta para autorizar la conexión de forma segura.</p>
                                        <button onClick={handleConnectFacebook} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95">Conectar con Meta</button>
                                    </motion.div>
                                ) : (

                                    <motion.div key="connected" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center text-center pt-0 pb-6">
                                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6 relative">
                                            <div className="absolute inset-0 rounded-full border-2 border-green-500/20 animate-pulse" />
                                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white mb-2 tracking-tight italic uppercase">¡WhatsApp Conectado!</h3>
                                        <p className="text-sm text-neutral-500 font-light mb-8 max-w-xs">Tu cuenta de WhatsApp Business (Cloud API) está activa y lista para recibir mensajes.</p>
                                        
                                        <div className="w-full space-y-4 px-2">
                                            <div className="h-20 bg-white/[0.03] border border-white/5 rounded-[24px] flex items-center px-6 justify-between relative overflow-hidden group">
                                                <div className="text-left relative z-10">
                                                    <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 block mb-1.5 font-black opacity-60">NÚMERO DE NEGOCIO ACTIVO</span>
                                                    <p className="text-2xl font-medium text-white tracking-tight">{waConfig.displayPhoneNumber || "Sin número"}</p>
                                                </div>
                                                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-2xl"><ShieldCheck className="w-6 h-6 text-green-500/60" /></div>
                                            </div>

                                            <div className="flex items-center gap-4 pt-6">
                                                <button onClick={onClose} className="flex-1 h-14 bg-white/5 hover:bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.1em] rounded-2xl transition-all">CERRAR PANEL</button>
                                                <button onClick={handleDeleteConfig} className="flex-1 h-14 bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 text-[11px] font-black uppercase tracking-[0.1em] rounded-2xl transition-all">DESCONECTAR</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
