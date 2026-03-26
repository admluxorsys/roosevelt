'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { 
    ArrowLeft, Plus, Settings, Edit3, Folder, 
    Calendar, Activity, Award, Star, 
    ChevronRight, ExternalLink, Shield
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { auth, storage, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';

export default function ProfileViewPage() {
    const router = useRouter();
    const { currentUser, loading } = useAuth();
    const [mounted, setMounted] = useState(false);
    
    // Stats Mock (In production this would come from analytics sub-vaults)
    const stats = {
        projects: 0,
        followers: 124,
        following: 89,
        handle: '@luxor_sys',
        dailyAverage: '0.0 edits',
        daysActive: '0 days',
        currentStreak: '0 days',
        totalEdits: 0
    };

    useEffect(() => {
        setMounted(true);
        if (!loading && !currentUser) {
            router.push('/login');
        }
    }, [currentUser, loading, router]);

    if (!mounted || loading || !currentUser) return <ConnectingState />;

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-blue-500/30 pb-32 overflow-x-hidden">
            
            {/* Nav Superior */}
            <div className="fixed top-0 left-0 right-0 h-16 z-50 px-12 flex items-center justify-between border-b border-white/[0.03] backdrop-blur-3xl bg-black/40">
                <button 
                    onClick={() => router.push('/nucleo')}
                    className="flex items-center gap-4 text-neutral-500 hover:text-white transition-all group scale-90 origin-left"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-[10px] font-bold tracking-[0.5em] uppercase">Gateway</span>
                </button>

                <div className="flex items-center gap-6">
                    <button className="text-[9px] font-bold tracking-[0.4em] uppercase text-white/20 hover:text-white transition-all">Support</button>
                    <button className="text-[9px] font-bold tracking-[0.4em] uppercase text-white/20 hover:text-white transition-all">Doc</button>
                    <div className="h-4 w-[1px] bg-white/5" />
                    <button onClick={() => signOut(auth)} className="text-[9px] font-bold tracking-[0.4em] uppercase text-red-500/50 hover:text-red-500 transition-all">Disconnect</button>
                </div>
            </div>

            <main className="max-w-6xl mx-auto pt-24 px-8">
                
                {/* Profile Header Block */}
                <div className="relative mb-16">
                    {/* Banner Gradient Cinematográfico */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="w-full h-64 md:h-80 rounded-[2rem] overflow-hidden relative shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 via-indigo-600 to-purple-800 opacity-80" />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                    </motion.div>

                    {/* Avatar Overlap */}
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="absolute -bottom-12 left-12"
                    >
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-8 border-[#0A0A0A] shadow-2xl overflow-hidden bg-zinc-900 group cursor-pointer relative">
                            <Avatar className="w-full h-full border-none">
                                <AvatarImage src={currentUser.photoURL || ''} />
                                <AvatarFallback className="bg-gradient-to-br from-neutral-800 to-black text-4xl font-extralight uppercase border-none">
                                    {currentUser.displayName?.[0] || '•'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="w-8 h-8 text-white/50" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Identity Info */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="pt-10"
                    >
                        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-2">{currentUser.displayName || 'Luxor Identity'}</h1>
                        <div className="flex items-center gap-4 text-white/30 text-xs font-medium tracking-wide">
                            <span className="text-blue-500 font-bold tracking-widest uppercase text-[10px]">@{currentUser.email?.split('@')[0]}</span>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <span><strong className="text-white/80">0</strong> followers</span>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <span><strong className="text-white/80">0</strong> following</span>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="pt-10 flex gap-4"
                    >
                        <Button 
                            variant="ghost" 
                            className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold tracking-widest uppercase px-8 h-12 rounded-full border border-white/5 shadow-xl transition-all"
                            onClick={() => router.push('/perfil/edit')} // Podrías crear una subruta para el form anterior
                        >
                            Edit Profile
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold tracking-widest uppercase p-4 h-12 rounded-full border border-white/5 flex items-center gap-2"
                            onClick={() => router.push('/configuracion')}
                        >
                            Account Settings <Settings className="w-3.5 h-3.5" />
                        </Button>
                    </motion.div>
                </div>

                {/* Main Content Area: Projects Empty State */}
                <motion.div 
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="w-full bg-white/[0.01] border border-white/5 rounded-[2.5rem] py-32 flex flex-col items-center justify-center mb-24 relative overflow-hidden group hover:border-blue-500/20 transition-all duration-700 shadow-2xl"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/0 to-blue-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Folder className="w-12 h-12 text-white/5 mb-8 group-hover:text-blue-500/40 transition-all duration-700 group-hover:scale-110" />
                    <h3 className="text-xl font-light tracking-[0.2em] uppercase text-white/80 mb-2">No projects yet</h3>
                    <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/20">Projects will appear here once created</p>
                </motion.div>

                {/* Activity Visualizer (GitHub Style Heatmap) */}
                <motion.div 
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="w-full"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <h4 className="text-[10px] font-black tracking-[0.6em] uppercase text-white/40">Identity Activity Map</h4>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 bg-white/[0.02] border border-white/5 rounded-[2rem] p-10 backdrop-blur-3xl shadow-2xl">
                        
                        {/* Heatmap Area */}
                        <div className="lg:col-span-3">
                            <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-[0.4em] text-white/20 mb-6">
                                <span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span>
                            </div>
                            <div className="grid grid-cols-[repeat(52,1fr)] gap-1 md:gap-1.5 auto-rows-fr">
                                {Array.from({ length: 52 * 7 }).map((_, i) => (
                                    <div 
                                        key={i} 
                                        className="aspect-square bg-white/5 rounded-[1px] hover:bg-blue-500/40 transition-colors cursor-pointer" 
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Summary Stats Column */}
                        <div className="flex flex-col justify-center space-y-8 pl-8 border-l border-white/5 mt-8 lg:mt-0">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mb-1">Daily Average</p>
                                <p className="text-xl font-light text-white tracking-wide">0.0 edits</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mb-1">Current Streak</p>
                                <p className="text-xl font-light text-white tracking-wide">0 days</p>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">Total Edits</p>
                                    <Award className="w-3.5 h-3.5 text-blue-500/50" />
                                </div>
                                <p className="text-xl font-light text-white tracking-wide">0</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </main>

            {/* Footer Branding */}
            <div className="mt-32 text-center opacity-10">
                <span className="text-[8px] font-black tracking-[1em] uppercase">Roosevelt Identity Core (Alpha Phase)</span>
            </div>

        </div>
    );
}

function ConnectingState() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-8">
            <div className="relative">
                <div className="w-20 h-20 border-t border-blue-600 rounded-full animate-spin shadow-[0_0_40px_rgba(37,99,235,0.1)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
                </div>
            </div>
            <span className="text-white/20 tracking-[1em] text-[10px] uppercase font-bold animate-pulse">Syncing ID...</span>
        </div>
    );
}
