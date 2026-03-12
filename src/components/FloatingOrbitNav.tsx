'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimationFrame, PanInfo } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface NavItem {
    href: string;
    icon: LucideIcon;
    label: string;
}

interface FloatingOrbitNavProps {
    items: NavItem[];
    title: string;
    colorClass?: string;
}

const RADIUS_X = 600;
const RADIUS_Z = 120;
const PERSPECTIVE = 1200;
const AUTO_ROTATION_SPEED = -0.12;
const DRAG_SENSITIVITY = 0.15;
const MOMENTUM_FRICTION = 0.95;

export function FloatingOrbitNav({ items, title, colorClass = "bg-purple-600" }: FloatingOrbitNavProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [lastRotation, setLastRotation] = useState(0);
    const isDragging = useRef(false);
    const pathname = usePathname();

    const allItems = [
        { href: "/suite", icon: ChevronLeft, label: "Back" },
        ...items,
    ];

    useAnimationFrame((t) => {
        if (!isDragging.current) {
            setRotation(prev => prev + AUTO_ROTATION_SPEED);
        }
    });

    const handlePan = useCallback((_: any, info: PanInfo) => {
        setRotation(lastRotation + (info.offset.x * DRAG_SENSITIVITY));
    }, [lastRotation]);

    const handlePanStart = useCallback(() => {
        isDragging.current = true;
        setLastRotation(rotation);
    }, [rotation]);

    const handlePanEnd = useCallback(() => {
        isDragging.current = false;
        setLastRotation(rotation);
    }, [rotation]);

    return (
        <div 
            className="fixed top-0 left-0 w-full z-[5000] h-64 select-none pointer-events-none"
        >
            {/* 1. Central Trigger zone */}
            <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-20 pointer-events-auto"
                onMouseEnter={() => setIsHovered(true)}
            />

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="relative w-full h-full flex items-center justify-center p-0 m-0 pointer-events-auto"
                        onMouseLeave={() => {
                            if (!isDragging.current) setIsHovered(false);
                        }}
                    >
                        {/* 2. Background Layer - Full Width Glass */}
                        <motion.div 
                            className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/40 to-transparent backdrop-blur-[2px] border-b border-white/5 cursor-grab active:cursor-grabbing pointer-events-auto"
                            onPan={handlePan}
                            onPanStart={handlePanStart}
                            onPanEnd={handlePanEnd}
                        />

                        {/* 3. Central Anchor Point */}
                        <div className="relative w-0 h-0 flex items-center justify-center perspective-[1200px]">
                            
                            {/* Department Info - Positioned slightly below top edge to be visible */}
                            <motion.div 
                                className="absolute flex flex-col items-center justify-center pointer-events-none z-50"
                                initial={{ opacity: 0, y: -80, scale: 0.95 }}
                                animate={{ opacity: 1, y: -110, scale: 1 }} // Moved down slightly from -128 to show full text
                                transition={{ duration: 0.3 }}
                            >
                                <h2 className="text-white/40 text-[11px] font-medium uppercase tracking-[0.6em] mr-[-0.6em] whitespace-nowrap">
                                    {title}
                                </h2>
                            </motion.div>

                            {/* Orbiting Items - Balanced gap */}
                            {allItems.map((item, index) => {
                                const angleDeg = (360 / allItems.length) * index + rotation;
                                const angleRad = (angleDeg * Math.PI) / 180;
                                
                                const x = Math.sin(angleRad) * RADIUS_X;
                                const z = Math.cos(angleRad) * RADIUS_Z;
                                
                                const isActive = pathname === item.href || (item.href !== '/suite' && pathname.startsWith(item.href));
                                const scaleFactor = (z + PERSPECTIVE) / PERSPECTIVE;
                                const opacity = Math.max(0.4, (z + RADIUS_Z) / (2 * RADIUS_Z) + 0.2);

                                return (
                                    <motion.div
                                        key={item.label}
                                        className="absolute flex items-center justify-center pointer-events-auto"
                                        style={{
                                            zIndex: Math.round(z + 200),
                                            width: 0, 
                                            height: 0
                                        }}
                                        animate={{
                                            x: x,
                                            scale: scaleFactor,
                                            opacity: opacity,
                                            y: (z * 0.05) - 45 // Adjusted to follow the title smoothly
                                        }}
                                        transition={{ type: "tween", duration: 0 }}
                                    >
                                        <Link 
                                            href={item.href}
                                            className="flex flex-col items-center group/item p-4"
                                            draggable={false}
                                        >
                                            <div className="relative flex items-center justify-center mb-1">
                                                <item.icon className={`w-7 h-7 ${isActive ? 'text-white' : 'text-white/40 group-hover/item:text-white'} transition-all duration-500 ${isActive ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''}`} />
                                                
                                                {isActive && (
                                                    <motion.div 
                                                        layoutId="active-glow"
                                                        className="absolute inset-0 bg-white/10 rounded-full blur-2xl -z-10"
                                                    />
                                                )}
                                            </div>
                                            <span className={`text-[10px] uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${isActive ? 'text-white font-medium' : 'text-white/30 group-hover/item:text-white'}`}>
                                                {item.label}
                                            </span>
                                            {isActive && (
                                                <motion.div 
                                                    layoutId="active-dot"
                                                    className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shadow-[0_0_10px_white]"
                                                />
                                            )}
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
