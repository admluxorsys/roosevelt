
import { useState, useEffect, useCallback, useRef } from "react";
import { ChatMessage, ChatStep, ConversationState, ReasoningLevel, ChatConversation } from "../types";
import { generateCodePrompt, detectIndustry, generateDesignSpec } from "../ai/promptTemplates";
import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    query,
    orderBy,
    deleteDoc,
    doc,
    setDoc,
    onSnapshot
} from "firebase/firestore";

interface AIResponse {
    type: "question" | "plan" | "code_update" | "message";
    content: string;
    plan?: {
        summary: string;
        structure: string[];
        features: string[];
        theme: string;
    };
    files?: { path: string; content: string }[];
    showCloudSetup?: boolean;
    supabaseConfig?: { url: string; key: string };
}

export const useChatAI = (
    activeProjectId: string | null,
    files: Record<string, string>,
    updateFiles: (files: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => Promise<void> | void,
    setActiveFile: (path: string) => void,
    setGeneratedTheme: (theme: 'default' | 'art' | 'tech' | 'cosmetics') => void,
    showToast: (msg: string, type?: 'success' | 'info') => void,
    selectedModel: string,
    reasoningLevel: ReasoningLevel,
    supabaseConfig?: { url: string; key: string }
) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [conversationState, setConversationState] = useState<ConversationState>('idle');
    const [statusMessage, setStatusMessage] = useState<string>("");
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch Conversations when project changes
    useEffect(() => {
        if (!activeProjectId) {
            setConversations([]);
            setActiveConversationId(null);
            return;
        }

        const convoCol = collection(db, "web-projects", activeProjectId, "conversations");
        const q = query(convoCol, orderBy("updatedAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatConversation));
            setConversations(list);

            // Auto-select first if none active
            if (list.length > 0 && !activeConversationId) {
                setActiveConversationId(list[0].id);
            }
        }, (error) => {
            console.error("Firestore Permission Error (Conversations):", error);
            showToast("Error de permisos en Firestore. Asegúrate de actualizar tus reglas para la colección 'conversations'.", "info");
        });

        return () => unsubscribe();
    }, [activeProjectId]);

    // Fetch Messages for active conversation
    useEffect(() => {
        if (!activeProjectId || !activeConversationId) {
            setMessages([]);
            return;
        }

        const msgCol = collection(db, "web-projects", activeProjectId, "conversations", activeConversationId, "messages");
        const q = query(msgCol, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
            setMessages(list);
        }, (error) => {
            console.error("Firestore Permission Error (Messages):", error);
        });

        return () => unsubscribe();
    }, [activeProjectId, activeConversationId]);

    const handleCloudProvision = useCallback(async (msgId: string, region: string) => {
        if (!activeProjectId) return;

        const controller = new AbortController();
        setAbortController(controller);
        setIsGenerating(true);
        setStatusMessage("Habilitando infraestructura en la nube (Backend)...");

        try {
            const res = await fetch('/api/web-builder/cloud/provision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: activeProjectId, region }),
                signal: controller.signal
            });

            const data = await res.json();
            if (res.ok) {
                showToast("¡Nube habilitada con éxito!", "success");

                // Update the message state to hide the card
                setMessages(prev => prev.map(m =>
                    m.id === msgId ? { ...m, showCloudSetup: false, approved: true } : m
                ));

                // Persist the change in Firestore (Messages)
                if (activeConversationId) {
                    const msgRef = doc(db, "web-projects", activeProjectId, "conversations", activeConversationId, "messages", msgId);
                    await setDoc(msgRef, { showCloudSetup: false, approved: true }, { merge: true });
                }

                // Force a project data refresh or assume parent will handle it via onSnapshot
                // Inform AI to continue
                const aiResponse: ChatMessage = {
                    id: `ai-${Date.now()}`,
                    role: 'ai',
                    content: "¡Perfecto! He activado el backend y la base de datos para tu proyecto. ¿Qué tabla o funcionalidad te gustaría crear primero?",
                    timestamp: Date.now()
                };
                await saveChatMessage(activeProjectId, activeConversationId!, aiResponse);
            } else {
                showToast(`Error: ${data.error}`, "info");
            }
        } catch (e: any) {
            if (e.name === 'AbortError') {
                console.log('[AI] Cloud provision cancelled by user');
                return;
            }
            console.error("Cloud provision tool failure", e);
            showToast("Error al conectar con el servicio de nube", "info");
        } finally {
            setIsGenerating(false);
            setStatusMessage("");
            setAbortController(null);
        }
    }, [activeProjectId, activeConversationId, showToast]);

    useEffect(() => {
        const onApprove = (e: any) => {
            const { msgId, config } = e.detail;
            handleCloudProvision(msgId, config.region);
        };

        const onReject = (e: any) => {
            const { msgId } = e.detail;
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, showCloudSetup: false } : m));
            // Optional: Persist in DB
        };

        window.addEventListener('approve-cloud', onApprove);
        window.addEventListener('reject-cloud', onReject);
        return () => {
            window.removeEventListener('approve-cloud', onApprove);
            window.removeEventListener('reject-cloud', onReject);
        };
    }, [handleCloudProvision]);

    const saveChatMessage = async (projectId: string, convoId: string, message: ChatMessage) => {
        try {
            // Firestore doesn't like undefined fields
            const cleanMessage = JSON.parse(JSON.stringify({
                ...message,
                timestamp: message.timestamp || Date.now()
            }, (_, v) => v === undefined ? null : v));

            const msgCol = collection(db, "web-projects", projectId, "conversations", convoId, "messages");
            await addDoc(msgCol, cleanMessage);

            // Update conversation snippet
            const convoRef = doc(db, "web-projects", projectId, "conversations", convoId);
            await setDoc(convoRef, {
                lastMessage: message.content.substring(0, 100) || (message.images?.length ? "Imagen enviada" : ""),
                updatedAt: Date.now()
            }, { merge: true });

        } catch (e) {
            console.error("Failed to save message to Firestore", e);
        }
    };

    const handleNewConversation = useCallback(async () => {
        if (!activeProjectId) return;
        try {
            const convoCol = collection(db, "web-projects", activeProjectId, "conversations");
            const newConvo = await addDoc(convoCol, {
                title: "Nuevo Chat",
                updatedAt: Date.now()
            });
            setActiveConversationId(newConvo.id);
            setMessages([]);
        } catch (e) {
            console.error("Failed to create conversation", e);
        }
    }, [activeProjectId]);


    const deleteConversation = useCallback(async (convoId: string) => {
        if (!activeProjectId) return;
        try {
            await deleteDoc(doc(db, "web-projects", activeProjectId, "conversations", convoId));
            if (activeConversationId === convoId) {
                setActiveConversationId(null);
            }
        } catch (e) {
            console.error("Failed to delete conversation", e);
        }
    }, [activeProjectId, activeConversationId]);

    const cancelGeneration = useCallback(() => {
        if (abortController) {
            abortController.abort('User cancelled generation');
            setAbortController(null);
        }
        if (statusIntervalRef.current) {
            clearInterval(statusIntervalRef.current);
            statusIntervalRef.current = null;
        }
        setIsGenerating(false);
        setStatusMessage("");
        showToast('Generación cancelada', 'info');
    }, [abortController, showToast]);

    const handleGenerate = useCallback(async (userMsg: string, images?: { id: string, url: string, file?: File }[]) => {
        if (!activeProjectId) return;

        // Ensure we have a conversation
        let convoId = activeConversationId;
        if (!convoId) {
            const convoCol = collection(db, "web-projects", activeProjectId, "conversations");
            const newConvo = await addDoc(convoCol, {
                title: userMsg.substring(0, 40).trim() || "Nueva conversación",
                updatedAt: Date.now()
            });
            convoId = newConvo.id;
            setActiveConversationId(convoId);
        } else {
            // Auto-update title if the conversation still has a placeholder name
            const activeConvo = conversations.find(c => c.id === convoId);
            const placeholderTitles = ["Nuevo Chat", "Nueva conversación", ""];
            if (activeConvo && placeholderTitles.includes(activeConvo.title?.trim() || "")) {
                const convoRef = doc(db, "web-projects", activeProjectId, "conversations", convoId);
                const autoTitle = userMsg.substring(0, 40).trim() || "Chat sin título";
                await setDoc(convoRef, { title: autoTitle }, { merge: true });
            }
        }

        // Process images to base64 for API
        const processedImages = images ? await Promise.all(images.map(async img => {
            if (img.file) {
                return new Promise<{ data: string; mimeType: string }>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = reader.result as string;
                        resolve({
                            data: base64.split(',')[1],
                            mimeType: img.file?.type || 'image/jpeg'
                        });
                    };
                    reader.readAsDataURL(img.file!);
                });
            }
            return null;
        })) : [];

        const validImages = (processedImages.filter(Boolean) as { data: string; mimeType: string }[]).map((img, idx) => {
            const ext = img.mimeType.split('/')[1] || 'jpg';
            const timestamp = Date.now();
            return {
                ...img,
                path: `public/lovable-uploads/img_${timestamp}_${idx}.${ext}`
            };
        });
        const startTime = Date.now();

        // Auto-ingest images into the project filesystem
        if (validImages.length > 0) {
            console.log("[useChatAI] Auto-ingesting images into project assets...");
            await updateFiles(prevFiles => {
                const newFiles = { ...prevFiles };
                validImages.forEach((img) => {
                    // Use a placeholder for the virtual filesystem state to avoid Firestore size limits
                    // The real data is sent to the AI via apiFiles below.
                    newFiles[img.path] = "__ASSET_ON_DISK__";
                });
                return newFiles;
            });
        }

        // Add user message via SDK
        const userChatMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content: userMsg,
            // Save project paths instead of blob URLs for UI persistence
            images: validImages.length > 0
                ? validImages.map(img => `/${img.path.replace('public/', '')}`)
                : images?.map(img => img.url)
        };
        await saveChatMessage(activeProjectId, convoId, userChatMessage);

        const controller = new AbortController();
        setAbortController(controller);
        setIsGenerating(true);
        setStatusMessage("Preparando archivos y subiendo imágenes...");
        try {
            if (activeProjectId && convoId) {
                // Determine if it's a new project or an improvement
                const isNew = Object.keys(files).length <= 1; // src/app/page.tsx is always there
                if (isNew) setStatusMessage("Diseñando arquitectura inicial...");
                else setStatusMessage("Analizando código existente...");
            }

            const isNewProject = Object.keys(files).length <= 1;
            const isFirstMessage = messages.length === 0;
            const isRecreateRequest = userMsg.toLowerCase().includes("recarga") ||
                userMsg.toLowerCase().includes("reinicia") ||
                userMsg.toLowerCase().includes("recrea");

            // Prepare current files with the newly ingested images for the AI call
            let apiFiles = { ...files };
            if (validImages.length > 0) {
                validImages.forEach((img) => {
                    apiFiles[img.path] = img.data;
                });
            }

            // Auto-switch to Pro model for initial generation or explicit re-creation
            let modelToUse = selectedModel;
            if (reasoningLevel === 'high') {
                modelToUse = 'Multipass Agentic (Vertex)';
                setStatusMessage("Iniciando flujo multi-agente de Vertex AI (Arquitecto + Programador + Pulidor)...");
            } else if ((isNewProject && isFirstMessage) || isRecreateRequest) {
                modelToUse = "Gemini 1.5 Pro";
                setStatusMessage("Utilizando Gemini 1.5 Pro para estructuración premium...");
            }

            // Sequential Status Cycle
            if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
            const constructionSteps = [
                "Analizando arquitectura del proyecto...",
                "Buscando dependencias y componentes...",
                "Estructurando código base (Arquitecto)...",
                "Diseñadora de UI: Creando interfaz premium...",
                "Diseñadora de UI: Aplicando animaciones y efectos...",
                "Diseñadora de UI: Optimizando visuales y assets...",
                "Validando coherencia final del diseño...",
                "Ensamblando proyecto final..."
            ];

            let step = 0;
            setStatusMessage(constructionSteps[0]);

            statusIntervalRef.current = setInterval(() => {
                step = (step + 1) % constructionSteps.length;
                setStatusMessage(constructionSteps[step]);
            }, 5000);

            let res;
            let attempts = 0;
            const maxClientAttempts = 2;

            while (attempts < maxClientAttempts) {
                try {
                    attempts++;
                    res = await fetch('/api/web-builder/ai', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: [...messages, userChatMessage].map(m => {
                                const payload: any = { role: m.role, content: m.content };
                                if (m.id === userChatMessage.id && validImages.length > 0) {
                                    payload.images = validImages;
                                }
                                return payload;
                            }),
                            currentFiles: apiFiles,
                            model: attempts === 1 ? modelToUse : "Gemini 2.0 Flash",
                            projectId: activeProjectId,
                            supabaseConfig
                        }),
                        signal: controller.signal
                    });

                    if (res.ok) break;
                    else throw new Error(`HTTP Error ${res.status}`);
                } catch (e: any) {
                    if (e.name === 'AbortError') throw e;
                    if (attempts >= maxClientAttempts) throw e;
                    console.warn(`[useChatAI] Attempt ${attempts} failed. Retrying with Flash...`, e);
                    setStatusMessage("Reintentando con modelo de respaldo (Resiliencia Phase 3)...");
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            if (statusIntervalRef.current) {
                clearInterval(statusIntervalRef.current);
                statusIntervalRef.current = null;
            }
            if (!res) throw new Error("No response from AI API after retries");

            const data: AIResponse = await res.json();
            const endTime = Date.now();
            const thinkingTime = Math.floor((endTime - startTime) / 1000);

            setStatusMessage("Procesando respuesta técnica...");

            // 1. TRY EXTREMELY ROBUST JSON EXTRACTION (Rescuing code from "dirty" responses)
            let parsedData: AIResponse | null = null;
            if (data.type === 'message') {
                try {
                    const text = data.content || "";
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        try {
                            const extracted = JSON.parse(jsonMatch[0]);
                            if (extracted.type && ['code_update', 'plan', 'question', 'message'].includes(extracted.type)) {
                                parsedData = { ...data, ...extracted };
                            }
                        } catch (e) { }
                    }
                } catch (e) {
                    console.warn("Silent rescue failed", e);
                }
            }

            const finalData = parsedData || data;

            // Simulate Structured Steps for ReasoningBlock
            const generatedSteps: ChatStep[] = [];
            if (finalData.type === 'plan') {
                generatedSteps.push(
                    { id: '1', label: 'Analizar requerimientos', status: 'done', type: 'laboral' },
                    { id: '2', label: 'Diseñar arquitectura de componentes', status: 'current', type: 'laboral' },
                    { id: '3', label: 'Estructurar plan de ejecución', status: 'pending', type: 'proximo' },
                    { id: '4', label: 'Validar coherencia visual', status: 'pending', type: 'proximo' }
                );
            } else if (finalData.type === 'code_update') {
                generatedSteps.push(
                    { id: '1', label: 'Análisis de diferencias (Diffing)', status: 'done', type: 'laboral' },
                    { id: '2', label: 'Aplicar parches quirúrgicos', status: 'done', type: 'laboral' },
                    { id: '3', label: 'Ensamblar archivos modificados', status: 'done', type: 'laboral' },
                    { id: '4', label: 'Sincronizar visor y editor', status: 'done', type: 'laboral' }
                );
            } else {
                generatedSteps.push(
                    { id: '1', label: 'Analizar consulta del usuario', status: 'done', type: 'laboral' },
                    { id: '2', label: 'Generar respuesta contextual', status: 'done', type: 'laboral' }
                );
            }

            // Mark all active/pending steps as 'done' for the final message persistence
            const finalSteps: ChatStep[] = generatedSteps.map(s => ({
                ...s,
                status: 'done' as const
            }));

            if (finalData.type === 'code_update' && finalData.files && finalData.files.length > 0) {
                console.group("[AI Code Update]");
                console.log("Files received:", finalData.files.map(f => f.path));
                console.log("Content sizes:", finalData.files.map(f => `${f.path}: ${f.content.length} chars`));

                await updateFiles(prevFiles => {
                    const newFiles = { ...prevFiles };
                    finalData.files!.forEach(f => {
                        newFiles[f.path] = f.content;
                    });
                    return newFiles;
                });
                setStatusMessage("Sincronizando cambios locales...");
                console.groupEnd();

                setActiveFile(finalData.files[0].path);
                showToast(`Se han aplicado ${finalData.files.length} mejoras al código.`, "success");
            }
            else if (finalData.type === 'code_update' && (!finalData.files || finalData.files.length === 0)) {
                console.warn("[AI] Code update received but no files found. Raw content:", finalData.content);
            }

            let aiChatMessage: ChatMessage | null = null;

            if (finalData.type === 'plan' && finalData.plan) {
                aiChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'ai' as const,
                    content: finalData.content || `He preparado un plan para "${finalData.plan.summary}".`,
                    plan: finalData.plan,
                    thinkingTime,
                    steps: finalSteps,
                    showCloudSetup: finalData.showCloudSetup
                };
            }
            else if (finalData.type === 'code_update' && finalData.files) {
                aiChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'ai' as const,
                    content: finalData.content || "Mejoras aplicadas correctamente.",
                    thinkingTime,
                    steps: finalSteps,
                    showCloudSetup: finalData.showCloudSetup
                };
            }
            else {
                aiChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'ai' as const,
                    content: finalData.content || "",
                    thinkingTime,
                    steps: finalSteps,
                    showCloudSetup: finalData.showCloudSetup,
                    supabaseConfig: finalData.supabaseConfig
                };
            }

            if (aiChatMessage) {
                await saveChatMessage(activeProjectId, convoId, aiChatMessage);

                // Set first user message as title if it was "Nuevo Chat"
                const currentConvo = conversations.find(c => c.id === convoId);
                if (currentConvo && currentConvo.title === "Nuevo Chat") {
                    const convoRef = doc(db, "web-projects", activeProjectId, "conversations", convoId);
                    await setDoc(convoRef, { title: userMsg.substring(0, 30) }, { merge: true });
                }
            }

        } catch (e: any) {
            console.error("AI Generation failed", e);

            // Don't show error if user cancelled
            if (e.name === 'AbortError' || e.message?.includes('cancelled')) {
                console.log('[AI] Generation cancelled by user');
                return;
            }

            if (activeProjectId && convoId) {
                saveChatMessage(activeProjectId, convoId, {
                    id: crypto.randomUUID(),
                    role: 'ai' as const,
                    content: "Lo siento, hubo un error al procesar tu solicitud."
                });
            }
        } finally {
            setIsGenerating(false);
            setStatusMessage("");
            setAbortController(null);
            if (statusIntervalRef.current) {
                clearInterval(statusIntervalRef.current);
                statusIntervalRef.current = null;
            }
            setAbortController(null);
        }
    }, [activeProjectId, activeConversationId, messages, files, selectedModel, updateFiles, setActiveFile, showToast, conversations]);

    const approvePlan = useCallback(async (msgId: string) => {
        if (!activeProjectId || !activeConversationId || !msgId) return;
        try {
            const msgRef = doc(db, "web-projects", activeProjectId, "conversations", activeConversationId, "messages", msgId);
            await setDoc(msgRef, { approved: true }, { merge: true });

            // Trigger the AI to proceed
            handleGenerate("Plan aprobado. Procede a generar el código.");
        } catch (e) {
            console.error("Failed to approve plan in Firestore", e);
        }
    }, [activeProjectId, activeConversationId, handleGenerate]);

    return {
        isGenerating,
        statusMessage,
        chatHistory: messages,
        conversations,
        activeConversationId,
        setActiveConversationId,
        handleGenerate,
        handleNewConversation,
        approvePlan,
        deleteConversation,
        cancelGeneration
    };
}

