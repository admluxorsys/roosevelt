'use client';

import { FloatingOrbitNav } from '@/components/FloatingOrbitNav';
import { CFO_MENU } from '@/lib/department-nav';

export default function CfoLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-black min-h-screen font-sans relative">
            <FloatingOrbitNav items={CFO_MENU} title="CFO Office" colorClass="bg-yellow-600" />
            <main className="w-full min-h-screen pt-48">
                {children}
            </main>
        </div>
    );
}

