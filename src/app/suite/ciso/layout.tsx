'use client';

import { FloatingOrbitNav } from '@/components/FloatingOrbitNav';
import { CISO_MENU } from '@/lib/department-nav';

export default function CisoLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-black min-h-screen font-sans relative">
            <FloatingOrbitNav items={CISO_MENU} title="CISO Office" colorClass="bg-red-600" />
            <main className="w-full min-h-screen pt-48">
                {children}
            </main>
        </div>
    );
}
