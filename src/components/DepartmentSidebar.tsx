'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Menu,
    ChevronLeft,
    LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebar } from '@/components/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
    href: string;
    icon: any;
    label: string;
}

interface DepartmentSidebarProps {
    items: NavItem[];
    title: string;
    colorClass?: string;
}

export function DepartmentSidebar({ items, title, colorClass = "bg-blue-600" }: DepartmentSidebarProps) {
    const { isCollapsed, toggleSidebar } = useSidebar();
    const pathname = usePathname();
    const { activeEntity } = useAuth();

    return (
        <TooltipProvider delayDuration={0}>
            <aside className={`bg-neutral-950 border-r border-neutral-800 text-neutral-300 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'} h-screen sticky top-0`}>
                <div className={`flex items-center p-4 h-16 border-b border-neutral-800 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className={`flex items-center space-x-3 ${isCollapsed ? 'hidden' : 'flex'}`}>
                        <div className={`p-1.5 rounded-lg ${colorClass}`}>
                            <LayoutDashboard className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-lg text-white">{title}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hover:bg-neutral-800 text-neutral-400 hover:text-white">
                        {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </Button>
                </div>

                <nav className="flex-grow p-2 flex flex-col overflow-y-auto custom-scrollbar">
                    <ul className="space-y-1 flex-grow">
                        {items.map((item) => {
                            const actualHref = item.href.replace('{entity}', activeEntity || '');
                            const isActive = pathname.startsWith(actualHref);
                            const linkContent = (
                                <div className={`flex items-center p-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? `${colorClass} text-white shadow-lg`
                                    : 'hover:bg-white/5 text-neutral-400 hover:text-white'
                                    } ${isCollapsed ? 'justify-center' : ''}`}
                                >
                                    <item.icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                                    <span className={isCollapsed ? 'hidden' : 'block'}>{item.label}</span>
                                </div>
                            );

                            return (
                                <li key={actualHref}>
                                    {isCollapsed ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Link href={actualHref}>{linkContent}</Link>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="bg-neutral-800 text-white border-neutral-700">
                                                {item.label}
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        <Link href={actualHref}>{linkContent}</Link>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    <div className="mt-auto pt-4 border-t border-neutral-800/50">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href={`/nucleo/${activeEntity || ''}`}
                                    className={`group flex items-center justify-center ${isCollapsed ? 'p-2' : 'px-4 py-2'} mx-auto rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all duration-200`}
                                >
                                    <ChevronLeft className={`w-4 h-4 ${isCollapsed ? '' : 'mr-2 group-hover:-translate-x-0.5 transition-transform'}`} />
                                    <span className={`text-sm font-medium ${isCollapsed ? 'hidden' : 'block'}`}>Back to Suite</span>
                                </Link>
                            </TooltipTrigger>
                            {isCollapsed && (
                                <TooltipContent side="right" className="bg-neutral-800 text-white border-neutral-700">
                                    Back to Suite
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </div>
                </nav>
            </aside>
        </TooltipProvider>
    );
}

