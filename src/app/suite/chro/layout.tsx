'use client';

import { FloatingOrbitNav } from '@/components/FloatingOrbitNav';
import { CHRO_MENU } from '@/lib/department-nav';

export default function ChroLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-black min-h-screen font-sans relative">
            <FloatingOrbitNav items={CHRO_MENU} title="CHRO Office" colorClass="bg-rose-600" />
            <main className="w-full min-h-screen pt-48">
                {children}
            </main>
        </div>
    );
}
