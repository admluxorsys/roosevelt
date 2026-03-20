import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Edit, Save, Activity, X, Mail, Phone, Globe, Building, MapPin,
    CreditCard, User, Calendar, CheckCheck, ArrowUpRight, ExternalLink,
    Briefcase, Plus, RefreshCw, DollarSign, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { EnhancedContactForm } from './EnhancedContactForm';
import { cn, formatPhoneNumber } from "@/lib/utils";

interface ContactDetailsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedContact: any;
    setSelectedContact: (contact: any) => void;
    isEditingProfile: boolean;
    setIsEditingProfile: (editing: boolean) => void;
    handleSaveContact: () => void;
    handleUpdateStage: (stage: string) => void;
    handleRemoveTag: (tag: string) => void;
    handleAddTag: () => void;
    newTag: string;
    setNewTag: (tag: string) => void;
    isAddingTag: boolean;
    setIsAddingTag: (adding: boolean) => void;
    getDateString: (value: any) => string;
    getDateInputValue: (value: any) => string;
    getAge: (birthDate: any) => number | null;
}

export const ContactDetailsModal: React.FC<ContactDetailsModalProps> = ({
    isOpen,
    onOpenChange,
    selectedContact,
    setSelectedContact,
    isEditingProfile,
    setIsEditingProfile,
    handleSaveContact,
    handleUpdateStage,
    handleRemoveTag,
    handleAddTag,
    newTag,
    setNewTag,
    isAddingTag,
    setIsAddingTag,
    getDateString,
    getDateInputValue,
    getAge
}) => {
    if (!selectedContact) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#080808]/95 border-neutral-800 text-white sm:max-w-7xl p-0 overflow-hidden outline-none rounded-[3rem] backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-white/5 h-[90vh] flex flex-col">
                <DialogTitle className="sr-only">Contact Details</DialogTitle>
                <DialogDescription className="sr-only">View and edit contact information.</DialogDescription>

                {/* Header */}
                <div className="bg-gradient-to-br from-blue-900/20 via-transparent to-transparent p-6 border-b border-white/5 relative shrink-0">
                    <div className="absolute top-0 right-0 p-4 space-x-2 flex">
                        {!isEditingProfile ? (
                            <>
                                <Button
                                    onClick={() => setIsEditingProfile(true)}
                                    variant="ghost"
                                    size="sm"
                                    className="hover:bg-blue-600/20 rounded-lg h-8 px-3 text-xs font-medium text-blue-400 border border-blue-500/30"
                                >
                                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                                    Editar
                                </Button>
                                {/* Duplicate X button removed here */}
                            </>
                        ) : (
                            <>
                                <Button
                                    onClick={() => {
                                        handleSaveContact();
                                        setIsEditingProfile(false);
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="hover:bg-emerald-600/20 rounded-lg h-8 px-3 text-xs font-medium text-emerald-400 border border-emerald-500/30"
                                >
                                    <Save className="w-3.5 h-3.5 mr-1.5" />
                                    Guardar
                                </Button>
                                <Button
                                    onClick={() => setIsEditingProfile(false)}
                                    variant="ghost"
                                    size="sm"
                                    className="hover:bg-red-600/20 rounded-lg h-8 px-3 text-xs font-medium text-red-400 border border-red-500/30"
                                >
                                    <X className="w-3.5 h-3.5 mr-1.5" />
                                    Cancelar
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="flex items-center space-x-6">
                        <motion.div
                            initial={{ scale: 0.8, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl font-medium shadow-lg relative"
                        >
                            {selectedContact.name?.charAt(0)}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-[3px] border-[#0c0c0c] rounded-full shadow-lg" />
                        </motion.div>
                        <div className="flex-1 max-w-xl">
                            <h1 className="text-2xl font-semibold tracking-tight mb-2 text-white">
                                {selectedContact.name}
                            </h1>
                            <div className="flex items-center space-x-3">
                                <Badge variant="outline" className="px-3 py-1 border-blue-500/50 text-blue-400 bg-blue-500/10 font-medium tracking-wider text-[9px] uppercase rounded-full">
                                    <Activity className="w-3 h-3 mr-1.5" /> {selectedContact.stage === 'Closed' ? 'Completado' : selectedContact.stage}
                                </Badge>
                                <span className="text-neutral-500 font-medium text-[9px] uppercase tracking-widest">ESTABLISHED {selectedContact.date}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs for Overview vs Full Profile */}
                <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 pt-2 border-b border-white/5 bg-black/20">
                        <TabsList className="bg-transparent space-x-4 p-0 h-auto">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 text-neutral-500 text-[10px] font-medium tracking-widest uppercase py-3 rounded-none transition-all">
                                Overview
                            </TabsTrigger>
                            <TabsTrigger value="profile" className="data-[state=active]:bg-transparent data-[state=active]:border-b data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 text-neutral-500 text-[10px] font-medium tracking-widest uppercase py-3 rounded-none transition-all">
                                Profile Data
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="overview" className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#080808]">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Block 1: Digital Identity */}
                            <div className="bg-white/[0.02] rounded-3xl border border-white/5 p-6 space-y-6">
                                <div>
                                    <h3 className="text-[9px] font-semibold uppercase tracking-widest text-neutral-500 mb-4 border-l-2 border-blue-600 pl-3">Digital Identity</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center group">
                                            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center mr-4 group-hover:border-blue-500/50 transition-all shadow-inner">
                                                <Mail className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] text-neutral-600 font-medium tracking-wider mb-0.5 uppercase">Email Address</p>
                                                <p className="text-sm text-neutral-200 font-medium tracking-tight truncate">
                                                    {selectedContact.email || '---'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center group">
                                            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center mr-4 group-hover:border-blue-500/50 transition-all shadow-inner">
                                                <Phone className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] text-neutral-600 font-medium tracking-wider mb-0.5 uppercase">Phone Number</p>
                                                <p className="text-sm text-neutral-200 font-medium tracking-tight">
                                                    {formatPhoneNumber(selectedContact.phone)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center group">
                                            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center mr-4 group-hover:border-blue-500/50 transition-all shadow-inner">
                                                <Globe className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] text-neutral-600 font-medium tracking-wider mb-0.5 uppercase">Website</p>
                                                <p className="text-sm text-neutral-200 font-medium tracking-tight truncate">
                                                    {selectedContact.website || '---'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center group">
                                            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center mr-4 group-hover:border-blue-500/50 transition-all shadow-inner">
                                                <Building className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] text-neutral-600 font-medium tracking-wider mb-0.5 uppercase">Organization</p>
                                                <p className="text-sm text-neutral-200 font-medium tracking-tight truncate">
                                                    {selectedContact.company || '---'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center group">
                                            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center mr-4 group-hover:border-blue-500/50 transition-all shadow-inner">
                                                <MapPin className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] text-neutral-600 font-medium tracking-wider mb-0.5 uppercase">Location</p>
                                                <p className="text-sm text-neutral-200 font-medium tracking-tight truncate">
                                                    {selectedContact.city || selectedContact.address || '---'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Block 2: Traveler Details & Bio */}
                            <div className="bg-white/[0.02] rounded-3xl border border-white/5 p-6 space-y-6">
                                <div>
                                    <h3 className="text-[9px] font-semibold uppercase tracking-widest text-neutral-500 mb-4 border-l-2 border-blue-600 pl-3">Personal Details</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center group">
                                            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center mr-4 group-hover:border-blue-500/50 transition-all shadow-inner">
                                                <CreditCard className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] text-neutral-600 font-medium tracking-wider mb-0.5 uppercase">Passport / ID</p>
                                                <p className="text-sm text-neutral-200 font-medium tracking-tight">
                                                    {selectedContact.passport || '---'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center group">
                                            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center mr-4 group-hover:border-blue-500/50 transition-all shadow-inner">
                                                <User className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] text-neutral-600 font-medium tracking-wider mb-0.5 uppercase">Gender</p>
                                                <p className="text-sm text-neutral-200 font-medium tracking-tight uppercase">
                                                    {selectedContact.gender || '---'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center group">
                                            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center mr-4 group-hover:border-blue-500/50 transition-all shadow-inner">
                                                <Calendar className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] text-neutral-600 font-medium tracking-wider mb-0.5 uppercase">Birth Date</p>
                                                <p className="text-sm text-neutral-200 font-medium tracking-tight">
                                                    {getDateString(selectedContact.birthDate)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <div className="flex items-center justify-between bg-neutral-900/50 rounded-xl p-3 border border-white/5">
                                                <span className="text-[9px] font-medium uppercase tracking-widest text-neutral-500">Type</span>
                                                <span className="text-[10px] font-bold text-white uppercase bg-blue-600 px-2.5 py-1 rounded-md shadow-lg shadow-blue-900/20">{selectedContact.clientType}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Block 3: Kanban Trajectory */}
                            <div className="bg-white/[0.01] rounded-3xl border border-white/5 p-6 space-y-6 relative h-full">
                                <div className="absolute top-0 right-0 p-6">
                                    <h3 className="text-neutral-600 font-medium text-[9px] tracking-widest uppercase">Trajectory</h3>
                                </div>
                                <h3 className="text-[9px] font-semibold uppercase tracking-widest text-neutral-500 flex items-center">
                                    <Activity className="w-3.5 h-3.5 mr-2.5 text-blue-500 animate-pulse" />
                                    Journey Status
                                </h3>

                                <div className="relative pl-6 space-y-8 border-l border-dashed border-neutral-800 ml-2 py-2">
                                    <div
                                        className={`relative cursor-pointer group/step transition-all ${selectedContact.stage === 'Prospecting' ? 'opacity-100 scale-102' : 'opacity-40 hover:opacity-100'} `}
                                        onClick={() => handleUpdateStage('Prospecting')}
                                    >
                                        <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-lg border-2 border-[#080808] bg-emerald-500 shadow-md flex items-center justify-center group-hover/step:scale-110 transition-transform">
                                            <CheckCheck className="text-[#080808] w-3 h-3" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-neutral-500 font-bold tracking-widest uppercase mb-0.5">Start</p>
                                            <p className="text-base font-medium text-neutral-200 leading-none">Prospecting</p>
                                        </div>
                                    </div>
                                    <div
                                        className={`relative cursor-pointer group/step transition-all ${selectedContact.stage === 'In Progress' ? 'opacity-100 scale-102' : 'opacity-40 hover:opacity-100'} `}
                                        onClick={() => handleUpdateStage('In Progress')}
                                    >
                                        <div className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-lg border-2 border-[#080808] z-10 group-hover/step:scale-110 transition-transform ${selectedContact.stage !== 'Prospecting' ? 'bg-blue-600 shadow-md animate-pulse' : 'bg-neutral-900 border-neutral-800'} `}>
                                            {selectedContact.stage !== 'Prospecting' && <Activity className="text-white w-3 h-3 m-1.5" />}
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-neutral-500 font-bold tracking-widest uppercase mb-0.5">Active</p>
                                            <p className="text-base font-medium text-neutral-200 leading-none">In Progress</p>
                                            {selectedContact.stage === 'In Progress' && (
                                                <div className="mt-2 flex items-center space-x-1.5">
                                                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
                                                    <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Active Focus</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        className={`relative cursor-pointer group/step transition-all ${selectedContact.stage === 'Closed' ? 'opacity-100 scale-102' : 'opacity-40 hover:opacity-100'} `}
                                        onClick={() => handleUpdateStage('Closed')}
                                    >
                                        <div className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-lg border-2 border-[#080808] group-hover/step:scale-110 transition-transform ${selectedContact.stage === 'Closed' ? 'bg-emerald-500 shadow-md' : 'bg-neutral-900 border-neutral-800'} `}>
                                            {selectedContact.stage === 'Closed' && <ArrowUpRight className="text-[#080808] w-3 h-3 m-1.5" />}
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-neutral-500 font-bold tracking-widest uppercase mb-0.5">End</p>
                                            <p className="text-base font-medium text-neutral-300 leading-none">Completed</p>
                                        </div>
                                    </div>
                                </div>

                                <Button className="w-full mt-4 bg-gradient-to-r from-blue-600/80 to-blue-800/80 hover:from-blue-600 hover:to-blue-800 text-white font-medium py-6 rounded-2xl shadow-xl relative group overflow-hidden active:scale-95 transition-all">
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-10 transition-opacity" />
                                    <span className="flex items-center text-sm font-semibold tracking-wide">
                                        <ExternalLink className="w-4 h-4 mr-2" /> OPEN ARCHIVE
                                    </span>
                                </Button>
                            </div>
                        </div>

                        {/* Neural Taxonomy & Tags */}
                        <div className="bg-white/[0.02] rounded-3xl border border-white/5 p-6 mt-6">
                            <h3 className="text-[9px] font-semibold uppercase tracking-widest text-neutral-500 mb-4 border-l-2 border-blue-600 pl-3">Labels & Taxonomy</h3>
                            <div className="flex flex-wrap gap-3">
                                {(selectedContact.tags || []).map((tag: string) => (
                                    <Badge key={tag} className="bg-neutral-900 text-neutral-300 border border-white/5 px-4 py-2 text-[11px] font-medium uppercase tracking-widest hover:bg-neutral-800 transition-colors group/tag relative pr-9">
                                        {tag}
                                        <X
                                            onClick={() => handleRemoveTag(tag)}
                                            className="w-3.5 h-3.5 ml-3 absolute right-3 cursor-pointer opacity-30 hover:opacity-100 hover:text-red-500 transition-all"
                                        />
                                    </Badge>
                                ))}
                                {isAddingTag ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            autoFocus
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                            onBlur={() => !newTag && setIsAddingTag(false)}
                                            className="h-10 w-32 bg-neutral-900 border-neutral-800 rounded-full px-4 text-xs font-medium"
                                            placeholder="New label..."
                                        />
                                        <Button onClick={handleAddTag} size="icon" className="h-8 w-8 rounded-full bg-blue-600">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsAddingTag(true)}
                                        className="h-10 px-5 text-[11px] font-medium border-dashed border-neutral-800 bg-transparent text-neutral-400 hover:text-blue-400 hover:border-blue-500/50 rounded-full transition-all flex items-center"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> ADD LABEL
                                    </Button>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="profile" className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#050505] data-[state=inactive]:hidden">
                        <EnhancedContactForm contact={selectedContact} onChange={setSelectedContact} isEditing={isEditingProfile} />
                    </TabsContent>
                </Tabs>

            </DialogContent>
        </Dialog >
    );
};
