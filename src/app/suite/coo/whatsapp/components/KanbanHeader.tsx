import { Search, Filter, MoreHorizontal, ArrowLeft, UserPlus, Download, RefreshCw, Settings, Instagram, Facebook, Globe, Ghost, MessageSquare, Twitter, Send, Music, LayoutGrid, Columns2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import WhatsappIcon from '@/components/icons/WhatsappIcon';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const KanbanHeader = ({
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
    channelStats,
    isSidebarCollapsed,
    toggleSidebar
}: any) => {
    return (
        <div className="h-[52px] border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-4 flex-shrink-0 z-20">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-3">

                    <div className="flex items-center gap-2">
                        <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20">
                            <MessageSquare size={16} className="text-blue-500" />
                        </div>
                        <h1 className="text-[14px] font-semibold text-white tracking-tight truncate hidden sm:block">Inbox</h1>
                    </div>
                </div>

                <div className="h-6 w-[1px] bg-neutral-800 mx-2 hidden lg:block" />

                {/* Stats Bar */}
                <div className="flex items-center gap-4 py-1 px-1 overflow-x-auto no-scrollbar">
                    {/* WhatsApp */}
                    <div className="flex flex-col items-center gap-0.5 transition-all cursor-pointer group/pill hover:opacity-80">
                        <div className="relative">
                            <div className="w-1 h-1 rounded-full bg-emerald-500/50 absolute -right-0.5 -top-0.5 animate-pulse" />
                            <WhatsappIcon className="w-[14px] h-[14px] text-neutral-400 group-hover/pill:text-emerald-500/80 transition-all" />
                        </div>
                        <div className="flex flex-col items-center -space-y-0.5">
                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-tighter group-hover/pill:text-neutral-400 transition-colors"></span>
                            <span className="text-[9px] font-bold text-neutral-300">{channelStats.whatsapp}</span>
                        </div>
                    </div>

                    {/* Instagram */}
                    <div className="flex flex-col items-center gap-0.5 transition-all cursor-pointer group/pill hover:opacity-80">
                        <Instagram size={14} className="text-neutral-500 group-hover/pill:text-pink-500/50 transition-all" />
                        <div className="flex flex-col items-center -space-y-0.5">
                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-tighter group-hover/pill:text-neutral-400 transition-colors"></span>
                            <span className="text-[9px] font-bold text-neutral-300">{channelStats.instagram}</span>
                        </div>
                    </div>

                    {/* Messenger */}
                    <div className="flex flex-col items-center gap-0.5 transition-all cursor-pointer group/pill hover:opacity-80">
                        <Facebook size={14} className="text-neutral-500 group-hover/pill:text-blue-500/50 transition-all" />
                        <div className="flex flex-col items-center -space-y-0.5">
                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-tighter group-hover/pill:text-neutral-400 transition-colors"></span>
                            <span className="text-[9px] font-bold text-neutral-300">{channelStats.messenger}</span>
                        </div>
                    </div>

                    {/* Web */}
                    <div className="flex flex-col items-center gap-0.5 transition-all cursor-pointer group/pill hover:opacity-80">
                        <Globe size={14} className="text-neutral-500 group-hover/pill:text-cyan-500/50 transition-all" />
                        <div className="flex flex-col items-center -space-y-0.5">
                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-tighter group-hover/pill:text-neutral-400 transition-colors"></span>
                            <span className="text-[9px] font-bold text-neutral-300">{channelStats.web}</span>
                        </div>
                    </div>

                    {/* X */}
                    <div className="flex flex-col items-center gap-0.5 transition-all cursor-pointer group/pill hover:opacity-80">
                        <Twitter size={14} className="text-neutral-500 group-hover/pill:text-neutral-200 transition-all" />
                        <div className="flex flex-col items-center -space-y-0.5">
                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-tighter group-hover/pill:text-neutral-400 transition-colors"></span>
                            <span className="text-[9px] font-bold text-neutral-300">{channelStats.x}</span>
                        </div>
                    </div>

                    {/* TikTok */}
                    <div className="flex flex-col items-center gap-0.5 transition-all cursor-pointer group/pill hover:opacity-80">
                        <Music size={14} className="text-neutral-500 group-hover/pill:text-neutral-200 transition-all" />
                        <div className="flex flex-col items-center -space-y-0.5">
                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-tighter group-hover/pill:text-neutral-400 transition-colors"></span>
                            <span className="text-[9px] font-bold text-neutral-300">{channelStats.tiktok}</span>
                        </div>
                    </div>

                    {/* Telegram */}
                    <div className="flex flex-col items-center gap-0.5 transition-all cursor-pointer group/pill hover:opacity-80">
                        <Send size={14} className="text-neutral-500 group-hover/pill:text-sky-500/50 transition-all" />
                        <div className="flex flex-col items-center -space-y-0.5">
                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-tighter group-hover/pill:text-neutral-400 transition-colors"></span>
                            <span className="text-[9px] font-bold text-neutral-300">{channelStats.telegram}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
                <div className="relative group/search w-32 transition-all duration-300 focus-within:w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-500 group-focus-within/search:text-blue-500 transition-colors" />
                    <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-7 bg-black/20 border-white/5 text-[10px] placeholder:text-neutral-600 focus:bg-black/40 transition-all rounded-lg"
                    />
                </div>

                <div className="flex items-center gap-0.5">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className={cn(
                                "h-7 w-7 text-neutral-400 hover:text-white border border-transparent hover:border-white/5 hover:bg-white/5 transition-all rounded-full",
                                filter !== 'all' && "text-blue-400 bg-blue-500/10 border-blue-500/20"
                            )}>
                                <Filter size={12} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-white shadow-2xl rounded-xl p-1 w-40">
                            <DropdownMenuItem onClick={() => setFilter('all')} className="flex items-center justify-between text-[11px] rounded-lg cursor-pointer">
                                <span>All</span>
                                {filter === 'all' && <Check size={12} className="text-blue-500" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter('unread')} className="flex items-center justify-between text-[11px] rounded-lg cursor-pointer">
                                <span>Unread</span>
                                {filter === 'unread' && <Check size={12} className="text-blue-500" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter('unassigned')} className="flex items-center justify-between text-[11px] rounded-lg cursor-pointer">
                                <span>Unassigned</span>
                                {filter === 'unassigned' && <Check size={12} className="text-blue-500" />}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-neutral-400 hover:text-white border border-transparent hover:border-white/5 hover:bg-white/5">
                        <Settings size={13} />
                    </Button>
                </div>

                <div className="pl-2">
                    <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-lg shadow-blue-900/20 text-[11px] px-3 font-medium rounded-lg">
                        <UserPlus size={14} />
                        <span>New Chat</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};
