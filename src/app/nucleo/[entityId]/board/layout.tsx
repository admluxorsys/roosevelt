'use client';

import { FloatingOrbitNav } from '@/components/FloatingOrbitNav';
import { BOARD_MENU } from '@/lib/department-nav';

export default function BoardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-black min-h-screen font-sans relative">
            <FloatingOrbitNav items={BOARD_MENU} title="Board of Directors" colorClass="bg-slate-500" />
            <main className="w-full min-h-screen pt-48">
                {children}
            </main>
        </div>
    );
}

