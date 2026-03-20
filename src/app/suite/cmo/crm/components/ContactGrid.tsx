import React from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Phone, ExternalLink, UserPlus, MessageSquare, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    useReactTable, 
    getCoreRowModel, 
    createColumnHelper 
} from '@tanstack/react-table';

interface ContactGridProps {
    contacts: any[];
    containerVariants: any;
    itemVariants: any;
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

export const ContactGrid: React.FC<ContactGridProps> = ({
    contacts,
    containerVariants,
    itemVariants,
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
        columnHelper.accessor('id', { header: 'ID' }),
        columnHelper.accessor('name', { header: 'Name' }),
    ];

    const table = useReactTable({
        data: contacts,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const toggleSelection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSelectedContactIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <motion.div
            key="grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20"
        >
            {table.getRowModel().rows.map((row) => {
                const contact = row.original;
                return (
                    <motion.div
                        key={row.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: row.index * 0.05 }}
                        className={cn(
                            "bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-[1.5rem] p-4 hover:border-blue-500/30 hover:bg-neutral-900/60 transition-all group flex flex-col relative overflow-hidden shadow-xl",
                            selectedContactIds.includes(contact.id) && "border-blue-500/50 bg-blue-500/5"
                        )}
                    >
                        {/* Simplified layout - removed top-left bubbles */}

                        <div className="absolute top-4 right-4 z-20">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-white" onClick={(e) => e.stopPropagation()}>
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-neutral-900 border-neutral-800 text-white rounded-xl py-1 shadow-2xl">
                                    <DropdownMenuItem onClick={() => { handleOpenDetails(contact); }} className="hover:bg-blue-600 rounded-lg cursor-pointer mx-1 text-xs font-medium uppercase tracking-wider py-2 transition-colors">
                                        <UserPlus className="w-3.5 h-3.5 mr-2" /> View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleContactClick(contact)} className="hover:bg-blue-600 rounded-lg cursor-pointer mx-1 text-xs font-medium uppercase tracking-wider py-2 transition-colors">
                                        <MessageSquare className="w-3.5 h-3.5 mr-2" /> Open Instance
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteContact(contact.id)} className="hover:bg-red-600 rounded-lg cursor-pointer mx-1 text-xs font-medium uppercase tracking-wider py-2 text-red-400 focus:text-white transition-colors">
                                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Purge Profile
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="mb-2 mt-1">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-lg font-medium text-white shadow-lg mb-2 group-hover:scale-110 transition-transform">
                                {contact.name?.charAt(0)}
                            </div>
                            <Badge variant="outline" className={`${contact.stage === 'Closed' ? 'border-emerald-500/50 text-emerald-500' :
                                contact.stage === 'In Progress' ? 'border-blue-500/50 text-blue-500' : 'border-orange-500/50 text-orange-500'} px-2 py-0 text-[7px] uppercase tracking-widest font-medium`}>
                                {contact.stage}
                            </Badge>
                        </div>

                        <h3
                            onClick={() => handleContactClick(contact)}
                            className="text-sm font-semibold text-neutral-100 mb-0.5 cursor-pointer hover:text-blue-400 hover:underline truncate pr-10 transition-colors"
                        >
                            {contact.name || 'Sin Nombre'}
                        </h3>
                        <p className="text-[10px] text-neutral-400 mb-2 truncate">{contact.email}</p>

                        <div className="space-y-1 mb-2">
                            <div className="flex items-center text-[10px] text-neutral-500">
                                <Phone className="w-2.5 h-2.5 mr-2" /> {contact.phone}
                            </div>
                            <div className="flex items-center text-[10px] text-neutral-500">
                                <ExternalLink className="w-2.5 h-2.5 mr-2" /> {contact.source}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
};
