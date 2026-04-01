'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Shield, User,
    ArrowLeft, Search, WalletCards, Home, Key, Network, ToggleLeft, Settings, FlaskConical, Zap, ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Solana & Web3 Imports
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import SubscriptionPayment from '@/components/solana/SubscriptionPayment';
import JupiterTerminalForm from '@/components/solana/JupiterTerminalForm';
import { useAuth } from '@/contexts/AuthContext';

// Entity Switcher Imports
import { db, auth, storage } from '@/lib/firebase';
import { collection, onSnapshot, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, X, Briefcase, Camera, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const SIDEBAR_ITEMS = [
    { id: 'public-profile', label: "View Public Profile", icon: User, bg: "bg-white/10", color: "text-white", href: "/perfil" },
    { id: 'home', label: "Home", icon: Home, bg: "bg-[#A8C7FA]", color: "text-[#062E6F]" },
    { id: 'profile', label: "Personal info", icon: User, bg: "bg-[#6DD58C]", color: "text-[#00391B]" },
    { id: 'security', label: "Security & sign-in", icon: Shield, bg: "bg-[#71BCE1]", color: "text-[#00344F]" },
    { id: 'password', label: "Google password", icon: Key, bg: "bg-[#8AB4F8]", color: "text-[#174EA6]" },
    { id: 'third-party', label: "Third-party apps & services", icon: Network, bg: "bg-[#6CC6EB]", color: "text-[#004A70]" },
    { id: 'privacy', label: "Data & privacy", icon: ToggleLeft, bg: "bg-[#C589E8]", color: "text-[#491671]" },
    { id: 'team', label: "People & sharing", icon: Users, bg: "bg-[#F88CCF]", color: "text-[#630043]" },
    { id: 'billing', label: "Wallet & subscriptions", icon: WalletCards, bg: "bg-[#FCAD70]", color: "text-[#5B2100]" },
];

export default function ConfigurationPage() {
    const router = useRouter();
    const { currentUser, activeEntity, setActiveEntity } = useAuth();
    const [activeTab, setActiveTab] = useState('billing');
    const [searchQuery, setSearchQuery] = useState('');
    const [entities, setEntities] = useState<any[]>([]);

    // Expandable Wallet Modules
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
        subscriptions: false,
        jupiter: false
    });

    // Profile Settings State
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileData, setProfileData] = useState({
        contactEmail: '',
        phone: '',
        website: '',
        address: ''
    });

    React.useEffect(() => {
        if (currentUser) {
            const q = collection(db, `users/${currentUser.uid}/entities`);
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const ents = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setEntities(ents);
            });
            return () => unsubscribe();
        }
    }, [currentUser]);

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser || !activeEntity) return;

        setIsUploadingPhoto(true);
        try {
            const imageRef = storageRef(storage, `users/${currentUser.uid}/entities/${activeEntity}/avatar_${Date.now()}`);
            await uploadBytes(imageRef, file);
            const url = await getDownloadURL(imageRef);

            const rootRef = doc(db, `users/${currentUser.uid}/entities/${activeEntity}`);
            await updateDoc(rootRef, { logoUrl: url });
            
            toast.success('Logo empresarial / Avatar actualizado');
        } catch (error) {
            console.error("Storage upload error", error);
            toast.error('Error al subir la imagen al Servidor');
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    React.useEffect(() => {
        if (!currentUser || !activeEntity) return;
        const fetchProfile = async () => {
            const ref = doc(db, `users/${currentUser.uid}/entities/${activeEntity}/settings/profile`);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                setProfileData({ ...profileData, ...snap.data() });
            } else {
                setProfileData({ contactEmail: '', phone: '', website: '', address: '' });
            }
        };
        fetchProfile();
    }, [currentUser, activeEntity]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !activeEntity) return;
        setIsSavingProfile(true);
        try {
            const ref = doc(db, `users/${currentUser.uid}/entities/${activeEntity}/settings/profile`);
            await setDoc(ref, {
                ...profileData,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            toast.success('Bóveda actualizada correctamente');
        } catch (error: any) {
            console.error("Error saving profile", error);
            toast.error('Error al actualizar datos');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans flex overflow-hidden relative">
            
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[100px] rounded-full mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* Left Sidebar */}
            <aside className="w-64 sm:w-72 h-screen shrink-0 border-r border-white/5 bg-black/50 backdrop-blur-xl relative z-10 hidden md:flex flex-col">
                <div className="p-6 flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Settings className="w-4 h-4 text-white" />
                   </div>
                   <h1 className="text-xl font-medium tracking-wide">Settings</h1>
                </div>

                <div className="px-4 pb-4">
                    <button 
                        onClick={() => router.push(`/nucleo/${activeEntity || 'gateway'}`)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Dashboard</span>
                    </button>
                </div>

                <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar pb-6 mt-4">
                    {SIDEBAR_ITEMS.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    if (item.href) {
                                        router.push(item.href);
                                    } else {
                                        setActiveTab(item.id);
                                    }
                                }}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-all text-[15px] font-medium ${
                                    isActive 
                                    ? 'bg-[#3C4043] text-white' 
                                    : 'text-[#E8EAED] hover:bg-[#3C4043]/50'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.bg}`}>
                                    <item.icon className={`w-4 h-4 ${item.color} ${isActive ? 'opacity-100' : ''}`} />
                                </div>
                                <span className="tracking-wide text-left leading-snug">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 h-screen overflow-y-auto relative z-10">
                {/* Top Right Identity Switcher */}
                <div className="absolute top-8 right-8 z-[2000]">
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button className="relative focus:outline-none group">
                                <div className="absolute inset-[-4px] rounded-full border border-blue-500/0 group-hover:border-blue-500/40 transition-all duration-500" />
                                <Avatar className="w-10 h-10 border border-white/10 shadow-2xl transition-transform group-hover:scale-110 active:scale-95">
                                    <AvatarImage src={entities.find(e => e.id === activeEntity)?.logoUrl || (entities.find(e => e.id === activeEntity)?.type === 'persona' ? currentUser?.photoURL : '')} />
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white font-bold text-xs">
                                        {entities.find(e => e.id === activeEntity)?.name?.[0] || currentUser?.displayName?.[0] || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                            <DropdownMenu.Content 
                                align="end" 
                                sideOffset={12}
                                className="w-[340px] bg-[#1A1C1E] border border-white/5 rounded-[2rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] backdrop-blur-3xl animate-in fade-in slide-in-from-top-4 duration-300 z-[3000] overflow-hidden p-0"
                            >
                                <div className="flex justify-between items-center px-6 pt-6 mb-4">
                                    <div className="flex-1 text-center">
                                        <p className="text-[11px] font-bold text-white/40 tracking-wider lowercase">{currentUser?.email}</p>
                                    </div>
                                    <DropdownMenu.Item className="focus:outline-none cursor-pointer">
                                        <X className="w-5 h-5 text-white/40 hover:text-white transition-colors" />
                                    </DropdownMenu.Item>
                                </div>

                                <div className="flex flex-col items-center px-8 pb-6 text-center border-b border-white/5">
                                    <div className="relative mb-4">
                                        <Avatar className="w-20 h-20 border border-white/10 shadow-2xl">
                                            <AvatarImage src={entities.find(e => e.id === activeEntity)?.logoUrl || (entities.find(e => e.id === activeEntity)?.type === 'persona' ? currentUser?.photoURL : '')} />
                                            <AvatarFallback className="bg-neutral-800 text-xl font-bold uppercase">
                                                {entities.find(e => e.id === activeEntity)?.name?.[0] || currentUser?.displayName?.[0] || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <h3 className="text-xl font-light text-white mb-2">Hi, {currentUser?.displayName?.split(' ')[0] || 'Luxor'}!</h3>
                                    <p className="text-xs text-blue-400 font-medium">Active Entity: {entities.find(e => e.id === activeEntity)?.name || activeEntity}</p>
                                </div>

                                {/* Entities List (Switcher) */}
                                <div className="max-h-[200px] overflow-y-auto no-scrollbar p-2">
                                    <p className="text-[9px] font-bold text-white/30 tracking-widest uppercase px-4 py-2">Switch Entity</p>
                                    {entities.map(ent => (
                                        <DropdownMenu.Item 
                                            key={ent.id}
                                            onSelect={() => {
                                                setActiveEntity(ent.id);
                                                localStorage.setItem('roosevelt_active_entity', ent.id);
                                            }}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 cursor-pointer outline-none transition-all group"
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activeEntity === ent.id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/50 group-hover:bg-white/10'}`}>
                                                {ent.type === 'persona' ? <User className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <span className={`block text-sm font-medium ${activeEntity === ent.id ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>{ent.name || ent.id}</span>
                                                <span className="block text-[10px] text-white/30 uppercase tracking-widest">{ent.type || 'Entity'}</span>
                                            </div>
                                        </DropdownMenu.Item>
                                    ))}
                                </div>

                                {/* Footer Logout */}
                                <div className="p-2 border-t border-white/5 bg-black/20">
                                    <DropdownMenu.Item 
                                        onClick={handleLogout}
                                        className="w-full bg-white/[0.03] hover:bg-red-500/10 rounded-xl flex items-center gap-4 cursor-pointer outline-none transition-all px-4 py-3 group"
                                    >
                                        <LogOut className="w-5 h-5 text-white/40 group-hover:text-red-500" />
                                        <span className="text-[11px] font-bold text-white/60 group-hover:text-red-500">Sign out</span>
                                    </DropdownMenu.Item>
                                </div>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                </div>

                <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 lg:px-12">
                     
                     {/* Header Avatar & Search */}
                     <div className="flex flex-col items-center mb-16">
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                        <motion.div 
                           onClick={() => fileInputRef.current?.click()}
                           initial={{ scale: 0.9, opacity: 0 }}
                           animate={{ scale: 1, opacity: 1 }}
                           className={`w-24 h-24 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 p-1 mb-6 relative group cursor-pointer ${isUploadingPhoto ? 'animate-pulse' : ''}`}
                        >
                           <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden relative">
                              {(() => {
                                  const currentEnt = entities.find(e => e.id === activeEntity);
                                  const photoUrl = currentEnt?.logoUrl || (currentEnt?.type === 'persona' ? currentUser?.photoURL : null);
                                  
                                  if (photoUrl) {
                                      return <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />;
                                  }
                                  return (
                                      <div className="text-3xl font-light text-white/50 tracking-widest uppercase">
                                          {currentEnt?.name?.[0] || 'E'}
                                      </div>
                                  );
                              })()}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                  {isUploadingPhoto ? (
                                      <Loader2 className="w-6 h-6 animate-spin text-white/80" />
                                  ) : (
                                      <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest text-center px-2 leading-tight">Change<br/>Photo</span>
                                  )}
                              </div>
                           </div>
                        </motion.div>
                        
                        <h2 className="text-3xl font-light mb-2 tracking-wide">
                            {entities.find(e => e.id === activeEntity)?.name || 'Cargando Entidad...'}
                        </h2>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-blue-400 font-bold mb-10">
                            {entities.find(e => e.id === activeEntity)?.type === 'persona' 
                                ? currentUser?.email 
                                : `BÓVEDA EMPRESARIAL · ${activeEntity}`
                            }
                        </p>

                        {/* Search Bar */}
                        <div className="w-full max-w-2xl relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search settings, billing, or security..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-light placeholder:text-gray-600"
                            />
                        </div>
                     </div>

                     {/* Dynamic Tab Content */}
                     <AnimatePresence mode="wait">
                         {activeTab === 'billing' && (
                             <motion.div 
                                 key="billing"
                                 initial={{ opacity: 0, y: 20 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: -20 }}
                                 transition={{ duration: 0.3 }}
                                 className="w-full max-w-4xl mx-auto space-y-8"
                             >
                                 <div className="mb-8">
                                     <h3 className="text-xl font-medium text-white mb-2">Wallet & Subscriptions</h3>
                                     <p className="text-sm text-gray-400 leading-relaxed font-light">
                                         Manage your Web3 identity, organization access tokens, and decentralized payments.
                                     </p>
                                 </div>

                                 <div className="flex flex-col gap-4">
                                     
                                     {/* Identity Connection (Phantom) */}
                                     <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[24px] bg-[#202124] hover:bg-[#2A2B2E] transition-colors border border-transparent hover:border-white/5 cursor-pointer">
                                        <div className="flex items-start gap-5 mb-4 md:mb-0">
                                           <div className="mt-1">
                                              <WalletCards className="w-6 h-6 text-blue-400" />
                                           </div>
                                           <div>
                                              <h4 className="text-[15px] font-medium text-white mb-1">Identity Connection</h4>
                                              <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">Connect your Solana Phantom Wallet to authenticate your decentralized identity. Your keys never leave your device.</p>
                                           </div>
                                        </div>
                                        <div className="shrink-0 flex items-center md:pl-6">
                                            <div className="[&_.wallet-adapter-button]:!bg-transparent [&_.wallet-adapter-button]:!border [&_.wallet-adapter-button]:!border-blue-500/30 [&_.wallet-adapter-button]:hover:!bg-blue-500/10 [&_.wallet-adapter-button]:!rounded-full [&_.wallet-adapter-button]:!text-blue-400 [&_.wallet-adapter-button]:!font-sans [&_.wallet-adapter-button]:!font-medium [&_.wallet-adapter-button]:!text-sm [&_.wallet-adapter-button]:!h-10 [&_.wallet-adapter-button]:!px-6">
                                               <WalletMultiButton />
                                            </div>
                                        </div>
                                     </div>

                                     {/* Subscriptions */}
                                     <div className="flex flex-col rounded-[24px] bg-[#202124] transition-colors border border-transparent hover:border-white/5 overflow-hidden">
                                        <div 
                                           onClick={() => setExpandedModules(p => ({...p, subscriptions: !p.subscriptions}))}
                                           className="flex items-center justify-between p-6 cursor-pointer hover:bg-[#2A2B2E] transition-colors"
                                        >
                                            <div className="flex items-start gap-5">
                                               <div className="mt-1">
                                                  <Zap className="w-6 h-6 text-green-400" />
                                               </div>
                                               <div>
                                                  <h4 className="text-[15px] font-medium text-white mb-1">Active Subscriptions</h4>
                                                  <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">Manage your recurring payments for premium AI modules and SaaS Core access via Smart Contracts.</p>
                                               </div>
                                            </div>
                                            <div className="px-4">
                                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedModules.subscriptions ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>
                                        
                                        <AnimatePresence>
                                            {expandedModules.subscriptions && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-6 pt-0 md:pl-[84px]">
                                                        {/* We customize the internal SubscriptionPayment component through CSS override to look as clean as possible */}
                                                        <div className="w-full max-w-2xl [&>div]:!m-0 [&>div]:!bg-[#1A1C1E] [&>div]:!border-white/5 [&>div]:!rounded-2xl [&>div]:!p-6 [&>div]:!shadow-none">
                                                            <SubscriptionPayment />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                     </div>

                                     {/* Jupiter Swap */}
                                     <div className="flex flex-col rounded-[24px] bg-[#202124] transition-colors border border-transparent hover:border-white/5 overflow-hidden">
                                        <div 
                                           onClick={() => setExpandedModules(p => ({...p, jupiter: !p.jupiter}))}
                                           className="flex items-center justify-between p-6 cursor-pointer hover:bg-[#2A2B2E] transition-colors"
                                        >
                                            <div className="flex items-start gap-5">
                                               <div className="mt-1">
                                                  <Network className="w-6 h-6 text-purple-400" />
                                               </div>
                                               <div>
                                                  <h4 className="text-[15px] font-medium text-white mb-1">Liquidity Swap (Jupiter)</h4>
                                                  <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">Convierte liquidez entre SOL y USDC directamente aquí utilizando el agregador descentralizado Jupiter.</p>
                                               </div>
                                            </div>
                                            <div className="px-4">
                                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedModules.jupiter ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {expandedModules.jupiter && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-6 pt-0 md:pl-[84px] flex items-center">
                                                        <div className="w-full max-w-md [&>div]:!m-0 [&>div]:!mt-0 [&>div]:!bg-[#1A1C1E] [&>div]:!border-white/5 [&>div]:!rounded-2xl [&>div]:!p-0 [&>div]:!shadow-none [&>div]:overflow-hidden">
                                                            <JupiterTerminalForm />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                     </div>

                                     {/* Stripe Bridge Placeholder */}
                                     <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[24px] bg-[#202124] border border-transparent opacity-60">
                                        <div className="flex items-start gap-5 mb-4 md:mb-0">
                                           <div className="mt-1">
                                              <Shield className="w-6 h-6 text-gray-400" />
                                           </div>
                                           <div>
                                              <h4 className="text-[15px] font-medium text-white mb-1">Stripe Bridge</h4>
                                              <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">Fiat-to-crypto bridging capabilities. Purchase USDC directly with your credit card.</p>
                                           </div>
                                        </div>
                                        <div className="shrink-0 md:pl-6">
                                            <span className="px-4 py-2 border border-white/10 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white/5">
                                                Coming Soon
                                            </span>
                                        </div>
                                     </div>
                                     
                                     {/* Squads Multisig Placeholder */}
                                     <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[24px] bg-[#202124] border border-transparent opacity-60">
                                        <div className="flex items-start gap-5 mb-4 md:mb-0">
                                           <div className="mt-1">
                                              <Users className="w-6 h-6 text-gray-400" />
                                           </div>
                                           <div>
                                              <h4 className="text-[15px] font-medium text-white mb-1">Squads Multisig Treasury</h4>
                                              <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">Manage corporate treasury and enforce multi-signature authentication.</p>
                                           </div>
                                        </div>
                                        <div className="shrink-0 md:pl-6">
                                            <span className="px-4 py-2 border border-white/10 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white/5">
                                                Coming Soon
                                            </span>
                                        </div>
                                     </div>
                                 </div>
                             </motion.div>
                         )}

                         {activeTab === 'profile' && (
                             <motion.div 
                                 key="profile"
                                 initial={{ opacity: 0, y: 20 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: -20 }}
                                 transition={{ duration: 0.3 }}
                                 className="w-full max-w-4xl mx-auto space-y-8"
                             >
                                 <div className="mb-8">
                                     <h3 className="text-xl font-medium text-white mb-2">Personal & Business Info</h3>
                                     <p className="text-sm text-gray-400 leading-relaxed font-light">
                                         Administra los datos privados de la identidad actual: <span className="text-white font-medium">{entities.find(e => e.id === activeEntity)?.name}</span>. Todo se guarda seguro en su sub-bóveda exclusiva.
                                     </p>
                                 </div>

                                 <form onSubmit={handleSaveProfile} className="space-y-6">
                                     <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl space-y-8">
                                         
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                             <div className="space-y-2">
                                                 <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Email de Contacto Privado</label>
                                                 <input 
                                                     type="email"
                                                     value={profileData.contactEmail}
                                                     onChange={e => setProfileData({...profileData, contactEmail: e.target.value})}
                                                     className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-blue-500/50 focus:outline-none transition-colors"
                                                     placeholder="ceo@empresa.com"
                                                 />
                                             </div>
                                             
                                             <div className="space-y-2">
                                                 <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Teléfono (WhatsApp/Llamadas)</label>
                                                 <input 
                                                     type="tel"
                                                     value={profileData.phone}
                                                     onChange={e => setProfileData({...profileData, phone: e.target.value})}
                                                     className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-blue-500/50 focus:outline-none transition-colors"
                                                     placeholder="+1 (555) 000-0000"
                                                 />
                                             </div>
                                         </div>

                                         <div className="space-y-2">
                                             <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Website Oficial</label>
                                             <input 
                                                 type="url"
                                                 value={profileData.website}
                                                 onChange={e => setProfileData({...profileData, website: e.target.value})}
                                                 className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-blue-500/50 focus:outline-none transition-colors"
                                                 placeholder="https://roosevelt.system"
                                             />
                                         </div>

                                         <div className="space-y-2">
                                             <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Dirección de Operaciones</label>
                                             <textarea 
                                                 rows={3}
                                                 value={profileData.address}
                                                 onChange={e => setProfileData({...profileData, address: e.target.value})}
                                                 className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-blue-500/50 focus:outline-none transition-colors resize-none"
                                                 placeholder="123 Financial District..."
                                             />
                                         </div>

                                     </div>

                                     <div className="flex justify-end">
                                         <button 
                                             type="submit"
                                             disabled={isSavingProfile}
                                             className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-8 py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                                         >
                                             {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                             <span>{isSavingProfile ? 'Sincronizando...' : 'Guardar Información'}</span>
                                         </button>
                                     </div>
                                 </form>
                             </motion.div>
                         )}

                         {activeTab !== 'billing' && activeTab !== 'profile' && (
                             <motion.div 
                                 key="placeholder"
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 exit={{ opacity: 0 }}
                                 className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-20 opacity-50"
                             >
                                 <FlaskConical className="w-12 h-12 text-gray-500 mb-6" />
                                 <h3 className="text-lg font-medium text-gray-400 tracking-wide">Section under construction</h3>
                                 <p className="text-sm text-gray-600 mt-2 font-light">The `{activeTab}` settings module is currently being built.</p>
                             </motion.div>
                         )}
                     </AnimatePresence>

                </div>
            </main>
        </div>
    );
}
