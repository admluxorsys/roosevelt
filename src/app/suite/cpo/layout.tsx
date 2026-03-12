'use client';

import { FloatingOrbitNav } from '@/components/FloatingOrbitNav';
import { CPO_MENU } from '@/lib/department-nav';

export default function CpoLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-black min-h-screen font-sans relative">
            <FloatingOrbitNav items={CPO_MENU} title="CPO Office" colorClass="bg-indigo-600" />
            <main className="w-full min-h-screen pt-48">
                {children}
            </main>
        </div>
    );
}
