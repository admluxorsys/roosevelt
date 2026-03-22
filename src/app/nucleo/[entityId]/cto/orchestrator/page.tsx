"use client";

import React from "react";
import { GitBranch, Zap, Bell, Workflow, Database, PlayCircle, PlusCircle, Link as LinkIcon } from "lucide-react";


export default function OrchestratorPage() {
    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white">

            <div className="flex-1 flex flex-col p-8 md:p-12 space-y-6 overflow-hidden">
                {/* Header */}
                <div className="mb-10 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-medium tracking-tight">Master Flow Editor</h1>
                        <p className="text-neutral-400 mt-3 text-lg">
                            Orquesta todos tus módulos de IA y servicios externos.
                        </p>
                    </div>
                    <div className="flex gap-3 mt-2">
                        <button className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2 transition-all border border-white/5">
                            <Zap className="w-4 h-4 text-yellow-400" /> Disparadores
                        </button>
                        <button className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-red-600/20 font-medium">
                            <PlusCircle className="w-4 h-4" /> Nuevo Flujo
                        </button>
                    </div>
                </div>

                {/* Main Flow Editor Canvas */}
                <div className="flex-1 bg-black/40 border border-white/5 rounded-3xl relative overflow-hidden flex items-center justify-center bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:32px_32px]">
                    {/* Mock Nodes */}
                    <div className="relative w-full h-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-16 relative">

                            {/* Input Node */}
                            <div className="w-64 bg-white/10 border border-white/20 p-4 rounded-2xl backdrop-blur-xl shadow-2xl relative z-20">
                                <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-2">
                                    <Bell className="w-5 h-5 text-yellow-400" />
                                    <span className="text-sm font-medium">New Form Lead</span>
                                </div>
                                <p className="text-[10px] text-gray-500">Google Forms → Webhook</p>
                            </div>

                            <div className="w-[2px] h-16 bg-gradient-to-b from-white/20 to-red-500/50 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>
                                </div>
                            </div>

                            {/* AI Action Node */}
                            <div className="w-64 bg-white/10 border border-red-500/30 p-4 rounded-2xl backdrop-blur-xl shadow-2xl relative z-20 overflow-hidden group">
                                <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-2">
                                    <Zap className="w-5 h-5 text-red-500" />
                                    <span className="text-sm font-medium">Analyze & Action</span>
                                </div>
                                <p className="text-[10px] text-gray-500">GPT-4o Agent Integration</p>
                            </div>

                            <div className="flex gap-32 relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-full h-8 border-l-[2px] border-r-[2px] border-white/10 rounded-t-3xl"></div>

                                {/* Output 1 */}
                                <div className="w-48 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Workflow className="w-4 h-4 text-blue-400" />
                                        <span className="text-xs font-medium">Auto kamban</span>
                                    </div>
                                </div>

                                {/* Output 2 */}
                                <div className="w-48 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Database className="w-4 h-4 text-green-400" />
                                        <span className="text-xs font-medium">Update CRM</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Floating Toolbar */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#0d0d0d] border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-8 shadow-2xl">
                        <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
                            <PlayCircle className="w-4 h-4" /> Play
                        </button>
                        <div className="w-[1px] h-4 bg-white/10"></div>
                        <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
                            <LinkIcon className="w-4 h-4" /> Connections
                        </button>
                        <div className="w-[1px] h-4 bg-white/10"></div>
                        <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
                            <GitBranch className="w-4 h-4" /> History
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


