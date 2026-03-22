
import React from 'react';
import {
    Cloud,
    Database,
    Sparkles,
    Zap,
    Globe,
    ChevronRight,
    ShieldCheck,
    Lock,
    Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CloudSetupCardProps {
    onApprove: (config: any) => void;
    onCancel: () => void;
}

export const CloudSetupCard = ({ onApprove, onCancel }: CloudSetupCardProps) => {
    const [selectedRegion, setSelectedRegion] = React.useState('us-east-1');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-4 overflow-hidden rounded-3xl border bg-[#0c0c0e] border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] font-sans"
        >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-br from-blue-600/10 to-transparent border-b border-white/5">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Cloud className="w-4 h-4 text-blue-400" />
                        </div>
                        Habilitar la nube
                    </h3>
                    <button onClick={onCancel} className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                    </button>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">Modelos de IA y backend completos listos para usar.</p>
            </div>

            {/* Features List */}
            <div className="p-1.5 space-y-1">
                {/* Feature: Integrated Backend */}
                <div className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-white/[0.03] transition-all cursor-default border border-transparent hover:border-white/5">
                    <div className="mt-1 w-10 h-10 rounded-xl bg-[#1a1a1c] border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all">
                        <Database className="w-5 h-5 text-gray-400 group-hover:text-blue-400" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">Backend integrado</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                            Base de datos PostgreSQL, almacenamiento de archivos y autenticación listos para usar en segundos.
                        </p>
                    </div>
                </div>

                {/* Feature: AI LLM */}
                <div className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-white/[0.03] transition-all cursor-default border border-transparent hover:border-white/5">
                    <div className="mt-1 w-10 h-10 rounded-xl bg-[#1a1a1c] border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-all">
                        <Cpu className="w-5 h-5 text-gray-400 group-hover:text-purple-400" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">Añade un LLM a tu aplicación</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                            Chat, generación de imágenes y análisis inteligentes integrados por defecto.
                        </p>
                    </div>
                </div>

                {/* Pricing / Scale */}
                <div className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-white/[0.03] transition-all cursor-default border border-transparent hover:border-white/5">
                    <div className="mt-1 w-10 h-10 rounded-xl bg-[#1a1a1c] border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-green-500/10 group-hover:border-green-500/20 transition-all">
                        <Zap className="w-5 h-5 text-gray-400 group-hover:text-green-400" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white group-hover:text-green-400 transition-colors">Gratis para empezar</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                            Incluye uso gratuito generoso. Paga a medida que escales tu tráfico.
                        </p>
                    </div>
                </div>

                {/* Region Selector */}
                <div className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="mt-1 w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Globe className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="space-y-2 flex-1">
                        <h4 className="text-xs font-bold text-white">Dónde está alojado su proyecto</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                            Almacenaremos los datos en esta región para mínima latencia. No se puede cambiar después.
                        </p>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-[10px] text-gray-300 font-bold outline-none focus:border-blue-500/30 transition-all"
                        >
                            <option value="us-east-1">Estados Unidos (Virginia)</option>
                            <option value="eu-west-1">Europa (Irlanda)</option>
                            <option value="sa-east-1">Sudamérica (São Paulo)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Footer / Action */}
            <div className="p-6 bg-[#08080a] border-t border-white/5 flex items-center gap-4">
                <button
                    onClick={onCancel}
                    className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold rounded-2xl border border-white/5 transition-all text-center"
                >
                    Preguntar cada vez
                </button>
                <button
                    onClick={() => onApprove({ region: selectedRegion })}
                    className="flex-[1.5] py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_10px_20px_rgba(37,99,235,0.2)] flex items-center justify-center gap-2 group"
                >
                    <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Permitir
                </button>
            </div>
        </motion.div>
    );
};

