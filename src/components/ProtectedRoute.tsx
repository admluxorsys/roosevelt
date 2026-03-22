'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { currentUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push('/login');
        }
    }, [currentUser, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-white">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p className="ml-4 tracking-wider text-sm font-medium">Validando sesión...</p>
            </div>
        );
    }

    // If we are not loading and there's no user, we return nothing while useEffect redirects
    if (!currentUser) {
        return null;
    }

    return <>{children}</>;
}

