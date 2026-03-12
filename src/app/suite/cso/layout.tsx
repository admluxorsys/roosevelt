'use client';

import { FloatingOrbitNav } from '@/components/FloatingOrbitNav';
import { CSO_MENU } from '@/lib/department-nav';

export default function CsoLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-black min-h-screen font-sans relative">
            <FloatingOrbitNav items={CSO_MENU} title="CSO Office" colorClass="bg-yellow-600" />
            <main className="w-full min-h-screen pt-48">
                {children}
            </main>
        </div>
    );
}
