import React from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, UserPlus, MessageSquare, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatPhoneNumber } from "@/lib/utils";
import { 
    useReactTable, 
    getCoreRowModel, 
    getSortedRowModel,
    SortingState,
    flexRender, 
    createColumnHelper 
} from '@tanstack/react-table';
import { useState } from 'react';

interface ContactListProps {
    contacts: any[];
    containerVariants: any;
    itemVariants: any;
    isChatOpen: boolean;
    handleContactClick: (contact: any) => void;
    setSelectedContact: (contact: any) => void;
    setIsDetailModalOpen: (open: boolean) => void;
    handleOpenDetails: (contact: any) => void;
    setIsEditingProfile: (editing: boolean) => void;
    handleDeleteContact: (id: string) => void;
    selectedContactIds: string[];
    setSelectedContactIds: (ids: string[] | ((prev: string[]) => string[])) => void;
}

const columnHelper = createColumnHelper<any>();

export const ContactList: React.FC<ContactListProps> = ({
    contacts,
    containerVariants,
    itemVariants,
    isChatOpen,
    handleContactClick,
    setSelectedContact,
    setIsDetailModalOpen,
    handleOpenDetails,
    setIsEditingProfile,
    handleDeleteContact,
    selectedContactIds,
    setSelectedContactIds
}) => {
    const columns = [
        columnHelper.accessor('id', {
            header: 'Selection',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('clientId', {
            header: 'ID',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('name', {
            header: 'Identity / Name',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('email', {
            header: 'Email Address',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('phone', {
            header: 'Primary Phone',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('source', {
            header: 'Source',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('stage', {
            header: 'Stage',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('tags', {
            header: 'Tags',
            cell: info => info.getValue(),
        }),
    ];

    const [sorting, setSorting] = useState<SortingState>([]);

    const table = useReactTable({
        data: contacts,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });
    const toggleSelection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSelectedContactIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedContactIds.length === contacts.length) {
            setSelectedContactIds([]);
        } else {
            setSelectedContactIds(contacts.map(c => c.id));
        }
    };

    return (
        <motion.div
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: 10 }}
            className="bg-black/40 rounded-lg border border-white/5 shadow-2xl overflow-hidden"
        >
            <div className={cn(
                "grid px-6 py-3 border-b border-white/5 text-[10px] font-medium text-neutral-500 uppercase tracking-widest bg-white/[0.01]",
                isChatOpen
                    ? "grid-cols-[40px_1fr_40px]"
                    : "grid-cols-[40px_60px_2.5fr_2fr_1.5fr_1fr_1fr_1fr_80px] gap-4"
            )}>
                <div className="flex justify-center items-center cursor-pointer" onClick={toggleAll}>
                    <div className={cn(
                        "w-3.5 h-3.5 border border-neutral-800 rounded flex items-center justify-center transition-colors",
                        selectedContactIds.length > 0 && selectedContactIds.length === contacts.length ? "bg-blue-600 border-blue-600" : ""
                    )}>
                        {selectedContactIds.length > 0 && selectedContactIds.length === contacts.length && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                    </div>
                </div>

                {!isChatOpen && (
                    <div className="truncate text-center group cursor-pointer select-none" onClick={table.getColumn('clientId')?.getToggleSortingHandler()}>
                        ID
                        {{
                            asc: <ArrowUp className="w-2 h-2 inline ml-1 text-blue-500" />,
                            desc: <ArrowDown className="w-2 h-2 inline ml-1 text-blue-500" />,
                        }[table.getColumn('clientId')?.getIsSorted() as string] ?? <ArrowUpDown className="w-2 h-2 inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                )}

                <div className="truncate group cursor-pointer select-none" onClick={table.getColumn('name')?.getToggleSortingHandler()}>
                    Identity / Name
                    {{
                        asc: <ArrowUp className="w-2 h-2 inline ml-1 text-blue-500" />,
                        desc: <ArrowDown className="w-2 h-2 inline ml-1 text-blue-500" />,
                    }[table.getColumn('name')?.getIsSorted() as string] ?? <ArrowUpDown className="w-2 h-2 inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>

                {!isChatOpen && (
                    <>
                        <div className="truncate group cursor-pointer select-none" onClick={table.getColumn('email')?.getToggleSortingHandler()}>
                            Email Address
                            {{
                                asc: <ArrowUp className="w-2 h-2 inline ml-1 text-blue-500" />,
                                desc: <ArrowDown className="w-2 h-2 inline ml-1 text-blue-500" />,
                            }[table.getColumn('email')?.getIsSorted() as string] ?? <ArrowUpDown className="w-2 h-2 inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                        <div className="truncate group cursor-pointer select-none" onClick={table.getColumn('phone')?.getToggleSortingHandler()}>
                            Primary Phone
                            {{
                                asc: <ArrowUp className="w-2 h-2 inline ml-1 text-blue-500" />,
                                desc: <ArrowDown className="w-2 h-2 inline ml-1 text-blue-500" />,
                            }[table.getColumn('phone')?.getIsSorted() as string] ?? <ArrowUpDown className="w-2 h-2 inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                        <div className="truncate text-center group cursor-pointer select-none" onClick={table.getColumn('source')?.getToggleSortingHandler()}>
                            Source
                            {{
                                asc: <ArrowUp className="w-2 h-2 inline ml-1 text-blue-500" />,
                                desc: <ArrowDown className="w-2 h-2 inline ml-1 text-blue-500" />,
                            }[table.getColumn('source')?.getIsSorted() as string] ?? <ArrowUpDown className="w-2 h-2 inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                        <div className="truncate text-center group cursor-pointer select-none" onClick={table.getColumn('stage')?.getToggleSortingHandler()}>
                            Stage
                            {{
                                asc: <ArrowUp className="w-2 h-2 inline ml-1 text-blue-500" />,
                                desc: <ArrowDown className="w-2 h-2 inline ml-1 text-blue-500" />,
                            }[table.getColumn('stage')?.getIsSorted() as string] ?? <ArrowUpDown className="w-2 h-2 inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                        <div className="truncate">Tags</div>
                    </>
                )}
                <div className="text-right pr-2">Actions</div>
            </div>

            <motion.div className="divide-y divide-white/[0.02]">
                {table.getRowModel().rows.map((row) => {
                    const contact = row.original;
                    return (
                        <motion.div
                            key={row.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: row.index * 0.03 }}
                            className={cn(
                                "grid items-center hover:bg-white/[0.02] transition-colors group",
                                isChatOpen
                                    ? "grid-cols-[40px_1fr_40px] px-3 py-2"
                                    : "grid-cols-[40px_60px_2.5fr_2fr_1.5fr_1fr_1fr_1fr_80px] px-6 py-2 gap-4",
                                selectedContactIds.includes(contact.id) && "bg-blue-500/5 hover:bg-blue-500/10"
                            )}
                        >
                            <div className="flex justify-center items-center cursor-pointer py-3" onClick={(e) => toggleSelection(e, contact.id)}>
                                <div className={cn(
                                    "w-4 h-4 border border-neutral-700 rounded-md group-hover:border-neutral-500 transition-all flex items-center justify-center shadow-sm",
                                    selectedContactIds.includes(contact.id) ? "bg-blue-600 border-blue-600 shadow-blue-500/20" : "bg-neutral-900/50"
                                )}>
                                    {selectedContactIds.includes(contact.id) && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-1.5 h-1.5 bg-white rounded-full"
                                        />
                                    )}
                                </div>
                            </div>
                            {!isChatOpen && (
                                <div className="text-neutral-500 font-mono text-[10px] text-center">
                                    {contact.clientId || (contact.id ? `RY${contact.id.substring(0, 5).toUpperCase()}` : '—')}
                                </div>
                            )}
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <div className={cn(
                                    "rounded bg-neutral-800 flex-shrink-0 flex items-center justify-center font-medium text-neutral-400 group-hover:text-blue-400 transition-colors",
                                    isChatOpen ? "w-8 h-8 text-[10px]" : "w-7 h-7 text-[9px]"
                                )}>
                                    {contact.name?.charAt(0) || '?'}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <div
                                        onClick={() => handleContactClick(contact)}
                                        className="font-medium text-neutral-200 hover:text-blue-400 hover:underline cursor-pointer truncate text-xs transition-colors"
                                    >
                                        {contact.name || 'Sin Nombre'}
                                    </div>
                                    {(isChatOpen || !contact.clientId) && (
                                        <span className="text-[10px] text-neutral-500 font-mono truncate">
                                            {contact.clientId || (contact.id ? `RY${contact.id.substring(0, 5).toUpperCase()}` : '—')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {!isChatOpen && (
                                <>
                                    <div className="text-neutral-400 text-[11px] truncate">{contact.email || '—'}</div>
                                    <div className="text-neutral-400 font-mono text-[11px] truncate tracking-tighter">{formatPhoneNumber(contact.phone)}</div>
                                    <div className="text-neutral-500 font-medium text-[10px] tracking-tight uppercase text-center">{contact.source}</div>
                                    <div className="flex justify-center">
                                        <Badge variant="outline" className={cn(
                                            "px-2 py-0 border-0 text-[9px] font-medium uppercase rounded",
                                            contact.stage === 'Closed' ? 'text-emerald-500 bg-emerald-500/10' :
                                                contact.stage === 'In Progress' ? 'text-blue-500 bg-blue-500/10' :
                                                    'text-orange-500 bg-orange-500/10'
                                        )}>
                                            {contact.stage}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-1 items-center">
                                        {contact.tags?.slice(0, 1).map((tag: string) => (
                                            <span key={tag} className="px-1.5 py-0.5 bg-neutral-900 text-[9px] text-neutral-500 rounded border border-white/5 uppercase font-medium">{tag}</span>
                                        ))}
                                        {contact.tags?.length > 1 && <span className="text-[9px] text-neutral-600 font-medium">+{contact.tags.length - 1}</span>}
                                    </div>
                                </>
                            )}
                            <div className="text-right flex justify-end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-600 hover:text-white hover:bg-white/5 rounded">
                                            <MoreVertical className="w-3.5 h-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-neutral-900 border-neutral-800 text-white rounded-md shadow-2xl py-1">
                                        <DropdownMenuItem onClick={() => { handleOpenDetails(contact); }} className="hover:bg-blue-600 rounded-sm cursor-pointer mx-1 text-xs font-medium uppercase tracking-wider py-2">
                                            <UserPlus className="w-3 h-3 mr-2" /> View Details
                                        </DropdownMenuItem>
                                        {!isChatOpen && (
                                            <DropdownMenuItem onClick={() => handleContactClick(contact)} className="hover:bg-blue-600 rounded-sm cursor-pointer mx-1 text-xs font-medium uppercase tracking-wider py-2">
                                                <MessageSquare className="w-3 h-3 mr-2" /> Open Instance
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => { handleDeleteContact(contact.id) }} className="hover:bg-red-600 rounded-sm cursor-pointer mx-1 text-xs font-medium uppercase tracking-wider py-2 text-red-500 focus:text-white">
                                            <Trash2 className="w-3 h-3 mr-2" /> Purge Profile
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {contacts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-neutral-400">
                    <Search className="w-16 h-16 mb-6 opacity-20" />
                    <p className="text-xl font-medium tracking-tight">Zero matches detected.</p>
                </div>
            )}
        </motion.div>
    );
};

