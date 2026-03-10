import { useState, useEffect, useRef, useCallback } from "react";
import { INITIAL_FILES } from "../constants";
import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    where,
    deleteDoc,
    onSnapshot,
    writeBatch
} from "firebase/firestore";

// Helper to encode/decode paths for Firestore IDs (slash is reserved)
const encodePath = (p: string) => encodeURIComponent(p).replace(/\./g, '%2E');

// Helper to strip markdown fences from code (prevents runtime errors)
const stripMarkdownFences = (content: string) => {
    if (!content) return "";
    let cleaned = content.trim();

    // 1. Remove recursive markdown wrappers (sometimes AI nests them)
    while (cleaned.startsWith('```')) {
        // Remove the starting line like ```typescript
        cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, "").trim();
        // Remove the ending line like ```
        cleaned = cleaned.replace(/\s*```$/, "").trim();
    }

    // 2. Final emergency cleanup for any stray single backticks if they wrap the entire content
    if (cleaned.startsWith('`') && cleaned.endsWith('`')) {
        cleaned = cleaned.substring(1, cleaned.length - 1).trim();
    }

    return cleaned;
};

export const useFileSystem = (activeProjectId: string | null, updateProjectLastModified: (id: string) => void) => {
    const [files, setFiles] = useState<Record<string, string>>(INITIAL_FILES);
    const [history, setHistory] = useState<Record<string, string>[]>([]);
    const [future, setFuture] = useState<Record<string, string>[]>([]);
    const [activeFile, setActiveFile] = useState<string>("src/app/page.tsx");
    const [generatedTheme, setGeneratedTheme] = useState<'default' | 'art' | 'tech' | 'cosmetics'>('default');

    const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'pending'>('synced');
    const [hasChanges, setHasChanges] = useState(false);
    const [loading, setLoading] = useState(true);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Track if we are viewing the correct project's files
    const loadedProjectId = useRef<string | null>(null);
    const currentProjectIdRef = useRef<string | null>(null);

    // Fetch Files when project changes
    useEffect(() => {
        if (!activeProjectId) {
            setFiles(INITIAL_FILES);
            setLoading(false);
            loadedProjectId.current = null;
            return;
        }

        // Project Isolation: Clear files immediately when switching to avoid "leaking" previous project code
        if (activeProjectId !== currentProjectIdRef.current) {
            console.log("[useFileSystem] Project changed, resetting files state for isolation:", activeProjectId);
            setFiles(INITIAL_FILES);
            setLoading(true);
            currentProjectIdRef.current = activeProjectId;
        }

        if (loadedProjectId.current === activeProjectId) return;

        fetchFiles(activeProjectId);
        // Reset hasChanges when switching project
        setHasChanges(false);
    }, [activeProjectId]);

    const fetchFiles = async (projectId: string) => {
        try {
            // 1. Try to load from Local Cache first for instant UI
            const cacheKey = `fs_cache_${projectId}`;
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    if (parsed && typeof parsed === 'object') {
                        console.log("[FileSystem] Loading from cache:", projectId);
                        setFiles(parsed);
                        setLoading(false);
                        loadedProjectId.current = projectId;
                    }
                } catch (e) {
                    console.error("[FileSystem] Cache parse error", e);
                }
            } else {
                setLoading(true);
            }

            // 2. Fetch from Firestore (Background / Revalidation)
            const filesCollection = collection(db, "web-projects", projectId, "files");
            const snapshot = await getDocs(filesCollection);

            if (!snapshot.empty) {
                const fetchedFiles: Record<string, string> = { ...INITIAL_FILES };
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.path && data.content !== undefined) {
                        fetchedFiles[data.path] = data.content;
                    }
                });

                // Update state and cache
                setFiles(fetchedFiles);
                localStorage.setItem(cacheKey, JSON.stringify(fetchedFiles));

                if (snapshot.size < Object.keys(INITIAL_FILES).length) {
                    console.log("[FileSystem] Repairing project: adding missing mandatory files.");
                    saveFilesToFirestore(projectId, fetchedFiles);
                }
            } else {
                setFiles(INITIAL_FILES);
                saveFilesToFirestore(projectId, INITIAL_FILES);
                localStorage.setItem(cacheKey, JSON.stringify(INITIAL_FILES));
            }
            loadedProjectId.current = projectId;
            setLoading(false);
        } catch (e) {
            console.error("Failed to fetch files from Firestore", e);
            setLoading(false);
            if (Object.keys(files).length === 0) setFiles(INITIAL_FILES);
        }
    };

    const triggerSync = useCallback(async (options?: { projectId?: string, autoCreate?: boolean, projectName?: string, dryRun?: boolean, repoUrl?: string }) => {
        const targetProjectId = options?.projectId || activeProjectId;
        if (!targetProjectId) return null;

        // Isolation Check: Ensure we don't sync if the files in memory don't belong to the target project
        if (loadedProjectId.current && targetProjectId !== loadedProjectId.current) {
            console.warn("[FileSystem] Sync blocked: Memory project ID mismatch. Files are for", loadedProjectId.current, "target is", targetProjectId);
            return { error: 'Project mismatch. Please wait for files to load.' };
        }

        if (!options?.dryRun) setSyncStatus('syncing');

        try {
            // Use current truth from REF to avoid closure staleness
            const currentFiles = filesRef.current;
            // We now send the files directly to the API in case the backend doesn't have Firestore credentials
            const res = await fetch('/api/web-builder/git', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-dry-run': options?.dryRun ? 'true' : 'false'
                },
                body: JSON.stringify({
                    projectId: targetProjectId,
                    action: 'sync',
                    files: currentFiles,
                    repoUrl: options?.repoUrl,
                    message: 'Auto-save from Web Builder',
                    autoCreate: options?.autoCreate,
                    projectName: options?.projectName
                })
            });

            const data = await res.json();
            console.log(`[FileSystem] Sync result (dryRun: ${!!options?.dryRun}):`, data);

            if (res.ok) {
                if (!options?.dryRun) {
                    setSyncStatus('synced');
                    setHasChanges(false);
                } else {
                    const changes = data.status === 'has_changes';
                    console.log(`[FileSystem] setting hasChanges to: ${changes}`);
                    setHasChanges(changes);
                }
                return data;
            } else {
                if (!options?.dryRun) setSyncStatus('error');
                return data;
            }
        } catch (e) {
            console.error("Sync failed", e);
            if (!options?.dryRun) setSyncStatus('error');
            return { error: 'Sync request failed' };
        }
    }, [activeProjectId, files]);

    const checkChanges = useCallback(async (repoUrl?: string) => {
        return await triggerSync({ dryRun: true, repoUrl });
    }, [triggerSync]);

    const saveFileToFirestore = async (projectId: string, path: string, content: string) => {
        try {
            const sanitizedContent = stripMarkdownFences(content);
            const fileRef = doc(db, "web-projects", projectId, "files", encodePath(path));
            await setDoc(fileRef, {
                path,
                content: sanitizedContent,
                updatedAt: Date.now()
            });

            // Update local state and ref too!
            const nextFiles = { ...filesRef.current, [path]: sanitizedContent };
            filesRef.current = nextFiles;
            setFiles(nextFiles);

            // Update Cache
            localStorage.setItem(`fs_cache_${projectId}`, JSON.stringify(nextFiles));

            updateProjectLastModified(projectId);
            setHasChanges(true); // Flag changes locally immediately
        } catch (e) {
            console.error("Failed to save file to Firestore", e);
        }
    };

    const saveFile = useCallback(async (path: string, content: string) => {
        if (!activeProjectId) return;

        // Optimistic update status
        setSyncStatus('pending');

        try {
            await saveFileToFirestore(activeProjectId, path, content);

            // Debounced Change Check instead of auto-sync PUSH
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            syncTimeoutRef.current = setTimeout(() => {
                // Here we might not have repoUrl easily, but it's okay if it's fetched from DB occasionally
                // Or we can try to pass it if we had it in scope. 
                // Let's assume the manual check from Settings is the priority.
                checkChanges();
            }, 3000);

        } catch (e) {
            console.error("Failed to save file", e);
        }
    }, [activeProjectId, checkChanges]);

    const saveFilesToFirestore = async (projectId: string, filesToSave: Record<string, string>) => {
        try {
            const batch = writeBatch(db);
            Object.entries(filesToSave).forEach(([path, content]) => {
                const sanitized = stripMarkdownFences(content);
                const fileRef = doc(db, "web-projects", projectId, "files", encodePath(path));
                batch.set(fileRef, {
                    path,
                    content: sanitized,
                    updatedAt: Date.now()
                });
            });
            await batch.commit();
            updateProjectLastModified(projectId);

            // Update Cache
            localStorage.setItem(`fs_cache_${projectId}`, JSON.stringify(filesToSave));
            setHasChanges(true);
        } catch (e) {
            console.error("Failed to save files to Firestore batch", e);
        }
    };

    // Track latest files in ref for atomic updates without waiting for re-renders
    const filesRef = useRef(files);

    // Sync ref when files change externally or via init
    useEffect(() => {
        filesRef.current = files;
    }, [files]);

    const updateFiles = useCallback(async (newFilesOrFn: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
        let nextState: Record<string, string>;

        // Calculate next state based on the REF (most current truth)
        if (typeof newFilesOrFn === 'function') {
            nextState = newFilesOrFn(filesRef.current);
        } else {
            nextState = newFilesOrFn;
        }

        // SAFEGUARD: Reject invalid updates to prevent accidental wipe of the project
        if (!nextState || typeof nextState !== 'object' || Object.keys(nextState).length === 0) {
            console.error("[FileSystem] Rejected attempt to update files with an empty or invalid object:", nextState);
            return;
        }

        // Update Ref immediately
        filesRef.current = nextState;

        // Update UI State
        setFiles(nextState);
        setHistory(h => [files, ...h].slice(0, 50)); // history uses 'files' (rendered) which is fine
        setFuture([]);

        if (activeProjectId) {
            setSyncStatus('pending');

            // Save the accurately calculated nextState
            await saveFilesToFirestore(activeProjectId, nextState);

            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            syncTimeoutRef.current = setTimeout(() => checkChanges(), 3000);
        }
    }, [activeProjectId, files, checkChanges]);

    const handleUndo = useCallback(async () => {
        if (history.length === 0) return;
        const [prev, ...rest] = history;
        setFuture(f => [files, ...f]);
        setHistory(rest);
        setFiles(prev);
        if (activeProjectId) {
            await saveFilesToFirestore(activeProjectId, prev);
        }
    }, [activeProjectId, files, history]);

    const handleRedo = useCallback(async () => {
        if (future.length === 0) return;
        const [next, ...rest] = future;
        setHistory(h => [files, ...h]);
        setFuture(rest);
        setFiles(next);
        if (activeProjectId) {
            await saveFilesToFirestore(activeProjectId, next);
        }
    }, [activeProjectId, files, future]);

    const deleteProjectFiles = useCallback(async (id: string) => {
        // Redundant: Server-side API handles absolute deletion. 
        // Local state is cleared if active project is deleted via switch.
    }, []);

    // Safety: Ensure activeFile always exists
    useEffect(() => {
        if (!files[activeFile] && Object.keys(files).length > 0) {
            setActiveFile(Object.keys(files)[0]);
        }
    }, [files, activeFile]);

    return {
        files,
        setFiles,
        updateFiles,
        activeFile,
        setActiveFile,
        generatedTheme,
        setGeneratedTheme,
        history,
        future,
        handleUndo,
        handleRedo,
        deleteProjectFiles,
        syncStatus,
        triggerSync,
        hasChanges,
        checkChanges
    };
};
