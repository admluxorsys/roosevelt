import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, UserPlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { ImportDialog } from './ImportDialog';
import { EnhancedContactForm } from './EnhancedContactForm';
import { cn } from "@/lib/utils";

interface ContactHeaderProps {
    isChatOpen: boolean;
    handleSynckambanContacts: () => void;
    isSyncing: boolean;
    isImportModalOpen: boolean;
    setIsImportModalOpen: (open: boolean) => void;
    onImportDrop: (acceptedFiles: File[]) => void;
    isAddModalOpen: boolean;
    setIsAddModalOpen: (open: boolean) => void;
    newContact: any;
    setNewContact: (contact: any) => void;
    handleAddContact: () => void;
    setIsDuplicateManagerOpen: (open: boolean) => void;
}

export const ContactHeader: React.FC<ContactHeaderProps> = ({
    isChatOpen,
    handleSynckambanContacts,
    isSyncing,
    isImportModalOpen,
    setIsImportModalOpen,
    onImportDrop,
    isAddModalOpen,
    setIsAddModalOpen,
    newContact,
    setNewContact,
    handleAddContact,
    setIsDuplicateManagerOpen
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex justify-between items-center relative z-10"
        >
            <div>
                <h1 className={cn("font-medium tracking-tight transition-all uppercase", isChatOpen ? "text-lg" : "text-2xl")}>
                    Control Center <span className="text-blue-500">/ Contacts</span>
                </h1>
            </div>

            <div className="flex space-x-2">
                <Button
                    onClick={() => setIsDuplicateManagerOpen(true)}
                    variant="outline"
                    className="h-10 bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 text-white rounded-md px-4 text-xs font-medium transition-all uppercase tracking-wider"
                >
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Manage Duplicates
                </Button>

                <Button
                    onClick={handleSynckambanContacts}
                    disabled={isSyncing}
                    variant="outline"
                    className="h-10 bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 text-white rounded-md px-4 text-xs font-medium transition-all disabled:opacity-50 uppercase tracking-wider"
                >
                    <RefreshCw className={`w-3 h-3 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync'}
                </Button>

                <ImportDialog
                    isOpen={isImportModalOpen}
                    onOpenChange={setIsImportModalOpen}
                    onDrop={onImportDrop}
                />

                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md px-6 text-xs transition-all uppercase tracking-wider">
                            <UserPlus className="w-3 h-3 mr-2" />
                            Create Profile
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-neutral-950 border-neutral-800 text-white sm:max-w-6xl rounded-3xl p-8 backdrop-blur-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-medium tracking-tight uppercase">Create Profile</DialogTitle>
                            <DialogDescription className="text-neutral-300 font-medium">Add a comprehensive contact profile to your ecosystem.</DialogDescription>
                        </DialogHeader>
                        <div className="py-6">
                            <EnhancedContactForm contact={newContact} onChange={setNewContact} isEditing={true} />
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} className="text-neutral-300 font-medium hover:text-white rounded-xl px-6">Cancel</Button>
                            <Button onClick={handleAddContact} className="bg-blue-600 hover:bg-blue-700 px-10 rounded-xl font-medium shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Establish Profile</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </motion.div>
    );
};

