import React, { useState } from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";

interface NewProjectModalProps {
    show: boolean;
    setShow: (show: boolean) => void;
    onCreate: (name: string) => void;
}

export const NewProjectModal = ({ show, setShow, onCreate }: NewProjectModalProps) => {
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!show) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        await onCreate(name);
        setIsSubmitting(false);
        setName("");
        setShow(false);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-[#09090b] border border-[#222] rounded-3xl shadow-2xl p-8 relative overflow-hidden ring-1 ring-white/10">

                {/* Decorative gradients */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-600/20 rounded-full blur-[100px]" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-600/20 rounded-full blur-[100px]" />

                <button
                    onClick={() => setShow(false)}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>

                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Nuevo Proyecto</h2>
                    <p className="text-gray-400 text-sm mb-8">
                        Dale un nombre a tu idea. La IA se encargar├í del resto.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Nombre del Proyecto
                                </label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Landing Page Startup..."
                                    className="w-full bg-[#18181b] border border-[#27272a] text-white rounded-xl px-4 py-3 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!name.trim() || isSubmitting}
                                className="w-full bg-white text-black font-bold h-12 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Crear Proyecto <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

