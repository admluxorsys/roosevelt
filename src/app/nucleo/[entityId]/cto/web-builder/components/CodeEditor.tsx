import React, { useState, useEffect, useRef } from "react";
import { X, Copy, Download, Maximize2, Minimize2, ChevronRight, FileCode, Search, AlertTriangle } from "lucide-react";
import Editor, { Monaco } from "@monaco-editor/react";
import { FileTree } from "./FileTree";

interface CodeEditorProps {
    showCode: boolean;
    setShowCode: (show: boolean) => void;
    files: Record<string, string>;
    updateFiles: (files: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
    activeFile: string;
    setActiveFile: (path: string) => void;
    expandedFolders: Set<string>;
    setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
    runtimeErrors?: Record<string, string>;
    setRuntimeErrors?: (errs: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
}

export const CodeEditor = ({
    showCode,
    setShowCode,
    files,
    updateFiles,
    activeFile,
    setActiveFile,
    expandedFolders,
    setExpandedFolders,
    runtimeErrors = {},
    setRuntimeErrors
}: CodeEditorProps) => {
    const [openFiles, setOpenFiles] = useState<string[]>([]);
    const [isMaxEditor, setIsMaxEditor] = useState(false);

    // Sync activeFile with openFiles
    useEffect(() => {
        if (activeFile) {
            setOpenFiles(prev => prev.includes(activeFile) ? prev : [...prev, activeFile]);
        }
    }, [activeFile]);

    // Handle Editor Search from Preview (Bidirectional Sync)
    const editorRef = useRef<any>(null);
    useEffect(() => {
        const onSearch = (e: any) => {
            const term = e.detail;
            if (editorRef.current && term) {
                const model = editorRef.current.getModel();
                if (model) {
                    const matches = model.findMatches(term, false, false, false, null, true);
                    if (matches && matches.length > 0) {
                        const match = matches[0];
                        editorRef.current.revealRangeInCenter(match.range);
                        editorRef.current.setSelection(match.range);
                    }
                }
            }
        };

        const onGotoLine = (e: any) => {
            const { line } = e.detail;
            if (editorRef.current && line) {
                setTimeout(() => {
                    editorRef.current.revealLineInCenter(line);
                    editorRef.current.setSelection({
                        startLineNumber: line,
                        startColumn: 1,
                        endLineNumber: line,
                        endColumn: 100
                    });
                    editorRef.current.focus();
                }, 100);
            }
        };

        window.addEventListener('editor-search', onSearch);
        window.addEventListener('editor-goto-line', onGotoLine);
        return () => {
            window.removeEventListener('editor-search', onSearch);
            window.removeEventListener('editor-goto-line', onGotoLine);
        };
    }, []);

    // Handle closing a tab
    const closeTab = (e: React.MouseEvent, path: string) => {
        e.stopPropagation();
        const nextFiles = openFiles.filter(f => f !== path);
        setOpenFiles(nextFiles);
        if (activeFile === path && nextFiles.length > 0) {
            setActiveFile(nextFiles[nextFiles.length - 1]);
        } else if (nextFiles.length === 0) {
            setActiveFile("");
        }
    };

    const handleCopy = () => {
        const content = files[activeFile] || "";
        navigator.clipboard.writeText(content);
    };

    const handleDownload = () => {
        const content = files[activeFile] || "";
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = activeFile.split('/').pop() || 'file.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!showCode) return null;

    const codeContent = files[activeFile] || "";
    const lines = codeContent.split('\n');

    return (
        <div className={`fixed z-[100] bg-[#0d0d0d] flex flex-col overflow-hidden transition-all duration-300 border border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)] ${isMaxEditor ? 'inset-0 rounded-none' : 'inset-6 rounded-2xl'
            }`}>
            {/* Main Header / Tab Bar */}
            <div className="flex items-center justify-between bg-[#141414] border-b border-[#222] h-11">
                <div className="flex-1 flex items-center overflow-x-auto no-scrollbar h-full">
                    {openFiles.map(path => (
                        <div
                            key={path}
                            onClick={() => setActiveFile(path)}
                            className={`group flex items-center gap-2 px-4 h-full cursor-pointer text-[13px] border-r border-[#222] transition-colors relative min-w-[120px] max-w-[200px] ${activeFile === path
                                ? 'bg-[#1e1e1e] text-white'
                                : 'bg-[#141414] text-[#858585] hover:bg-[#1a1a1a] hover:text-[#cccccc]'
                                }`}
                        >
                            {activeFile === path && <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500" />}
                            <span className="truncate flex-1">{path}</span>
                            {runtimeErrors[path] && (
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" title={runtimeErrors[path]} />
                            )}
                            <button
                                onClick={(e) => closeTab(e, path)}
                                className={`p-0.5 rounded hover:bg-[#333] transition-opacity ${activeFile === path ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 px-3 border-l border-[#222] h-full bg-[#141414]">
                    <button onClick={handleCopy} className="p-2 text-[#858585] hover:text-white rounded-lg transition-colors" title="Copiar c├│digo">
                        <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={handleDownload} className="p-2 text-[#858585] hover:text-white rounded-lg transition-colors" title="Descargar archivo">
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsMaxEditor(!isMaxEditor)} className="p-2 text-[#858585] hover:text-white rounded-lg transition-colors">
                        {isMaxEditor ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <div className="w-[1px] h-4 bg-[#333] mx-1" />
                    <button onClick={() => setShowCode(false)} className="p-2 text-[#858585] hover:text-red-400 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* File Explorer Sidebar */}
                <div className="w-[280px] bg-[#0d0d0d] border-r border-[#222] flex flex-col overflow-hidden">
                    <FileTree
                        files={files}
                        activeFile={activeFile}
                        setActiveFile={setActiveFile}
                        expandedFolders={expandedFolders}
                        setExpandedFolders={setExpandedFolders}
                        runtimeErrors={runtimeErrors}
                    />
                </div>

                {/* Editor Surface */}
                <div className="flex-1 flex flex-col bg-[#1e1e1e] relative overflow-hidden">
                    {/* Floating Error Banner */}
                    {runtimeErrors[activeFile] && (
                        <div className="absolute top-4 left-4 right-4 z-[110] animate-in slide-in-from-top duration-500">
                            <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-xl p-4 flex items-start gap-4 shadow-2xl shadow-red-500/20">
                                <div className="p-2 bg-red-500/20 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-red-200 text-xs font-bold uppercase tracking-wider mb-1">Error de Ejecución</h4>
                                    <p className="text-red-100/80 text-sm leading-relaxed font-mono">
                                        {runtimeErrors[activeFile]}
                                    </p>
                                    <div className="mt-3 flex gap-3">
                                        <button
                                            onClick={() => window.parent.postMessage({ type: 'ask-ai-fix', error: runtimeErrors[activeFile], file: activeFile }, '*')}
                                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-[11px] font-bold rounded-lg transition-all border border-red-500/20"
                                        >
                                            Solicitar Corrección a IA
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!activeFile ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-[#555] bg-[#0d0d0d]">
                            <FileCode className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-sm font-medium">Selecciona un archivo para editar</p>
                        </div>
                    ) : (
                        <div className="flex flex-1 overflow-hidden">
                            <div className="flex-1 relative overflow-hidden flex">
                                <Editor
                                    height="100%"
                                    defaultLanguage="typescript"
                                    theme="vs-dark"
                                    value={codeContent}
                                    beforeMount={(monaco: Monaco) => {
                                        const ts = (monaco as any).languages?.typescript;
                                        ts?.typescriptDefaults?.setCompilerOptions({
                                            target: 99 /* ESNext */,
                                            allowNonTsExtensions: true,
                                            moduleResolution: 2 /* NodeJs */,
                                            module: 1 /* CommonJS */,
                                            noEmit: true,
                                            typeRoots: ["node_modules/@types"],
                                            jsx: 2 /* React */,
                                            allowJs: true,
                                        });
                                        ts?.typescriptDefaults?.setDiagnosticsOptions({
                                            // Disable static analysis — creates false positives for valid
                                            // TypeScript generics and class components in .tsx files.
                                            // Real runtime errors are caught by the Visor Engine.
                                            noSemanticValidation: true,
                                            noSyntaxValidation: true,
                                        });
                                    }}
                                    onMount={(editor, monaco) => {
                                        editorRef.current = editor;

                                        // Sync editor markers (errors/warnings) to the file tree
                                        monaco.editor.onDidChangeMarkers(() => {
                                            const markers = monaco.editor.getModelMarkers({ resource: editor.getModel()?.uri });
                                            const highestSeverity = markers.reduce((max, m) => Math.max(max, m.severity), 0);

                                            if (highestSeverity >= monaco.MarkerSeverity.Error) {
                                                const firstError = markers.find(m => m.severity === monaco.MarkerSeverity.Error);
                                                if (firstError && activeFile && setRuntimeErrors) {
                                                    setRuntimeErrors(prev => ({ ...prev, [activeFile]: firstError.message }));
                                                }
                                            } else if (activeFile && setRuntimeErrors && runtimeErrors[activeFile]) {
                                                // Clear error if resolved (and it was a code-time error)
                                                setRuntimeErrors(prev => {
                                                    const next = { ...prev };
                                                    delete next[activeFile];
                                                    return next;
                                                });
                                            }
                                        });
                                    }}
                                    onChange={(val) => {
                                        if (val !== codeContent) {
                                            updateFiles(prev => ({ ...prev, [activeFile]: val || "" }));
                                        }
                                    }}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        lineNumbers: 'on',
                                        roundedSelection: false,
                                        scrollBeyondLastLine: false,
                                        readOnly: false,
                                        automaticLayout: true,
                                        padding: { top: 20 },
                                        glyphMargin: false,
                                        folding: true,
                                        lineDecorationsWidth: 10,
                                        lineNumbersMinChars: 3,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className={`h-6 flex items-center px-4 justify-between text-[11px] font-medium transition-colors ${(runtimeErrors[activeFile] || runtimeErrors['__runtime__']) ? 'bg-red-900/50 text-red-200' : 'bg-[#007acc] text-white'}`}>
                        <div className="flex items-center gap-4">
                            {(runtimeErrors[activeFile] || runtimeErrors['__runtime__']) ? (
                                <span className="font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                    Error: {runtimeErrors[activeFile] || runtimeErrors['__runtime__']}
                                </span>
                            ) : (
                                <>
                                    <span>{activeFile.endsWith('.tsx') ? 'TypeScript React' : activeFile.endsWith('.css') ? 'CSS' : 'Text'}</span>
                                    <span>UTF-8</span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <span>Spaces: 4</span>
                            <span>Line: {lines.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


