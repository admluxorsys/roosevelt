'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Scale, FileCheck, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const tools = [
    {
        name: 'Contract Management',
        description: 'Draft, review, and store legal agreements.',
        icon: Scale,
        path: '#',
        color: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    },
    {
        name: 'Compliance Monitoring',
        description: 'Track regulatory requirements for Visas and Crypto.',
        icon: FileCheck,
        path: '#',
        color: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    },
    {
        name: 'Risk & Security',
        description: 'Manage data privacy, IP protection, and legal risks.',
        icon: Lock,
        path: '#',
        color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
    }
];

export default function CLODashboard() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 pt-24">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h6 className="text-slate-500 uppercase tracking-widest text-xs font-medium mb-2">Legal Department</h6>
                        <h1 className="text-4xl md:text-5xl font-medium bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent tracking-tight">CLO Office</h1>
                        <p className="text-white/40 mt-4 max-w-xl text-lg font-light">
                            Navigate the legal landscape, ensuring compliance and protecting the company's future.
                        </p>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tools.map((tool, idx) => (
                        <motion.div
                            key={tool.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * idx }}
                            onClick={() => router.push(tool.path)}
                            className={`group cursor-pointer p-8 rounded-2xl border ${tool.color} hover:bg-opacity-20 transition-all duration-300 relative overflow-hidden`}
                        >
                            <tool.icon className="w-10 h-10 mb-6" />
                            <h3 className="text-xl font-medium mb-2 text-white/90 tracking-tight">{tool.name}</h3>
                            <p className="text-sm text-white/50 leading-relaxed mb-6">{tool.description}</p>

                            <div className="flex items-center text-xs font-medium uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
                                Launch Tool <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

