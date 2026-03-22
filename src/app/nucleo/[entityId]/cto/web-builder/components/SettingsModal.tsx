import React, { useState, useEffect, useMemo } from "react";
import { X, Settings, Trash2, Globe, Loader2, Github, Check, RefreshCw, LogOut, ArrowRight, FolderGit2, Search, PlusCircle } from "lucide-react";

interface SettingsModalProps {
    show: boolean;
    setShow: (show: boolean) => void;
    repoUrl: string;
    repoName?: string;
    githubUser?: any;
    projectId?: string;
    onDisconnect: () => void;
    handleClearCache: () => void;
    onOpenGitHubSettings: () => void;
    handleSync: () => void;
    isSyncing: boolean;
    hasChanges?: boolean;
    onCheckChanges?: () => Promise<any>;
    onSaveRepoUrl?: (url: string, name?: string) => Promise<void>;
    projectName?: string;
    // Database Integration
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    onSaveDatabaseConfig?: (config: { url: string; key: string }) => Promise<void>;
}

export const SettingsModal = ({
    show, setShow, repoUrl, repoName, githubUser, projectId, onDisconnect, handleClearCache,
    onOpenGitHubSettings, handleSync, isSyncing, hasChanges, onCheckChanges, onSaveRepoUrl,
    projectName, supabaseUrl: initialUrl, supabaseAnonKey: initialKey, onSaveDatabaseConfig
}: SettingsModalProps) => {
    const [isChecking, setIsChecking] = useState(false);
    const [step, setStep] = useState<'idle' | 'repo-input'>('idle');
    const [repoInput, setRepoInput] = useState("");
    const [repoType, setRepoType] = useState<'existing' | 'new' | 'picker'>('picker');
    const [isSaving, setIsSaving] = useState(false);

    // Database State
    const [dbUrl, setDbUrl] = useState(initialUrl || "");
    const [dbKey, setDbKey] = useState(initialKey || "");
    const [isSavingDb, setIsSavingDb] = useState(false);

    // Repo Picker State
    const [repos, setRepos] = useState<any[]>([]);
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchRepos = async () => {
        if (!githubUser) return;
        setIsLoadingRepos(true);
        try {
            const res = await fetch('/api/auth/github/repos');
            const data = await res.json();
            if (data.repos) {
                setRepos(data.repos);
            }
        } catch (e) {
            console.error("Failed to fetch repos", e);
        } finally {
            setIsLoadingRepos(false);
        }
    };

    useEffect(() => {
        if (show && githubUser && step === 'repo-input' && repos.length === 0) {
            fetchRepos();
        }
    }, [show, githubUser, step]);

    const filteredRepos = useMemo(() => {
        return repos.filter(r =>
            r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.full_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [repos, searchQuery]);

    if (!show) return null;

    const handleVerifyChanges = async () => {
        if (!onCheckChanges) return;
        setIsChecking(true);
        await onCheckChanges();
        setIsChecking(false);
    };

    const handleConnectClick = () => {
        setRepoInput("");
        setStep('repo-input');
    };

    const handleRepoSubmit = async (selectedRepo?: any) => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            if (selectedRepo && onSaveRepoUrl) {
                await onSaveRepoUrl(selectedRepo.html_url, selectedRepo.full_name);
            } else if (repoType === 'existing' && repoInput.trim() && onSaveRepoUrl) {
                await onSaveRepoUrl(repoInput.trim());
            } else if (repoType === 'new' && projectId) {
                localStorage.setItem(`pendingAutoCreate_${projectId}`, '1');
                onOpenGitHubSettings();
                return;
            }
        } finally {
            setIsSaving(false);
            setStep('idle');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 font-sans">
            <div className="w-full max-w-xl bg-[#09090b] border border-[#222] rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0c0c0e]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
                            <Settings className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white tracking-tight">Configuración {projectName ? `— ${projectName}` : ''}</h2>
                            <p className="text-[10px] text-gray-500 font-medium tracking-wide">Gestiona tu repositorio y base de datos</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setShow(false); setStep('idle'); }}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                <div className="p-5 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {/* GitHub Integration Section */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                <Github className="w-3.5 h-3.5" /> Repository Source
                            </div>
                            {repoUrl && (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 bg-blue-400/5 px-2 py-0.5 rounded-full border border-blue-500/10">
                                    <Check className="w-3 h-3" /> Conectado
                                </span>
                            )}
                        </div>

                        {!repoUrl ? (
                            <>
                                {githubUser && step !== 'repo-input' && (
                                    <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img src={githubUser.avatar_url} className="w-9 h-9 rounded-full border border-blue-500/20" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">GitHub Account</div>
                                                <div className="text-sm font-bold text-white leading-tight">@{githubUser.login}</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleConnectClick}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-all active:scale-95 shadow-md shadow-blue-500/20"
                                        >
                                            Vincular Repositorio
                                        </button>
                                    </div>
                                )}

                                {step === 'repo-input' ? (
                                    <div className="p-4 bg-[#111] border border-blue-500/20 rounded-xl space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-2">
                                            <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
                                            <span className="text-xs font-bold text-white">Configurar Repositorio</span>
                                        </div>

                                        <div className="flex gap-1 p-0.5 bg-[#0c0c0e] rounded-lg border border-[#222]">
                                            {['picker', 'new', 'existing'].map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setRepoType(type as any)}
                                                    className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${repoType === type ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    {type === 'picker' ? '🔍 Seleccionar' : type === 'new' ? '✨ Crear' : '🔗 Manual'}
                                                </button>
                                            ))}
                                        </div>

                                        {repoType === 'picker' ? (
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                                                    <input
                                                        type="text"
                                                        value={searchQuery}
                                                        onChange={e => setSearchQuery(e.target.value)}
                                                        placeholder="Buscar repositorios..."
                                                        className="w-full bg-[#0c0c0e] border border-[#222] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500/30"
                                                    />
                                                </div>

                                                <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                                                    {isLoadingRepos ? (
                                                        <div className="py-4 text-center text-[10px] text-gray-500">Cargando...</div>
                                                    ) : filteredRepos.length > 0 ? (
                                                        filteredRepos.map(repo => (
                                                            <button
                                                                key={repo.id}
                                                                onClick={() => handleRepoSubmit(repo)}
                                                                className="w-full p-2 bg-[#0c0c0e] border border-transparent hover:border-blue-500/30 hover:bg-blue-500/5 rounded-lg text-left flex items-center justify-between group transition-all"
                                                            >
                                                                <div className="flex items-center gap-2 truncate">
                                                                    <FolderGit2 className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 shrink-0" />
                                                                    <span className="text-xs font-medium text-white truncate">{repo.name}</span>
                                                                </div>
                                                                <ArrowRight className="w-3 h-3 text-gray-700 group-hover:text-blue-400 shrink-0" />
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="py-4 text-center text-[10px] text-gray-600">No se encontraron repositorios</div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {repoType === 'existing' ? (
                                                    <input
                                                        type="url"
                                                        value={repoInput}
                                                        onChange={e => setRepoInput(e.target.value)}
                                                        placeholder="https://github.com/usuario/mi-repo"
                                                        className="w-full bg-[#0c0c0e] border border-[#222] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500/30"
                                                    />
                                                ) : (
                                                    <p className="text-[10px] text-gray-500">Se creará un repositorio privado tras autorizar.</p>
                                                )}
                                                <div className="flex gap-2">
                                                    <button onClick={() => setStep('idle')} className="flex-1 py-1.5 bg-[#1a1a1a] text-gray-400 text-[10px] font-bold rounded-lg hover:bg-[#222]">Cancelar</button>
                                                    <button onClick={() => handleRepoSubmit()} className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-all">Siguiente</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={onOpenGitHubSettings}
                                        className="w-full p-4 bg-[#0c0c0e] border border-[#222] hover:border-blue-500/30 hover:bg-blue-500/5 rounded-2xl text-left flex items-center justify-between group transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/5 rounded-lg group-hover:bg-blue-500/10 transition-all">
                                                <Github className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-white">GitHub Integration</div>
                                                <div className="text-[10px] text-gray-500 mt-0.5">Sincroniza tus cambios con Git</div>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1.5 bg-blue-600/10 text-blue-400 text-[10px] font-bold rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all border border-blue-500/20">
                                            {githubUser ? 'Ajustes' : 'Conectar'}
                                        </div>
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="p-3 bg-[#0c0c0e] border border-[#222] rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={githubUser?.avatar_url} className="w-8 h-8 rounded-full border border-white/10" />
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-bold text-white">@{githubUser?.login}</span>
                                            <Check className="w-3 h-3 text-blue-400" />
                                        </div>
                                        <div className="text-[10px] text-gray-500 truncate max-w-[150px]">{repoName || "Repositorio Activo"}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={handleSync} disabled={isSyncing} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg disabled:opacity-30"><RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /></button>
                                    <button onClick={onDisconnect} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg"><LogOut className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Database Integration Section */}
                    <section className="space-y-3 pt-4 border-t border-[#1a1a1a]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                <Globe className="w-3.5 h-3.5" /> Database (PostgreSQL / Cloud SQL)
                            </div>
                            {initialUrl && initialKey && (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 bg-blue-400/5 px-2 py-0.5 rounded-full border border-blue-500/10">
                                    <Check className="w-3 h-3" /> Conectado
                                </span>
                            )}
                        </div>

                        <div className="p-4 bg-[#0c0c0e] border border-[#222] rounded-xl space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Project URL / Host</label>
                                    <input
                                        type="text"
                                        value={dbUrl}
                                        onChange={e => setDbUrl(e.target.value)}
                                        placeholder="https://your-project.supabase.co"
                                        className="w-full bg-[#09090b] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-700 outline-none focus:border-blue-500/30"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Secret Key / Anon Key</label>
                                    <input
                                        type="password"
                                        value={dbKey}
                                        onChange={e => setDbKey(e.target.value)}
                                        placeholder="your-secret-key"
                                        className="w-full bg-[#09090b] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-700 outline-none focus:border-blue-500/30"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    if (!onSaveDatabaseConfig) return;
                                    setIsSavingDb(true);
                                    await onSaveDatabaseConfig({ url: dbUrl, key: dbKey });
                                    setIsSavingDb(false);
                                }}
                                disabled={isSavingDb || (!dbUrl && initialUrl === dbUrl) || (!dbKey && initialKey === dbKey)}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10"
                            >
                                {isSavingDb ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Settings className="w-3.5 h-3.5" />}
                                Guardar Configuración
                            </button>

                            <p className="text-[9px] text-gray-600 text-center px-8 leading-relaxed uppercase tracking-widest font-bold">
                                Conecta tu base de datos PostgreSQL (GCP Cloud SQL compatible) para habilitar persistencia Full-Stack real.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

