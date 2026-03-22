
import React, { useState } from "react";
import { MoreHorizontal, Plus, History, MessageSquare, Trash2, X, Sparkles, Globe } from "lucide-react";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { ChatConversation, ChatMessage, ReasoningLevel, WebProject } from "../types";

interface ChatSidebarProps {
    messages: ChatMessage[];
    isGenerating: boolean;
    statusMessage?: string;
    handleGenerate: (msg: string, images?: { id: string, url: string, file?: File }[]) => void;
    projectOpen: boolean;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    reasoningLevel: ReasoningLevel;
    setReasoningLevel: (level: ReasoningLevel) => void;

    // Conversation Props
    conversations: ChatConversation[];
    activeConversationId: string | null;
    setActiveConversationId: (id: string) => void;
    handleNewConversation: () => void;
    deleteConversation: (id: string) => void;
    cancelGeneration?: () => void;
    approvePlan?: (msgId: string) => void;
    onOpenSettings?: () => void;
}

export const ChatSidebar = ({
    messages, isGenerating, handleGenerate, projectOpen,
    selectedModel, setSelectedModel, reasoningLevel, setReasoningLevel,
    conversations, activeConversationId, setActiveConversationId, handleNewConversation, deleteConversation,
    cancelGeneration, statusMessage, onOpenSettings, approvePlan
}: ChatSidebarProps) => {
    const [input, setInput] = useState("");
    const [selectedImages, setSelectedImages] = useState<{ id: string, url: string, file?: File }[]>([]);
    const [showHistoryList, setShowHistoryList] = useState(false);

    const onSend = () => {
        if (!input.trim() && selectedImages.length === 0) return;
        handleGenerate(input, selectedImages);
        setInput("");
        setSelectedImages([]);
    };

    // Listen for Approval Events from ChatMessageList
    React.useEffect(() => {
        const handleApprove = (e: any) => {
            const msgId = e.detail?.msgId;
            if (approvePlan && msgId) {
                approvePlan(msgId);
            } else {
                handleGenerate("Plan aprobado. Procede a generar el código.");
            }
        };
        const handleReject = () => {
            // Fill input with a modification prompt instead of direct message
            setInput("Quiero modificar el plan propuesto: ");
            // Focus textarea if possible
            const textarea = document.querySelector('textarea');
            if (textarea) textarea.focus();
        };

        window.addEventListener('approve-plan', handleApprove);
        window.addEventListener('reject-plan', handleReject);

        return () => {
            window.removeEventListener('approve-plan', handleApprove);
            window.removeEventListener('reject-plan', handleReject);
        };
    }, [handleGenerate]);

    return (
        <div className="w-[317px] border-r border-white/5 flex flex-col bg-[#09090b]/90 backdrop-blur-xl relative z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] font-sans">
            {/* Header with Actions */}
            <div className="h-14 border-b border-white/[0.03] bg-white/[0.01] flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em] flex items-center gap-2">
                        AI Architect
                    </span>
                </div>

                <div className="flex items-center gap-0.5">
                    <button
                        onClick={onOpenSettings}
                        className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all active:scale-90"
                        title="Integraciones y Base de Datos"
                    >
                        <Globe className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleNewConversation}
                        className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all active:scale-90"
                        title="Nuevo Chat"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setShowHistoryList(!showHistoryList)}
                        className={`p-2 rounded-xl transition-all active:scale-90 ${showHistoryList ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        title="Historial de Chats"
                    >
                        <History className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* History Overlay or Chat List */}
            {showHistoryList ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 animate-in fade-in slide-in-from-left-4 duration-200">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <span className="text-sm font-bold text-gray-300">Tus chats</span>
                    </div>

                    <div className="space-y-1">
                        {conversations.map(convo => (
                            <div
                                key={convo.id}
                                onClick={() => { setActiveConversationId(convo.id); setShowHistoryList(false); }}
                                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${activeConversationId === convo.id
                                    ? 'bg-[#202023] text-white border border-[#333]'
                                    : 'text-gray-400 hover:bg-[#151518] hover:text-gray-200 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                                    <div className="overflow-hidden">
                                        <span className="text-sm truncate block">
                                            {convo.title?.trim() || "Chat sin título"}
                                        </span>
                                        {convo.updatedAt && (
                                            <span className="text-[10px] text-gray-600 block">
                                                {new Date(convo.updatedAt).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteConversation(convo.id); }}
                                    className="p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}

                        {conversations.length === 0 && (
                            <div className="text-center py-10 text-xs text-gray-500">
                                No hay conversaciones previas.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <ChatMessageList
                        messages={messages}
                        isGenerating={isGenerating}
                        statusMessage={statusMessage}
                    />

                    <ChatInput
                        input={input}
                        setInput={setInput}
                        handleGenerate={onSend}
                        isGenerating={isGenerating}
                        projectOpen={projectOpen}
                        selectedModel={selectedModel}
                        setSelectedModel={setSelectedModel}
                        reasoningLevel={reasoningLevel}
                        setReasoningLevel={setReasoningLevel}
                        selectedImages={selectedImages}
                        setSelectedImages={setSelectedImages}
                        cancelGeneration={cancelGeneration}
                        statusMessage={statusMessage}
                    />
                </>
            )}
        </div>
    );
};

