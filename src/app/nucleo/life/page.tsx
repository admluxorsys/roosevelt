'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeCarousel } from './components/LifeCarousel';
import Link from 'next/link';
import { Briefcase, Pencil, Fingerprint, BadgeCheck, Gem, TrendingDown, Mail, Lock, Calendar } from 'lucide-react';
import { FloatingOrbitNav } from '@/components/FloatingOrbitNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { IdentitySwitcher } from '@/components/IdentitySwitcher';

const personalInformationItems = [
    { href: '#id', icon: Fingerprint, label: 'Identity' },
    { href: '#lic', icon: BadgeCheck, label: 'Licenses' },
    { href: '#assets', icon: Gem, label: 'Activos' },
    { href: '#liab', icon: TrendingDown, label: 'Pasivos' },
    { href: '#mail', icon: Mail, label: 'Emails' },
    { href: '#pass', icon: Lock, label: 'Passwords' },
    { href: '#bio', icon: Calendar, label: 'Personal' },
];

export default function LifeDashboard() {

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-black text-white overflow-hidden relative selection:bg-blue-500/30 select-none">
                {/* Pure Black Background */}
                <div className="absolute inset-0 bg-black" />

                {/* Personal Information Orbit Menu */}
                <FloatingOrbitNav 
                    title="PERSONAL DATA"
                    items={personalInformationItems}
                    colorClass="bg-rose-600"
                />

                {/* Main layout - Fixed height, no scrolling */}
                <div className="relative z-10 w-full h-screen flex flex-col items-center justify-between pt-10 pb-6 overflow-hidden no-scrollbar">

                    {/* Global Identity Switcher Glass Pill */}
                    <IdentitySwitcher />
                    {/* 1. Greeting Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 1 }}
                        className="mt-4 mb-0 text-center relative z-[2000] px-6"
                    >
                        <span className="text-lg md:text-xl font-light text-white/50 tracking-tight block mb-2 uppercase">El Triángulo de la Existencia</span>
                        <h2 className="text-2xl md:text-4xl font-extralight tracking-tighter text-white leading-tight">
                            Your Personal Dashboard
                        </h2>
                    </motion.div>

                    {/* 2. Carousel Area - Flexible space */}
                    <div className="relative w-full flex-1 flex items-center justify-center min-h-0">
                        <LifeCarousel />
                    </div>

                    {/* 3. Title Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="text-center relative z-[2000] pointer-events-none mt-2 pb-6"
                    >
                        <div className="h-[1px] w-8 bg-white/10 mx-auto mb-6" />
                        <h1 className="text-xs md:text-sm font-light tracking-[0.3em] mb-2 text-white/20 uppercase">
                            The Core of Being
                        </h1>
                        <p className="text-neutral-500 max-w-lg mx-auto leading-relaxed text-[10px] md:text-xs opacity-20 px-6">
                            Cuerpo, Mente y Realidad. El sostén biológico, el procesador de emociones, y el escenario de creación.
                        </p>
                    </motion.div>

                </div>
            </div>
        </ProtectedRoute>
    );
}

