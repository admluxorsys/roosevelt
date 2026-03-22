'use client';

import { FloatingOrbitNav } from '@/components/FloatingOrbitNav';
import { CLO_MENU } from '@/lib/department-nav';

export default function CloLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-black min-h-screen font-sans relative">
            <FloatingOrbitNav items={CLO_MENU} title="CLO Office" colorClass="bg-slate-600" />
            <main className="w-full min-h-screen pt-48">
                {children}
            </main>
        </div>
    );
}

