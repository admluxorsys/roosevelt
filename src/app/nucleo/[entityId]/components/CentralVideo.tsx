'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Central Video Component (Refined: No container)
export const CentralVideo = () => (
    <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative w-[60vw] max-w-[600px] aspect-square flex items-center justify-center p-8 z-10"
    >
        {/* The video itself, borderless */}
        <video
            autoPlay
            muted
            loop
            playsInline
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full object-contain hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
        >
            <source src="https://firebasestorage.googleapis.com/v0/b/roosevelt-491004.firebasestorage.app/o/media%2Fsphera.mp4?alt=media&token=8161da22-6280-4a9c-b87c-a0391f7fff67" type="video/mp4" />
        </video>
    </motion.div>
);

