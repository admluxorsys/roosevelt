import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimationFrame, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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

export function FloatingOrbitNav({ items, title, colorClass = "bg-purple-600" }: FloatingOrbitNavProps) {
    const [isHovered, setIsHovered] = useState(false);
    const rotation = useMotionValue(0);
    const lastRotation = useRef(0);
    const isDragging = useRef(false);
    const pathname = usePathname();
    const { activeEntity } = useAuth();

    const allItems = [
        { href: `/nucleo/${activeEntity || ''}`, icon: ChevronLeft, label: "Back" },
        ...items.map(item => ({ ...item, href: item.href.replace('{entity}', activeEntity || '') })),
    ];

    useAnimationFrame(() => {
        if (!isDragging.current) {
            rotation.set(rotation.get() + AUTO_ROTATION_SPEED);
        }
    });

    const handlePan = useCallback((_: any, info: PanInfo) => {
        rotation.set(lastRotation.current + (info.offset.x * DRAG_SENSITIVITY));
    }, []);

    const handlePanStart = useCallback(() => {
        isDragging.current = true;
        lastRotation.current = rotation.get();
    }, [rotation]);

    const handlePanEnd = useCallback(() => {
        isDragging.current = false;
        lastRotation.current = rotation.get();
    }, [rotation]);

    return (
        <div 
            className="fixed top-0 left-0 w-full z-[5000] h-64 select-none pointer-events-none"
        >
            <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-1 pointer-events-auto"
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
                        <motion.div 
                            className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/40 to-transparent backdrop-blur-[2px] border-b border-white/5 cursor-grab active:cursor-grabbing pointer-events-auto"
                            onPan={handlePan}
                            onPanStart={handlePanStart}
                            onPanEnd={handlePanEnd}
                        />

                        <div className="relative w-0 h-0 flex items-center justify-center perspective-[1200px]">
                            <motion.div 
                                className="absolute flex flex-col items-center justify-center pointer-events-none z-50"
                                initial={{ opacity: 0, y: -80, scale: 0.95 }}
                                animate={{ opacity: 1, y: -110, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h2 className="text-white/40 text-[11px] font-medium uppercase tracking-[0.6em] mr-[-0.6em] whitespace-nowrap">
                                    {title}
                                </h2>
                            </motion.div>

                            {allItems.map((item, index) => (
                                <OrbitingItem 
                                    key={item.label}
                                    item={item}
                                    index={index}
                                    total={allItems.length}
                                    rotation={rotation}
                                    pathname={pathname}
                                    activeEntity={activeEntity}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function OrbitingItem({ item, index, total, rotation, pathname, activeEntity }: { 
    item: any, 
    index: number, 
    total: number, 
    rotation: any, 
    pathname: string,
    activeEntity: string | null
}) {
    const angleOffset = (360 / total) * index;
    
    // Create transformed motion values for 3D positioning
    const x = useTransform(rotation, (r: number) => {
        const rad = ((r + angleOffset) * Math.PI) / 180;
        return Math.sin(rad) * RADIUS_X;
    });
    
    const z = useTransform(rotation, (r: number) => {
        const rad = ((r + angleOffset) * Math.PI) / 180;
        return Math.cos(rad) * RADIUS_Z;
    });

    const scale = useTransform(z, (zv: number) => (zv + PERSPECTIVE) / PERSPECTIVE);
    const opacity = useTransform(z, (zv: number) => Math.max(0.4, (zv + RADIUS_Z) / (2 * RADIUS_Z) + 0.2));
    const y = useTransform(z, (zv: number) => (zv * 0.05) - 45);
    const zIndex = useTransform(z, (zv: number) => Math.round(zv + 200));

    const backHref = `/nucleo/${activeEntity || ''}`;
    const isActive = pathname === item.href || (item.href !== backHref && pathname.startsWith(item.href));

    return (
        <motion.div
            className="absolute flex items-center justify-center pointer-events-auto"
            style={{ x, y, scale, opacity, zIndex, width: 0, height: 0 }}
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
}


