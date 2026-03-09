'use client';

import { DepartmentSidebar } from '@/components/DepartmentSidebar';
import { CTO_MENU } from '@/lib/department-nav';

export default function CtoLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex bg-black min-h-screen font-sans">
            <DepartmentSidebar items={CTO_MENU} title="CTO Office" colorClass="bg-purple-600" />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
}
