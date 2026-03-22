'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface OrbNodeProps {
    href?: string;
    onClick?: () => void;
    icon: LucideIcon;
    title: string;
    subtitle: string;
    color: string;
    index: number;
    total: number;
}

const shadowColors: Record<string, string> = {
    blue: 'rgba(59, 130, 246, 0.5)',
    emerald: 'rgba(16, 185, 129, 0.5)',
    purple: 'rgba(168, 85, 247, 0.5)',
    slate: 'rgba(100, 116, 139, 0.5)',
    amber: 'rgba(245, 158, 11, 0.5)',
    pink: 'rgba(236, 72, 153, 0.5)',
    rose: 'rgba(244, 63, 94, 0.5)',
    indigo: 'rgba(99, 102, 241, 0.5)',
};

export const OrbNode = ({ href, onClick, icon: Icon, title, subtitle, color }: Omit<OrbNodeProps, 'index' | 'total'>) => {
    const InnerContent = (
        <>
            <motion.div
                className="flex items-center justify-center transition-all duration-500 relative"
                whileHover={{
                    filter: `drop-shadow(0 0 35px ${shadowColors[color] || 'rgba(255,255,255,0.4)'})`,
                    scale: 1.12
                }}
            >
                <Icon className="w-10 h-10 text-white/70 group-hover:text-white transition-colors duration-500" />
            </motion.div>
            <div className="text-center transition-all duration-500">
                <p className="text-sm font-bold text-white uppercase tracking-tight whitespace-nowrap opacity-70 group-hover:opacity-100">{title}</p>
                <p className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] opacity-50 group-hover:opacity-100">{subtitle}</p>
            </div>
        </>
    );

    if (href && href !== '#') {
        return (
            <Link href={href} className="group flex flex-col items-center gap-2">
                {InnerContent}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className="group flex flex-col items-center gap-2 cursor-pointer outline-none bg-transparent border-none p-0 inline-flex">
            {InnerContent}
        </button>
    );
};

