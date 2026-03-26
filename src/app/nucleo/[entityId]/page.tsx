'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Carousel } from './components/Carousel';
import { Wallet, Fingerprint, FileCheck, Gem } from 'lucide-react';
import { FloatingOrbitNav } from '@/components/FloatingOrbitNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { IdentitySwitcher } from '@/components/IdentitySwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PersonaDashboard } from './_persona/PersonaDashboard';

const informationItems = [
    { href: '#wallets', icon: Wallet, label: 'Wallets' },
    { href: '#ein', icon: Fingerprint, label: 'EIN' },
    { href: '#licenses', icon: FileCheck, label: 'Licenses' },
    { href: '#activos', icon: Gem, label: 'Activos' },
];

export default function SuiteDashboard() {
    const { activeEntity, currentUser } = useAuth();
    const [entityType, setEntityType] = useState<string | null>(null);
    const [loadingEntity, setLoadingEntity] = useState(true);

    useEffect(() => {
        async function fetchEntityType() {
            if (!currentUser || !activeEntity) return;
            try {
                const docRef = doc(db, `users/${currentUser.uid}/entities/${activeEntity}`);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setEntityType(snap.data().type);
                }
            } catch (error) {
                console.error("Error fetching entity type:", error);
            } finally {
                setLoadingEntity(false);
            }
        }
        fetchEntityType();
    }, [activeEntity, currentUser]);

    if (loadingEntity) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white/50 tracking-widest text-xs uppercase">Connecting...</div>;
    }

    if (entityType === 'persona') {
        return <PersonaDashboard />;
    }

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
                        <span className="text-2xl md:text-3xl font-light text-white/50 tracking-tight block mb-2">Welcome Back</span>
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

                    {/* 4. Global Identity Switcher Glass Pill */}
                    <IdentitySwitcher />


                </div>
            </div>
        </ProtectedRoute>
    );
}

