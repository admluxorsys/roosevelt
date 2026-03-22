'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Carousel } from './components/Carousel';
import { User, Pencil, Briefcase, Plus, Wallet, Fingerprint, FileCheck, Gem } from 'lucide-react';
import Link from 'next/link';
import { FloatingOrbitNav } from '@/components/FloatingOrbitNav';
import ProtectedRoute from '@/components/ProtectedRoute';

const informationItems = [
    { href: '#wallets', icon: Wallet, label: 'Wallets' },
    { href: '#ein', icon: Fingerprint, label: 'EIN' },
    { href: '#licenses', icon: FileCheck, label: 'Licenses' },
    { href: '#activos', icon: Gem, label: 'Activos' },
];

export default function SuiteDashboard() {
    const [isProfileHovered, setIsProfileHovered] = useState(false);
    const [isAddHovered, setIsAddHovered] = useState(false);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-black text-white overflow-hidden relative selection:bg-blue-500/30 select-none">
                {/* Pure Black Background */}
                <div className="absolute inset-0 bg-black" />

                {/* Information Orbit Menu */}
                <FloatingOrbitNav 
                    title="INFORMATION"
                    items={informationItems}
                    colorClass="bg-blue-600"
                />

                {/* Main layout - Fixed height, no scrolling */}
                <div className="relative z-10 w-full h-screen flex flex-col items-center justify-between pt-10 pb-6 overflow-hidden no-scrollbar">

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 1 }}
                        className="mt-4 mb-0 text-center relative z-[2000] px-6"
                    >
                        <span className="text-2xl md:text-3xl font-light text-white/50 tracking-tight block mb-2">Hi Udreamms</span>
                        <h2 className="text-2xl md:text-4xl font-extralight tracking-tighter text-white leading-tight">
                            Where should we start?
                        </h2>
                    </motion.div>

                    {/* 2. Carousel Area - Flexible space */}
                    <div className="relative w-full flex-1 flex items-center justify-center min-h-0">
                        <Carousel />
                    </div>

                    {/* 3. Title Section: Smaller and more subtle */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="text-center relative z-[2000] pointer-events-none mt-2 pb-6"
                    >
                        <div className="h-[1px] w-8 bg-white/10 mx-auto mb-6" />
                        <h1 className="text-xs md:text-sm font-light tracking-[0.3em] mb-2 text-white/20 uppercase">
                            Autonomous Management System
                        </h1>
                        <p className="text-neutral-500 max-w-lg mx-auto leading-relaxed text-[10px] md:text-xs opacity-20 px-6">
                            Unified governance through decentralized protocols. Harmonizing operations, finance, and technology in a single autonomous flow.
                        </p>
                    </motion.div>

                    {/* 4. Top Left Profile Hover Trigger Zone */}
                    <div 
                        className="fixed top-0 left-0 w-64 h-32 z-[7000]"
                        onMouseEnter={() => setIsProfileHovered(true)}
                        onMouseLeave={() => setIsProfileHovered(false)}
                    />

                    <AnimatePresence>
                        {isProfileHovered && (
                            <motion.div
                                initial={{ opacity: 0, y: -40, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -40, scale: 0.8 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className="fixed top-12 left-12 z-[8000]"
                                onMouseEnter={() => setIsProfileHovered(true)}
                                onMouseLeave={() => setIsProfileHovered(false)}
                            >
                                <Link href="/nucleo/life" className="relative group block">
                                    <div className="w-20 h-20 rounded-full border border-white/20 bg-black/40 backdrop-blur-xl flex items-center justify-center hover:bg-white/10 hover:border-white/40 transition-all duration-300">
                                        <User className="w-10 h-10 text-white/70 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="absolute -bottom-2 bg-black/80 text-white/70 text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 left-1/2 -translate-x-1/2 whitespace-nowrap shadow-lg">Life</div>
                                    {/* Pencil Edit Icon */}
                                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-black transform transition-transform hover:scale-110 hover:bg-blue-500 cursor-pointer">
                                        <Pencil className="w-4 h-4 text-white" />
                                    </div>
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 5. Top Right ADD Hover Trigger Zone */}
                    <div 
                        className="fixed top-0 right-0 w-64 h-32 z-[7000]"
                        onMouseEnter={() => setIsAddHovered(true)}
                        onMouseLeave={() => setIsAddHovered(false)}
                    />

                    <AnimatePresence>
                        {isAddHovered && (
                            <motion.div
                                initial={{ opacity: 0, y: -40, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -40, scale: 0.8 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className="fixed top-12 right-12 z-[8000]"
                                onMouseEnter={() => setIsAddHovered(true)}
                                onMouseLeave={() => setIsAddHovered(false)}
                            >
                                <Link href="#" className="relative group block">
                                    <div className="w-20 h-20 rounded-full border border-white/20 bg-black/40 backdrop-blur-xl flex items-center justify-center hover:bg-white/10 hover:border-white/40 transition-all duration-300">
                                        <Plus className="w-10 h-10 text-white/70 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="absolute -bottom-2 bg-black/80 text-white/70 text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 left-1/2 -translate-x-1/2 whitespace-nowrap shadow-lg">ADD</div>
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </ProtectedRoute>
    );
}

