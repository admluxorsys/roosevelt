import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, Clock, MessageCircle, ChevronDown, Check, Mic } from 'lucide-react';

interface ChatListProps {
    selectedFolder: string;
    activeConversationId: string | null;
    setActiveConversationId: (id: string) => void;
    cards?: any[];
    loading?: boolean;
}

type SortOption = 'newest' | 'oldest';
type FilterOption = 'all' | 'unread';

export default function ChatList({ selectedFolder, activeConversationId, setActiveConversationId, cards = [], loading = false }: ChatListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [filterBy, setFilterBy] = useState<FilterOption>('all');
    const filterMenuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
                setShowFilterMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Process and filter real cards from Firebase
    const conversations = useMemo(() => {
        let filtered = [...cards];

        // 1. Folder Filtering
        if (selectedFolder === 'mine') {
            filtered = filtered.filter(c => c.assignedTo === 'Mío');
        } else if (selectedFolder === 'unassigned') {
            filtered = filtered.filter(c => !c.assignedTo || c.assignedTo === 'Unassigned');
        } else if (selectedFolder === 'whatsapp1') {
            filtered = filtered.filter(c => (c.channel || c.source || '').toLowerCase().includes('whatsapp'));
        } else if (selectedFolder === 'ig1') {
            filtered = filtered.filter(c => (c.channel || c.source || '').toLowerCase().includes('instagram'));
        } else if (selectedFolder.startsWith('label:')) {
            const labelFilter = selectedFolder.replace('label:', '');
            filtered = filtered.filter(c => c.labels?.includes(labelFilter));
        }

        // 2. Unread Filter
        if (filterBy === 'unread') {
            filtered = filtered.filter(c => (c.unreadCount || 0) > 0);
        }

        // 3. Search filtering
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(c => 
                (c.contactName || '').toLowerCase().includes(query) || 
                (c.contactNumber || '').toLowerCase().includes(query)
            );
        }

        // 4. Sorting
        filtered.sort((a, b) => {
            const timeA = a.updatedAt?.seconds || 0;
            const timeB = b.updatedAt?.seconds || 0;
            return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
        });

        return filtered.map(c => ({
            id: c.id,
            name: c.contactName || c.contactNumber || 'Desconocido',
            channel: c.channel || c.source || c.primary_channel || 'WhatsApp',
            snippet: c.lastMessage || c.description || 'Nueva conversación',
            time: c.updatedAt ? typeof c.updatedAt.toDate === 'function' ? c.updatedAt.toDate().toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'}) : 'Reciente' : '',
            unread: c.unreadCount || 0,
            status: 'open',
            presence: c.presence || null
        }));
    }, [cards, selectedFolder, searchQuery, sortBy, filterBy]);

    return (
        <div className="w-[280px] bg-[#0d0d0d] border-r border-neutral-900 flex flex-col h-full flex-shrink-0 text-white">
            {/* Header & Search */}
            <div className="p-2 border-b border-neutral-900 space-y-2">
                <div className="flex items-center justify-between relative px-1 pt-1">
                    <h2 className="font-bold text-[10px] uppercase tracking-widest text-neutral-500 opacity-80">
                        {selectedFolder.startsWith('label:') ? selectedFolder.replace('label:', 'LABEL: ') : selectedFolder}
                    </h2>
                    <div className="relative" ref={filterMenuRef}>
                        <button 
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className={`p-1 rounded transition-colors ${showFilterMenu || filterBy !== 'all' || sortBy !== 'newest' ? 'text-blue-500 bg-blue-500/10' : 'text-neutral-500 hover:text-white hover:bg-neutral-900'}`}
                        >
                            <Filter size={13} />
                        </button>

                        {showFilterMenu && (
                            <div className="absolute top-full right-0 mt-1 w-48 bg-neutral-900 border border-neutral-800 rounded shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="p-2 border-b border-neutral-800 bg-neutral-950/50">
                                    <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Sort by</span>
                                </div>
                                <div className="p-0.5">
                                    <button onClick={() => { setSortBy('newest'); setShowFilterMenu(false); }} className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] rounded hover:bg-neutral-800 transition-colors text-neutral-400">
                                        Newest First {sortBy === 'newest' && <Check size={12} className="text-blue-500" />}
                                    </button>
                                    <button onClick={() => { setSortBy('oldest'); setShowFilterMenu(false); }} className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] rounded hover:bg-neutral-800 transition-colors text-neutral-400">
                                        Oldest First {sortBy === 'oldest' && <Check size={12} className="text-blue-500" />}
                                    </button>
                                </div>
                                <div className="p-2 border-b border-t border-neutral-800 bg-neutral-950/50">
                                    <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Filter by</span>
                                </div>
                                <div className="p-0.5">
                                    <button onClick={() => { setFilterBy('all'); setShowFilterMenu(false); }} className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] rounded hover:bg-neutral-800 transition-colors text-neutral-400">
                                        All Messages {filterBy === 'all' && <Check size={12} className="text-blue-500" />}
                                    </button>
                                    <button onClick={() => { setFilterBy('unread'); setShowFilterMenu(false); }} className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] rounded hover:bg-neutral-800 transition-colors text-neutral-400">
                                        Unread Only {filterBy === 'unread' && <Check size={12} className="text-blue-500" />}
                                    </button>
                                </div>
                                {(sortBy !== 'newest' || filterBy !== 'all') && (
                                    <button onClick={() => {setSortBy('newest'); setFilterBy('all'); setShowFilterMenu(false);}} className="w-full py-2 text-[9px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest text-center border-t border-neutral-800">
                                        Reset
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative px-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-700" size={12} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded py-1 pl-7 pr-2 text-[11px] focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-neutral-700"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 hover:scrollbar-thumb-neutral-700">
                <div className="divide-y divide-neutral-900/40">
                    {loading ? (
                        <div className="p-4 text-center text-neutral-700 text-[10px] animate-pulse">Cargando...</div>
                    ) : conversations.length === 0 ? (
                        <div className="p-4 text-center text-neutral-700 text-[10px]">
                            {filterBy === 'unread' ? 'Sin mensajes no leídos' : 'Sin conversaciones'}
                        </div>
                    ) : (
                        conversations.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => setActiveConversationId(chat.id)}
                                className={`w-full flex items-start p-2 text-left transition-colors hover:bg-neutral-900/50 relative ${activeConversationId === chat.id ? 'bg-neutral-900/80 shadow-inner' : ''}`}
                            >
                                {activeConversationId === chat.id && (
                                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-blue-500 rounded-r" />
                                )}

                                <div className="relative mr-2 flex-shrink-0 pt-0.5">
                                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-[10px] text-white">
                                        {chat.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-[#0d0d0d] flex items-center justify-center
                                        ${chat.channel.toLowerCase().includes('whatsapp') ? 'bg-green-500' :
                                            chat.channel.toLowerCase().includes('instagram') ? 'bg-pink-500' :
                                                chat.channel.toLowerCase().includes('messenger') ? 'bg-blue-500' : 'bg-neutral-500'}
                                    `}>
                                        <MessageCircle size={6} className="text-white fill-current" />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0">
                                        <h3 className={`font-semibold truncate pr-1 text-[12px] ${chat.unread > 0 ? 'text-white' : 'text-neutral-400'}`}>
                                            {chat.name}
                                        </h3>
                                        <span className="text-[9px] text-neutral-600 flex-shrink-0 font-medium">
                                            {chat.time}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {chat.unread > 0 && <div className="w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />}
                                        <div className={`truncate text-[11px] ${chat.unread > 0 ? 'text-neutral-300 font-medium' : 'text-neutral-600'}`}>
                                            {chat.presence === 'typing' ? (
                                                <span className="text-blue-500 italic animate-pulse">Escribiendo...</span>
                                            ) : chat.presence === 'recording' ? (
                                                <span className="text-blue-500 italic animate-pulse flex items-center gap-1">
                                                    <Mic size={10} /> Grabando audio...
                                                </span>
                                            ) : (
                                                chat.snippet
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {chat.unread > 0 && (
                                    <div className="ml-1 flex-shrink-0 pt-0.5">
                                        <span className="bg-blue-600 text-white text-[8px] font-bold px-1 py-0 rounded-full inline-block min-w-[0.8rem] text-center">
                                            {chat.unread}
                                        </span>
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

