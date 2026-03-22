'use client';

import React, { createContext, useContext, useState } from 'react';

interface SidebarContextType {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    expandSidebar: () => void;
    collapseSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => setIsCollapsed(prev => !prev);
    const expandSidebar = () => setIsCollapsed(false);
    const collapseSidebar = () => setIsCollapsed(true);

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, expandSidebar, collapseSidebar }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}

