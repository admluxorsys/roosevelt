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

export const INITIAL_LIFE_NODES = [
    { id: "body", href: "/suite/life/body", iconName: "Activity", title: "The Body", subtitle: "Physical", color: "rose" },
    { id: "mind", href: "/suite/life/mind", iconName: "Brain", title: "The Mind", subtitle: "Emotional", color: "indigo" },
    { id: "reality", href: "/suite/life/reality", iconName: "Eye", title: "The Reality", subtitle: "Purpose", color: "amber" },
    { id: "journal", href: "/suite/life/journal", iconName: "BookOpen", title: "Journal", subtitle: "History", color: "slate" },
    { id: "biography", href: "/suite/life/biography", iconName: "UserCog", title: "Biography", subtitle: "Identity", color: "blue" },
    { id: "notes", href: "/suite/life/notes", iconName: "ScrollText", title: "Notes", subtitle: "Drafts", color: "yellow" },
    { id: "moments", href: "/suite/life/moments", iconName: "Camera", title: "Moments", subtitle: "Photos", color: "pink" },
    { id: "wallet", href: "/suite/life/wallet", iconName: "Wallet", title: "Wallet", subtitle: "Assets", color: "emerald" },
    { id: "social", href: "/suite/life/social", iconName: "Globe", title: "Social", subtitle: "Connections", color: "cyan" },
    { id: "professional", href: "/suite/life/professional", iconName: "Briefcase", title: "Professional", subtitle: "Career", color: "purple" }
];

export const ICON_MAP: Record<string, any> = {
    Activity, Brain, Eye, BookOpen, UserCog, ScrollText, Camera, Wallet,
    Globe, Briefcase, Plus, Flame, Music, Film, Plane, Gamepad2
};

export const AVAILABLE_COLORS = [
    "rose", "indigo", "amber", "slate", "blue", "yellow", "pink", "emerald", "cyan", "purple"
];
