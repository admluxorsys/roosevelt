import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Loader2, Terminal as TerminalIcon, ChevronRight, Sparkles, X as XIcon } from 'lucide-react';
import { TerminalPanel, LogEntry } from './TerminalPanel';

interface PreviewAreaProps {
    files: Record<string, string>;
    activeFile?: string;
    setRuntimeErrors?: (errs: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
    // remote controls
    showTerminal?: boolean;
    setShowTerminal?: (show: boolean) => void;
    refreshSignal?: number;
    onLoadingChange?: (loading: boolean) => void;
    handleGenerate?: (msg: string, images?: { id: string; url: string; file?: File }[]) => Promise<void>;
    selection?: { path: string; loc: string; rect: any } | null;
    setSelection?: (sel: { path: string; loc: string; rect: any } | null) => void;
}

export const PreviewArea = ({
    files, activeFile, setRuntimeErrors,
    showTerminal, setShowTerminal, refreshSignal, onLoadingChange,
    handleGenerate, selection, setSelection
}: PreviewAreaProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [loading, setLoading] = useState(true);
    const [previewHTML, setPreviewHTML] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [runtimeError, setRuntimeError] = useState<{ message: string; stack: string } | null>(null);
    const [errorCollapsed, setErrorCollapsed] = useState(true);

    useEffect(() => {
        onLoadingChange?.(loading);
    }, [loading, onLoadingChange]);

    const addLog = (message: string, type: LogEntry['type'] = 'info') => {
        const timestamp = new Date().toLocaleTimeString('es-MX', { hour12: false });
        setLogs(prev => [...prev, { message, type, timestamp }]);
    };

    const refreshPreview = async () => {
        setLoading(true);
        setError('');

        addLog(`Iniciando compilación de ${Object.keys(files).length} archivos...`, 'info');
        addLog("Detectando dependencias y assets virtuales...", 'debug');

        try {
            const response = await fetch('/api/web-builder/preview-v4', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files })
            });

            if (!response.ok) {
                let errorMsg = 'Preview generation failed';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) {
                    const text = await response.text();
                    errorMsg = `Server Error (${response.status}): ${text.substring(0, 50)}...`;
                }
                addLog(`Error en el servidor: ${errorMsg}`, 'error');
                throw new Error(errorMsg);
            }

            addLog("Babel transpilation iniciada en el cliente...", 'info');
            addLog("Inyectando motor de visualización react-standalone...", 'debug');

            const html = await response.text();
            setPreviewHTML(html);
            setLoading(false);
            addLog("Bundle generado exitosamente.", 'success');
        } catch (err: any) {
            console.error('[PreviewArea] Error:', err);
            setError(err.message);
            setLoading(false);
            addLog(`Fallo en el build: ${err.message}`, 'error');

            if (setRuntimeErrors) {
                setRuntimeErrors(prev => ({ ...prev, [activeFile || 'preview']: err.message }));
            }
        }
    };

    // Refresh preview when files change OR refreshSignal changes
    useEffect(() => {
        const timer = setTimeout(() => {
            refreshPreview();
        }, 200); // 200ms for near-instant feel

        return () => clearTimeout(timer);
    }, [files, refreshSignal]);

    // Update iframe when HTML changes
    useEffect(() => {
        if (previewHTML && iframeRef.current) {
            const iframe = iframeRef.current;
            const doc = iframe.contentDocument || iframe.contentWindow?.document;

            if (doc) {
                doc.open();
                doc.write(previewHTML);
                doc.close();
            }
        }
    }, [previewHTML]);

    // Listen for console logs and runtime errors from the iframe
    useEffect(() => {
        const handleIframeMessage = (event: MessageEvent) => {
            if (event.source !== iframeRef.current?.contentWindow) return;

            if (event.data?.type === 'console-log') {
                const { level, args } = event.data;
                const message = args.join(' ');
                const logType: LogEntry['type'] =
                    level === 'error' ? 'error' : level === 'warn' ? 'warn' : level === 'debug' ? 'debug' : 'info';
                addLog(`[${level.toUpperCase()}] ${message}`, logType);
            }

            if (event.data?.type === 'runtime-error') {
                const { message, stack, file } = event.data;
                setRuntimeError({ message, stack: stack || '' });
                addLog(`Runtime Error [${file || 'unknown'}]: ${message}`, 'error');
                if (setRuntimeErrors) {
                    setRuntimeErrors(prev => ({ ...prev, [file || '__runtime__']: message }));
                }
            }
        };

        window.addEventListener('message', handleIframeMessage);
        return () => window.removeEventListener('message', handleIframeMessage);
    }, []);

    return (
        <div className="w-full h-full bg-white relative overflow-hidden flex flex-col">
            <div className="flex-1 relative overflow-hidden">
                {/* Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-50 transition-opacity duration-300">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 border-2 border-blue-500/20 rounded-full"></div>
                                <div className="w-12 h-12 border-2 border-t-blue-500 rounded-full animate-spin absolute top-0 left-0"></div>
                            </div>
                            <div className="text-center">
                                <p className="text-white/70 text-xs font-medium tracking-wide">Generating Preview</p>
                                <p className="text-white/30 text-[10px] mt-1">Transpiling components...</p>
                            </div>
                        </div>
                    </div>
                )}


                {/* Error Display */}
                {error && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black z-40 p-8">
                        <div className="max-w-2xl w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
                            <div className="flex items-start gap-4">
                                <div className="text-red-400 text-2xl">⚠️</div>
                                <div className="flex-1">
                                    <h3 className="text-red-400 font-bold text-lg mb-2">Preview Error</h3>
                                    <p className="text-red-300/80 text-sm font-mono whitespace-pre-wrap">{error}</p>
                                    <button
                                        onClick={refreshPreview}
                                        className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 text-sm font-medium transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions Bar REMOVED (Moved to Global Toolbar) */}

                {/* Preview Iframe */}
                <iframe
                    ref={iframeRef}
                    className="w-full h-full border-none bg-black"
                    sandbox="allow-scripts allow-same-origin"
                    title="Preview"
                />

                {/* Terminal Panel */}
                <TerminalPanel
                    logs={logs}
                    isVisible={!!showTerminal}
                    onClose={() => setShowTerminal?.(false)}
                    onClear={() => setLogs([])}
                />
            </div>
        </div>
    );
};

