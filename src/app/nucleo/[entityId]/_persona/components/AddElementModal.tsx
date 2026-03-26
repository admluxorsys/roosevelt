'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ICON_MAP, AVAILABLE_COLORS } from '../constants';
import { useAuth } from '@/contexts/AuthContext';

interface AddElementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (element: any) => void;
}

export const AddElementModal = ({ isOpen, onClose, onAdd }: AddElementModalProps) => {
    const { activeEntity } = useAuth();
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('Activity');
    const [selectedColor, setSelectedColor] = useState('rose');

    const handleAdd = () => {
        if (!title.trim() || !activeEntity) return;
        onAdd({
            id: title.toLowerCase().replace(/\s+/g, '-'),
            href: `/nucleo/${activeEntity}/${title.toLowerCase().replace(/\s+/g, '-')}`,
            iconName: selectedIcon,
            title,
            subtitle,
            color: selectedColor
        });
        setTitle('');
        setSubtitle('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[8000] bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[8001] w-full max-w-lg bg-zinc-900 border border-white/10 p-6 rounded-2xl shadow-2xl"
                    >
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/50 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <h3 className="text-xl font-light text-white mb-6 uppercase tracking-widest text-center">Add Element</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2 mt-4">Title</label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30"
                                    placeholder="e.g. Finance"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2 mt-4">Subtitle</label>
                                <input 
                                    type="text" 
                                    value={subtitle}
                                    onChange={(e) => setSubtitle(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/30"
                                    placeholder="e.g. Main Income"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2 mt-4">Select Icon</label>
                                <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto no-scrollbar p-1">
                                    {Object.keys(ICON_MAP).map(iconName => {
                                        const IconDoc = ICON_MAP[iconName];
                                        return (
                                            <button
                                                key={iconName}
                                                onClick={() => setSelectedIcon(iconName)}
                                                className={`p-2 rounded-lg flex items-center justify-center transition-all ${selectedIcon === iconName ? 'bg-white/20 border border-white/40' : 'bg-black border border-white/10 hover:bg-white/10'}`}
                                            >
                                                <IconDoc className="w-5 h-5 text-white/70" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-white/50 uppercase tracking-widest mb-2 mt-4">Select Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setSelectedColor(c)}
                                            className={`px-3 py-1 rounded border text-xs uppercase cursor-pointer ${selectedColor === c ? 'bg-white/20 border-white/50 text-white' : 'bg-black border-white/10 text-white/50'}`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleAdd}
                                disabled={!title.trim()}
                                className="w-full mt-6 py-3 bg-white text-black font-semibold rounded-lg uppercase tracking-widest text-sm hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add to Orbit
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
