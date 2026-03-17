import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

export const WhatsappIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L22 2l-1.5 6.5Z" />
    </svg>
);

interface ContactFieldCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    placeholder?: string;
    isEditing?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onStartEdit?: () => void;
    onDelete?: () => void;
    name?: string;
}

export function ContactFieldCard({
    icon,
    label,
    value,
    placeholder = "No disponible",
    isEditing = false,
    onChange,
    onStartEdit,
    onDelete,
    name
}: ContactFieldCardProps) {
    return (
        <div className="flex items-center gap-2 p-2 bg-neutral-900/50 rounded-2xl border border-neutral-800/50 hover:bg-neutral-800/50 transition-all group relative pr-16 text-xs">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-neutral-800 text-neutral-400 group-hover:bg-neutral-700/50 group-hover:text-neutral-300 transition-colors">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-medium text-neutral-500 mb-1">
                    {label}
                </p>
                {isEditing ? (
                    <div className="relative">
                        <Input
                            name={name}
                            value={value}
                            onChange={onChange}
                            className="h-8 bg-neutral-800 border-neutral-700 text-sm focus:ring-neutral-500/50 pr-2"
                            placeholder={placeholder}
                            autoFocus
                        />
                    </div>
                ) : (
                    <p className={cn("text-xs font-medium truncate", value ? "text-neutral-200" : "text-neutral-600 italic")}>
                        {value || placeholder}
                    </p>
                )}
            </div>

            {!isEditing && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onStartEdit && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
                            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200 transition-colors"
                            title="Editar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                            </svg>
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                            title="Eliminar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
