'use client';

import { FloatingOrbitNav } from '@/components/FloatingOrbitNav';
import { CDO_MENU } from '@/lib/department-nav';

export default function CdoLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-black min-h-screen font-sans relative">
            <FloatingOrbitNav items={CDO_MENU} title="CDO Office" colorClass="bg-orange-600" />
            <main className="w-full min-h-screen pt-48">
                {children}
            </main>
        </div>
    );
}
