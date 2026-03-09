import { useState, useEffect, useCallback } from "react";
import { WebProject } from "../types";
import { db, auth } from "@/lib/firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp,
    onSnapshot,
    writeBatch
} from "firebase/firestore";

export const useProjects = (initialFiles: Record<string, string>) => {
    const [projects, setProjects] = useState<WebProject[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

    // Initial Load active project from localStorage (Safe for Hydration)
    useEffect(() => {
        const savedId = localStorage.getItem('web-builder-active-project');
        if (savedId) {
            setActiveProjectId(savedId);
        }
    }, []);

    // Initial Load & Real-time Sync
    useEffect(() => {
        const q = collection(db, "web-projects");
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const projectsData = snapshot.docs
                .map(d => ({
                    id: d.id,
                    name: "Untitled Project",
                    lastModified: Date.now(),
                    ...d.data()
                } as WebProject))
                // Filter out ghost docs: must have a real name field in Firestore
                .filter(p => {
                    const raw = snapshot.docs.find(d => d.id === p.id)?.data();
                    return raw && raw.name && raw.name.trim() !== '';
                });

            // Sort in memory to be resilient to missing fields
            projectsData.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));

            setProjects(projectsData);
        });

        return () => unsubscribe();
    }, []);

    // Persist active project ID
    useEffect(() => {
        if (activeProjectId) {
            localStorage.setItem('web-builder-active-project', activeProjectId);
        } else {
            localStorage.removeItem('web-builder-active-project');
        }
    }, [activeProjectId]);

    const handleNewProject = useCallback(async (name: string) => {
        if (!name) return;

        try {
            const newProject = {
                name,
                authorId: auth.currentUser?.uid,
                createdAt: Date.now(),
                lastModified: Date.now(),
                repoUrl: '',
                previewUrl: ''
            };

            const docRef = await addDoc(collection(db, "web-projects"), newProject);
            const projectId = docRef.id;

            // Initialize files in Firestore
            const batch = writeBatch(db);
            Object.entries(initialFiles).forEach(([path, content]) => {
                const fileRef = doc(db, "web-projects", projectId, "files", encodeURIComponent(path).replace(/\./g, '%2E'));
                batch.set(fileRef, {
                    path,
                    content,
                    updatedAt: Date.now()
                });
            });
            await batch.commit();

            setActiveProjectId(projectId);
            return projectId;
        } catch (e) {
            console.error("Failed to create project with files", e);
        }
    }, [initialFiles]);

    const handleSwitchProject = useCallback((id: string) => {
        setActiveProjectId(id);
    }, []);

    const deleteProject = useCallback(async (id: string) => {
        try {
            const batch = writeBatch(db);

            // 1. Delete all files
            const filesSnap = await getDocs(collection(db, "web-projects", id, "files"));
            filesSnap.docs.forEach(d => batch.delete(d.ref));

            // 2. Delete all conversations AND their nested messages
            const convsSnap = await getDocs(collection(db, "web-projects", id, "conversations"));
            for (const convoDoc of convsSnap.docs) {
                // Delete every message inside this conversation
                const msgsSnap = await getDocs(
                    collection(db, "web-projects", id, "conversations", convoDoc.id, "messages")
                );
                msgsSnap.docs.forEach(m => batch.delete(m.ref));
                // Delete the conversation document itself
                batch.delete(convoDoc.ref);
            }

            // 3. Delete the project document
            batch.delete(doc(db, "web-projects", id));

            await batch.commit();

            // Clear localStorage if this was the active project
            if (activeProjectId === id) {
                setActiveProjectId(null);
                localStorage.removeItem('web-builder-active-project');
            }
            console.log(`[deleteProject] Project ${id} and all subcollections deleted successfully.`);
        } catch (e: any) {
            console.error("Failed to delete project:", e);
            // Fallback to API
            try {
                await fetch(`/api/web-builder/projects?projectId=${id}`, { method: 'DELETE' });
            } catch (apiErr) {
                console.error("API fallback delete also failed:", apiErr);
            }
        }
    }, [activeProjectId]);

    const updateProjectLastModified = useCallback(async (id: string) => {
        try {
            await updateDoc(doc(db, "web-projects", id), {
                lastModified: Date.now()
            });
        } catch (e) {
            console.error("Failed to update lastModified", e);
        }
    }, []);

    const updateProjectRepo = useCallback(async (id: string, repoUrl: string) => {
        try {
            await updateDoc(doc(db, "web-projects", id), {
                repoUrl,
                lastModified: Date.now()
            });
        } catch (e) {
            console.error("Failed to update repoUrl", e);
        }
    }, []);

    const updateProject = useCallback(async (id: string, updates: Partial<WebProject>) => {
        try {
            await updateDoc(doc(db, "web-projects", id), {
                ...updates,
                lastModified: Date.now()
            });
        } catch (e) {
            console.error("Failed to update project metadata", e);
        }
    }, []);

    const activeProject = projects.find(p => p.id === activeProjectId);

    return {
        projects,
        setProjects,
        activeProjectId,
        activeProject,
        handleNewProject,
        handleSwitchProject,
        deleteProject,
        updateProjectLastModified,
        updateProjectRepo,
        updateProject
    };
};
