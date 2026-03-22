'use client';

import { FloatingOrbitNav } from '@/components/FloatingOrbitNav';
import { COO_MENU } from '@/lib/department-nav';

export default function CooLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-black min-h-screen font-sans relative">
            <FloatingOrbitNav items={COO_MENU} title="COO Office" colorClass="bg-emerald-600" />
            <main className="w-full min-h-screen pt-48">
                {children}
            </main>
        </div>
    );
}

