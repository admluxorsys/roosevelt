import {
    BarChart,
    Users,
    DollarSign,
    Target,
    MessageSquare,
    Cog,
    Contact,
    Mic,
    Video,
    Send,
    Layout,
    Zap,
    Briefcase,
    FileText,
    Shield,
    CreditCard,
    Landmark,
    Gavel,
    Lightbulb,
    Search,
    Lock,
    Server,
    Database,
    PenTool,
    Globe,
    Truck,
    Building,
    FileCheck,
    TrendingUp,
    UserPlus,
    GraduationCap,
    Heart,
    PieChart,
    Calendar,
    Award,
    Rocket,
    Activity,
    LifeBuoy,
    Share2,
    Settings,
    Layers,
    Coffee,
    Cloud,
    Cpu,
    BookOpen,
    Code2,
    Brain
} from 'lucide-react';

// --- GOVERNANCE ---
export const BOARD_MENU = [
    { href: "/suite/board/governance", icon: Gavel, label: "Protocol Governance" },
    { href: "/suite/board/treasury", icon: Landmark, label: "MultiSig Treasury" },
    { href: "/suite/board/voting", icon: FileCheck, label: "Shareholder Voting" },
    { href: "/suite/board/audits", icon: Search, label: "Audits & Risk" },
    { href: "/suite/board/compensation", icon: Award, label: "Executive Compensation" },
    { href: "/suite/board/subsidiaries", icon: Building, label: "Subsidiary Management" },
    { href: "/suite/board/ethics", icon: Shield, label: "Ethics Committee" },
];

export const CEO_MENU = [
    { href: "/suite/ceo/kpis", icon: BarChart, label: "Global KPIs" },
    { href: "/suite/ceo/strategy", icon: Target, label: "Vision & Strategy" },
    { href: "/suite/ceo/investor-relations", icon: TrendingUp, label: "Investor Relations" },
    { href: "/suite/ceo/ma", icon: Rocket, label: "Mergers & Acquisitions" },
    { href: "/suite/ceo/public-relations", icon: Share2, label: "Public Relations" },
    { href: "/suite/ceo/esg", icon: Heart, label: "ESG Reporting" },
    { href: "/suite/ceo/executive-dashboard", icon: Layout, label: "Executive Dashboard" },
    { href: "/suite/ceo/board-liaison", icon: Gavel, label: "Board Liaison" },
    { href: "/suite/ceo/crisis-management", icon: LifeBuoy, label: "Crisis Response" },
    { href: "/suite/ceo/culture-steering", icon: Coffee, label: "Culture Steering" },
];

// --- TECHNOLOGY & PRODUCT ---
export const CTO_MENU = [
    { href: "/suite/cto/automation", icon: Cog, label: "Automation" },
    { href: "/suite/cto/voice-center", icon: Mic, label: "Voice AI" },
    { href: "/suite/cto/meet-agents", icon: Video, label: "Meet Agents" },
    { href: "/suite/cto/web-builder", icon: Layout, label: "Web Builder" },
    { href: "/suite/cto/orchestrator", icon: Zap, label: "Orchestrator" },
    { href: "/suite/cto/integrations", icon: Zap, label: "Integrations" },
    { href: "/suite/cto/smart-contracts", icon: FileText, label: "Smart Contracts" },
    { href: "/suite/cto/security", icon: Lock, label: "Cybersecurity (CISO)" },
    { href: "/suite/cto/devops", icon: Server, label: "DevOps & Infra" },
    { href: "/suite/cto/data", icon: Database, label: "Data Warehouse" },
    { href: "/suite/cto/cloud", icon: Cloud, label: "Cloud Architecture" },
    { href: "/suite/cto/quantum", icon: Cpu, label: "Quantum Research" },
    { href: "/suite/cto/api", icon: Code2, label: "API Gateway" },
];

export const CPO_MENU = [
    { href: "/suite/cpo/roadmap", icon: Target, label: "Product Roadmap" },
    { href: "/suite/cpo/requests", icon: MessageSquare, label: "Feature Requests" },
    { href: "/suite/cpo/design", icon: PenTool, label: "UX/UI Design System" },
    { href: "/suite/cpo/research", icon: Search, label: "User Research" },
    { href: "/suite/cpo/plm", icon: Layers, label: "Product Lifecycle" },
    { href: "/suite/cpo/beta", icon: Activity, label: "Beta Testing" },
    { href: "/suite/cpo/patents", icon: Shield, label: "Product Patents" },
    { href: "/suite/cpo/analytics", icon: PieChart, label: "Usage Analytics" },
    { href: "/suite/cpo/competitive", icon: Search, label: "Market Benchmarking" },
    { href: "/suite/cpo/quality", icon: FileCheck, label: "Product QA" },
];

// --- GROWTH & REVENUE ---
export const CMO_MENU = [
    { href: "/suite/cmo/analytics", icon: BarChart, label: "Sales Analytics" },
    { href: "/suite/cmo/crm", icon: Contact, label: "Contacts (CRM)" },
    { href: "/suite/cmo/campaigns", icon: Send, label: "Campaigns" },
    { href: "/suite/cmo/goals", icon: Target, label: "Sales Goals" },
    { href: "/suite/cmo/content", icon: Lightbulb, label: "Content Studio" },
    { href: "/suite/cmo/social", icon: Globe, label: "Social Media Manager" },
    { href: "/suite/cmo/affiliates", icon: Users, label: "Affiliate Program" },
    { href: "/suite/cmo/brand", icon: Award, label: "Brand Identity" },
    { href: "/suite/cmo/events", icon: Calendar, label: "Events & PR" },
    { href: "/suite/cmo/seo", icon: Search, label: "SEO & SEM" },
    { href: "/suite/cmo/loyalty", icon: Heart, label: "Loyalty Programs" },
    { href: "/suite/cmo/market-share", icon: PieChart, label: "Market Share" },
];

// --- OPERATIONS & PEOPLE ---
export const COO_MENU = [
    { href: "/suite/coo/omnichannel", icon: MessageSquare, label: "Omnichannel Inbox" },
    { href: "/suite/coo/kamban", icon: Contact, label: "Kamban Leads" },
    { href: "/suite/coo/visas", icon: Briefcase, label: "Visas & Immigration" },
    { href: "/suite/coo/cx", icon: Users, label: "Customer Experience" },
    { href: "/suite/coo/projects", icon: Layout, label: "Project Management" },
    { href: "/suite/coo/supply", icon: Truck, label: "Supply Chain" },
    { href: "/suite/coo/facilities", icon: Building, label: "Facilities" },
    { href: "/suite/coo/logistics", icon: Truck, label: "Logistics Hub" },
    { href: "/suite/coo/quality", icon: Shield, label: "Quality Control" },
    { href: "/suite/coo/procurement", icon: CreditCard, label: "Procurement" },
];

export const CHRO_MENU = [
    { href: "/suite/chro/recruitment", icon: UserPlus, label: "Recruitment" },
    { href: "/suite/chro/onboarding", icon: GraduationCap, label: "Onboarding" },
    { href: "/suite/chro/payroll", icon: DollarSign, label: "Payroll & Benefits" },
    { href: "/suite/chro/culture", icon: Heart, label: "Culture & Wellness" },
    { href: "/suite/chro/training", icon: BookOpen, label: "Training & Dev" },
    { href: "/suite/chro/performance", icon: TrendingUp, label: "Performance Reviews" },
    { href: "/suite/chro/workforce-planning", icon: Users, label: "Workforce Planning" },
    { href: "/suite/chro/hris", icon: Database, label: "HRIS System" },
    { href: "/suite/chro/surveys", icon: MessageSquare, label: "Employee Feedback" },
    { href: "/suite/chro/mediation", icon: Gavel, label: "Employee Mediation" },
];

// --- FINANCE & LEGAL ---
export const CFO_MENU = [
    { href: "/suite/cfo/revenue", icon: DollarSign, label: "Revenue & Treasury" },
    { href: "/suite/cfo/billing", icon: FileText, label: "Invoices & Billing" },
    { href: "/suite/cfo/tax", icon: Shield, label: "Tax Vault" },
    { href: "/suite/cfo/fundraising", icon: TrendingUp, label: "Fundraising" },
    { href: "/suite/cfo/budgeting", icon: PieChart, label: "Budgeting" },
    { href: "/suite/cfo/cash-flow", icon: Activity, label: "Cash Flow" },
    { href: "/suite/cfo/audit-prep", icon: FileCheck, label: "Audit Readiness" },
    { href: "/suite/cfo/risk-modeling", icon: Target, label: "Financial Risk" },
    { href: "/suite/cfo/investments", icon: Landmark, label: "Capital Investments" },
];

export const CLO_MENU = [
    { href: "/suite/clo/contracts", icon: FileText, label: "Legal Contracts" },
    { href: "/suite/clo/compliance", icon: Shield, label: "Compliance & Risk" },
    { href: "/suite/clo/ip", icon: Lock, label: "IP & Patents" },
    { href: "/suite/clo/disputes", icon: Gavel, label: "Dispute Resolution" },
    { href: "/suite/clo/regulatory", icon: Landmark, label: "Regulatory Affairs" },
];

export const CSO_MENU = [
    { href: "/suite/cso/growth", icon: TrendingUp, label: "Growth Initiatives" },
    { href: "/suite/cso/intelligence", icon: Target, label: "Market Intelligence" },
    { href: "/suite/cso/roadmap", icon: Zap, label: "Strategic Roadmap" },
    { href: "/suite/cso/partnerships", icon: Users, label: "Corporate Partnerships" },
    { href: "/suite/cso/expansion", icon: Globe, label: "Market Expansion" },
];

export const CDO_MENU = [
    { href: "/suite/cdo/ai-engine", icon: Brain, label: "AI Engine" },
    { href: "/suite/cdo/lake", icon: Database, label: "Data Lake" },
    { href: "/suite/cdo/neural", icon: Cpu, label: "Neural Pipeline" },
    { href: "/suite/cdo/governance", icon: Shield, label: "Data Governance" },
    { href: "/suite/cdo/viz", icon: PieChart, label: "Data Visualization" },
    { href: "/suite/cdo/mining", icon: Search, label: "Data Mining" },
    { href: "/suite/cdo/bi", icon: BarChart, label: "Business Intelligence" },
    { href: "/suite/cdo/privacy", icon: Lock, label: "Data Privacy" },
];

export const CISO_MENU = [
    { href: "/suite/ciso/map", icon: Shield, label: "Cyber Threat Map" },
    { href: "/suite/ciso/identity", icon: Lock, label: "Identity & Access" },
    { href: "/suite/ciso/audit", icon: Shield, label: "Risk Audit" },
    { href: "/suite/ciso/incident", icon: Activity, label: "Incident Response" },
    { href: "/suite/ciso/awareness", icon: BookOpen, label: "Security Awareness" },
    { href: "/suite/ciso/forensics", icon: Search, label: "Digital Forensics" },
    { href: "/suite/ciso/compliance", icon: FileCheck, label: "Security Compliance" },
    { href: "/suite/ciso/endpoint", icon: Server, label: "Endpoint Protection" },
];
