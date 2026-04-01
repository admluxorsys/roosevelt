'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function IdentitySwitcher() {
  const router = useRouter();

  return (
    <div className="fixed top-8 left-8 z-[9000]">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onClick={() => router.push('/nucleo')}
        className="flex items-center gap-3 px-5 py-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-medium backdrop-blur-md group shadow-xl"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Core Hub</span>
      </motion.button>
    </div>
  );
}
