"use client";

import React from "react";
import { Send, Users, Smartphone, Mail, Globe, Sparkles, BarChart3, Filter } from "lucide-react";


export default function CampaignsPage() {
    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white">

            <div className="flex-1 flex flex-col p-6 space-y-4">
                {/* Header */}
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight">Campañas Omnicanal</h1>
                        <p className="text-neutral-400 mt-1 text-sm">
                            Lanza campañas masivas inteligentes en segundos.
                        </p>
                    </div>
                    <button className="bg-pink-600 hover:bg-pink-500 px-4 py-1.5 rounded-lg flex items-center gap-2 transition-all shadow-md shadow-pink-600/20 font-medium text-xs mt-1">
                        <Send className="w-3 h-3" /> Crear Campaña
                    </button>
                </div>

                {/* Campaign Channels */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { icon: <Smartphone />, label: "kamban Masivo", desc: "Integrado con API oficial", color: "from-green-500/10 to-green-600/5", border: "border-green-500/20" },
                        { icon: <Mail />, label: "Email Marketing", desc: "Diseños responsivos e inteligentes", color: "from-blue-500/10 to-blue-600/5", border: "border-blue-500/20" },
                        { icon: <Globe />, label: "Anuncios Dinámicos", desc: "Facebook, Instagram y TikTok", color: "from-purple-500/10 to-purple-600/5", border: "border-purple-500/20" },
                    ].map((channel, i) => (
                        <div key={i} className={`bg-gradient-to-br ${channel.color} border ${channel.border} p-4 rounded-xl cursor-pointer hover:scale-[1.01] transition-transform`}>
                            <div className="bg-white/5 w-8 h-8 rounded-lg flex items-center justify-center mb-3 text-white/80 scale-75 origin-top-left">{channel.icon}</div>
                            <h3 className="font-medium text-sm">{channel.label}</h3>
                            <p className="text-gray-500 text-[11px] mt-0.5 leading-tight">{channel.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
                    {/* Active Campaigns List */}
                    <div className="lg:col-span-3 bg-white/5 border border-white/5 rounded-xl flex flex-col p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-medium flex items-center gap-2 uppercase tracking-wide text-neutral-300"><BarChart3 className="w-4 h-4 text-gray-400" /> Campañas Activas</h2>
                            <div className="flex gap-2">
                                <button className="bg-white/5 p-1.5 rounded-md border border-white/10 hover:bg-white/10 transition-colors"><Filter className="w-3 h-3" /></button>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                            <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-pink-400" />
                            </div>
                            <div>
                                <p className="text-gray-400 font-medium text-xs uppercase tracking-wide">No hay campañas programadas hoy</p>
                                <p className="text-[10px] text-gray-600 mt-1 max-w-xs leading-relaxed">Usa nuestra IA para generar copys persuasivos y lanza tu primera campaña ahora.</p>
                            </div>
                        </div>
                    </div>

                    {/* Audience Section */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                        <h2 className="text-sm font-medium mb-4 flex items-center gap-2 uppercase tracking-wide text-neutral-300"><Users className="w-4 h-4 text-gray-400" /> Audiencias</h2>
                        <div className="space-y-3">
                            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                <p className="text-[9px] text-gray-500 uppercase font-medium tracking-widest">Total Alcance</p>
                                <p className="text-xl font-medium mt-1">14,240</p>
                                <p className="text-[9px] text-green-400 mt-0.5 flex items-center gap-1 font-medium">↑ 12% desde el mes pasado</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wider px-1">Segmentos Top</p>
                                {["Clientes Hot", "Olvidados", "Nuevos Leads"].map((tag, idx) => (
                                    <div key={idx} className="flex items-center justify-between px-1 text-[11px] font-medium text-neutral-300">
                                        <span>{tag}</span>
                                        <span className="text-gray-500 font-mono">{100 - (idx * 20)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

