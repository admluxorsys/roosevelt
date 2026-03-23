import {
    Briefcase,
    Cpu,
    Globe,
    LineChart,
    Scale,
    Users,
    Landmark,
    Lightbulb,
    Heart,
    Zap,
    ShieldCheck,
    Database
} from 'lucide-react';

export const SUITE_NODES = [
    { href: "/nucleo/roosevelt/board", icon: Landmark, title: "Board", subtitle: "Directors", color: "slate" },
    { href: "/nucleo/roosevelt/ceo", icon: Briefcase, title: "CEO", subtitle: "Executive", color: "blue" },
    { href: "/nucleo/roosevelt/coo", icon: Globe, title: "COO", subtitle: "Operations", color: "emerald" },
    { href: "/nucleo/roosevelt/cfo", icon: LineChart, title: "CFO", subtitle: "Finance", color: "amber" },
    { href: "/nucleo/roosevelt/clo", icon: Scale, title: "CLO", subtitle: "Legal", color: "slate" },
    { href: "/nucleo/roosevelt/cto", icon: Cpu, title: "CTO", subtitle: "Technology", color: "purple" },
    { href: "/nucleo/roosevelt/cpo", icon: Lightbulb, title: "CPO", subtitle: "Product", color: "indigo" },
    { href: "/nucleo/roosevelt/cmo", icon: Users, title: "CMO", subtitle: "Marketing", color: "pink" },
    { href: "/nucleo/roosevelt/chro", icon: Heart, title: "CHRO", subtitle: "Resources", color: "rose" },
    { href: "/nucleo/roosevelt/cso", icon: Zap, title: "CSO", subtitle: "Strategy", color: "yellow" },
    { href: "/nucleo/roosevelt/ciso", icon: ShieldCheck, title: "CISO", subtitle: "Security", color: "cyan" },
    { href: "/nucleo/roosevelt/cdo", icon: Database, title: "CDO", subtitle: "Data", color: "orange" },
];

