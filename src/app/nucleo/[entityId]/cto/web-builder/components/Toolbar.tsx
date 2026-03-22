import React from "react";
import {
    MousePointer2, Hand, ZoomIn, Undo2, Redo2, Globe, MonitorCheck,
    Smartphone, Tablet, Monitor, Code2, GitCommit, Loader2, History, Settings, ChevronDown, LayoutGrid, Upload, Rocket, Package,
    RefreshCw, Terminal as TerminalIcon, ExternalLink, Home, Sparkles
} from "lucide-react";
import { ReasoningLevel } from "../types";
import { GitHubSyncButton } from "./GitHubSyncButton";
import { DeployButton } from "./DeployButton";

interface ToolbarProps {
    activeTool: string;
    setActiveTool: (tool: string) => void;
    viewMode: "desktop" | "tablet" | "mobile";
    setViewMode: (mode: "desktop" | "tablet" | "mobile") => void;
    zoom: number;
    setZoom: (zoom: number) => void;
    handleUndo: () => void;
    handleRedo: () => void;
    historyLength: number;
    futureLength: number;
    user: any;
    showUserMenu: boolean;
    setShowUserMenu: (show: boolean) => void;
    projects: any[];
    activeProjectId: string | null;
    handleSwitchProject: (id: string) => void;
    showCode: boolean;
    setShowCode: (show: boolean) => void;
    repoUrl: string;
    deploymentUrl?: string;
    isGenerating: boolean;
    isCommiting: boolean;
    isPublishing: boolean;
    handleCommit: () => void;
    handlePublish: (details?: any) => void;
    setShowHistory: (show: boolean) => void;
    setShowSettings: (show: boolean) => void;
    syncStatus: 'synced' | 'syncing' | 'error' | 'pending';
    triggerSync: (opts?: any) => void;

    // Publish / Deploy Props
    activeProjectName?: string;
    files: Record<string, string>;
    onSyncComplete: () => void;
    onDeployComplete: (url: string) => void;
    resetPan?: () => void;
    isConfigured?: boolean;
    handleCloseProject?: () => void;

    // Preview Controls
    showTerminal?: boolean;
    setShowTerminal?: (show: boolean) => void;
    onRefresh?: () => void;
    isPreviewLoading?: boolean;
    isAutoFixEnabled?: boolean;
    setIsAutoFixEnabled?: (enabled: boolean) => void;
}

export const Toolbar = ({
    activeTool, setActiveTool, viewMode, setViewMode, zoom,
    handleUndo, handleRedo, historyLength, futureLength,
    user, showUserMenu, setShowUserMenu, projects, activeProjectId, handleSwitchProject,
    showCode, setShowCode, repoUrl, deploymentUrl, isGenerating, isCommiting, isPublishing,
    handleCommit, handlePublish, setShowHistory, setShowSettings,
    syncStatus, triggerSync,
    activeProjectName, files, onSyncComplete, onDeployComplete,
    resetPan, setZoom, isConfigured, handleCloseProject,
    showTerminal, setShowTerminal, onRefresh, isPreviewLoading,
    isAutoFixEnabled, setIsAutoFixEnabled
}: ToolbarProps) => {
    const [showPublishMenu, setShowPublishMenu] = React.useState(false);
    const publishMenuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (publishMenuRef.current && !publishMenuRef.current.contains(event.target as Node)) {
                setShowPublishMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    return (
        <div className="h-14 border-b border-[#222] bg-[#09090b] flex items-center justify-between px-4 z-[90] shrink-0 font-sans">
            {/* Left: Exit & Dashboard */}
            <div className="flex items-center gap-4">
                <button
                    onClick={handleCloseProject}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group px-2 py-1 rounded-lg hover:bg-white/5"
                    title="Cerrar Proyecto y Volver al Inicio"
                >
                    <div className="p-1.5 rounded-lg group-hover:bg-blue-500/10 transition-colors">
                        <Home className="w-4 h-4 group-hover:text-blue-400" />
                    </div>
                </button>

                <div className="h-4 w-[1px] bg-[#222]"></div>

                <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                >
                    <div className="p-1.5 rounded-lg group-hover:bg-white/10 transition-colors">
                        <Package className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Mis Proyectos</span>
                </button>

                {activeProjectName && (
                    <>
                        <div className="h-4 w-[1px] bg-[#333]"></div>
                        <div className="flex items-center gap-2 text-white">
                            <span className="text-sm font-semibold tracking-tight">{activeProjectName}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Right: Tools & Actions Island */}
            <div className="flex items-center gap-2">

                {/* Tools Group */}
                <div className="flex items-center gap-1 bg-[#111] p-1 rounded-xl border border-[#222]">
                    {[
                        { id: 'select', icon: MousePointer2, title: 'Seleccionar' },
                        { id: 'hand', icon: Hand, title: 'Mano (Pan)' },
                        { id: 'zoom', icon: ZoomIn, title: 'Zoom (Clic para rotar)' }
                    ].map(tool => (
                        <button
                            key={tool.id}
                            title={tool.title}
                            onClick={() => {
                                if (tool.id === 'zoom' && activeTool === 'zoom') {
                                    // Cycle zoom: 100 -> 150 -> 200 -> 50 -> 100
                                    const levels = [100, 150, 200, 50];
                                    const next = levels[(levels.indexOf(zoom) + 1) % levels.length];
                                    setZoom(next);
                                }
                                setActiveTool(tool.id);
                            }}
                            className={`p-1.5 rounded-lg transition-all ${activeTool === tool.id ? 'bg-[#222] text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <tool.icon className={`w-3.5 h-3.5 ${activeTool === 'zoom' && tool.id === 'zoom' ? 'text-blue-400' : ''}`} />
                        </button>
                    ))}
                </div>

                {/* View Modes Group */}
                <div className="flex items-center gap-3 bg-[#111] p-1 pr-3 rounded-xl border border-[#222]">
                    <div className="flex items-center gap-1">
                        {[
                            { id: 'desktop', icon: Monitor },
                            { id: 'tablet', icon: Tablet },
                            { id: 'mobile', icon: Smartphone }
                        ].map(view => (
                            <button
                                key={view.id}
                                onClick={() => setViewMode(view.id as any)}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === view.id ? 'bg-[#222] text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <view.icon className="w-3.5 h-3.5" />
                            </button>
                        ))}
                    </div>
                    <div className="h-4 w-[1px] bg-[#222]"></div>
                    <button
                        onClick={resetPan}
                        title="Restablecer vista"
                        className="text-[10px] text-gray-500 font-mono hover:text-blue-400 transition-colors px-1"
                    >
                        {zoom}%
                    </button>
                </div>


                {/* Undo/Redo Group */}
                <div className="flex items-center gap-1 bg-[#111] p-1 rounded-xl border border-[#222]">
                    <button onClick={handleUndo} disabled={historyLength === 0} className="p-1.5 text-gray-500 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed rounded-lg hover:bg-white/5"><Undo2 className="w-3.5 h-3.5" /></button>
                    <button onClick={handleRedo} disabled={futureLength === 0} className="p-1.5 text-gray-500 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed rounded-lg hover:bg-white/5"><Redo2 className="w-3.5 h-3.5" /></button>
                </div>

                <div className="h-4 w-[1px] bg-[#222] mx-2"></div>

                {/* Publish Split Button */}
                {activeProjectId && (
                    <div className="relative flex items-center" ref={publishMenuRef}>
                        <div className="flex items-center bg-[#111] rounded-full border border-[#222] overflow-hidden shadow-lg shadow-black/20">
                            {/* Primary Action Button */}
                            <button
                                onClick={!isConfigured ? () => handlePublish() : () => handlePublish(true)}
                                disabled={isPublishing}
                                className={`flex items-center gap-2 px-3 py-1.5 transition-all ${isPublishing
                                    ? 'text-blue-400 cursor-wait'
                                    : isConfigured
                                        ? 'text-green-400 hover:bg-white/5'
                                        : 'text-blue-400 hover:bg-white/5'
                                    }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${isPublishing
                                    ? 'bg-blue-400 animate-pulse'
                                    : isConfigured
                                        ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                                        : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                    }`} />
                                <span className="text-[10px] font-black tracking-widest uppercase truncate max-w-[100px]">
                                    {isPublishing ? 'PUBLISHING...' : isConfigured ? 'UPDATE LIVE' : 'PUBLISH'}
                                </span>
                            </button>

                            {/* Dropdown Chevron */}
                            <div className="w-[1px] h-4 bg-[#222]"></div>
                            <button
                                onClick={() => setShowPublishMenu(!showPublishMenu)}
                                className={`p-1.5 transition-all hover:bg-white/5 ${showPublishMenu ? 'text-white' : 'text-gray-500'}`}
                            >
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showPublishMenu ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Dropdown Menu */}
                        {showPublishMenu && (
                            <div className="absolute top-full right-0 mt-2 w-60 bg-[#0c0c0e] border border-[#222] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
                                <div className="p-2 flex flex-col gap-1">
                                    <button
                                        onClick={() => { handlePublish(true); setShowPublishMenu(false); }}
                                        disabled={isPublishing || !isConfigured}
                                        className="w-full px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3 group text-left disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <div className="p-1.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                            <Rocket className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white">Publicar Cambios</div>
                                            <div className="text-[10px] text-gray-500">
                                                {isConfigured ? "Subir última versión" : "Configuración requerida"}
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { handlePublish(null); setShowPublishMenu(false); }}
                                        className="w-full px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3 group text-left"
                                    >
                                        <div className="p-1.5 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                                            <Globe className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white">Configuración del Dominio</div>
                                            <div className="text-[10px] text-gray-500">Editor de URL y DNS</div>
                                        </div>
                                    </button>

                                    {deploymentUrl && (
                                        <a
                                            href={deploymentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3 group text-left"
                                        >
                                            <div className="p-1.5 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                                                <ExternalLink className="w-4 h-4 text-green-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-white">Ver Sitio en Vivo</div>
                                                <div className="text-[10px] text-gray-500">Abrir en nueva pestaña</div>
                                            </div>
                                        </a>
                                    )}

                                    <div className="h-[1px] bg-[#222] my-1" />

                                    <button
                                        onClick={() => { setShowSettings(true); setShowPublishMenu(false); }}
                                        className="w-full px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3 group text-left"
                                    >
                                        <div className="p-1.5 bg-gray-500/10 rounded-lg group-hover:bg-gray-500/20 transition-colors">
                                            <Settings className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white">Configuración General</div>
                                            <div className="text-[10px] text-gray-500">Metadata y ajustes del proyecto</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Preview Controls (Terminal & Refresh & Auto-Fix) */}
                <div className="flex items-center gap-1 bg-[#111] p-1 rounded-xl border border-[#222]">
                    <button
                        onClick={() => setIsAutoFixEnabled?.(!isAutoFixEnabled)}
                        className={`p-1.5 rounded-lg transition-all ${isAutoFixEnabled ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        title={isAutoFixEnabled ? "Auto-Fix AI Habilitado" : "Habilitar Auto-Fix AI"}
                    >
                        <Sparkles className={`w-3.5 h-3.5 ${isAutoFixEnabled ? 'animate-pulse' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowTerminal?.(!showTerminal)}
                        className={`p-1.5 rounded-lg transition-all ${showTerminal ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        title="Show Terminal"
                    >
                        <TerminalIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onRefresh}
                        disabled={isPreviewLoading}
                        className={`p-1.5 rounded-lg transition-all text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30`}
                        title="Refresh Preview"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isPreviewLoading ? 'animate-spin text-blue-400' : ''}`} />
                    </button>
                </div>

                <div className="h-4 w-[1px] bg-[#222] mx-1"></div>

                {/* Code Toggle */}
                <button
                    onClick={() => setShowCode(!showCode)}
                    className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all ${showCode ? 'bg-white text-black border-white' : 'bg-[#111] hover:bg-[#222] border-[#222] text-gray-400'}`}
                    title="Code Editor"
                >
                    <Code2 className="w-4 h-4" />
                </button>

                {/* User Profile */}
                {user && (
                    <div className="relative ml-1">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#111] border border-[#222] hover:border-gray-500 transition-colors"
                        >
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="User" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-black border border-gray-400">
                                    {user.email?.[0].toUpperCase() || 'U'}
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#09090b] rounded-full"></div>
                        </button>

                        {showUserMenu && (
                            <div className="absolute top-full right-0 mt-2 w-72 bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                                <div className="p-4 border-b border-[#27272a] bg-[#202023]">
                                    <div className="flex items-center gap-3">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full border border-gray-500" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sm font-bold text-black">{user.email?.[0].toUpperCase()}</div>
                                        )}
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-sm font-medium text-white truncate">{user.displayName || 'User'}</span>
                                            <span className="text-xs text-gray-400 truncate">{user.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-[#27272a] mb-1">My Web Builder Projects</div>
                                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                        {projects.length === 0 ? (
                                            <div className="px-3 py-4 text-xs text-gray-500 italic text-center">No active projects.</div>
                                        ) : (
                                            projects.map(proj => (
                                                <button
                                                    key={proj.id}
                                                    onClick={() => { handleSwitchProject(proj.id); setShowUserMenu(false); }}
                                                    className={`w-full px-3 py-2 text-xs text-left transition-colors flex items-center justify-between group ${activeProjectId === proj.id ? 'bg-blue-600/10 text-blue-400' : 'text-gray-300 hover:bg-[#27272a]'}`}
                                                >
                                                    <span className="truncate max-w-[120px]">{proj.name}</span>
                                                    {activeProjectId === proj.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="p-2 border-t border-[#27272a]">
                                    <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-[#27272a] rounded-lg transition-colors"><Settings className="w-3.5 h-3.5" /> Settings</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

