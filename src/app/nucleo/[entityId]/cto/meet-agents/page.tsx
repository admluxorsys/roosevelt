"use client";

import React from "react";
import { Video, UserPlus, Monitor, Clock, Shield, Sparkles, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";


export default function MeetAgentsPage() {
    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white">

            <div className="flex-1 flex flex-col p-8 md:p-12 space-y-6 overflow-hidden">
                {/* Header */}
                <div className="mb-10 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-medium tracking-tight">Agentes Virtuales para Meet</h1>
                        <p className="text-neutral-400 mt-3 text-lg">
                            Bots de IA con avatar para cerrar ventas 24/7 en tus reuniones.
                        </p>
                    </div>
                    <div className="flex gap-3 mt-2">
                        <button className="bg-teal-600 hover:bg-teal-500 px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-teal-600/20">
                            <UserPlus className="w-4 h-4" /> Conectar a Meet
                        </button>
                    </div>
                </div>

                {/* Stats / Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { icon: <Video />, label: "Reuniones Hoy", value: "12", color: "text-blue-400" },
                        { icon: <Clock />, label: "Horas Ahorradas", value: "24h", color: "text-green-400" },
                        { icon: <Sparkles />, label: "Cierres por IA", value: "4", color: "text-purple-400" },
                        { icon: <Shield />, label: "Confianza Bot", value: "98%", color: "text-teal-400" },
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center gap-4">
                            <div className={`${stat.color} p-2 bg-white/5 rounded-lg`}>{stat.icon}</div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-medium">{stat.label}</p>
                                <p className="text-xl font-medium">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-auto">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden aspect-video relative group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-teal-500 flex items-center justify-center text-2xl font-medium border-4 border-white/10 shadow-xl">R</div>
                                    <div>
                                        <h3 className="text-xl font-medium">Royalty AI Bot (En espera)</h3>
                                        <p className="text-teal-400 text-sm">Listo para unirse a la siguiente reunión</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-4 right-4 bg-red-600 px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider">Offline</div>
                            <div className="w-full h-full bg-slate-900 border border-white/5 flex items-center justify-center">
                                <Monitor className="w-24 h-24 text-white/5" />
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                            <h2 className="text-lg font-medium mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-teal-400" /> Historial de Asistencias</h2>
                            <div className="text-gray-500 text-center py-12">No se han registrado reuniones recientes.</div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                            <h2 className="text-lg font-medium mb-4">Configuración del Bot</h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 uppercase font-medium">Objetivo de la reunión</label>
                                    <select className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
                                        <option>Cierre de Venta Comercial</option>
                                        <option>Soporte Técnico de Cuenta</option>
                                        <option>Onboarding de Usuario</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 uppercase font-medium">Conocimiento base</label>
                                    <div className="p-3 bg-white/5 rounded-lg border border-teal-500/20 text-xs text-teal-400">
                                        CRM Royalty1 + Manual de Procesos V1
                                    </div>
                                </div>
                                <button className="w-full bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 py-3 rounded-lg border border-teal-500/20 transition-all font-medium text-sm mt-4">
                                    Personalizar Avatar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

