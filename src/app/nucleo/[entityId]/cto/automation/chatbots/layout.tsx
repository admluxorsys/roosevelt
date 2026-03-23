'use client';

import React from 'react';import { useAuth } from '@/contexts/AuthContext';

import ProtectedRoute from '@/components/ProtectedRoute';

export default function ChatbotsLayout({ children }: { children: React.ReactNode }) {
    const { currentUser, activeEntity } = useAuth();
    const getTenantPath = () => {
        if (!currentUser?.uid || !activeEntity) return '';
        return `users/${currentUser.uid}/entities/${activeEntity}`;
    };

    return (
        <ProtectedRoute>
            {children}
        </ProtectedRoute>
    );
}

