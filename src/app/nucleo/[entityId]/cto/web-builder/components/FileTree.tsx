import React, { useState } from "react";
import { ChevronDown, ChevronRight, Folder, FileCode, FileType, FileJson, Search, FolderOpen, Image as FileImage } from "lucide-react";

interface FileTreeItemProps {
    name: string;
    path: string;
    isFolder: boolean;
    level: number;
    isOpen: boolean;
    onToggle: () => void;
    onClick: () => void;
    activeFile: string;
    runtimeErrors?: Record<string, string>;
}

const FileTreeItem = ({ name, path, isFolder, level, isOpen, onToggle, onClick, activeFile, runtimeErrors = {} }: FileTreeItemProps) => {
    const hasError = !isFolder && runtimeErrors[path];
    return (
        <div className="relative group/item">
            {/* Nesting lines */}
            {level > 0 && Array.from({ length: level }).map((_, i) => (
                <div
                    key={i}
                    className="absolute h-full w-[1px] bg-[#333] group-hover/item:bg-[#444] transition-colors"
                    style={{ left: `${i * 12 + 18}px` }}
                />
            ))}

            <div
                className={`flex items-center gap-2 py-1.5 px-3 text-[13px] cursor-pointer select-none transition-all border-l-2 relative z-10 ${activeFile === path
                    ? 'bg-[#2a2d2e] text-white border-blue-500 shadow-sm'
                    : 'text-[#969696] hover:text-[#cccccc] hover:bg-[#2a2d2e]/50 border-transparent'
                    }`}
                style={{ paddingLeft: `${level * 12 + 12}px` }}
                onClick={isFolder ? onToggle : onClick}
            >
                {isFolder ? (
                    <>
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-[#cccccc] transition-transform duration-200" /> : <ChevronRight className="w-3.5 h-3.5 text-[#cccccc] transition-transform duration-200" />}
                        {isOpen ? (
                            <FolderOpen className="w-4 h-4 text-blue-400 opacity-90" />
                        ) : (
                            <Folder className="w-4 h-4 text-[#8a8a8a] opacity-80" />
                        )}
                    </>
                ) : (
                    <>
                        <span className="w-3.5"></span>
                        {name.endsWith('tsx') || name.endsWith('ts') ? <FileCode className="w-4 h-4 text-[#42a5f5]" /> :
                            name.endsWith('js') || name.endsWith('jsx') ? <FileCode className="w-4 h-4 text-[#f4d03f]" /> :
                                name.endsWith('css') ? <FileType className="w-4 h-4 text-[#42a5f5]" /> :
                                    name.endsWith('json') ? <FileJson className="w-4 h-4 text-[#cbcb41]" /> :
                                        name.endsWith('md') ? <FileCode className="w-4 h-4 text-[#e37933]" /> :
                                            name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i) ? <FileImage className="w-4 h-4 text-[#ce9178]" /> :
                                                <FileType className="w-4 h-4 text-[#969696]" />}
                    </>
                )}
                <span className={`truncate ${isFolder ? 'font-medium text-[#cccccc]' : ''}`}>{name}</span>
                {hasError && (
                    <div className="ml-auto pr-1">
                        <div className="flex items-center justify-center w-4 h-4 rounded-full bg-red-500/20 animate-pulse" title={runtimeErrors[path]}>
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


interface FileTreeProps {
    files: Record<string, string>;
    activeFile: string;
    setActiveFile: (path: string) => void;
    expandedFolders: Set<string>;
    setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
    runtimeErrors?: Record<string, string>;
}

export const FileTree = ({ files, activeFile, setActiveFile, expandedFolders, setExpandedFolders, runtimeErrors = {} }: FileTreeProps) => {
    const [searchQuery, setSearchQuery] = useState("");

    const renderFileTree = () => {
        const tree: any = {};

        // Filter files based on search
        const filteredPaths = Object.keys(files).filter(path =>
            path.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filteredPaths.forEach(path => {
            const parts = path.split('/');
            let current = tree;
            parts.forEach((part, i) => {
                if (i === parts.length - 1) {
                    if (!current._files) current._files = [];
                    current._files.push({ name: part, path });
                } else {
                    if (!current[part]) current[part] = {};
                    current = current[part];
                }
            });
        });

        const renderNode = (node: any, path: string, level: number) => {
            const folders = Object.keys(node).filter(k => k !== '_files').sort();
            const fileItems = (node._files || []).sort((a: any, b: any) => a.name.localeCompare(b.name));

            return (
                <div key={path || 'root'}>
                    {folders.map(folder => {
                        const folderPath = path ? `${path}/${folder}` : folder;
                        // If searching, folders are always expanded if they contain matches
                        const isOpen = searchQuery ? true : expandedFolders.has(folderPath);
                        return (
                            <React.Fragment key={folderPath}>
                                <FileTreeItem
                                    name={folder}
                                    path={folderPath}
                                    isFolder={true}
                                    level={level}
                                    isOpen={isOpen}
                                    activeFile={activeFile}
                                    runtimeErrors={runtimeErrors}
                                    onToggle={() => {
                                        const newExpanded = new Set(expandedFolders);
                                        if (isOpen) newExpanded.delete(folderPath);
                                        else newExpanded.add(folderPath);
                                        setExpandedFolders(newExpanded);
                                    }}
                                    onClick={() => { }}
                                />
                                {isOpen && renderNode(node[folder], folderPath, level + 1)}
                            </React.Fragment>
                        );
                    })}
                    {fileItems.map((item: any) => (
                        <FileTreeItem
                            key={item.path}
                            name={item.name}
                            path={item.path}
                            isFolder={false}
                            level={level + 0.5}
                            activeFile={activeFile}
                            runtimeErrors={runtimeErrors}
                            isOpen={false}
                            onToggle={() => { }}
                            onClick={() => setActiveFile(item.path)}
                        />
                    ))}
                </div>
            );
        };

        return renderNode(tree, "", 0);
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-[#333]">
                <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-[#8a8a8a]" />
                    <span className="text-[11px] font-bold text-[#cccccc] uppercase tracking-wider">Archivos</span>
                </div>
                <button className="p-1 hover:bg-[#37373d] rounded transition-colors group">
                    <Search className="w-3.5 h-3.5 text-[#8a8a8a] group-hover:text-white" />
                </button>
            </div>

            {/* Search Input */}
            <div className="p-3">
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Buscar archivos"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#3c3c3c] text-white text-[12px] px-3 py-1.5 rounded border border-transparent focus:border-blue-500/50 focus:outline-none transition-all placeholder:text-[#8a8a8a]"
                    />
                </div>
            </div>

            {/* Tree View */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {Object.keys(files).length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-2">0 archivos</div>
                        <p className="text-[9px] text-gray-700 leading-relaxed italic">El proyecto est├í vac├¡o.</p>
                    </div>
                ) : (
                    renderFileTree()
                )}
            </div>
        </div>
    );
};


