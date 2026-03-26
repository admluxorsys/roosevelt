'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Plus, Globe, User, Info, Check, Shield, Loader2, Camera, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { auth, storage, db } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import * as Switch from '@radix-ui/react-switch';
import * as Select from '@radix-ui/react-select';

export default function ProfileEditPage() {
    const router = useRouter();
    const { currentUser, loading } = useAuth();
    
    // Form States
    const [displayName, setDisplayName] = useState('');
    const [website, setWebsite] = useState('');
    const [bio, setBio] = useState('');
    const [gender, setGender] = useState('prefer-not-to-say');
    const [showInsignia, setShowInsignia] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    
    // UI States
    const [updating, setUpdating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push('/login');
        } else if (currentUser) {
            setDisplayName(currentUser.displayName || '');
            setPreviewUrl(currentUser.photoURL || null);
            fetchExtendedData();
        }
    }, [currentUser, loading, router]);

    const fetchExtendedData = async () => {
        if (!currentUser) return;
        const docRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            setWebsite(data.website || '');
            setBio(data.bio || '');
            setGender(data.gender || 'prefer-not-to-say');
            setShowInsignia(data.showInsignia || false);
            setShowSuggestions(data.showSuggestions !== undefined ? data.showSuggestions : true);
        }
    };

    if (loading || !currentUser) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;
        setUploading(true);
        const storageRef = ref(storage, `avatars/${currentUser.uid}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed', null, (err) => toast.error('Error al subir'), async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            await updateProfile(currentUser, { photoURL: url });
            await updateDoc(doc(db, 'users', currentUser.uid), { photoURL: url });
            setPreviewUrl(url);
            setUploading(false);
            toast.success('Imagen de perfil actualizada');
        });
    };

    const handleSave = async () => {
        setUpdating(true);
        try {
            await updateProfile(currentUser, { displayName });
            await updateDoc(doc(db, 'users', currentUser.uid), { 
                name: displayName,
                website,
                bio,
                gender,
                showInsignia,
                showSuggestions,
                updatedAt: new Date() 
            });
            toast.success('Cambios guardados con éxito');
            router.push('/perfil');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-blue-500/30 flex flex-col items-center pb-32">
            
            {/* Header Fijo */}
            <header className="fixed top-0 left-0 right-0 h-16 z-50 px-12 flex items-center border-b border-white/[0.03] backdrop-blur-3xl bg-black/40">
                <button onClick={() => router.push('/perfil')} className="flex items-center gap-4 text-neutral-500 hover:text-white transition-all scale-90 origin-left group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-bold tracking-[0.5em] uppercase">Return to View</span>
                </button>
            </header>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-32 w-full max-w-2xl px-6"
            >
                <h1 className="text-3xl font-extralight tracking-[0.2em] uppercase mb-12 text-left">Editar Perfil</h1>
                
                {/* Profile Header Card */}
                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[1.5rem] flex items-center justify-between mb-12 shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 relative group">
                            <Avatar className="w-full h-full border-none">
                                <AvatarImage src={previewUrl || ''} />
                                <AvatarFallback className="bg-neutral-900">{displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <Camera className="w-4 h-4 text-white/50" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold tracking-tight text-white/90">{displayName || 'Identity'}</span>
                            <span className="text-[10px] text-white/30 tracking-widest uppercase font-medium">{currentUser.email?.split('@')[0]} | Roosevelt ID</span>
                        </div>
                    </div>
                    <Button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black tracking-widest uppercase px-6 py-2 rounded-xl h-auto"
                    >
                        {uploading ? '...' : 'Cambiar foto'}
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>

                {/* Form Fields */}
                <div className="space-y-10">
                    
                    {/* Public Name */}
                    <div className="flex flex-col gap-3">
                        <label className="text-[11px] font-black tracking-[0.1em] text-white/90">Nombre</label>
                        <input 
                            type="text" 
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="bg-zinc-900 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-white/20 transition-all font-light"
                            placeholder="Tu nombre público..."
                        />
                    </div>

                    {/* Web Site */}
                    <div className="flex flex-col gap-3">
                        <label className="text-[11px] font-black tracking-[0.1em] text-white/90">Sitio web</label>
                        <input 
                            type="text" 
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            className="bg-zinc-900 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-white/20 transition-all font-light text-white/50"
                            placeholder="url.com"
                        />
                        <span className="text-[9px] text-white/20 leading-relaxed max-w-sm">La edición de enlaces solo está disponible en dispositivos autorizados. Visita la bóveda de administración para cambios masivos.</span>
                    </div>

                    {/* Bio / Presentación */}
                    <div className="flex flex-col gap-3">
                        <label className="text-[11px] font-black tracking-[0.1em] text-white/90">Presentación</label>
                        <div className="relative">
                            <textarea 
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                maxLength={150}
                                className="w-full h-32 bg-zinc-900 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-white/20 transition-all font-light resize-none leading-relaxed"
                                placeholder="..."
                            />
                            <span className="absolute bottom-4 right-4 text-[9px] text-white/20 font-bold">{bio.length} / 150</span>
                        </div>
                    </div>

                    {/* Insignia Threads Switch */}
                    <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-white/10 transition-all">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-white/80">Mostrar insignia de Threads</span>
                        </div>
                        <Switch.Root checked={showInsignia} onCheckedChange={setShowInsignia} className="w-11 h-6 bg-white/[0.05] rounded-full relative shadow-inner focus:outline-none data-[state=checked]:bg-blue-600 transition-colors">
                            <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform duration-100 translate-x-1 will-change-transform data-[state=checked]:translate-x-6" />
                        </Switch.Root>
                    </div>

                    {/* Género Select */}
                    <div className="flex flex-col gap-3">
                        <label className="text-[11px] font-black tracking-[0.1em] text-white/90">Género</label>
                        <Select.Root value={gender} onValueChange={setGender}>
                            <Select.Trigger className="bg-zinc-900 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-white/20 transition-all font-light flex items-center justify-between text-white/60">
                                <Select.Value />
                                <Select.Icon><ChevronDown className="w-4 h-4 text-white/20" /></Select.Icon>
                            </Select.Trigger>
                            <Select.Portal>
                                <Select.Content className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[6000]">
                                    <Select.ScrollUpButton />
                                    <Select.Viewport className="p-2">
                                        <SelectItem value="man">Hombre</SelectItem>
                                        <SelectItem value="woman">Mujer</SelectItem>
                                        <SelectItem value="non-binary">No binario</SelectItem>
                                        <SelectItem value="prefer-not-to-say">Prefiero no decirlo</SelectItem>
                                    </Select.Viewport>
                                </Select.Content>
                            </Select.Portal>
                        </Select.Root>
                        <span className="text-[9px] text-white/20">No se incluirá en tu perfil público de forma explícita.</span>
                    </div>

                    {/* Suggestions Switch Card */}
                    <div className="bg-zinc-900 border border-white/5 rounded-[1.5rem] p-8 flex flex-col gap-6 mt-12 hover:border-white/10 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white/90">Mostrar sugerencias de cuentas en los perfiles</span>
                            <Switch.Root checked={showSuggestions} onCheckedChange={setShowSuggestions} className="w-11 h-6 bg-white/[0.05] rounded-full relative shadow-inner focus:outline-none data-[state=checked]:bg-blue-600 transition-colors">
                                <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform duration-100 translate-x-1 will-change-transform data-[state=checked]:translate-x-6" />
                            </Switch.Root>
                        </div>
                        <p className="text-[10px] text-white/30 leading-relaxed">
                            Elige si las personas pueden ver sugerencias de cuentas similares en tu perfil y si se puede sugerir tu cuenta en otros perfiles.
                        </p>
                    </div>

                    {/* Footer Info & Button */}
                    <div className="pt-12 flex flex-col items-center gap-12">
                        <p className="text-[9px] text-white/20 text-center leading-loose max-w-lg">
                            Cierta información del perfil, como tu nombre, presentación y enlaces, es visible para todos en la red de Roosevelt. Consulta qué <span className="text-blue-500 underline cursor-pointer">información del perfil es visible</span>.
                        </p>
                        <Button 
                            onClick={handleSave}
                            disabled={updating}
                            className="w-full bg-blue-700 hover:bg-blue-600 text-white font-black text-xs tracking-[0.2em] uppercase py-8 rounded-[1.2rem] shadow-2xl transition-all"
                        >
                            {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar'}
                        </Button>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}

const SelectItem = ({ children, value, ...props }: any) => {
    return (
        <Select.Item 
            value={value} 
            className="flex items-center justify-between px-4 py-3 text-xs text-white/60 hover:text-white hover:bg-white/5 outline-none cursor-pointer rounded-xl transition-colors"
            {...props}
        >
            <Select.ItemText>{children}</Select.ItemText>
            <Select.ItemIndicator>
                <Check className="w-3 h-3 text-blue-500" />
            </Select.ItemIndicator>
        </Select.Item>
    );
};
