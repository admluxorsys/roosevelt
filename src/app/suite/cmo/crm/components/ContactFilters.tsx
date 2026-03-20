import React from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronRight, List, LayoutGrid, Filter, Trash2, Command } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from "@/lib/utils";

interface ContactFiltersProps {
    isChatOpen: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    viewMode: 'list' | 'grid';
    setViewMode: (mode: 'list' | 'grid') => void;
    isFilterOpen: boolean;
    setIsFilterOpen: (open: boolean) => void;
    activeFiltersCount: number;
    clearAllFilters: () => void;
    availableStages: string[];
    selectedStages: string[];
    setSelectedStages: (stages: string[] | ((prev: string[]) => string[])) => void;
    availableSources: string[];
    selectedSources: string[];
    setSelectedSources: (sources: string[] | ((prev: string[]) => string[])) => void;
    availableTags: string[];
    selectedTags: string[];
    setSelectedTags: (tags: string[] | ((prev: string[]) => string[])) => void;
    filteredCount: number;
    selectedCount: number;
    handleBulkDelete: () => void;
    currentView: string;
    setCurrentView: (view: any) => void;
}

export const ContactFilters: React.FC<ContactFiltersProps> = ({
    isChatOpen,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    isFilterOpen,
    setIsFilterOpen,
    activeFiltersCount,
    clearAllFilters,
    availableStages,
    selectedStages,
    setSelectedStages,
    availableSources,
    selectedSources,
    setSelectedSources,
    availableTags,
    selectedTags,
    setSelectedTags,
    filteredCount,
    selectedCount,
    handleBulkDelete,
    currentView,
    setCurrentView
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center relative z-10 p-1 bg-neutral-900 border border-white/5 rounded-md gap-3"
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn("relative group transition-all shrink-0", isChatOpen ? "w-48" : "w-64")}>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-neutral-500 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <Input
                    id="crm-search-input"
                    type="text"
                    placeholder="Search database..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-16 bg-black/40 border-white/5 h-10 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 text-white font-medium placeholder:text-neutral-600 text-xs uppercase tracking-wider rounded-lg transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                    <kbd className="h-5 px-1.5 rounded border border-white/20 bg-white/5 text-[9px] font-medium text-neutral-400 flex items-center justify-center min-w-[20px]">⌘</kbd>
                    <kbd className="h-5 px-1.5 rounded border border-white/20 bg-white/5 text-[9px] font-medium text-neutral-400 flex items-center justify-center min-w-[20px]">K</kbd>
                </div>
            </div>

            {/* Relocated Tabs */}
            {!isChatOpen && (
                <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-lg border border-white/5 shrink-0 overflow-hidden">
                    {(['all', 'Prospecting', 'In Progress', 'Closed'] as const).map((view) => (
                        <button
                            key={view}
                            onClick={() => setCurrentView(view)}
                            className={cn(
                                "px-3 py-1 rounded-md text-[9px] font-medium transition-all uppercase tracking-widest whitespace-nowrap",
                                currentView === view 
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                                    : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                            )}
                        >
                            {view === 'all' ? 'Core Database' : view}
                        </button>
                    ))}
                </div>
            )}
        </div>

            {!isChatOpen && (
                <div className="flex items-center space-x-4 pr-2">
                    <div className="flex bg-black/40 p-1 rounded-md border border-white/5">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewMode('list')}
                            className={`h-7 w-7 transition-all rounded ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                            <List className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewMode('grid')}
                            className={`h-7 w-7 transition-all rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-400 hover:text-neutral-300'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="h-6 w-[1px] bg-neutral-800" />

                    <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" className="h-9 text-neutral-500 hover:text-white font-medium text-xs uppercase tracking-wider flex items-center group">
                                <Filter className="w-3.5 h-3.5 mr-2 group-hover:text-blue-500 transition-colors" />
                                Filters
                                {activeFiltersCount > 0 && (
                                    <Badge className="ml-2 bg-blue-600 text-white text-[9px] px-1.5 py-0 font-medium rounded-sm">
                                        {activeFiltersCount}
                                    </Badge>
                                )}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-neutral-950 border-neutral-800 text-white sm:max-w-2xl rounded-lg p-6 backdrop-blur-3xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-medium tracking-tight uppercase flex items-center justify-between">
                                    <span className="flex items-center">
                                        <Filter className="w-6 h-6 mr-3 text-blue-500" />
                                        Advanced Filters
                                    </span>
                                    {activeFiltersCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            onClick={clearAllFilters}
                                            className="text-xs text-red-400 hover:text-red-300 font-medium"
                                        >
                                            Clear All
                                        </Button>
                                    )}
                                </DialogTitle>
                                <DialogDescription className="text-neutral-300 font-medium">
                                    Refine your contact list with precision filters
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-8 py-6">
                                {/* Stage Filter */}
                                <div>
                                    <Label className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 mb-4 block">
                                        Stage / Status
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableStages.map(stage => (
                                            <Button
                                                key={stage}
                                                variant={selectedStages.includes(stage) ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedStages(prev =>
                                                        prev.includes(stage)
                                                            ? prev.filter(s => s !== stage)
                                                            : [...prev, stage]
                                                    );
                                                }}
                                                className={cn(
                                                    "h-9 px-4 text-xs font-medium rounded-xl transition-all",
                                                    selectedStages.includes(stage)
                                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 border-blue-500"
                                                        : "bg-neutral-900/50 text-neutral-400 border-neutral-800 hover:border-blue-500/50 hover:text-neutral-200"
                                                )}
                                            >
                                                {stage}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Source Filter */}
                                <div>
                                    <Label className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 mb-4 block">
                                        Source / Origin
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableSources.map(source => (
                                            <Button
                                                key={source}
                                                variant={selectedSources.includes(source) ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedSources(prev =>
                                                        prev.includes(source)
                                                            ? prev.filter(s => s !== source)
                                                            : [...prev, source]
                                                    );
                                                }}
                                                className={cn(
                                                    "h-9 px-4 text-xs font-medium rounded-xl transition-all",
                                                    selectedSources.includes(source)
                                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 border-blue-500"
                                                        : "bg-neutral-900/50 text-neutral-400 border-neutral-800 hover:border-blue-500/50 hover:text-neutral-200"
                                                )}
                                            >
                                                {source}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tags Filter */}
                                {availableTags.length > 0 && (
                                    <div>
                                        <Label className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400 mb-4 block">
                                            Tags / Categories
                                        </Label>
                                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                            {availableTags.map(tag => (
                                                <Button
                                                    key={tag}
                                                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedTags(prev =>
                                                            prev.includes(tag)
                                                                ? prev.filter(t => t !== tag)
                                                                : [...prev, tag]
                                                        );
                                                    }}
                                                    className={cn(
                                                        "h-9 px-4 text-xs font-medium rounded-xl transition-all",
                                                        selectedTags.includes(tag)
                                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 border-blue-500"
                                                            : "bg-neutral-900/50 text-neutral-400 border-neutral-800 hover:border-blue-500/50 hover:text-neutral-200"
                                                    )}
                                                >
                                                    {tag}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="mt-6">
                                <div className="flex items-center justify-between w-full">
                                    <p className="text-sm text-neutral-400">
                                        <span className="font-medium text-blue-400">{filteredCount}</span> contacts match your filters
                                    </p>
                                    <Button
                                        onClick={() => setIsFilterOpen(false)}
                                        className="bg-blue-600 hover:bg-blue-700 px-8 rounded-xl font-medium shadow-lg shadow-blue-600/20"
                                    >
                                        Apply Filters
                                    </Button>
                                </div>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {selectedCount > 0 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBulkDelete}
                            className="text-white hover:text-white h-10 px-3 w-auto bg-red-600 hover:bg-red-700 rounded-md flex gap-2 items-center transition-all animate-in fade-in zoom-in duration-200"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Delete ({selectedCount})</span>
                        </Button>
                    )}
                </div>
            )}
        </motion.div>
    );
};
