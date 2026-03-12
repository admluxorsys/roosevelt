'use client';

import { FloatingOrbitNav } from '@/components/FloatingOrbitNav';
import { CTO_MENU } from '@/lib/department-nav';

export default function CtoLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-black min-h-screen font-sans relative">
            <FloatingOrbitNav items={CTO_MENU} title="CTO Office" colorClass="bg-purple-600" />
            <main className="w-full min-h-screen pt-48">
                {children}
            </main>
        </div>
    );
}
