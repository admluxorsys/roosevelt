import React, { useState, useEffect } from "react";
import { Monitor, ExternalLink, RefreshCw, Loader2, Maximize2, Minimize2 } from "lucide-react";

interface BrowserAddressBarProps {
    url: string;
    availableRoutes?: string[];
    onNavigate: (path: string) => void;
    onRefresh: () => void;
    isRefreshing?: boolean;
    onOpenExternal?: () => void;
    isMaximized?: boolean;
    onToggleMaximize?: () => void;
}

export const BrowserAddressBar = ({
    url,
    availableRoutes = [],
    onNavigate,
    onRefresh,
    isRefreshing = false,
    onOpenExternal,
    isMaximized = false,
    onToggleMaximize
}: BrowserAddressBarProps) => {
    const [inputValue, setInputValue] = useState(url);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        setInputValue(url || "");
    }, [url]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        onNavigate(inputValue);
        setShowDropdown(false);
    };

    const filteredRoutes = availableRoutes.filter(r =>
        r.toLowerCase().includes(inputValue.toLowerCase()) && r !== (inputValue.startsWith('/') ? inputValue : `/${inputValue}`)
    );

    return (
        <div className="h-10 bg-[#161616] flex items-center px-4 gap-3 border-b border-[#222] z-50 shrink-0 select-none">
            {/* Window Controls (Mac Style) */}
            <div className="flex gap-2 mr-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
            </div>

            {/* Address Bar Input Container */}
            <div className="flex-1 flex items-center justify-center relative">
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-2xl flex items-center bg-[#0d0d0d] rounded-full px-4 h-7 border border-[#222] group focus-within:border-blue-500/50 transition-all shadow-inner"
                >
                    <Monitor className="w-3 h-3 text-gray-600 mr-2 group-focus-within:text-blue-400 transition-colors" />
                    <span className="text-[11px] text-gray-500 font-medium select-none">localhost:3000/</span>
                    <input
                        type="text"
                        value={inputValue}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-[11px] text-gray-200 font-medium px-0.5 placeholder:text-gray-700 h-full"
                        placeholder="index"
                        spellCheck={false}
                    />
                </form>

                {/* Routes Dropdown */}
                {showDropdown && filteredRoutes.length > 0 && (
                    <div className="absolute top-9 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden py-1 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-3 py-1.5 border-b border-white/5 mb-1">
                            <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Páginas Disponibles</span>
                        </div>
                        {filteredRoutes.map((route) => (
                            <button
                                key={route}
                                onClick={() => {
                                    const cleanPath = route.startsWith('/') ? route.substring(1) : route;
                                    setInputValue(cleanPath);
                                    onNavigate(cleanPath);
                                    setShowDropdown(false);
                                }}
                                className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-md bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 group-hover:bg-blue-500 transition-colors"></div>
                                    </div>
                                    <span className="text-[11px] text-gray-300 font-medium group-hover:text-white transition-colors">
                                        {route === '/' ? 'index' : route}
                                    </span>
                                </div>
                                <span className="text-[10px] text-white/20 opacity-0 group-hover:opacity-100 transition-all font-mono">ir</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 ml-2">
                <button
                    onClick={onToggleMaximize}
                    title={isMaximized ? "Restore" : "Maximize"}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all active:scale-95"
                >
                    {isMaximized ? (
                        <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                        <Maximize2 className="w-3.5 h-3.5" />
                    )}
                </button>
                <button
                    onClick={onOpenExternal}
                    title="Open in new tab"
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all active:scale-95"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={onRefresh}
                    title="Reload preview"
                    disabled={isRefreshing}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all active:rotate-180 disabled:opacity-30"
                >
                    {isRefreshing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                    )}
                </button>
            </div>
        </div>
    );
};

