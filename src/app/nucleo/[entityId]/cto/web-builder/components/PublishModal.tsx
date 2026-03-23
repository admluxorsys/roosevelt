import React, { useState } from "react";
import { X, Rocket, Globe, ChevronRight, Layout, Shield, Info, Loader2 } from "lucide-react";

interface PublishModalProps {
    show: boolean;
    setShow: (show: boolean) => void;
    projectName: string;
    onPublish: (details: { url: string, domain: string, description: string, visibility: string }) => void;
    isPublishing: boolean;
}

export const PublishModal = ({ show, setShow, projectName, onPublish, isPublishing }: PublishModalProps) => {
    const [url, setUrl] = useState(projectName.toLowerCase().replace(/\s+/g, '-'));
    const [domain, setDomain] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState("public");

    if (!show) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onPublish({ url, domain, description, visibility });
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full max-w-xl bg-[#09090b] border border-[#222] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
                {/* Header with Background Glow */}
                <div className="relative p-8 border-b border-[#1a1a1a] bg-[#0c0c0e] overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[80px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 blur-[60px] rounded-full" />

                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Rocket className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Publicar Proyecto</h2>
                                <p className="text-sm text-gray-500 font-medium">Configura el lanzamiento de <span className="text-blue-400">"{projectName}"</span></p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShow(false)}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {/* Basic Info Group */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">
                            <Info className="w-3 h-3" /> Información Básica
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 ml-1">URL del Sitio</label>
                            <div className="relative flex items-center group">
                                <div className="absolute left-4 text-gray-500 text-sm font-medium border-r border-[#333] pr-3 py-1 group-focus-within:border-blue-500/50 transition-colors">roosevelt.com/</div>
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="w-full pl-[124px] pr-4 py-3.5 bg-[#111] border border-[#222] focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-sm text-white transition-all outline-none"
                                    placeholder="mi-proyecto-increible"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 ml-1">Dominio Personalizado (Opcional)</label>
                            <div className="relative flex items-center">
                                <Globe className="absolute left-4 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-[#111] border border-[#222] focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-sm text-white transition-all outline-none"
                                    placeholder="www.tu-sitio.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SEO & Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-400 ml-1">Descripción del Proyecto</label>
                        <div className="relative">
                            <Layout className="absolute left-4 top-4 w-4 h-4 text-gray-500" />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full pl-11 pr-4 py-4 bg-[#111] border border-[#222] focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-sm text-white transition-all outline-none resize-none"
                                placeholder="Describe brevemente de qué trata tu página..."
                            />
                        </div>
                    </div>

                    {/* Visibility Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">
                            <Shield className="w-3 h-3" /> Privacidad & Visibilidad
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setVisibility("public")}
                                className={`p-4 rounded-2.5xl border transition-all text-left flex flex-col gap-2 ${visibility === "public"
                                        ? "bg-blue-500/10 border-blue-500/50 ring-4 ring-blue-500/5"
                                        : "bg-[#111] border-[#222] hover:border-[#333]"
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${visibility === "public" ? "bg-blue-400" : "bg-gray-600"}`} />
                                <div className="text-xs font-bold text-white">Publico</div>
                                <div className="text-[10px] text-gray-500 leading-tight">Cualquiera puede ver la página y el código.</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setVisibility("private")}
                                className={`p-4 rounded-2.5xl border transition-all text-left flex flex-col gap-2 ${visibility === "private"
                                        ? "bg-purple-500/10 border-purple-500/50 ring-4 ring-purple-500/5"
                                        : "bg-[#111] border-[#222] hover:border-[#333]"
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${visibility === "private" ? "bg-purple-400" : "bg-gray-600"}`} />
                                <div className="text-xs font-bold text-white">Privado</div>
                                <div className="text-[10px] text-gray-500 leading-tight">Solo tú y tus colaboradores pueden acceder.</div>
                            </button>
                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="p-8 bg-[#0c0c0e] border-t border-[#1a1a1a] flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => setShow(false)}
                        className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isPublishing}
                        className="relative px-8 py-3 bg-white text-black font-black text-sm rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5 flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPublishing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Publicando...
                            </>
                        ) : (
                            <>
                                Confirmar Lanzamiento
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

