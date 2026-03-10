import { useState, useMemo, useEffect, useRef } from 'react';
import { groupMessagesByDate } from '../utils';
import { socialPlatforms } from '../constants';
import { ConversationModalProps } from '../types';
import { useCardSubscription } from './useCardSubscription';
import { useMessageSender } from './useMessageSender';
import { useCardOperations } from './useCardOperations';

export const useConversationLogic = (props: ConversationModalProps) => {
    // 1. Subscription & Data Layer
    const {
        liveCardData,
        setLiveCardData,
        contactInfo,
        setContactInfo,
        crmData,
        currentCardId,
        currentGroupId,
        currentGroupName,
        setForcedCardId,
        setForcedGroupId
    } = useCardSubscription(props);

    // 2. UI State
    const [activeTab, setActiveTab] = useState<'perfil' | 'pagos' | 'notas' | 'historial' | null>(null);
    const [activePlatform, setActivePlatform] = useState('WhatsApp');
    const [isEditing, setIsEditing] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string; } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const onEmojiClick = (emojiData: any) => {
        senderLogic.setNewMessage((prev: string) => prev + emojiData.emoji);
    };

    // Sync Active Platform with Card Source
    useEffect(() => {
        if (liveCardData) {
            const rawSource = (liveCardData.channel || liveCardData.source || liveCardData.primary_channel || '').toLowerCase();
            let targetPlatform = 'WhatsApp';

            if (rawSource.includes('instagram')) targetPlatform = 'Instagram';
            else if (rawSource.includes('messenger') || rawSource.includes('facebook')) targetPlatform = 'Messenger';
            else if (rawSource.includes('telegram')) targetPlatform = 'Telegram';
            else if (rawSource.includes('x') || rawSource.includes('twitter')) targetPlatform = 'X';
            else if (rawSource.includes('tiktok')) targetPlatform = 'TikTok';
            else if (rawSource.includes('web')) targetPlatform = 'Web';

            setActivePlatform(targetPlatform);
        }
    }, [liveCardData?.id]);

    const currentPlatform = useMemo(() =>
        socialPlatforms.find(p => p.name === activePlatform) || socialPlatforms[0],
        [activePlatform]);

    // 3. Messages & Sending Layer
    const senderLogic = useMessageSender({
        currentCardId: currentCardId || null,
        currentGroupId: currentGroupId || null,
        liveCardData,
        card: props.card,
        setLiveCardData,
        setForcedCardId,
        setForcedGroupId,
        activePlatform
    });

    // 4. Operations Layer (Notes, Check-ins, etc.)
    const operationsLogic = useCardOperations({
        currentCardId: currentCardId || null,
        currentGroupId: currentGroupId || null,
        liveCardData,
        card: props.card,
        contactInfo,
        setContactInfo,
        setLiveCardData,
        isEditing,
        setIsEditing
    });

    // 5. Computed Helpers
    const groupedMessages = useMemo(() => groupMessagesByDate(liveCardData?.messages || []), [liveCardData?.messages]);

    const isMessageRead = (msg: any) =>
        liveCardData?.lastReadAt && msg.timestamp
            ? msg.timestamp.seconds <= liveCardData.lastReadAt.seconds
            : false;

    const dynamicItems = liveCardData?.checkIns || [];
    const completedDynamicItems = dynamicItems.filter(item => item.completed);
    const totalItems = dynamicItems.length;
    const totalCompleted = completedDynamicItems.length;
    const checklistProgress = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

    return {
        // Data
        liveCardData,
        contactInfo: {
            ...contactInfo,
            id: crmData?.id || contactInfo.id
        },
        setContactInfo,
        currentCardId,
        crmId: crmData?.id || contactInfo.id,
        currentGroupName,
        checklistProgress,

        // UI
        activeTab,
        setActiveTab,
        activePlatform,
        setActivePlatform,
        currentPlatform,
        isEditing,
        setIsEditing,
        previewFile,
        setPreviewFile,
        onEmojiClick,

        // Messages
        groupedMessages,
        isMessageRead,
        messagesEndRef,
        ...senderLogic, // newMessage, isSending, handleSendMessage, etc.

        // Operations
        ...operationsLogic, // handleSaveNote, handleSaveCheckIn, handleAddLabel, etc.
    };
};
