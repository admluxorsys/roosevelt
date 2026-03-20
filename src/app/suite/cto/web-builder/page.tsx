"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useSearchParams, useRouter } from "next/navigation";
import { Maximize2, Minimize2, Sparkles, Plus, History } from "lucide-react";

import { INITIAL_FILES } from "./constants";
import { ReasoningLevel } from "./types";

// Hooks
import { useProjects } from "./hooks/useProjects";
import { useFileSystem } from "./hooks/useFileSystem";
import { useChatAI } from "./hooks/useChatAI";

// Components
import { Toolbar } from "./components/Toolbar";
import { ChatSidebar } from "./components/ChatSidebar";
import { PreviewArea } from "./components/PreviewArea";
import { CodeEditor } from "./components/CodeEditor";
import { DashboardModal } from "./components/DashboardModal";
import { SettingsModal } from "./components/SettingsModal";
import { NewProjectModal } from "./components/NewProjectModal";
import { PublishModal } from "./components/PublishModal";
import { ToastContainer, useToast } from "./components/Toast";
import { BrowserAddressBar } from "./components/BrowserAddressBar";

import { Suspense } from "react";

function WebBuilderContent() {
    // --- Global UI State ---
    const [activeTool, setActiveTool] = useState("select");
    const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
    const [zoom, setZoom] = useState(100);
    const [showCode, setShowCode] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["src", "src/app", "src/components"]));
    const [previewPath, setPreviewPath] = useState("");
    const searchParams = useSearchParams();
    const router = useRouter();

    // Load GitHub user from cookie on mount (and after OAuth)
    const loadGitHubUser = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/github/user', { cache: 'no-store' });
            const data = await res.json();
            setGithubUser(data.user || null);
        } catch {
            setGithubUser(null);
        }
    }, []);

    useEffect(() => { loadGitHubUser(); }, [loadGitHubUser]);

    // Handle GitHub OAuth callback
    useEffect(() => {
        const connected = searchParams.get('github_connected');
        const githubLoginParam = searchParams.get('github_user');
        const projectIdFromUrl = searchParams.get('projectId'); // projectId passed through OAuth state
        const error = searchParams.get('github_error');

        if (connected === '1') {
            showToast(`✅ GitHub conectado${githubLoginParam ? ` como @${githubLoginParam}` : ''} correctamente`, 'success');
            loadGitHubUser();

            // Save per-project GitHub owner directly to Firestore using projectId from URL
            if ((projectIdFromUrl || activeProjectId) && githubLoginParam) {
                const targetProjectId = projectIdFromUrl || activeProjectId!;
                fetch(`https://api.github.com/users/${githubLoginParam}`)
                    .then(r => r.json())
                    .then(u => updateDoc(doc(db, 'web-projects', targetProjectId), {
                        githubOwner: u.login || githubLoginParam,
                        githubAvatar: u.avatar_url || '',
                        githubConnected: true
                    }))
                    .catch(() => updateDoc(doc(db, 'web-projects', targetProjectId), {
                        githubOwner: githubLoginParam,
                        githubConnected: true
                    }));
            }

            router.replace(window.location.pathname);
        } else if (error) {
            showToast(`Error conectando GitHub: ${decodeURIComponent(error)}`, 'info');
            router.replace(window.location.pathname);
        }
    }, [searchParams]);

    // AI Config
    const [selectedModel, setSelectedModel] = useState("Gemini 2.0 Flash");
    const [reasoningLevel, setReasoningLevel] = useState<ReasoningLevel>("medium");

    // Runtime Monitoring (Bridge between Visor and Editor)
    const [runtimeErrors, setRuntimeErrors] = useState<Record<string, string>>({});
    const [isAutoFixEnabled, setIsAutoFixEnabled] = useState(true);
    const lastAutoFixedErrorRef = useRef<string | null>(null);
    const [showTerminal, setShowTerminal] = useState(false);
    const [refreshSignal, setRefreshSignal] = useState(0);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [selection, setSelection] = useState<{ path: string, loc: string, rect: any } | null>(null);

    // --- Viewport / Pan State ---
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0, offX: 0, offY: 0 });

    const handlePanStart = (e: React.MouseEvent) => {
        if (activeTool !== 'hand') return;
        setIsPanning(true);
        panStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            offX: panOffset.x,
            offY: panOffset.y
        };
    };

    const handlePanMove = (e: React.MouseEvent) => {
        if (!isPanning || activeTool !== 'hand') return;
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setPanOffset({
            x: panStartRef.current.offX + dx,
            y: panStartRef.current.offY + dy
        });
    };

    const handlePanEnd = () => {
        setIsPanning(false);
    };

    const resetPan = () => {
        setPanOffset({ x: 0, y: 0 });
        setZoom(100);
    };

    // Repo/Auth
    const [user] = useAuthState(auth);
    // --- Hooks Integration ---
    const {
        projects, setProjects, activeProjectId, activeProject,
        handleNewProject: createProject, handleSwitchProject, deleteProject,
        updateProjectLastModified, updateProject, updateProjectRepo
    } = useProjects(INITIAL_FILES);

    const handleCloseProject = useCallback(() => {
        // Clear project from memory and localStorage (via switch to null)
        handleSwitchProject('');
        // Force refresh to the dashboard URL to ensure a clean state
        window.location.href = "/suite/cto/web-builder";
    }, [handleSwitchProject]);

    // Derived states
    const deploymentUrl = activeProject?.deploymentUrl || "";
    const repoUrl = activeProject?.repoUrl || "";

    const [isCommiting, setIsCommiting] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [githubUser, setGithubUser] = useState<any>(null);

    const {
        files, setFiles, updateFiles, activeFile, setActiveFile, generatedTheme,
        setGeneratedTheme, history, future, handleUndo, handleRedo, deleteProjectFiles,
        syncStatus, triggerSync, hasChanges, checkChanges
    } = useFileSystem(activeProjectId, updateProjectLastModified);

    // Toast Utility
    const { toasts, showToast, removeToast } = useToast();

    const {
        isGenerating,
        chatHistory,
        conversations,
        activeConversationId,
        setActiveConversationId,
        handleGenerate,
        handleNewConversation,
        approvePlan,
        deleteConversation,
        cancelGeneration,
        statusMessage
    } = useChatAI(
        activeProjectId, files, updateFiles, setActiveFile, setGeneratedTheme, showToast,
        selectedModel, reasoningLevel,
        activeProject?.supabaseUrl && activeProject?.supabaseAnonKey
            ? { url: activeProject.supabaseUrl, key: activeProject.supabaseAnonKey }
            : undefined
    );

    // Sync initial loading state
    useEffect(() => {
        if (!Object.keys(files).length && Object.keys(runtimeErrors).length === 0) {
            setIsPreviewLoading(true);
        }
    }, [files, runtimeErrors]);

    // --- Route Discovery ---
    const availableRoutes = useMemo(() => {
        const routes = new Set<string>();
        Object.keys(files).forEach(path => {
            if (path.startsWith('src/pages/') && path.endsWith('.tsx')) {
                const name = path.split('src/pages/')[1].split('.tsx')[0].toLowerCase().replace('page', '');
                routes.add(name === 'home' || name === 'index' ? '/' : `/${name}`);
            } else if (path.startsWith('src/app/') && path.endsWith('/page.tsx')) {
                const route = path.split('src/app/')[1].split('/page.tsx')[0];
                routes.add(route === 'page.tsx' || route === '' ? '/' : `/${route}`);
            } else if (path.startsWith('src/app/') && path.endsWith('.tsx') && !path.includes('/page.tsx')) {
                const name = path.split('src/app/')[1].split('.tsx')[0].toLowerCase();
                routes.add(name === 'page' ? '/' : `/${name}`);
            }
        });
        return Array.from(routes).sort();
    }, [files]);

    // Helper to propagate navigation to the iframe
    const propagateNavigation = useCallback((path: string) => {
        const iframe = document.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
            console.log("[Parent] Propagating navigation to iframe:", path);
            iframe.contentWindow.postMessage({ type: 'navigate-to', path: path.startsWith('/') ? path : '/' + path }, '*');
        }
    }, []);

    // Sync previewPath with activeFile (Filtering)
    useEffect(() => {
        if (activeFile) {
            const isSupported = activeFile.startsWith('src/app/') || activeFile.startsWith('src/pages/');
            if (!isSupported) {
                console.log("[Parent Sync] activeFile is not in a supported route folder, skipping path sync:", activeFile);
                return;
            }

            let targetPath = ""; // Root by default
            if (activeFile.includes('src/pages/')) {
                const base = activeFile.split('src/pages/')[1].split('.tsx')[0].toLowerCase();
                const clean = base.replace('page', '');
                targetPath = (clean === 'home' || clean === 'index') ? "" : clean;
            } else if (activeFile.includes('src/app/')) {
                const parts = activeFile.split('src/app/')[1];
                if (parts === 'page.tsx') {
                    targetPath = "";
                } else {
                    targetPath = parts.split('/page.tsx')[0].split('.tsx')[0];
                }
            }

            console.log("[Parent] Propagating derived navigation path:", targetPath || "/", "from file:", activeFile);
            propagateNavigation(targetPath || "/");
            setPreviewPath(targetPath);
        }
    }, [activeFile, propagateNavigation]);

    // Per-project GitHub user
    const projectGithubUser = activeProject?.githubOwner
        ? { login: activeProject.githubOwner, avatar_url: activeProject.githubAvatar || '' }
        : null;

    // Cleanup when deleting project
    const onProjectDelete = (id: string) => {
        deleteProject(id);
        deleteProjectFiles(id);
    };

    const handleClearCache = () => {
        localStorage.clear();
        window.location.reload();
    };

    const handleCreateProject = async (name: string) => {
        await createProject(name);
    };

    // --- Message Handling ---
    useEffect(() => {
        const handleGlobalMessage = (e: MessageEvent) => {
            if (e.data?.type === 'ask-ai-fix') {
                const { error, file } = e.data;
                const errorEntries = Object.entries(runtimeErrors).filter(([k, v]) => v && k !== '__runtime__');
                const globalError = runtimeErrors['__runtime__'];

                showToast(errorEntries.length > 1 ? `Analizando múltiples errores...` : `Analizando error en ${file}...`, "info");

                let msg = `Tengo el siguiente problema en el proyecto en este momento. Por favor, revisa TODO el contexto de mis archivos (importaciones, dependencias, variables) y soluciona este/os error/es de una sola vez. IMPORTANTE: NO rompas los archivos que ya están funcionando bien.\n\n`;

                if (globalError) {
                    msg += `🚨 Error global de ejecución (Crashed):\n"${globalError}"\n\n`;
                }
                if (errorEntries.length > 0) {
                    msg += `🚨 Errores detectados por archivo:\n` + errorEntries.map(([k, v]) => `- Archivo ${k}: "${v}"`).join('\n');
                }

                // Fallback si por alguna razón el estado de runtimeErrors no tiene el error del evento
                if (!globalError && errorEntries.length === 0) {
                    msg += `🚨 Error en ${file}:\n"${error}"\n`;
                }

                handleGenerate(msg);
            }

            if (e.data?.type === 'navigation') {
                const { path } = e.data;
                console.log("[Parent] Received navigation event from iframe:", path);

                // Normalize path: handle '/', '/index', '/home' and ensure they map to empty string for previewPath
                const isRoot = path === '/' || path === "" || path === "/index" || path === "/home" || path === "index" || path === "home";
                const normalized = isRoot ? "" : (path.startsWith('/') ? path.substring(1) : path);

                setPreviewPath(normalized);

                // Extended search for the corresponding file
                const searchPaths = isRoot ? [
                    "src/app/page.tsx",
                    "src/pages/index.tsx",
                    "src/app/main.tsx",
                    "src/app/main/page.tsx",
                    "src/pages/home.tsx"
                ] : [
                    `src/app/${normalized}/page.tsx`,
                    `src/app/${normalized}.tsx`,
                    `src/pages/${normalized}.tsx`,
                    `src/pages/${normalized}Page.tsx`,
                    `src/pages/${normalized.charAt(0).toUpperCase() + normalized.slice(1)}Page.tsx`,
                    `src/components/${normalized}.tsx`
                ];

                const found = searchPaths.find(p => files[p]);
                console.log("[Parent] Map navigation path", normalized || "/", "to file:", found || "NOT FOUND");
                if (found && found !== activeFile) {
                    setActiveFile(found);
                }
            }

            if (e.data?.type === 'inspect-element') {
                const { path, loc } = e.data;

                if (path && loc) {
                    setActiveFile(path);
                    setShowCode(true);
                    setSelection({ path, loc, rect: e.data.rect });

                    // Auto-expand folders in FileTree
                    const pathParts = path.split('/');
                    const foldersToExpand = new Set(expandedFolders);
                    let currentPath = '';
                    for (let i = 0; i < pathParts.length - 1; i++) {
                        currentPath = currentPath ? `${currentPath}/${pathParts[i]}` : pathParts[i];
                        foldersToExpand.add(currentPath);
                    }
                    setExpandedFolders(foldersToExpand);

                    const line = parseInt(loc.split(':')[0]);
                    window.dispatchEvent(new CustomEvent('editor-goto-line', {
                        detail: { path, line }
                    }));
                }
                // Note: removed the else branch — clicking elements without data-component-path
                // should NOT open the editor or trigger any search.
            }

            if (e.data?.type === 'inception-detected') {
                console.warn("[Parent] Inception detected in preview. Resetting preview bundle...");
                setRefreshSignal(s => s + 1);
            }
        };
        window.addEventListener('message', handleGlobalMessage);
        return () => window.removeEventListener('message', handleGlobalMessage);
    }, [
        handleGenerate, showToast, setRefreshSignal, setPreviewPath,
        files, setActiveFile, activeFile, setShowCode, setSelection,
        expandedFolders, setExpandedFolders, runtimeErrors
    ]);

    // --- Auto-Fix Engine ---
    useEffect(() => {
        if (!isAutoFixEnabled || !activeProjectId || isGenerating) return;

        const runtimeErr = runtimeErrors['__runtime__'];
        const errorEntries = Object.entries(runtimeErrors).filter(([k, v]) => v && k !== '__runtime__');

        if (runtimeErr && runtimeErr !== lastAutoFixedErrorRef.current) {
            console.log("[Auto-Fix] Detecting runtime error, triggering AI fix:", runtimeErr);
            lastAutoFixedErrorRef.current = runtimeErr;

            // Trigger AI fix
            showToast("🔧 Error detectado. Iniciando auto-corrección...", "info");

            let msg = `Tengo el siguiente error de ejecución global (Crash) en la aplicación:\n"${runtimeErr}"\n\nPor favor, revisa TODO el contexto de mis archivos y soluciona el problema de una sola vez. IMPORTANTE: NO rompas los archivos que ya están funcionando bien.\n\n`;

            if (errorEntries.length > 0) {
                msg += `🛑 Además, he detectado estos errores en archivos específicos:\n` + errorEntries.map(([k, v]) => `- Archivo ${k}: "${v}"`).join('\n') + `\n\n`;
            }

            handleGenerate(msg);
        }
    }, [runtimeErrors, isAutoFixEnabled, isGenerating, activeProjectId, handleGenerate, showToast]);

    const handleDisconnectGitHub = async () => {
        try {
            if (activeProjectId) {
                await updateProject(activeProjectId, {
                    repoUrl: "",
                    repoName: "",
                    githubConnected: false
                });
            }
            showToast("Repositorio desvinculado de este proyecto", "success");
        } catch (e: any) {
            showToast("Error al desvincular el repositorio", "error");
        }
    };

    // Auto-create repo logic
    useEffect(() => {
        if (!githubUser || !activeProjectId || !activeProject) return;
        if (activeProject.repoUrl || repoUrl) return;

        const pendingKey = `pendingAutoCreate_${activeProjectId}`;
        if (!localStorage.getItem(pendingKey)) return;
        localStorage.removeItem(pendingKey);

        const autoCreateRepo = async () => {
            try {
                showToast("Creando repositorio en GitHub...", "info");
                const res = await fetch('/api/web-builder/git', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projectId: activeProjectId,
                        action: 'sync',
                        autoCreate: true,
                        projectName: activeProject.name,
                        message: `Initial commit — ${activeProject.name}`,
                        files: files // Enviar archivos actuales!
                    })
                });
                const result = await res.json();
                if (result?.repoUrl) {
                    const finalRepoUrl = result.repoUrl;
                    await updateProject(activeProjectId, {
                        repoUrl: finalRepoUrl,
                        repoName: result.repoName || finalRepoUrl.split('/').slice(-2).join('/'),
                        githubConnected: true
                    });
                    showToast(`📁 Repositorio "${result.repoName || finalRepoUrl.split('/').pop()}" creado y sincronizado`, 'success');
                }
            } catch (e) {
                console.error('[AutoCreate]', e);
                showToast("Error al crear el repositorio", "error");
            }
        };

        autoCreateRepo();
    }, [githubUser?.login, activeProjectId, !!activeProject]);

    const handleDeployComplete = (url: string) => {
        if (activeProjectId) {
            updateProject(activeProjectId, {
                deploymentUrl: url,
                lastDeployed: Date.now()
            });
        }
        showToast("Project deployed successfully!", "success");
    };

    const handleGitSync = async () => {
        if (!activeProjectId || !repoUrl) return;

        setIsCommiting(true);
        showToast("Sincronizando cambios con GitHub...", "info");

        try {
            const result = await triggerSync({
                repoUrl: repoUrl || activeProject?.repoUrl
            });

            if (result?.success) {
                showToast("Sincronización completada", "success");
                // Check for updates to repoName if it changed
                if (result.repoName && result.repoName !== activeProject?.repoName) {
                    await updateProject(activeProjectId, { repoName: result.repoName });
                }
            } else {
                showToast(result?.error || "Error en la sincronización", "error");
            }
        } catch (e) {
            console.error("[GitSync]", e);
            showToast("Error de conexión con el servicio de Git", "error");
        } finally {
            setIsCommiting(false);
        }
    };

    const handlePublish = async (details?: any) => {
        if (!activeProjectId) return;

        if (!details) {
            setShowPublishModal(true);
            return;
        }

        const isUpdate = details === true;
        const publishDetails = isUpdate ? {
            url: activeProject?.customUrl || activeProject?.name?.toLowerCase().replace(/\s+/g, '-'),
            domain: activeProject?.customDomain || "",
            description: activeProject?.description || "",
            visibility: activeProject?.visibility || "public"
        } : details;


        setIsPublishing(true);
        try {
            if (!repoUrl) {
                showToast(`Iniciando lanzamiento de "${publishDetails.url}"...`, "info");
            } else {
                showToast("Sincronizando y actualizando despliegue...", "info");
            }

            // --- Programmatic Firebase Hosting Deployment ---
            const userSiteId = publishDetails?.url?.toLowerCase()?.replace(/[^a-z0-9-]/g, '');
            const finalSiteId = userSiteId || (activeProject?.name || 'site').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) + "-" + activeProjectId.substring(0, 5).toLowerCase();

            try {
                const deployResponse = await fetch('/api/web-builder/deploy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        siteId: finalSiteId,
                        files: files
                    })
                });

                const deployData = await deployResponse.json();

                if (deployData.success) {
                    await updateProject(activeProjectId, {
                        deploymentUrl: deployData.url
                    });
                    showToast(`Sito web desplegado: ${deployData.url}`, "success");
                } else {
                    console.error("Programmatic deployment error:", deployData.details);
                    showToast(`Error en despliegue hosting: ${deployData.details.substring(0, 50)}...`, "warning");
                }
            } catch (deployErr) {
                console.error("Failed to call deploy API:", deployErr);
            }
            // ------------------------------------------------

            const result = await triggerSync({
                autoCreate: true,
                projectName: activeProject?.name,
                repoUrl: repoUrl || activeProject?.repoUrl
            });

            if (result?.success && result.repoUrl) {
                await updateProject(activeProjectId, {
                    repoUrl: result.repoUrl,
                    repoName: result.repoName || result.repoUrl.split('/').slice(-2).join('/'),
                    githubConnected: true,
                    customUrl: publishDetails.url,
                    customDomain: publishDetails.domain,
                    description: publishDetails.description,
                    visibility: publishDetails.visibility
                });
            }

            setIsPublishing(false);
            setShowPublishModal(false);

            if (result?.error) {
                showToast(result.error, "error");
            } else {
                showToast("¡Proyecto publicado con éxito!", "success");
            }
        } catch (e) {
            console.error("Publish failed", e);
            showToast("Error al publicar el proyecto", "error");
            setIsPublishing(false);
        }
    };

    return (
        <div className="h-screen w-full bg-[#050505] text-white flex flex-col overflow-hidden font-sans selection:bg-blue-500/30">
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {activeProjectId ? (
                <>
                    <Toolbar
                        activeTool={activeTool} setActiveTool={setActiveTool}
                        viewMode={viewMode} setViewMode={setViewMode}
                        zoom={zoom} setZoom={setZoom}
                        handleUndo={handleUndo} handleRedo={handleRedo}
                        historyLength={history.length} futureLength={future.length}
                        user={user} showUserMenu={showUserMenu} setShowUserMenu={setShowUserMenu}
                        projects={projects} activeProjectId={activeProjectId} handleSwitchProject={handleSwitchProject}
                        showCode={showCode} setShowCode={setShowCode}
                        repoUrl={repoUrl} isGenerating={isGenerating}
                        deploymentUrl={deploymentUrl}
                        isCommiting={isCommiting} isPublishing={isPublishing}
                        handleCommit={() => setIsCommiting(true)}
                        handlePublish={handlePublish}
                        setShowHistory={setShowHistory} setShowSettings={setShowSettings}
                        syncStatus={syncStatus} triggerSync={triggerSync}
                        activeProjectName={activeProject?.name}
                        files={files}
                        onSyncComplete={() => {
                            showToast("Synced to GitHub successfully!", "success");
                            updateProjectLastModified(activeProjectId);
                        }}
                        onDeployComplete={handleDeployComplete}
                        resetPan={resetPan}
                        isConfigured={!!activeProject?.customUrl}
                        handleCloseProject={handleCloseProject}
                        showTerminal={showTerminal}
                        setShowTerminal={setShowTerminal}
                        onRefresh={() => setRefreshSignal(s => s + 1)}
                        isPreviewLoading={isPreviewLoading}
                        isAutoFixEnabled={isAutoFixEnabled}
                        setIsAutoFixEnabled={setIsAutoFixEnabled}
                    />

                    <div className="flex-1 flex overflow-hidden relative">
                        <ChatSidebar
                            messages={chatHistory}
                            isGenerating={isGenerating}
                            statusMessage={statusMessage}
                            handleGenerate={(msg) => activeProjectId && handleGenerate(msg)}
                            projectOpen={!!activeProjectId}
                            selectedModel={selectedModel}
                            setSelectedModel={setSelectedModel}
                            reasoningLevel={reasoningLevel}
                            setReasoningLevel={setReasoningLevel}
                            conversations={conversations}
                            activeConversationId={activeConversationId}
                            setActiveConversationId={setActiveConversationId}
                            handleNewConversation={handleNewConversation}
                            approvePlan={approvePlan}
                            deleteConversation={deleteConversation}
                            cancelGeneration={cancelGeneration}
                            onOpenSettings={() => setShowSettings(true)}
                        />

                        <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-[#050505]">
                            <div className="absolute inset-0 opacity-[0.03]"
                                style={{
                                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                                    backgroundSize: '20px 20px'
                                }}
                            />

                            <CodeEditor
                                showCode={showCode}
                                setShowCode={setShowCode}
                                files={files}
                                updateFiles={updateFiles}
                                activeFile={activeFile}
                                setActiveFile={setActiveFile}
                                expandedFolders={expandedFolders}
                                setExpandedFolders={setExpandedFolders}
                                runtimeErrors={runtimeErrors}
                                setRuntimeErrors={setRuntimeErrors}
                            />

                            <div
                                onMouseDown={handlePanStart}
                                onMouseMove={handlePanMove}
                                onMouseUp={handlePanEnd}
                                onMouseLeave={handlePanEnd}
                                className={`transition-all duration-500 [transition-timing-function:cubic-bezier(0.25,0.8,0.25,1)] shadow-2xl ${isMaximized
                                    ? 'w-full h-full rounded-none border-0'
                                    : viewMode === 'mobile' ? 'w-[375px] h-[812px] rounded-[3rem] border-8 border-[#1a1a1a]'
                                        : viewMode === 'tablet' ? 'w-[768px] h-[1024px] rounded-[2rem] border-8 border-[#1a1a1a]'
                                            : 'w-[92%] h-[86%] min-h-[86%] max-h-[86%] rounded-xl border border-[#1a1a1a]'
                                    } bg-white overflow-hidden relative group ${activeTool === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} flex flex-col`}
                                style={{
                                    transform: `scale(${zoom / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                                    transformOrigin: 'center center'
                                }}
                            >
                                {activeTool === 'hand' && (
                                    <div className="absolute inset-0 z-20" />
                                )}

                                <BrowserAddressBar
                                    url={previewPath}
                                    availableRoutes={availableRoutes}
                                    onNavigate={(path) => {
                                        setPreviewPath(path);
                                        propagateNavigation(path);
                                        const possibleFiles = [
                                            `src/app/${path}/page.tsx`,
                                            `src/app/${path}.tsx`,
                                            `src/pages/${path}.tsx`,
                                            `src/pages/${path}Page.tsx`,
                                            `src/pages/${path.charAt(0).toUpperCase() + path.slice(1)}Page.tsx`,
                                            `src/components/${path}.tsx`
                                        ];
                                        const found = possibleFiles.find(p => files[p]);
                                        if (found) {
                                            setActiveFile(found);
                                        } else {
                                            showToast(`Ruta /${path} no mapeada a archivo local`, "info");
                                        }
                                    }}
                                    onRefresh={() => setRefreshSignal(s => s + 1)}
                                    isRefreshing={isPreviewLoading}
                                    onOpenExternal={() => {
                                        if (deploymentUrl) window.open(deploymentUrl, '_blank');
                                        else showToast("Despliegue no disponible todavía", "info");
                                    }}
                                    isMaximized={isMaximized}
                                    onToggleMaximize={() => setIsMaximized(!isMaximized)}
                                />

                                <div className="flex-1 overflow-hidden bg-white text-black relative">
                                    <PreviewArea
                                        files={files}
                                        activeFile={activeFile}
                                        setRuntimeErrors={setRuntimeErrors}
                                        showTerminal={showTerminal}
                                        setShowTerminal={setShowTerminal}
                                        refreshSignal={refreshSignal}
                                        onLoadingChange={setIsPreviewLoading}
                                        selection={selection}
                                        setSelection={setSelection}
                                        handleGenerate={handleGenerate}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-[#050505] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5" />

                    <div className="relative text-center max-w-2xl px-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-8">
                            <Sparkles className="w-3 h-3" /> Digital Builder Pro
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 leading-tight text-balance">
                            Build your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">masterpiece</span>
                        </h1>
                        <p className="text-gray-400 text-lg mb-10 leading-relaxed font-light max-w-xl mx-auto">
                            Crea proyectos web con lenguaje natural, gestiona múltiples sitios localmente y publica cuando estés listo.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <button
                                onClick={() => setShowNewProjectModal(true)}
                                className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:scale-105 transition-all shadow-xl shadow-white/5 flex items-center gap-3"
                            >
                                <Plus className="w-5 h-5" /> Iniciar Nuevo Proyecto
                            </button>
                            <button
                                onClick={() => setShowHistory(true)}
                                className="px-8 py-4 bg-[#111] text-white border border-[#222] font-bold rounded-2xl hover:bg-[#161616] transition-all flex items-center gap-3"
                            >
                                <History className="w-5 h-5" /> Ver Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <DashboardModal
                show={showHistory}
                setShow={setShowHistory}
                projects={projects}
                activeProjectId={activeProjectId}
                handleSwitchProject={handleSwitchProject}
                deleteProject={onProjectDelete}
                handleNewProject={() => { setShowHistory(false); setShowNewProjectModal(true); }}
                updateProject={updateProject}
            />

            <SettingsModal
                show={showSettings}
                setShow={setShowSettings}
                repoUrl={repoUrl}
                githubUser={projectGithubUser || githubUser}
                projectId={activeProjectId || undefined}
                repoName={activeProject?.repoName}
                projectName={activeProject?.name}
                onDisconnect={handleDisconnectGitHub}
                handleClearCache={handleClearCache}
                onOpenGitHubSettings={() => {
                    const baseUrl = window.location.origin;
                    window.location.href = `${baseUrl}/api/auth/github?projectId=${activeProjectId}`;
                }}
                onSaveRepoUrl={async (url: string, name?: string) => {
                    if (activeProjectId) {
                        await updateProject(activeProjectId, {
                            repoUrl: url,
                            repoName: name || url.split('/').slice(-2).join('/'),
                            githubConnected: true
                        });
                        showToast(`🚀 Proyecto vinculado a ${name || 'repositorio'}`, 'success');
                    }
                }}
                handleSync={handleGitSync}
                isSyncing={isCommiting}
                hasChanges={hasChanges}
                onCheckChanges={() => checkChanges(repoUrl || activeProject?.repoUrl)}
                supabaseUrl={activeProject?.supabaseUrl}
                supabaseAnonKey={activeProject?.supabaseAnonKey}
                onSaveDatabaseConfig={async (config) => {
                    if (activeProjectId) {
                        await updateProject(activeProjectId, {
                            supabaseUrl: config.url,
                            supabaseAnonKey: config.key,
                            databaseMode: 'manual'
                        });
                        showToast("Configuración de base de datos guardada", "success");
                    }
                }}
            />

            <NewProjectModal
                show={showNewProjectModal}
                setShow={setShowNewProjectModal}
                onCreate={handleCreateProject}
            />

            <PublishModal
                show={showPublishModal}
                setShow={setShowPublishModal}
                projectName={activeProject?.name || "Proyecto"}
                onPublish={handlePublish}
                isPublishing={isPublishing}
            />
        </div>
    );
}

export default function WebBuilderPage() {
    return (
        <Suspense fallback={
            <div className="h-screen w-full bg-[#050505] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-widest animate-pulse">Initializing Builder...</p>
                </div>
            </div>
        }>
            <WebBuilderContent />
        </Suspense>
    );
}
