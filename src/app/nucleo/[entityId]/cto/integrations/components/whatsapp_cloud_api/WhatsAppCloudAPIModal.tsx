import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Circle, ChevronLeft, Info, Settings, Copy, ShieldCheck, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { Integration } from '../../config';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    activeIntegration: Integration | null;
}

export function WhatsAppCloudAPIModal({ isOpen, onClose, activeIntegration }: Props) {
    const { currentUser, activeEntity } = useAuth();
    const [step, setStep] = useState<number>(1);
    const [devMode, setDevMode] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [updatedAt, setUpdatedAt] = useState<any>(null);
    
    // Step 1 State
    const [accountAction, setAccountAction] = useState<'new' | 'existing'>('new');
    
    // Step 2 State (Eligibility)
    const [phoneStatus, setPhoneStatus] = useState<'new' | 'personal' | 'none'>('new');

    const [waConfig, setWaConfig] = useState({
        phoneNumberId: '',
        wabaId: '',
        accessToken: '',
        displayPhoneNumber: '',
        verifyToken: Math.random().toString(36).substring(7),
        appId: process.env.NEXT_PUBLIC_META_APP_ID || '',
    });

    // Real-time listener for Config
    useEffect(() => {
        if (!isOpen || !currentUser || !activeEntity) return;
        setInitialLoading(true);

        const publicRef = doc(db, `users/${currentUser.uid}/entities/${activeEntity}/integrations/whatsapp`);
        const internalRef = doc(db, `users/${currentUser.uid}/entities/${activeEntity}/integrations/whatsapp_internal`);

        // Listener para la pública (OAuth Real)
        const unsubPublic = onSnapshot(publicRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                if (data.status === 'Connected') {
                    setStep(4);
                    setUpdatedAt(data.updatedAt);
                    setWaConfig(prev => ({
                        ...prev,
                        displayPhoneNumber: data.displayPhoneNumber || '',
                        phoneNumberId: data.phoneNumberId || prev.phoneNumberId,
                        wabaId: data.wabaId || prev.wabaId,
                        accessToken: data.accessToken || prev.accessToken,
                    }));
                }
            }
        });

        // Listener para la interna (Modo Dev)
        const unsubInternal = onSnapshot(internalRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                // Actualizar waConfig pero solo cambiar step si no hay pública conectada
                setWaConfig(prev => ({
                    ...prev,
                    phoneNumberId: data.phoneNumberId || prev.phoneNumberId,
                    wabaId: data.wabaId || prev.wabaId,
                    accessToken: data.accessToken || prev.accessToken,
                    displayPhoneNumber: data.displayPhoneNumber || prev.displayPhoneNumber,
                    verifyToken: data.verifyToken || prev.verifyToken,
                    appId: data.appId || prev.appId,
                }));

                // Si es modo dev y se guardó, mostrar éxito
                if (data.status === 'Internal') {
                    setStep(4);
                    setUpdatedAt(data.updatedAt);
                }
            }
            // Pequeño delay para evitar parpadeo si carga muy rápido
            setTimeout(() => setInitialLoading(false), 500);
        });

        return () => {
            unsubPublic();
            unsubInternal();
        };
    }, [isOpen, currentUser, activeEntity]);

    // Listener de emergencia para postMessage (Fallback)
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'META_CONNECTED') {
                toast.success("¡Meta vinculado correctamente!");
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    if (!activeIntegration || activeIntegration.id !== 'whatsapp') return null;

    const handleLogoClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount === 5) {
            setDevMode(!devMode);
            setClickCount(0);
            toast.success(devMode ? "Modo Desarrollador Desactivado" : "Modo Desarrollador Activado");
        }
    };

    const saveWhatsAppConfig = async (manualData?: typeof waConfig) => {
        if (!currentUser || !activeEntity) return;
        toast.loading("Guardando configuración...");
        
        const dataToSave = manualData || waConfig;
        
        try {
            // Rule 4: Isolated Data Vault
            const configRef = doc(db, `users/${currentUser.uid}/entities/${activeEntity}/integrations/whatsapp`);
            await setDoc(configRef, {
                ...dataToSave,
                phoneNumber: dataToSave.displayPhoneNumber?.replace(/\+/g, '') || '', // For consistent display in Dashboard
                status: 'Connected',
                provider: 'whatsapp',
                updatedAt: new Date(),
            }, { merge: true });

            toast.dismiss();
            toast.success("WhatsApp conectado correctamente.");
            onClose();
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error("Error al guardar la configuración.");
        }
    };

    const handleSaveManual = async () => {
        if (!currentUser || !activeEntity) return;
        
        toast.loading("Guardando configuración interna...");
        try {
            const configRef = doc(db, `users/${currentUser.uid}/entities/${activeEntity}/integrations/whatsapp_internal`);
            
            await setDoc(configRef, {
                ...waConfig,
                status: 'Internal', 
                provider: 'whatsapp',
                isInternal: true,
                updatedAt: new Date(),
            }, { merge: true });

            toast.dismiss();
            toast.success("Configuración guardada correctamente.");
            setStep(4);
            setDevMode(false);
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar.");
        }
    };

    const handleDeleteConfig = async () => {
        if (!currentUser || !activeEntity) return;
        if (!confirm("¿Seguro que quieres eliminar esta conexión? Esto desconectará WhatsApp.")) return;

        toast.loading("Desconectando servicios...");
        try {
            // Borrar ambas posibles rutas para asegurar limpieza total
            const publicRef = doc(db, `users/${currentUser.uid}/entities/${activeEntity}/integrations/whatsapp`);
            const internalRef = doc(db, `users/${currentUser.uid}/entities/${activeEntity}/integrations/whatsapp_internal`);
            
            await Promise.all([
                deleteDoc(publicRef),
                deleteDoc(internalRef)
            ]);
            
            // Reset local state
            setWaConfig({
                phoneNumberId: '',
                wabaId: '',
                accessToken: '',
                displayPhoneNumber: '',
                verifyToken: Math.random().toString(36).substring(7),
                appId: '',
            });
            setStep(1);
            setDevMode(false);
            setIsEditing(false);

            toast.dismiss();
            toast.success("Desconectado correctamente.");
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar.");
        }
    };

    const handleConnectFacebook = () => {
        const appId = waConfig.appId || process.env.NEXT_PUBLIC_META_APP_ID || '';
        toast.info("Iniciando conexión segura con Meta...");
        
        // URL limpia para evitar bucles de "Cambio de cuenta"
        const url = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${appId}&display=popup&extras={"setup":{"mobile":false,"whatsapp_business_account":null}}&response_type=token&scope=whatsapp_business_management,whatsapp_business_messaging,business_management&redirect_uri=${encodeURIComponent(window.location.origin + '/meta-callback')}`;
        
        window.open(url, "_blank", "width=600,height=800");
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
                        <div className="hidden md:flex w-[35%] bg-neutral-900/50 p-8 flex-col border-r border-white/5 relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 w-full h-full bg-blue-500 opacity-20 blur-[100px] pointer-events-none" />

                            <div className="relative z-10 h-full flex flex-col">
                                <div 
                                    onClick={handleLogoClick}
                                    className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl w-fit mb-6 cursor-pointer hover:bg-white/5 transition-all"
                                >
                                    {activeIntegration.icon}
                                </div>
                                <h2 className="text-2xl font-light mb-2">{activeIntegration.name}</h2>
                                <p className="text-sm text-neutral-400 font-light leading-relaxed mb-8">
                                    Conecta WhatsApp Business API a través de Meta para facilitar la interacción y la atención al cliente masiva.
                                </p>
                                
                                <div className="mt-auto">
                                    <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                            <AlertCircle className="w-3 h-3" />
                                            Conexión Segura
                                        </p>
                                        <p className="text-xs text-neutral-400 leading-snug">
                                            El proceso de vinculación se realiza directamente en los servidores de Meta.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Flow */}
                        <div className="flex-1 p-8 overflow-y-auto no-scrollbar relative flex flex-col h-full bg-[#0a0a0a]">
                            
                            {/* Header: Back & Close */}
                            <div className="flex justify-between items-center mb-8 h-8">
                                {step > 1 && step < 4 && !devMode ? (
                                    <button 
                                        onClick={() => setStep(step - 1)}
                                        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                                    >
                                        <ChevronLeft className="w-4 h-4" /> Atrás
                                    </button>
                                ) : <div />}

                                {devMode && (
                                    <button 
                                        onClick={() => setDevMode(false)}
                                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-[10px] font-bold uppercase tracking-widest"
                                    >
                                        <Settings className="w-3 h-3" /> Salir Modo Dev
                                    </button>
                                )}
                                
                                <button 
                                    onClick={onClose} 
                                    className="p-2 hover:bg-white/5 rounded-full transition-colors ml-auto"
                                >
                                    <X className="w-5 h-5 text-neutral-500" />
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {initialLoading ? (
                                    <motion.div 
                                        key="loading"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="flex-1 flex flex-col items-center justify-center p-12 text-center"
                                    >
                                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                                        <p className="text-xs text-neutral-500 font-medium uppercase tracking-widest">Verificando conexión...</p>
                                    </motion.div>
                                ) : (devMode && (step !== 4 || isEditing)) ? (
                                    <motion.div 
                                        key="dev"
                                        initial={{ opacity: 0, scale: 0.98 }} 
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        className="flex-1 flex flex-col"
                                    >
                                        <div className="flex items-center justify-between mb-8">
                                            <button 
                                                onClick={() => {
                                                    if (step === 4) setIsEditing(false);
                                                    else setDevMode(false);
                                                }}
                                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
                                            >
                                                <ChevronLeft className="w-3 h-3" />
                                                {step === 4 ? 'REGRESAR AL ESTADO' : 'REGRESAR AL ASISTENTE'}
                                            </button>
                                            <div className="flex items-center gap-2 text-blue-500">
                                                <Settings className="w-3 h-3" />
                                                <span className="text-[10px] font-black uppercase tracking-widest italic">Dev Mode</span>
                                            </div>
                                        </div>

                                        <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl mb-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Settings className="w-4 h-4 text-amber-500" />
                                                <h3 className="text-xs font-black uppercase tracking-wider text-amber-500">CONFIGURACIÓN INTERNA</h3>
                                            </div>
                                            <p className="text-[10px] text-amber-500/70 leading-relaxed font-medium">
                                                Usa esto para configurar la App de Meta para procesos internos. Esta configuración no activará el estado público de la cuenta.
                                            </p>
                                        </div>

                                        {(waConfig.phoneNumberId && (waConfig.phoneNumberId.includes('+') || waConfig.phoneNumberId.length < 10)) && (
                                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 animate-pulse mb-4">
                                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                                <p className="text-[9px] text-red-400 leading-tight font-bold uppercase italic">
                                                    ¡ERROR! El "Phone ID" NO es tu número de teléfono. 
                                                    Es un ID numérico de 15 dígitos de Meta.
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500 ml-2">Identificador de Teléfono (Phone ID)</label>
                                                <input 
                                                    type="text"
                                                    placeholder="Ej: 676837795516836"
                                                    value={waConfig.phoneNumberId}
                                                    onChange={(e) => setWaConfig({...waConfig, phoneNumberId: e.target.value.replace(/\D/g, '')})}
                                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm focus:border-white/20 transition-all outline-none font-mono"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500 ml-2">Número de Teléfono Visible</label>
                                                <input 
                                                    type="text"
                                                    placeholder="Ej: +1 385 888 2799"
                                                    value={waConfig.displayPhoneNumber}
                                                    onChange={(e) => setWaConfig({...waConfig, displayPhoneNumber: e.target.value})}
                                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm focus:border-white/20 transition-all outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-6">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500 ml-2">WhatsApp Business Account ID (WABA)</label>
                                            <input 
                                                type="text"
                                                placeholder="Ej: 25304791939521"
                                                value={waConfig.wabaId}
                                                onChange={(e) => setWaConfig({...waConfig, wabaId: e.target.value})}
                                                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm focus:border-white/20 transition-all outline-none font-light"
                                            />
                                        </div>

                                        <div className="space-y-2 mb-8">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500 ml-2">System User Token</label>
                                            <textarea 
                                                placeholder="EAA..."
                                                value={waConfig.accessToken}
                                                onChange={(e) => setWaConfig({...waConfig, accessToken: e.target.value})}
                                                className="w-full h-24 bg-white/5 border border-white/10 rounded-3xl p-5 text-sm focus:border-white/20 transition-all outline-none resize-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between px-2">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Meta App ID</label>
                                                </div>
                                                <input 
                                                    type="text"
                                                    placeholder="Ej: 1239485381164246"
                                                    value={waConfig.appId}
                                                    onChange={(e) => setWaConfig({...waConfig, appId: e.target.value})}
                                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-2xl px-4 text-[10px] text-blue-400 font-mono focus:border-white/20 transition-all outline-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between px-2">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Endpoint Webhook</label>
                                                    <button 
                                                        onClick={() => {
                                                            const url = `https://us-central1-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/metaWebhook?u=${currentUser?.uid}&e=${activeEntity}`;
                                                            navigator.clipboard.writeText(url);
                                                            toast.success("URL copiada");
                                                        }}
                                                        className="text-[8px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-tighter transition-colors"
                                                    >
                                                        COPIAR URL
                                                    </button>
                                                </div>
                                                <div className="w-full h-11 bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 overflow-hidden">
                                                    <p className="text-[9px] font-mono text-neutral-500 truncate select-all">
                                                        {`.../metaWebhook?u=${currentUser?.uid}&e=${activeEntity}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between px-2">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Verify Token</label>
                                                    <button 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(waConfig.verifyToken);
                                                            toast.success("Token copiado");
                                                        }}
                                                        className="text-[8px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-tighter transition-colors"
                                                    >
                                                        COPIAR TOKEN
                                                    </button>
                                                </div>
                                                <div className="w-full h-11 bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 overflow-hidden">
                                                    <p className="text-[9px] font-mono text-neutral-500 truncate select-all">
                                                        {waConfig.verifyToken}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleSaveManual}
                                            className="w-full h-12 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 mb-4"
                                        >
                                            GUARDAR CONFIGURACIÓN INTERNA
                                        </button>

                                        {waConfig.phoneNumberId && (
                                            <div className="pt-6 mt-6 border-t border-white/5 space-y-4">
                                                <div className="flex items-center gap-2 text-red-500/30">
                                                    <AlertCircle className="w-3 h-3" />
                                                    <span className="text-[9px] font-black uppercase tracking-wider italic">Zona de Peligro</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteConfig(false)}
                                                    className="w-full h-10 bg-red-500/5 text-red-500/30 border border-red-500/10 font-black uppercase text-[9px] tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all hover:border-transparent"
                                                >
                                                    ELIMINAR DATOS INTERNOS
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="wizard"
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        exit={{ opacity: 0 }}
                                        className="flex-1 flex flex-col"
                                    >
                                        <AnimatePresence mode="wait">
                                            {step === 1 && (
                                                <motion.div 
                                                    key="step1"
                                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                                    className="flex-1 flex flex-col"
                                                >
                                                    <h3 
                                                        onClick={handleLogoClick}
                                                        className="text-xl font-medium text-white mb-6 cursor-default select-none"
                                                    >
                                                        Conectar la plataforma WhatsApp Business (API)
                                                    </h3>
                                                    <div className="space-y-4 flex-1">
                                                        <button 
                                                            onClick={() => setAccountAction('new')}
                                                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 ${accountAction === 'new' ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}`}
                                                        >
                                                            <div className="mt-1">
                                                                {accountAction === 'new' ? <CheckCircle2 className="w-5 h-5 text-blue-500" /> : <Circle className="w-5 h-5 text-neutral-600" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-white text-sm mb-1">Crear y conectar una nueva cuenta de WhatsApp Business Platform (API)</p>
                                                                <p className="text-xs text-neutral-500">Selecciona esta opción si deseas crear una nueva cuenta y conectarte con un nuevo número de teléfono.</p>
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
                                                                <p className="font-medium text-white text-sm mb-1">Conectar una cuenta conectada de WhatsApp Business Platform (API) existente</p>
                                                                <p className="text-xs text-neutral-500">Selecciona esta opción si ya has creado una cuenta en la plataforma anteriormente.</p>
                                                            </div>
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-6 mt-8">
                                                        <button onClick={() => setStep(2)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-medium transition-colors">Comenzar</button>
                                                        <button onClick={handleConnectFacebook} className="text-neutral-400 hover:text-white text-sm font-medium transition-colors">Omitir y conectar a través de Facebook</button>
                                                    </div>
                                                </motion.div>
                                            )}
                                            {step === 2 && (
                                                <motion.div 
                                                    key="step2"
                                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                                    className="flex-1 flex flex-col"
                                                >
                                                    <h3 className="text-xl font-medium text-white mb-6">Comencemos Con Una Simple Comprobación De Elegibilidad</h3>
                                                    <div className="flex gap-2 mb-8">
                                                        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-xs font-medium">
                                                            <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px]">1</span> Número de teléfono válido
                                                        </div>
                                                        <div className="flex items-center gap-2 bg-white/5 border border-white/5 text-neutral-500 px-4 py-2 rounded-full text-xs font-medium">
                                                            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span> Acceso a Meta Business Manager
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-neutral-300 mb-6">¿Tienes un número de teléfono válido que puede enviar y recibir SMS? Necesitarás un número para conectar la plataforma.</p>
                                                    <div className="space-y-4 flex-1">
                                                        <button onClick={() => setPhoneStatus('new')} className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-4 ${phoneStatus === 'new' ? 'bg-white/10' : 'hover:bg-white/5'}`}>{phoneStatus === 'new' ? <CheckCircle2 className="w-5 h-5 text-blue-500" /> : <Circle className="w-5 h-5 text-neutral-600" />} <span className="text-sm text-white">Tengo un nuevo número de teléfono</span></button>
                                                        <button onClick={() => setPhoneStatus('personal')} className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-4 ${phoneStatus === 'personal' ? 'bg-white/10' : 'hover:bg-white/5'}`}>{phoneStatus === 'personal' ? <CheckCircle2 className="w-5 h-5 text-blue-500" /> : <Circle className="w-5 h-5 text-neutral-600" />} <span className="text-sm text-neutral-300">Tengo un número vinculado a cuenta personal</span></button>
                                                        <button onClick={() => setPhoneStatus('none')} className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-4 ${phoneStatus === 'none' ? 'bg-white/10' : 'hover:bg-white/5'}`}>{phoneStatus === 'none' ? <CheckCircle2 className="w-5 h-5 text-blue-500" /> : <Circle className="w-5 h-5 text-neutral-600" />} <span className="text-sm text-neutral-300">No tengo un número</span></button>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-8">
                                                        <button onClick={() => setStep(3)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-medium transition-colors">Siguiente</button>
                                                        <button onClick={() => setStep(3)} className="text-neutral-400 hover:text-white text-sm font-medium transition-colors">Saltar</button>
                                                    </div>
                                                </motion.div>
                                            )}
                                            {step === 3 && (
                                                <motion.div 
                                                    key="step3"
                                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                                    className="flex-1 flex flex-col"
                                                >
                                                    <h3 className="text-xl font-medium text-white mb-6">Comprobación de Elegibilidad de Meta Business</h3>
                                                    <div className="flex gap-2 mb-8">
                                                        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-2 rounded-full text-xs font-medium"><CheckCircle2 className="w-4 h-4" /> Número válido</div>
                                                        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-xs font-medium"><span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px]">2</span> Acceso a MBM</div>
                                                    </div>
                                                    <p className="text-sm text-neutral-300 mb-6">¿Tienes acceso a la cuenta de Meta Business Manager asociada a tu compañía?</p>
                                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 flex gap-4 mb-8">
                                                        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                                        <div className="text-xs text-blue-200/60 font-light">Necesitarás: Nombre legal, dirección oficial y nombre de marca.</div>
                                                    </div>
                                                    <div className="flex items-center gap-6 mt-auto pt-8 border-t border-white/5">
                                                        <button onClick={handleConnectFacebook} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                                                            <ShieldCheck className="w-4 h-4" /> Sí, conectar con Meta
                                                        </button>
                                                        <button onClick={onClose} className="text-neutral-400 hover:text-white text-sm font-medium transition-colors">Lo haré más tarde</button>
                                                    </div>
                                                </motion.div>
                                            )}
                                            {step === 4 && (
                                                <motion.div 
                                                    key="step4"
                                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                                    className="flex-1 flex flex-col items-center text-center pt-2 pb-10"
                                                >
                                                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                                                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                                                    </div>
                                                    <h3 
                                                        onClick={handleLogoClick}
                                                        className="text-2xl font-medium text-white mb-2 cursor-default select-none"
                                                    >
                                                        ¡WhatsApp Conectado!
                                                    </h3>
                                                    <p className="text-sm text-neutral-400 mb-8 max-w-sm">
                                                        Tu cuenta de WhatsApp Business (Cloud API) está activa y lista para recibir mensajes.
                                                    </p>
                                                    
                                                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 w-full mb-8">
                                                        <div className="flex justify-between items-center px-2 mb-4">
                                                            {devMode ? (
                                                                <div 
                                                                    onClick={handleLogoClick}
                                                                    className="flex items-center gap-2 cursor-default select-none"
                                                                >
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">Identidad de la Cuenta</span>
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setIsEditing(!isEditing);
                                                                        }}
                                                                        className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-neutral-500 hover:text-white"
                                                                    >
                                                                        <Settings className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div 
                                                                    onClick={handleLogoClick}
                                                                    className="flex items-center gap-2 cursor-default select-none font-sans"
                                                                >
                                                                    <ShieldCheck className="w-4 h-4 text-green-500/50" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">Conexión Verificada</span>
                                                                </div>
                                                            )}
                                                            <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Online</span>
                                                        </div>

                                                        {isEditing ? (
                                                            <div className="space-y-4 text-left">
                                                                {(waConfig.phoneNumberId && (waConfig.phoneNumberId.includes('+') || waConfig.phoneNumberId.length < 10)) && (
                                                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 animate-pulse">
                                                                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                                                        <p className="text-[9px] text-red-400 leading-tight font-bold uppercase italic">
                                                                            ¡ERROR DETECTADO! El "Phone ID" NO es tu número de teléfono. 
                                                                            Es un código numérico (ej: 105938475869485) de Meta.
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <label className="text-[9px] uppercase tracking-tighter text-neutral-500 mb-1 block font-black">Identificador de Teléfono (Phone ID - Meta)</label>
                                                                    <input 
                                                                        type="text" value={waConfig.phoneNumberId} 
                                                                        onChange={(e) => setWaConfig({...waConfig, phoneNumberId: e.target.value.replace(/\D/g, '')})}
                                                                        className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-xs text-white focus:outline-none focus:border-blue-500/50 font-mono"
                                                                        placeholder="Ej: 105938475869485"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[9px] uppercase tracking-tighter text-neutral-500 mb-1 block font-black">WABA ID (Cuenta Business - Meta)</label>
                                                                    <input 
                                                                        type="text" value={waConfig.wabaId} 
                                                                        onChange={(e) => setWaConfig({...waConfig, wabaId: e.target.value.replace(/\D/g, '')})}
                                                                        className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-xs text-white focus:outline-none focus:border-blue-500/50 font-mono"
                                                                        placeholder="Ej: 0987654321..."
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[9px] uppercase tracking-tighter text-neutral-500 mb-1 block font-black">Número de Teléfono Visible (Para el Panel)</label>
                                                                    <input 
                                                                        type="text" value={waConfig.displayPhoneNumber} 
                                                                        onChange={(e) => setWaConfig({...waConfig, displayPhoneNumber: e.target.value})}
                                                                        className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                                                        placeholder="Ej: +593987654321"
                                                                    />
                                                                </div>
                                                                <button 
                                                                    onClick={() => {
                                                                        saveWhatsAppConfig();
                                                                        setIsEditing(false);
                                                                    }}
                                                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white h-10 rounded-xl text-xs font-bold transition-all"
                                                                >
                                                                    Guardar Cambios
                                                                </button>

                                                                <div className="mt-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-3">
                                                                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                                                    <div className="text-[10px] text-blue-200/60 leading-relaxed font-sans">
                                                                        <p className="font-bold mb-1 text-blue-300">¿Cómo conectar correctamente?</p>
                                                                        1. Ve al <span className="text-blue-400 font-bold">Portal de Meta</span> → WhatsApp → Configuración de API.<br/>
                                                                        2. Copia el <span className="text-white font-bold">Identificador de número de teléfono</span> (ID numérico).<br/>
                                                                        3. <span className="text-red-400 font-bold">¡NO PEQUES TU NÚMERO DE TELÉFONO!</span> El ID es un código de 15 dígitos.<br/>
                                                                        4. En "Número Visible" pon tu número real con el + (ej: +5939...)
                                                                    </div>
                                                                </div>
                                                                {updatedAt && (
                                                                    <p className="text-[8px] text-neutral-600 font-medium uppercase tracking-widest text-center mt-4">
                                                                        Última actualización: {new Date(updatedAt.seconds * 1000).toLocaleString()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3 font-sans">
                                                                <div className="h-20 bg-white/5 rounded-2xl flex items-center px-6 justify-between group">
                                                                    <div className="text-left">
                                                                        <span className="text-[10px] uppercase tracking-widest text-neutral-500 block mb-1">Número de Negocio Activo</span>
                                                                        <p className="text-2xl font-light text-white tracking-tight">
                                                                            {waConfig.displayPhoneNumber ? `+${waConfig.displayPhoneNumber.replace(/\+/g, '')}` : (waConfig.phoneNumberId ? `ID: ${waConfig.phoneNumberId.substring(0, 10)}...` : "Esperando configuración...")}
                                                                        </p>
                                                                    </div>
                                                                    <div className={`p-2.5 rounded-2xl ${waConfig.displayPhoneNumber ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                                                                        <ShieldCheck className={`w-6 h-6 ${waConfig.displayPhoneNumber ? 'text-green-500' : 'text-yellow-500'}`} />
                                                                    </div>
                                                                </div>

                                                                {/* Technical Details only in Dev Mode */}
                                                                {devMode && (
                                                                    <motion.div 
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: 'auto' }}
                                                                        className="pt-4 space-y-4"
                                                                    >
                                                                        {!waConfig.displayPhoneNumber && waConfig.phoneNumberId && (
                                                                            <p className="text-[9px] text-amber-500/70 text-left px-2 italic">
                                                                                ⚠️ Se muestra el <b>Phone ID</b> de Meta. Para ver tu número real, edita la configuración y escribe tu número manualmente.
                                                                            </p>
                                                                        )}
                                                                        <div className="flex gap-2 text-sans">
                                                                            <div className="flex-1 h-10 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col justify-center px-4 text-left">
                                                                                <span className="text-[7px] uppercase text-neutral-600 font-bold">Phone ID</span>
                                                                                <span className="text-[9px] text-neutral-400 font-mono truncate select-all cursor-pointer">{waConfig.phoneNumberId || 'Sin asignar'}</span>
                                                                            </div>
                                                                            <div className="flex-1 h-10 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col justify-center px-4 text-left">
                                                                                <span className="text-[7px] uppercase text-neutral-600 font-bold">WABA ID</span>
                                                                                <span className="text-[9px] text-neutral-400 font-mono truncate select-all cursor-pointer">{waConfig.wabaId || 'Sin asignar'}</span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="pt-4 border-t border-white/5 space-y-3">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <QrCode className="w-3.5 h-3.5 text-blue-500" />
                                                                                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Configuración del Webhook</span>
                                                                            </div>
                                                                            
                                                                            <div className="bg-blue-500/5 rounded-xl p-3 text-left space-y-2 border border-blue-500/10">
                                                                                <div>
                                                                                    <span className="text-[7px] uppercase text-blue-400/60 block mb-0.5 font-bold">URL de Callback</span>
                                                                                    <span className="text-[8px] text-blue-200/80 font-mono break-all select-all">
                                                                                        {`https://us-central1-roosevelt-491004.cloudfunctions.net/metaWebhook?u=${currentUser?.uid}&e=${activeEntity}`}
                                                                                    </span>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="text-[7px] uppercase text-blue-400/60 block mb-0.5 font-bold">Token de Verificación (Verify Token)</span>
                                                                                    <span className="text-[9px] text-blue-100 font-mono font-bold select-all">{waConfig.verifyToken}</span>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <p className="text-[8px] text-neutral-500 leading-tight italic">
                                                                                Pega estos datos en el "Paso 3" del portal de Meta para recibir mensajes en el Omnicanal.
                                                                            </p>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-4 w-full">
                                                        <button 
                                                            onClick={onClose}
                                                            className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-2xl transition-all"
                                                        >
                                                            Cerrar Panel
                                                        </button>
                                                        <button 
                                                            onClick={handleDeleteConfig}
                                                            className="h-12 px-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-medium rounded-2xl transition-all border border-red-500/20"
                                                        >
                                                            Desconectar
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
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
