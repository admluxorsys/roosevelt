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
            <source src="https://firebasestorage.googleapis.com/v0/b/udreamms-platform-1.firebasestorage.app/o/chatbot_media%2FFrom%20KlickPin%20CF%20Pinterest%20_%20Motion%20graphics%20design%20Motion%20graphics%20inspiration%20Motion%20graphics%20trendsUser_lolHe%20avatar%20link.mp4?alt=media&token=2b218cb4-a885-4360-9368-6c0cfe8f799f" type="video/mp4" />
        </video>
    </motion.div>
);

