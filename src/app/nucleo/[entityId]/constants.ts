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
    { href: "/nucleo/{entity}/board", icon: Landmark, title: "Board", subtitle: "Directors", color: "slate" },
    { href: "/nucleo/{entity}/ceo", icon: Briefcase, title: "CEO", subtitle: "Executive", color: "blue" },
    { href: "/nucleo/{entity}/coo", icon: Globe, title: "COO", subtitle: "Operations", color: "emerald" },
    { href: "/nucleo/{entity}/cfo", icon: LineChart, title: "CFO", subtitle: "Finance", color: "amber" },
    { href: "/nucleo/{entity}/clo", icon: Scale, title: "CLO", subtitle: "Legal", color: "slate" },
    { href: "/nucleo/{entity}/cto", icon: Cpu, title: "CTO", subtitle: "Technology", color: "purple" },
    { href: "/nucleo/{entity}/cpo", icon: Lightbulb, title: "CPO", subtitle: "Product", color: "indigo" },
    { href: "/nucleo/{entity}/cmo", icon: Users, title: "CMO", subtitle: "Marketing", color: "pink" },
    { href: "/nucleo/{entity}/chro", icon: Heart, title: "CHRO", subtitle: "Resources", color: "rose" },
    { href: "/nucleo/{entity}/cso", icon: Zap, title: "CSO", subtitle: "Strategy", color: "yellow" },
    { href: "/nucleo/{entity}/ciso", icon: ShieldCheck, title: "CISO", subtitle: "Security", color: "cyan" },
    { href: "/nucleo/{entity}/cdo", icon: Database, title: "CDO", subtitle: "Data", color: "orange" },
];

