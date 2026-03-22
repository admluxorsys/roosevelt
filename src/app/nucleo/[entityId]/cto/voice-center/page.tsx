"use client";

import React from "react";
import { Mic, Phone, Play, Settings, Users, History, MessageSquare, Bot } from "lucide-react";
import { motion } from "framer-motion";


export default function VoiceCenterPage() {
    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white">

            <div className="flex-1 flex flex-col p-8 md:p-12 space-y-6 overflow-hidden">
                {/* Header */}
                <div className="mb-10 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-medium tracking-tight">Voice AI Center</h1>
                        <p className="text-neutral-400 mt-3 text-lg">
                            Automatización de llamadas con inteligencia artificial humana.
                        </p>
                    </div>
                    <div className="flex gap-3 mt-2">
                        <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-all border border-white/5">
                            <Settings className="w-4 h-4" /> Configuración
                        </button>
                        <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20">
                            <Phone className="w-4 h-4" /> Nueva Campaña
                        </button>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-auto bg-scrollbar-hide">
                    {/* Active Agents Column */}
                    <div className="glass-card p-6 border border-white/5 bg-white/5 rounded-2xl flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium flex items-center gap-2">
                                <Bot className="text-blue-400" /> Agentes Activos
                            </h2>
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/20">3 Online</span>
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-medium">A{i}</div>
                                            <div>
                                                <h3 className="text-sm font-medium">Soporte Nivel {i}</h3>
                                                <p className="text-xs text-gray-500">ElevenLabs - Spanish</p>
                                            </div>
                                        </div>
                                        <Play className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Real-time Monitor Column */}
                    <div className="glass-card md:col-span-2 p-6 border border-white/5 bg-white/5 rounded-2xl flex flex-col gap-4">
                        <h2 className="text-lg font-medium flex items-center gap-2">
                            <Mic className="text-red-400" /> Monitor en Tiempo Real
                        </h2>
                        <div className="flex-1 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center p-12 space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                                <Mic className="w-16 h-16 text-blue-400 relative z-10" />
                            </div>
                            <div>
                                <p className="text-gray-400">No hay llamadas activas actualmente</p>
                                <p className="text-xs text-gray-600">Las llamadas automáticas aparecerán aquí cuando se inicie una campaña.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

