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
    { href: "/nucleo/udreamms/board", icon: Landmark, title: "Board", subtitle: "Directors", color: "slate" },
    { href: "/nucleo/udreamms/ceo", icon: Briefcase, title: "CEO", subtitle: "Executive", color: "blue" },
    { href: "/nucleo/udreamms/coo", icon: Globe, title: "COO", subtitle: "Operations", color: "emerald" },
    { href: "/nucleo/udreamms/cfo", icon: LineChart, title: "CFO", subtitle: "Finance", color: "amber" },
    { href: "/nucleo/udreamms/clo", icon: Scale, title: "CLO", subtitle: "Legal", color: "slate" },
    { href: "/nucleo/udreamms/cto", icon: Cpu, title: "CTO", subtitle: "Technology", color: "purple" },
    { href: "/nucleo/udreamms/cpo", icon: Lightbulb, title: "CPO", subtitle: "Product", color: "indigo" },
    { href: "/nucleo/udreamms/cmo", icon: Users, title: "CMO", subtitle: "Marketing", color: "pink" },
    { href: "/nucleo/udreamms/chro", icon: Heart, title: "CHRO", subtitle: "Resources", color: "rose" },
    { href: "/nucleo/udreamms/cso", icon: Zap, title: "CSO", subtitle: "Strategy", color: "yellow" },
    { href: "/nucleo/udreamms/ciso", icon: ShieldCheck, title: "CISO", subtitle: "Security", color: "cyan" },
    { href: "/nucleo/udreamms/cdo", icon: Database, title: "CDO", subtitle: "Data", color: "orange" },
];

