import React, { useState } from 'react';
import { Mail, Users, CheckCircle, Tag, Hash, Settings, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';

interface SidebarProps {
    selectedFolder: string;
    setSelectedFolder: (folder: string) => void;
    cards?: any[];
}

export default function InboxSidebar({ selectedFolder, setSelectedFolder, cards = [] }: SidebarProps) {
    const [expandedSections, setExpandedSections] = useState({
        inboxes: true,
        labels: true
    });

    const toggleSection = (section: 'inboxes' | 'labels') => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const counts = {
        all: cards.length,
        mine: cards.filter(c => c.assignedTo === 'Mío').length,
        unassigned: cards.filter(c => !c.assignedTo || c.assignedTo === 'Unassigned').length,
    };

    const folders = [
        { id: 'mine', label: 'Mine', icon: <Users size={16} />, count: counts.mine },
        { id: 'unassigned', label: 'Unassigned', icon: <CheckCircle size={16} />, count: counts.unassigned },
        { id: 'all', label: 'All', icon: <Mail size={16} />, count: counts.all },
    ];

    const channels = [
        { id: 'whatsapp1', label: 'WhatsApp Main', type: 'whatsapp' },
        { id: 'ig1', label: 'Instagram CS', type: 'instagram' },
    ];

    return (
        <div className="w-52 bg-[#0a0a0a] border-r border-neutral-900 flex flex-col h-full flex-shrink-0 select-none">
            {/* Header / Brand */}
            <div className="h-12 flex items-center px-3 border-b border-neutral-900">
                <div className="w-5 h-5 bg-blue-600 rounded mr-2 flex items-center justify-center">
                    <MessageSquare size={12} className="text-white" />
                </div>
                <span className="font-semibold text-white tracking-wide text-sm">Inbox</span>
            </div>

            <div className="flex-1 overflow-y-auto pt-2 space-y-4">

                {/* Standard Folders */}
                <div className="px-2 space-y-0.5">
                    {folders.map(folder => (
                        <button
                            key={folder.id}
                            onClick={() => setSelectedFolder(folder.id)}
                            className={`w-full flex items-center px-2 py-1.5 rounded text-[12px] transition-colors group ${selectedFolder === folder.id
                                    ? 'bg-blue-600/10 text-blue-500 font-medium'
                                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                                }`}
                        >
                            <span className="mr-2.5 opacity-80">{React.cloneElement(folder.icon as React.ReactElement, { size: 14 })}</span>
                            {folder.label}
                            {folder.count > 0 && (
                                <span className={`ml-auto text-[9px] px-1.5 py-0 rounded-full transition-colors ${
                                    selectedFolder === folder.id 
                                    ? 'bg-blue-600/20 text-blue-500' 
                                    : 'bg-neutral-800 text-neutral-400 group-hover:text-white'
                                }`}>
                                    {folder.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Channels (Inboxes) */}
                <div className="px-2">
                    <button 
                        onClick={() => toggleSection('inboxes')}
                        className="w-full flex items-center text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1 px-2 hover:text-neutral-400 transition-colors"
                    >
                        <span className="flex-1 text-left">Inboxes</span>
                        {expandedSections.inboxes ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                    
                    {expandedSections.inboxes && (
                        <div className="space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                            {channels.map(channel => (
                                <button
                                    key={channel.id}
                                    onClick={() => setSelectedFolder(channel.id)}
                                    className={`w-full flex items-center px-2 py-1.5 rounded text-[12px] transition-colors ${selectedFolder === channel.id
                                            ? 'bg-blue-600/10 text-blue-500 font-medium'
                                            : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                                        }`}
                                >
                                    <Hash size={14} className="mr-2.5 opacity-40" />
                                    <span className="truncate">{channel.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Labels */}
                <div className="px-2">
                    <button 
                        onClick={() => toggleSection('labels')}
                        className="w-full flex items-center text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1 px-2 hover:text-neutral-400 transition-colors"
                    >
                        <span className="flex-1 text-left">Labels</span>
                        {expandedSections.labels ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>

                    {expandedSections.labels && (
                        <div className="space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                            {['Sales', 'Support', 'Urgent'].map(label => (
                                <button
                                    key={label}
                                    onClick={() => setSelectedFolder(`label:${label}`)}
                                    className={`w-full flex items-center px-2 py-1.5 rounded text-[12px] transition-colors ${
                                        selectedFolder === `label:${label}`
                                        ? 'bg-blue-600/10 text-white font-medium'
                                        : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                                    }`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full mr-2.5 ${
                                        label === 'Urgent' ? 'bg-red-500' :
                                        label === 'Sales' ? 'bg-green-500' : 'bg-blue-500'
                                    }`} />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Footer Settings */}
            <div className="p-2 border-t border-neutral-900">
                <button className="w-full flex items-center px-2 py-1.5 rounded text-[12px] text-neutral-400 hover:bg-neutral-900 transition-colors">
                    <Settings size={14} className="mr-2.5" />
                    Settings
                </button>
            </div>
        </div>
    );
}

