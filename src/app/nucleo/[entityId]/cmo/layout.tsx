'use client';

import { FloatingOrbitNav } from '@/components/FloatingOrbitNav';
import { CMO_MENU } from '@/lib/department-nav';

export default function CmoLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-black min-h-screen font-sans relative">
            <FloatingOrbitNav items={CMO_MENU} title="CMO Office" colorClass="bg-pink-600" />
            <main className="w-full min-h-screen pt-48">
                {children}
            </main>
        </div>
    );
}

