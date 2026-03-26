import {
    Activity,
    Brain,
    Eye,
    BookOpen,
    UserCog,
    ScrollText,
    Camera,
    Wallet,
    Globe,
    Briefcase,
    Plus,
    Flame,
    Music,
    Film,
    Plane,
    Gamepad2
} from 'lucide-react';

export const getInitialPersonaNodes = (entityId: string) => [
    { id: "body", href: `/nucleo/${entityId}/body`, iconName: "Activity", title: "The Body", subtitle: "Physical", color: "rose" },
    { id: "mind", href: `/nucleo/${entityId}/mind`, iconName: "Brain", title: "The Mind", subtitle: "Emotional", color: "indigo" },
    { id: "reality", href: `/nucleo/${entityId}/reality`, iconName: "Eye", title: "The Reality", subtitle: "Purpose", color: "amber" },
    { id: "journal", href: `/nucleo/${entityId}/journal`, iconName: "BookOpen", title: "Journal", subtitle: "History", color: "slate" },
    { id: "biography", href: `/nucleo/${entityId}/biography`, iconName: "UserCog", title: "Biography", subtitle: "Identity", color: "blue" },
    { id: "notes", href: `/nucleo/${entityId}/notes`, iconName: "ScrollText", title: "Notes", subtitle: "Drafts", color: "yellow" },
    { id: "moments", href: `/nucleo/${entityId}/moments`, iconName: "Camera", title: "Moments", subtitle: "Photos", color: "pink" },
    { id: "wallet", href: `/nucleo/${entityId}/wallet`, iconName: "Wallet", title: "Wallet", subtitle: "Assets", color: "emerald" },
    { id: "social", href: `/nucleo/${entityId}/social`, iconName: "Globe", title: "Social", subtitle: "Connections", color: "cyan" },
    { id: "professional", href: `/nucleo/${entityId}/professional`, iconName: "Briefcase", title: "Professional", subtitle: "Career", color: "purple" }
];

export const ICON_MAP: Record<string, any> = {
    Activity, Brain, Eye, BookOpen, UserCog, ScrollText, Camera, Wallet,
    Globe, Briefcase, Plus, Flame, Music, Film, Plane, Gamepad2
};

export const AVAILABLE_COLORS = [
    "rose", "indigo", "amber", "slate", "blue", "yellow", "pink", "emerald", "cyan", "purple"
];
