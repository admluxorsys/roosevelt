'use client';

import React, { useState } from 'react';
import InboxSidebar from './components/InboxSidebar';
import ChatList from './components/ChatList';
import ChatArea from './components/ChatArea';
import { useKanbanBoard } from '../whatsapp/hooks/useKanbanBoard';

export default function OmnichannelInboxPage() {
    // State to manage which conversation is active
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [selectedFolder, setSelectedFolder] = useState<string>('all');

    const { cards, groups, loading } = useKanbanBoard();

    // Find active card data
    const activeCard = cards.find(c => c.id === activeConversationId) || null;
    const activeGroupName = groups.find(g => activeCard && g.id === activeCard.groupId)?.name || '';

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden text-sm">
            {/* 1. Left Sidebar: Folders, Channels, Tags */}
            <InboxSidebar
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
                cards={cards}
            />

            {/* 2. Middle Column: List of conversations */}
            <ChatList
                selectedFolder={selectedFolder}
                activeConversationId={activeConversationId}
                setActiveConversationId={setActiveConversationId}
                cards={cards}
                loading={loading}
            />

            {/* 3. Right Area: Chat history + Contact panel */}
            <div className="flex flex-1 overflow-hidden bg-[#111111]">
                {activeCard ? (
                    <>
                        {/* Chat History and Input */}
                        <ChatArea
                            card={activeCard}
                            groups={groups}
                            groupName={activeGroupName}
                            allConversations={cards}
                        />
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center flex-col text-neutral-500">
                        <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="text-lg">Select a conversation to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
}

