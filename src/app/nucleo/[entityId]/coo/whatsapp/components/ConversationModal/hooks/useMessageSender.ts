import { useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { useFileUpload } from '@/lib/hooks/useFileUpload';
import { normalizePhoneNumber } from '@/lib/phoneUtils';
import { Timestamp } from 'firebase/firestore';
import { CardData, Message } from '../types';
import { socialPlatforms } from '../constants';
import { useAuth } from '@/contexts/AuthContext';

interface UseMessageSenderProps {
    currentCardId: string | null;
    currentGroupId: string | null;
    liveCardData: CardData | null;
    card: any; // Fallback card props
    setLiveCardData: React.Dispatch<React.SetStateAction<CardData | null>>;
    setForcedCardId: (id: string) => void;
    setForcedGroupId: (id: string) => void;
    activePlatform: string;
}

export const useMessageSender = ({
    currentCardId,
    currentGroupId,
    liveCardData,
    card,
    setLiveCardData,
    setForcedCardId,
    setForcedGroupId,
    activePlatform
}: UseMessageSenderProps) => {
    const { currentUser, activeEntity } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

    const { uploading, progress, uploadFile } = useFileUpload();

    // 24h Window Check (Improved Resilience)
    const isWithin24Hours = useMemo(() => {
        const messages = liveCardData?.messages || card?.messages || [];
        if (messages.length === 0) return true; // Default to true for new conversations to avoid template errors

        const userMessages = messages.filter((m: any) => m.sender !== 'agent');
        if (userMessages.length === 0) return true;

        const lastUserMsg = userMessages[userMessages.length - 1];
        if (!lastUserMsg.timestamp) return false;

        try {
            const now = new Date();
            let lastMsgDate: Date;

            if (lastUserMsg.timestamp.toDate) {
                lastMsgDate = lastUserMsg.timestamp.toDate();
            } else if (lastUserMsg.timestamp.seconds) {
                lastMsgDate = new Date(lastUserMsg.timestamp.seconds * 1000);
            } else if (lastUserMsg.timestamp instanceof Date) {
                lastMsgDate = lastUserMsg.timestamp;
            } else if (typeof lastUserMsg.timestamp === 'string' || typeof lastUserMsg.timestamp === 'number') {
                lastMsgDate = new Date(lastUserMsg.timestamp);
            } else {
                // Fallback for objects that might NOT have toDate but are still timestamps
                lastMsgDate = new Date();
            }

            const diffHours = (now.getTime() - lastMsgDate.getTime()) / (1000 * 60 * 60);
            return diffHours < 24;
        } catch (e) {
            console.warn('[useMessageSender] Error parsing timestamp for 24h check:', e);
            return true; // Default to true to try sending text instead of failing on template
        }
    }, [liveCardData?.messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || isSending) return;

        const rawPhone = liveCardData?.contactNumber || card?.contactNumber;
        const phoneNumber = normalizePhoneNumber(rawPhone || '');

        if (!phoneNumber) {
            toast.error('No se puede enviar: falta el número de teléfono del contacto.');
            return;
        }

        setIsSending(true);

        const tempMsgId = Date.now().toString() + Math.random().toString(36).substring(7);
        const tempMessage: Message & { id?: string } = {
            id: tempMsgId,
            text: newMessage,
            sender: 'agent',
            timestamp: Timestamp.now(),
            status: 'sending'
        };

        // 1. Optimistic UI Update
        setLiveCardData(prev => {
            if (!prev) return {
                ...card as any,
                id: currentCardId || 'temp',
                messages: [...(card?.messages || []), tempMessage],
                unreadCount: 0
            };
            return {
                ...prev,
                messages: [...(prev.messages || []), tempMessage],
                unreadCount: 0 // Reset unread count optimistically when sending
            };
        });

        const messageToSend = newMessage;
        setNewMessage('');

        try {
            const apiCardId = currentCardId?.startsWith('temp-') ? undefined : currentCardId;

            let payload: any = {
                message: messageToSend,
                toNumber: phoneNumber,
                cardId: apiCardId,
                groupId: currentGroupId,
                platform: activePlatform,
                userId: currentUser?.uid,
                entityId: activeEntity
            };

            if (activePlatform === 'WhatsApp' && !isWithin24Hours) {
                payload = {
                    ...payload,
                    type: 'template',
                    template: {
                        name: 'custom_message',
                        language: { code: 'es' },
                        components: [
                            { type: 'body', parameters: [{ type: 'text', text: messageToSend }] }
                        ]
                    }
                };
            }

            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            let result;
            try {
                result = await response.json();
            } catch (e) {
                const text = await response.text();
                console.error('[useMessageSender] Response is not JSON:', text);
                result = { error: 'Server Error (Non-JSON)', details: text.substring(0, 500) };
            }

            if (!response.ok) {
                const errorMsg = result.error || 'Error al enviar';

                // Mostrar el error detallado en un Toast para diagnóstico rápido
                let detail = '';
                if (typeof result.details === 'object') {
                    detail = result.details?.error?.message || JSON.stringify(result.details);
                } else {
                    detail = result.details || '';
                }

                toast.error(`${errorMsg}: ${detail}`, {
                    duration: 10000, // Show for 10 seconds
                    action: {
                        label: 'Ver Detalle',
                        onClick: () => alert(JSON.stringify(result, null, 2))
                    }
                });

                // Mark message as failed
                setLiveCardData(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        messages: prev.messages?.map(m => (m as any).id === tempMsgId ? { ...m, status: 'failed', error: detail } : m)
                    };
                });
                setNewMessage(messageToSend);
            } else {
                // ✅ Success: update optimistic message from 'sending' → 'sent'
                setLiveCardData(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        messages: prev.messages?.map(m =>
                            (m as any).id === tempMsgId
                                ? { ...m, status: 'sent', kambanMessageId: result?.messageId || null }
                                : m
                        )
                    };
                });
            }
        } catch (error: any) {
            console.error('[useMessageSender] Fatal Error:', error);
            toast.error(`Error de Conexión: ${error.message}`);

            // Mark as failed in catch too
            setLiveCardData(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    messages: prev.messages?.map(m => (m as any).id === tempMsgId ? { ...m, status: 'failed' } : m)
                };
            });
            setNewMessage(messageToSend);
        } finally {
            setIsSending(false);
        }
    };

    const sendTemplateMessage = async (templateName: string = 'hello_world') => {
        const rawPhone = liveCardData?.contactNumber || card?.contactNumber;
        const phoneNumber = normalizePhoneNumber(rawPhone || '');

        if (!phoneNumber) {
            toast.error('No se puede enviar: falta el número de teléfono.');
            return;
        }

        setIsSending(true);
        const tempMsg: Message = {
            text: `[PLANTILLA] ${templateName}`,
            sender: 'agent',
            timestamp: Timestamp.now()
        };

        setLiveCardData(prev => {
            if (!prev) return { ...card as any, id: currentCardId || 'temp', messages: [tempMsg] };
            return { ...prev, messages: [...(prev.messages || []), tempMsg] };
        });

        try {
            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Plantilla enviada: ${templateName}`,
                    toNumber: phoneNumber,
                    cardId: currentCardId?.startsWith('temp-') ? undefined : currentCardId,
                    groupId: currentGroupId,
                    type: 'template',
                    template: { name: templateName, language: { code: templateName === 'hello_world' ? 'en_US' : 'es' } },
                    userId: currentUser?.uid,
                    entityId: activeEntity
                })
            });

            if (!response.ok) throw new Error(JSON.stringify(await response.json()));

            const result = await response.json();
            if (result.success) {
                toast.success('Plantilla enviada correctamente');
                if (result.cardId && result.groupId) {
                    setForcedGroupId(result.groupId);
                    setForcedCardId(result.cardId);
                }
            }
        } catch (error: any) {
            toast.error('Error al enviar plantilla');
            setLiveCardData(prev => prev ? ({ ...prev, messages: prev.messages?.filter(m => m !== tempMsg) }) : null);
        } finally {
            setIsSending(false);
        }
    };

    const handleDisplayFileSend = async () => {
        if (!selectedFile || !liveCardData?.contactNumber) return;
        if (!currentCardId || currentCardId.startsWith('temp-')) {
            toast.error('Envía un mensaje de texto primero para iniciar la conversación.');
            return;
        }
        await uploadFile(selectedFile, { cardId: currentCardId, groupId: currentGroupId!, toNumber: liveCardData.contactNumber });
        if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
        setSelectedFile(null);
        setFilePreviewUrl(null);
    };

    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setSelectedFile(file);
            setFilePreviewUrl(URL.createObjectURL(file));
        }
    };

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: {
            'image/*': [],
            'video/*': [],
            'application/pdf': [],
            'audio/*': []
        },
        multiple: false
    });

    const handleCancelPreview = () => {
        setSelectedFile(null);
        setFilePreviewUrl(null);
    };

    const retryMessage = async (msgToRetry: Message & { id?: string }) => {
        if (!msgToRetry.id || !msgToRetry.text) return;
        setNewMessage(msgToRetry.text);

        // We no longer remove the failed message from UI/Firestore, 
        // as the user wants error messages to stay registered.

        // Small delay to ensure state updates before sending
        setTimeout(() => {
            handleSendMessage();
        }, 50);
    };

    return {
        newMessage,
        setNewMessage,
        isSending,
        selectedFile,
        filePreviewUrl,
        setSelectedFile,
        setFilePreviewUrl,
        uploading,
        progress,
        isWithin24Hours,
        handleSendMessage,
        sendTemplateMessage,
        handleDisplayFileSend,
        handleCancelPreview,
        retryMessage,
        open,
        getRootProps,
        getInputProps,
        isDragActive
    };
};

