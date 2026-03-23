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

    // 24h Window Check
    const isWithin24Hours = useMemo(() => {
        if (!liveCardData?.messages || liveCardData.messages.length === 0) return false;
        const userMessages = liveCardData.messages.filter(m => m.sender !== 'agent');
        if (userMessages.length === 0) return false;

        const lastUserMsg = userMessages[userMessages.length - 1];
        if (!lastUserMsg.timestamp) return false;

        const lastMsgDate = lastUserMsg.timestamp.toDate();
        const now = new Date();
        const diffHours = (now.getTime() - lastMsgDate.getTime()) / (1000 * 60 * 60);

        return diffHours < 24;
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
                messages: [tempMessage]
            };
            return {
                ...prev,
                messages: [...(prev.messages || []), tempMessage]
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

            const result = await response.json();

            if (!response.ok) {
                const errorMsg = result.error || 'Error al enviar';
                const details = result.details ? `\nDetalles: ${JSON.stringify(result.details)}` : '';
                toast.error(`${errorMsg}${details}`);
                
                // Mark message as failed instead of removing it
                setLiveCardData(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        messages: prev.messages?.map(m => (m as any).id === tempMsgId ? { ...m, status: 'failed' } : m)
                    };
                });
                setNewMessage(messageToSend);
                setIsSending(false);
                return;
            }

            if (result.success) {
                toast.success(`Mensaje enviado a ${result.sentTo}`);
                if (result.cardId && result.groupId) {
                    if (result.cardId !== currentCardId || result.groupId !== currentGroupId) {
                        setForcedGroupId(result.groupId);
                        setForcedCardId(result.cardId);
                    }
                }
            }
        } catch (error: any) {
            // Keep console.warn instead of error to avoid Next.js overlay in dev
            console.warn('[MessageSender] Caught error:', error);
            toast.error('Error de conexión o de red.');
            
            // Mark message as failed
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
        
        // Remove failed message from UI before retrying
        setLiveCardData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                messages: prev.messages?.filter(m => (m as any).id !== msgToRetry.id)
            };
        });

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

