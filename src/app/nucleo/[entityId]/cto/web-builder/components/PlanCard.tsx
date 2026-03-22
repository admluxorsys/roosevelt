
import React from 'react';
import {
    Sparkles,
    FileCode2,
    Layout,
    ListChecks,
    Check,
    X,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlanCardProps {
    plan: {
        summary: string;
        structure: string[];
        features: string[];
        theme: string;
    };
    onApprove: () => void;
    onReject: () => void;
}

export const PlanCard = ({ plan, onApprove, onReject }: PlanCardProps) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Helper to safely render text that might be an object from AI
    const safeText = (text: any, fallback = "") => {
        if (typeof text === 'string') return text;
        if (typeof text === 'number') return String(text);
        if (text && typeof text === 'object') {
            if (text.name) return String(text.name);
            if (text.FONT) return `Design: ${text.FONT}`;
            if (Array.isArray(text)) return text.join(", ");
            const keys = Object.keys(text);
            if (keys.length > 0 && typeof text[keys[0]] === 'string') return text[keys[0]];
            return JSON.stringify(text).substring(0, 40) + "...";
        }
        return fallback;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full mt-4 overflow-hidden rounded-2xl border bg-[#0c0c0e]/80 backdrop-blur-2xl border-blue-500/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
            {/* Header: ¿Qué vamos a hacer? Style */}
            <div className="px-5 pt-5 pb-2">
                <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse" />
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.15em]">
                        ¿Qué vamos a hacer?
                    </span>
                </div>
                <p className="text-[13px] text-white/90 leading-relaxed font-medium tracking-tight">
                    {safeText(plan.summary)}
                </p>
            </div>

            {/* Details Accordion (Subtle) */}
            <div className="px-5 pb-2">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 group py-2"
                >
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                        <ListChecks className="w-3 h-3 text-blue-500/50" />
                        Detalles técnicos
                    </span>
                    {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-600" /> : <ChevronDown className="w-3 h-3 text-gray-600" />}
                </button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden space-y-4 pb-4 pt-1"
                        >
                            {/* Features */}
                            {plan.features?.length > 0 && (
                                <div>
                                    <h4 className="text-[8px] font-black text-gray-600 uppercase mb-2 flex items-center gap-2">
                                        <Layout className="w-2.5 h-2.5" /> Mejoras en la interfaz
                                    </h4>
                                    <div className="grid grid-cols-1 gap-1.5 ml-1">
                                        {plan.features.map((feature, i) => (
                                            <div key={i} className="flex items-start gap-2 group">
                                                <div className="mt-1 w-1 h-1 rounded-full bg-blue-500/30 group-hover:bg-blue-400 transition-colors"></div>
                                                <span className="text-[10px] text-gray-500 group-hover:text-gray-400 transition-colors">
                                                    {safeText(feature)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Structure */}
                            {plan.structure?.length > 0 && (
                                <div>
                                    <h4 className="text-[8px] font-black text-gray-600 uppercase mb-2 flex items-center gap-2">
                                        <FileCode2 className="w-2.5 h-2.5" /> Archivos afectados
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5 ml-1">
                                        {plan.structure.map((file: any, i) => (
                                            <div key={i} className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[9px] text-gray-600 font-mono flex items-center gap-1.5 transition-all">
                                                <div className="w-1 h-1 rounded-full bg-gray-700"></div>
                                                {typeof file === 'string' ? file.split('/').pop() : 'file'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Actions Panel */}
            <div className="p-4 bg-[#08080a] border-t border-white/5 flex items-center gap-3">
                <button
                    onClick={onApprove}
                    className="flex-1 group relative overflow-hidden bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Aprobar Plan</span>
                </button>
                <button
                    onClick={onReject}
                    className="px-5 bg-[#1a1a1c] hover:bg-[#222225] text-gray-400 text-[11px] font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all border border-white/5 active:scale-95 flex items-center justify-center gap-2"
                >
                    <span>Modificar</span>
                </button>
            </div>
        </motion.div>
    );
};

