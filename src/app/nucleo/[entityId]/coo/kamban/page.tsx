
'use client';

import React, { useState, useEffect } from 'react';import { useAuth } from '@/contexts/AuthContext';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

import KambanBoard from './components/KambanBoard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CsoKambanPage() {
    const { currentUser, activeEntity } = useAuth();
    const getTenantPath = () => {
        if (!currentUser?.uid || !activeEntity) return '';
        return `users/${currentUser.uid}/entities/${activeEntity}`;
    };

  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return (
      <div className="flex h-screen bg-black text-white">
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm font-light tracking-widest animate-pulse">Loading...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-black text-white">
        <main className="flex-1 flex items-center justify-center">
          <p className="text-red-400">Error: {error.message}</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen bg-black text-white">
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <h2 className="text-2xl font-light mb-4 tracking-tight">Access Denied</h2>
          <p className="mb-8 text-white/50 font-light max-w-md">Please sign in to view the kamban board and manage your conversations.</p>
          <Link href="/login" passHref>
            <Button className="rounded-full px-8 bg-white text-black hover:bg-white/90 transition-all">
              Go to Login Page
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <KambanBoard />
        </div>
      </main>
    </div>
  );
}


