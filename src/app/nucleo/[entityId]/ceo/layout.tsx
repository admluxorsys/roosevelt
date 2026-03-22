'use client';

import { FloatingOrbitNav } from '@/components/FloatingOrbitNav';
import { CEO_MENU } from '@/lib/department-nav';

export default function CeoLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-black min-h-screen font-sans relative">
            <FloatingOrbitNav items={CEO_MENU} title="CEO Office" colorClass="bg-blue-600" />
            <main className="w-full min-h-screen pt-48">
                {children}
            </main>
        </div>
    );
}

