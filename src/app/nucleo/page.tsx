'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
    Plus, X, LogOut, Briefcase, Settings, Edit2, 
    Trash2, Archive, RotateCcw, AlertTriangle,
    User as UserIcon, Eye, EyeOff, Moon, HelpCircle, 
    BookOpen, Users, Home, ChevronRight, Camera
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';

interface Entity {
    id: string;
    name?: string;
    description?: string;
    type?: string;
    status?: 'active' | 'archived';
}

export default function NucleoPage() {
    const router = useRouter();
    const { currentUser, loading, setActiveEntity } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [transitioning, setTransitioning] = useState<string | null>(null);

    const [entities, setEntities] = useState<Entity[]>([]);
    const [managementMode, setManagementMode] = useState(false);

    // Modals States
    const [isCreating, setIsCreating] = useState(false);
    const [editEntity, setEditEntity] = useState<Entity | null>(null);
    const [deleteEntity, setDeleteEntity] = useState<Entity | null>(null);
    const [archiveEntity, setArchiveEntity] = useState<Entity | null>(null);

    const [inputValue, setInputValue] = useState('');
    const [creatingProgress, setCreatingProgress] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!loading && !currentUser) {
            router.push('/login');
        }
    }, [currentUser, loading, router]);

    useEffect(() => {
        if (currentUser) {
            const q = collection(db, `users/${currentUser.uid}/entities`);
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const ents = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Entity));
                setEntities(ents);
            }, (error) => {
                console.error("Error cargando entidades:", error);
                setEntities([]);
            });
            return () => unsubscribe();
        }
    }, [currentUser]);

    if (!mounted || loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white/50 tracking-widest text-sm">Cargando...</div>;
    if (!currentUser) return null;

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const handleSelectEntity = async (entityId: string) => {
        if (managementMode) return; // Prevent navigation in management mode
        setTransitioning(entityId);

        // Regla 3: Inyección de estado en AuthContext
        setActiveEntity(entityId);
        localStorage.setItem('roosevelt_active_entity', entityId);

        // Regla 2: Enrutamiento Dinámico
        setTimeout(() => {
            router.push(`/nucleo/${entityId}`);
        }, 400);
    };

    // --- CRUD Handlers (Regla 4 & 5) ---

    const handleCreateEntity = async () => {
        if (!currentUser || !inputValue.trim()) return;
        setCreatingProgress(true);

        // Regla 1: ID agnóstico
        const randomId = `bs_${Math.random().toString(36).substring(2, 9)}`;
        const entityRef = doc(db, `users/${currentUser.uid}/entities/${randomId}`);

        await setDoc(entityRef, {
            initialized: true,
            name: inputValue,
            status: 'active',
            type: 'empresa',
            createdAt: new Date()
        });

        // Regla 5: Estructura de Sub-Bóvedas
        await setDoc(doc(db, `users/${currentUser.uid}/entities/${randomId}/settings/general`), {
            theme: 'dark',
            branding: inputValue
        });

        setIsCreating(false);
        setInputValue('');
        setCreatingProgress(false);
    };

    const handleUpdateName = async () => {
        if (!editEntity || !inputValue.trim() || !currentUser) return;
        const ref = doc(db, `users/${currentUser.uid}/entities/${editEntity.id}`);
        await updateDoc(ref, { name: inputValue });
        setEditEntity(null);
        setInputValue('');
    };

    const handleToggleArchive = async (entity: Entity) => {
        if (!currentUser) return;
        const ref = doc(db, `users/${currentUser.uid}/entities/${entity.id}`);
        await updateDoc(ref, { status: entity.status === 'archived' ? 'active' : 'archived' });
        setArchiveEntity(null);
    };

    const handleDeleteEntity = async () => {
        if (!deleteEntity || !currentUser || inputValue !== deleteEntity.name) return;
        const ref = doc(db, `users/${currentUser.uid}/entities/${deleteEntity.id}`);
        await deleteDoc(ref);
        setDeleteEntity(null);
        setInputValue('');
    };

    return (
        <div className="min-h-screen bg-[#0f1115] text-white flex flex-col items-center justify-center selection:bg-blue-500/10 relative overflow-hidden">

            {/* Background glow effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Control Bar Top */}
            <div className="absolute top-8 right-8 flex items-center gap-6 z-[1000]">
                <button
                    onClick={() => setManagementMode(!managementMode)}
                    className={`flex items-center gap-2 transition-all p-2 rounded-lg ${managementMode ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/10' : 'text-neutral-500 hover:text-white'}`}
                >
                    <Settings className={`w-4 h-4 ${managementMode ? 'animate-spin-slow' : ''}`} />
                    <span className="text-[10px] uppercase tracking-widest font-bold">
                        {managementMode ? 'Modo Gestión ON' : 'Gestionar'}
                    </span>
                </button>

                {/* Avatar Dropdown */}
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <button className="relative focus:outline-none group">
                            <div className="absolute inset-[-4px] rounded-full border border-blue-500/0 group-hover:border-blue-500/40 transition-all duration-500" />
                            <Avatar className="w-10 h-10 border border-white/10 shadow-2xl transition-transform group-hover:scale-110 active:scale-95">
                                <AvatarImage src={currentUser.photoURL || ''} />
                                <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white font-bold text-xs">
                                    {currentUser.displayName?.[0] || currentUser.email?.[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                        <DropdownMenu.Content 
                            align="end" 
                            sideOffset={12}
                            className="w-[400px] bg-[#1A1C1E] border border-white/5 rounded-[2.5rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] backdrop-blur-3xl animate-in fade-in slide-in-from-top-4 duration-300 z-[2000] overflow-hidden p-0"
                        >
                            {/* Header: Email & Close */}
                            <div className="flex justify-between items-center px-6 pt-6 mb-4">
                                <div className="flex-1 text-center">
                                    <p className="text-[11px] font-bold text-white/40 tracking-wider lowercase">{currentUser.email}</p>
                                </div>
                                <DropdownMenu.Item className="focus:outline-none cursor-pointer">
                                    <X className="w-5 h-5 text-white/40 hover:text-white transition-colors" />
                                </DropdownMenu.Item>
                            </div>

                            {/* Main Identity Area */}
                            <div className="flex flex-col items-center px-10 pb-8 text-center">
                                <div className="relative mb-6 group cursor-pointer" onClick={() => router.push('/perfil')}>
                                    <Avatar className="w-24 h-24 border border-white/10 shadow-2xl">
                                        <AvatarImage src={currentUser.photoURL || ''} />
                                        <AvatarFallback className="bg-neutral-800 text-2xl font-bold">
                                            {currentUser.displayName?.[0] || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute bottom-0 right-0 p-1.5 bg-[#2D2F31] border border-[#1A1C1E] rounded-full shadow-lg group-hover:scale-110 transition-transform">
                                        <Camera className="w-4 h-4 text-white/60" />
                                    </div>
                                </div>
                                
                                <h3 className="text-2xl font-light text-white mb-6">Hi, {currentUser.displayName?.split(' ')[0] || 'Luxor'}!</h3>
                                
                                <button 
                                    onClick={() => router.push('/configuracion')}
                                    className="px-8 py-3.5 border border-white/10 rounded-full text-xs font-bold text-blue-400 hover:bg-blue-500/5 transition-all mb-8 w-full max-w-[280px]"
                                >
                                    Manage your Roosevelt Account
                                </button>
                            </div>

                            {/* Grid Navigation Section (Prior Items) */}
                            <div className="bg-black/20 p-4 border-y border-white/5">
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { label: "Profile", icon: UserIcon, href: "/perfil" },
                                        { label: "Settings", icon: Settings, href: "/configuracion" },
                                        { label: "Appearance", icon: Moon, href: "#" },
                                        { label: "Support", icon: HelpCircle, href: "#" },
                                        { label: "Docs", icon: BookOpen, href: "#" },
                                        { label: "Home", icon: Home, href: "/nucleo" }
                                    ].map((item) => (
                                        <DropdownMenu.Item 
                                            key={item.label}
                                            onClick={() => router.push(item.href)}
                                            className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white/5 cursor-pointer outline-none transition-all group"
                                        >
                                            <item.icon className="w-5 h-5 text-white/30 group-hover:text-blue-400 transition-colors" />
                                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest group-hover:text-white/60">{item.label}</span>
                                        </DropdownMenu.Item>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Actions: Add & Sign Out */}
                            <div className="p-4 flex gap-2 h-20">
                                <DropdownMenu.Item className="flex-1 bg-white/[0.03] hover:bg-white/[0.08] rounded-l-[1.5rem] rounded-r-lg flex items-center justify-center gap-4 cursor-pointer outline-none transition-all group">
                                    <Plus className="w-5 h-5 text-white/40 group-hover:text-white" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-white">Add account</span>
                                </DropdownMenu.Item>

                                <DropdownMenu.Item 
                                    onClick={handleLogout}
                                    className="flex-1 bg-white/[0.03] hover:bg-red-500/10 rounded-r-[1.5rem] rounded-l-lg flex items-center justify-center gap-4 cursor-pointer outline-none transition-all group"
                                >
                                    <LogOut className="w-5 h-5 text-white/40 group-hover:text-red-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-red-500">Sign out</span>
                                </DropdownMenu.Item>
                            </div>

                            {/* Privacy Policy Footer */}
                            <div className="py-4 text-center">
                                <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest cursor-default">
                                    Privacy Policy • Terms of Service
                                </p>
                            </div>
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="z-10 w-full max-w-6xl px-6 flex flex-col items-center"
            >
                <h1 className="text-3xl md:text-5xl font-light tracking-wide text-center mb-20 text-white/90">
                    {managementMode ? 'Gestión de Entornos' : '¿Qué entorno vas a conectar?'}
                </h1>

                <div className="flex flex-wrap justify-center gap-12 md:gap-16">

                    <AnimatePresence mode='popLayout'>
                        {/* Dynamic Rendering of Entities */}
                        {entities.filter(e => managementMode || e.status !== 'archived').map((entity) => (
                            <motion.div
                                key={entity.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className={`flex flex-col items-center gap-6 relative group ${transitioning && transitioning !== entity.id ? 'opacity-20 blur-sm scale-95' : ''} ${entity.status === 'archived' ? 'opacity-40 grayscale' : ''}`}
                            >
                                {/* Floating Actions for Management Mode */}
                                {managementMode && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute -top-6 -right-6 flex flex-col gap-2 z-50 p-2"
                                    >
                                        <button onClick={() => { setEditEntity(entity); setInputValue(entity.name || ''); }} className="bg-white/10 hover:bg-white text-white hover:text-black p-2.5 rounded-full backdrop-blur-xl transition-all border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setArchiveEntity(entity)} className="bg-white/10 hover:bg-amber-500 text-white p-2.5 rounded-full backdrop-blur-xl transition-all border border-white/20">
                                            {entity.status === 'archived' ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => { setDeleteEntity(entity); setInputValue(''); }} className="bg-white/10 hover:bg-red-600 text-white p-2.5 rounded-full backdrop-blur-xl transition-all border border-white/20">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                )}

                                <div
                                    onClick={() => handleSelectEntity(entity.id)}
                                    className={`w-36 h-36 md:w-40 md:h-40 rounded-full border-4 border-transparent transition-all p-1 cursor-pointer ${!managementMode ? 'hover:border-white/20 hover:scale-105 active:scale-95 shadow-2xl hover:shadow-blue-500/10' : 'cursor-default'}`}
                                >
                                    <Avatar className="w-full h-full shadow-2xl border border-white/5">
                                        <AvatarFallback className={`text-white text-5xl font-extralight ${entity.type === 'persona' ? 'bg-emerald-800' : 'bg-blue-800'}`}>
                                            {entity.name ? entity.name[0].toUpperCase() : '•'}
                                        </AvatarFallback>
                                        {entity.type === 'persona' && <AvatarImage src={currentUser?.photoURL || ''} />}
                                    </Avatar>
                                </div>

                                <div className="text-center group-hover:translate-y-1 transition-transform">
                                    <span className="text-xl font-light block transition-colors uppercase tracking-[0.2em] text-white/80 group-hover:text-white">
                                        {entity.name || 'Sin Nombre'}
                                    </span>
                                    <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold mt-1 block">
                                        {entity.status === 'archived' ? 'ARCHIVADO' : (entity.type || 'WORK UNIT')}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Add Account Option */}
                    {!managementMode && (
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex flex-col items-center gap-6 cursor-pointer group transition-all duration-500 ${transitioning ? 'opacity-20 scale-95 blur-sm' : ''}`}
                            onClick={() => { setIsCreating(true); setInputValue(''); }}
                        >
                            <div className="w-36 h-36 md:w-40 md:h-40 rounded-full border-4 border-dashed border-white/5 flex items-center justify-center group-hover:border-white/20 transition-all bg-white/[0.02] group-hover:bg-white/[0.05]">
                                <Plus className="w-12 h-12 text-white/10 group-hover:text-white/40 group-hover:rotate-90 transition-all duration-700" />
                            </div>
                            <div className="text-center">
                                <span className="text-[10px] font-bold text-white/20 group-hover:text-white/40 transition-all tracking-[0.5em] uppercase">
                                    Expand Core
                                </span>
                            </div>
                        </motion.div>
                    )}

                </div>
            </motion.div>

            {/* --- CRUD MODALS --- */}

            <AnimatePresence>
                {/* Modal: Editar */}
                {editEntity && (
                    <Modal title="Renombrar Entorno" onClose={() => setEditEntity(null)}>
                        <div className="space-y-6">
                            <div className="relative group">
                                <label className="block text-[8px] font-bold text-white/20 mb-4 uppercase tracking-[0.5em] text-center">Nuevo Identificador</label>
                                <input
                                    type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                                    className="w-full bg-transparent border-b border-white/10 text-white text-center py-4 focus:outline-none focus:border-white transition-all font-light text-2xl tracking-wide placeholder:text-white/5"
                                    placeholder="..." autoFocus
                                />
                            </div>
                            <Button onClick={handleUpdateName} className="w-full bg-white text-black hover:bg-neutral-200 rounded-none py-8 tracking-[0.4em] uppercase text-[10px] font-bold transition-all shadow-xl">
                                Actualizar Identidad
                            </Button>
                        </div>
                    </Modal>
                )}

                {/* Modal: Safe Delete */}
                {deleteEntity && (
                    <Modal title="Eliminar Entorno" onClose={() => setDeleteEntity(null)}>
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 text-red-500 bg-red-500/5 p-6 rounded-2xl border border-red-500/10">
                                <AlertTriangle className="w-6 h-6 shrink-0" />
                                <p className="text-[11px] leading-relaxed uppercase tracking-wider font-medium opacity-80">
                                    Esta acción es irreversible. Se borrará la bóveda y todos sus datos vinculados.
                                </p>
                            </div>

                            <div className="relative text-center">
                                <p className="text-[9px] text-white/40 uppercase tracking-[0.4em] mb-4">Escribe <span className="text-white font-bold">"{deleteEntity.name}"</span> para confirmar:</p>
                                <input
                                    type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                                    className="w-full bg-transparent border-b border-red-500/20 text-red-500 text-center py-4 focus:outline-none focus:border-red-500 transition-all font-light text-2xl tracking-wide"
                                    placeholder="..." autoFocus
                                />
                            </div>

                            <Button
                                onClick={handleDeleteEntity}
                                disabled={inputValue !== deleteEntity.name}
                                className="w-full bg-red-600 text-white py-8 rounded-none tracking-[0.4em] uppercase text-[10px] font-bold hover:bg-red-500 disabled:opacity-20 transition-all"
                            >
                                ELIMINAR PERMANENTEMENTE
                            </Button>
                        </div>
                    </Modal>
                )}

                {/* Modal: Archive */}
                {archiveEntity && (
                    <Modal title={archiveEntity.status === 'archived' ? "Restaurar Entorno" : "Archivar Entorno"} onClose={() => setArchiveEntity(null)}>
                        <div className="space-y-12">
                            <p className="text-sm text-neutral-500 text-center leading-relaxed font-light tracking-wide px-4">
                                {archiveEntity.status === 'archived'
                                    ? "¿Deseas reactivar este entorno en el flujo principal del Núcleo?"
                                    : "El entorno se ocultará del selector principal. Sus datos seguirán existiendo en la bóveda pero no serán accesibles en el Hub."}
                            </p>
                            <div className="flex gap-4">
                                <Button variant="ghost" onClick={() => setArchiveEntity(null)} className="flex-1 py-8 border border-white/5 hover:bg-white/5 text-[9px] tracking-[0.4em] uppercase rounded-none">Cancelar</Button>
                                <Button onClick={() => handleToggleArchive(archiveEntity)} className={`flex-1 py-8 rounded-none text-black tracking-[0.4em] uppercase text-[9px] font-bold ${archiveEntity.status === 'archived' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-amber-500 hover:bg-amber-400'}`}>
                                    {archiveEntity.status === 'archived' ? 'Restaurar' : 'Confirmar Archivo'}
                                </Button>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* Modal: Crear */}
                {isCreating && (
                    <Modal title="Protocolo de Bóveda" onClose={() => setIsCreating(false)}>
                        <div className="space-y-6">
                            <div className="relative group text-center">
                                <label className="block text-[8px] font-bold text-white/20 mb-4 uppercase tracking-[0.5em]">Identificador de Identidad</label>
                                <input
                                    type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                                    className="w-full bg-transparent border-b border-white/10 text-white text-center py-4 focus:outline-none focus:border-white transition-all font-light text-2xl tracking-wide placeholder:text-white/5"
                                    placeholder="..." autoFocus
                                />
                            </div>
                            <Button onClick={handleCreateEntity} disabled={creatingProgress || !inputValue.trim()} className="w-full bg-white text-black hover:bg-neutral-200 rounded-none py-8 tracking-[0.4em] uppercase text-[10px] font-bold transition-all shadow-2xl">
                                {creatingProgress ? 'Iniciando Motor...' : 'Confirmar Expansión'}
                            </Button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Admin Branding */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                className="absolute bottom-12 text-[10px] tracking-[0.6em] uppercase text-white/50 font-bold"
            >
                Roosevelt Identity Core
            </motion.div>
        </div>
    );
}

// Componente Local de Modal Premium (Agnóstico y Reutilizable)
function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6">
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }} className="w-full max-w-md relative pt-12">
                <button onClick={onClose} className="absolute -top-12 right-0 text-white/20 hover:text-white transition-all"><X className="w-8 h-8 font-thin" /></button>
                <div className="mb-16 text-center">
                    <h2 className="text-2xl font-extralight text-white mb-4 tracking-[0.3em] uppercase">{title}</h2>
                    <div className="w-8 h-[1px] bg-blue-500 mx-auto" />
                </div>
                {children}
            </motion.div>
        </motion.div>
    );
}
