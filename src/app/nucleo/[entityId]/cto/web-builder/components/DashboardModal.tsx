import React, { useState, useRef } from "react";
import { X, LayoutGrid, Clock, Trash2, Globe, ExternalLink, Plus, Pencil, Check } from "lucide-react";
import { WebProject } from "../types";

interface DashboardModalProps {
    show: boolean;
    setShow: (show: boolean) => void;
    projects: WebProject[];
    activeProjectId: string | null;
    handleSwitchProject: (id: string) => void;
    deleteProject: (id: string) => void;
    handleNewProject: () => void;
    updateProject?: (id: string, updates: Partial<WebProject>) => Promise<void>;
}

export const DashboardModal = ({
    show, setShow, projects, activeProjectId,
    handleSwitchProject, deleteProject, handleNewProject, updateProject
}: DashboardModalProps) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    if (!show) return null;

    const startEdit = (e: React.MouseEvent, proj: WebProject) => {
        e.stopPropagation();
        setEditingId(proj.id);
        setEditingName(proj.name);
        setTimeout(() => inputRef.current?.select(), 50);
    };

    const confirmEdit = async (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        if (!editingId || !editingName.trim()) return;
        if (updateProject) {
            await updateProject(editingId, { name: editingName.trim() });
        }
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') confirmEdit(e);
        if (e.key === 'Escape') setEditingId(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-5xl bg-[#09090b] border border-[#222] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-8 border-b border-[#1a1a1a] flex items-center justify-between bg-gradient-to-r from-[#09090b] to-[#111]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <LayoutGrid className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tighter text-white">Mis Proyectos</h2>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Gestiona y edita tus sitios web</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleNewProject}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all text-xs"
                        >
                            <Plus className="w-4 h-4" /> Nuevo Proyecto
                        </button>
                        <button onClick={() => setShow(false)} className="p-3 hover:bg-white/5 rounded-xl transition-colors">
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#0c0c0e]">
                    {projects.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center opacity-30">
                            <Globe className="w-12 h-12 text-gray-600 mb-4" />
                            <p className="text-xs font-bold text-white uppercase tracking-widest">No hay proyectos</p>
                            <button onClick={handleNewProject} className="mt-3 text-xs text-blue-500 hover:underline">
                                ¡Crea tu primer proyecto!
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {projects.map(proj => (
                                <div
                                    key={proj.id}
                                    onClick={() => { if (editingId !== proj.id) { handleSwitchProject(proj.id); setShow(false); } }}
                                    className={`group relative bg-[#111] border rounded-2xl p-4 flex flex-col gap-3 transition-all cursor-pointer overflow-hidden ${activeProjectId === proj.id
                                        ? 'border-blue-500/50 shadow-xl shadow-blue-500/10'
                                        : 'border-[#222] hover:border-[#333] hover:bg-[#141417]'
                                        }`}
                                >
                                    {/* Top row: icon + actions */}
                                    <div className="flex items-start justify-between">
                                        <div className={`p-2 bg-[#18181b] border border-[#27272a] rounded-lg`}>
                                            <Globe className={`w-4 h-4 ${activeProjectId === proj.id ? 'text-blue-500' : 'text-gray-500'}`} />
                                        </div>
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => startEdit(e, proj)}
                                                className="p-1.5 text-gray-600 hover:text-blue-400 transition-colors"
                                                title="Renombrar"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteProject(proj.id); }}
                                                className="p-1.5 text-gray-600 hover:text-red-500 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Name — editable or static */}
                                    {editingId === proj.id ? (
                                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                            <input
                                                ref={inputRef}
                                                value={editingName}
                                                onChange={e => setEditingName(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                className="flex-1 min-w-0 bg-[#1a1a1e] border border-blue-500/50 rounded-md px-2 py-1 text-xs text-white font-bold outline-none"
                                                autoFocus
                                            />
                                            <button
                                                onClick={confirmEdit}
                                                className="p-1 bg-blue-600 rounded-md text-white hover:bg-blue-500 transition-colors"
                                            >
                                                <Check className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <h3 className="text-xs font-black tracking-tight text-white truncate leading-relaxed">
                                            {proj.name}
                                        </h3>
                                    )}

                                    {/* Footer meta */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                                            <Clock className="w-2.5 h-2.5 text-gray-600" />
                                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                                                {new Date(proj.lastModified).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        {proj.previewUrl && (
                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 rounded border border-green-500/10">
                                                <ExternalLink className="w-2.5 h-2.5 text-green-500" />
                                                <span className="text-[9px] font-bold text-green-500 uppercase tracking-tighter">Live</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Active badge */}
                                    {activeProjectId === proj.id && (
                                        <div className="absolute top-3 right-3 bg-blue-600 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full text-white">
                                            Activo
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

