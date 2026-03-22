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
    { href: "/nucleo/{entity}/board/governance", icon: Gavel, label: "Protocol Governance" },
    { href: "/nucleo/{entity}/board/treasury", icon: Landmark, label: "MultiSig Treasury" },
    { href: "/nucleo/{entity}/board/voting", icon: FileCheck, label: "Shareholder Voting" },
    { href: "/nucleo/{entity}/board/audits", icon: Search, label: "Audits & Risk" },
    { href: "/nucleo/{entity}/board/compensation", icon: Award, label: "Executive Compensation" },
    { href: "/nucleo/{entity}/board/subsidiaries", icon: Building, label: "Subsidiary Management" },
    { href: "/nucleo/{entity}/board/ethics", icon: Shield, label: "Ethics Committee" },
];

export const CEO_MENU = [
    { href: "/nucleo/{entity}/ceo/kpis", icon: BarChart, label: "Global KPIs" },
    { href: "/nucleo/{entity}/ceo/strategy", icon: Target, label: "Vision & Strategy" },
    { href: "/nucleo/{entity}/ceo/investor-relations", icon: TrendingUp, label: "Investor Relations" },
    { href: "/nucleo/{entity}/ceo/ma", icon: Rocket, label: "Mergers & Acquisitions" },
    { href: "/nucleo/{entity}/ceo/public-relations", icon: Share2, label: "Public Relations" },
    { href: "/nucleo/{entity}/ceo/esg", icon: Heart, label: "ESG Reporting" },
    { href: "/nucleo/{entity}/ceo/executive-dashboard", icon: Layout, label: "Executive Dashboard" },
    { href: "/nucleo/{entity}/ceo/board-liaison", icon: Gavel, label: "Board Liaison" },
    { href: "/nucleo/{entity}/ceo/crisis-management", icon: LifeBuoy, label: "Crisis Response" },
    { href: "/nucleo/{entity}/ceo/culture-steering", icon: Coffee, label: "Culture Steering" },
];

// --- TECHNOLOGY & PRODUCT ---
export const CTO_MENU = [
    { href: "/nucleo/{entity}/cto/automation", icon: Cog, label: "Automation" },
    { href: "/nucleo/{entity}/cto/voice-center", icon: Mic, label: "Voice AI" },
    { href: "/nucleo/{entity}/cto/meet-agents", icon: Video, label: "Meet Agents" },
    { href: "/nucleo/{entity}/cto/web-builder", icon: Layout, label: "Web Builder" },
    { href: "/nucleo/{entity}/cto/orchestrator", icon: Zap, label: "Orchestrator" },
    { href: "/nucleo/{entity}/cto/integrations", icon: Zap, label: "Integrations" },
    { href: "/nucleo/{entity}/cto/smart-contracts", icon: FileText, label: "Smart Contracts" },
    { href: "/nucleo/{entity}/cto/security", icon: Lock, label: "Cybersecurity (CISO)" },
    { href: "/nucleo/{entity}/cto/devops", icon: Server, label: "DevOps & Infra" },
    { href: "/nucleo/{entity}/cto/data", icon: Database, label: "Data Warehouse" },
    { href: "/nucleo/{entity}/cto/cloud", icon: Cloud, label: "Cloud Architecture" },
    { href: "/nucleo/{entity}/cto/quantum", icon: Cpu, label: "Quantum Research" },
    { href: "/nucleo/{entity}/cto/api", icon: Code2, label: "API Gateway" },
];

export const CPO_MENU = [
    { href: "/nucleo/{entity}/cpo/roadmap", icon: Target, label: "Product Roadmap" },
    { href: "/nucleo/{entity}/cpo/requests", icon: MessageSquare, label: "Feature Requests" },
    { href: "/nucleo/{entity}/cpo/design", icon: PenTool, label: "UX/UI Design System" },
    { href: "/nucleo/{entity}/cpo/research", icon: Search, label: "User Research" },
    { href: "/nucleo/{entity}/cpo/plm", icon: Layers, label: "Product Lifecycle" },
    { href: "/nucleo/{entity}/cpo/beta", icon: Activity, label: "Beta Testing" },
    { href: "/nucleo/{entity}/cpo/patents", icon: Shield, label: "Product Patents" },
    { href: "/nucleo/{entity}/cpo/analytics", icon: PieChart, label: "Usage Analytics" },
    { href: "/nucleo/{entity}/cpo/competitive", icon: Search, label: "Market Benchmarking" },
    { href: "/nucleo/{entity}/cpo/quality", icon: FileCheck, label: "Product QA" },
];

// --- GROWTH & REVENUE ---
export const CMO_MENU = [
    { href: "/nucleo/{entity}/cmo/analytics", icon: BarChart, label: "Sales Analytics" },
    { href: "/nucleo/{entity}/cmo/crm", icon: Contact, label: "Contacts (CRM)" },
    { href: "/nucleo/{entity}/cmo/campaigns", icon: Send, label: "Campaigns" },
    { href: "/nucleo/{entity}/cmo/goals", icon: Target, label: "Sales Goals" },
    { href: "/nucleo/{entity}/cmo/content", icon: Lightbulb, label: "Content Studio" },
    { href: "/nucleo/{entity}/cmo/social", icon: Globe, label: "Social Media Manager" },
    { href: "/nucleo/{entity}/cmo/affiliates", icon: Users, label: "Affiliate Program" },
    { href: "/nucleo/{entity}/cmo/brand", icon: Award, label: "Brand Identity" },
    { href: "/nucleo/{entity}/cmo/events", icon: Calendar, label: "Events & PR" },
    { href: "/nucleo/{entity}/cmo/seo", icon: Search, label: "SEO & SEM" },
    { href: "/nucleo/{entity}/cmo/loyalty", icon: Heart, label: "Loyalty Programs" },
    { href: "/nucleo/{entity}/cmo/market-share", icon: PieChart, label: "Market Share" },
];

// --- OPERATIONS & PEOPLE ---
export const COO_MENU = [
    { href: "/nucleo/{entity}/coo/omnichannel", icon: MessageSquare, label: "Omnichannel Inbox" },
    { href: "/nucleo/{entity}/coo/kamban", icon: Contact, label: "Kamban Leads" },
    { href: "/nucleo/{entity}/coo/visas", icon: Briefcase, label: "Visas & Immigration" },
    { href: "/nucleo/{entity}/coo/cx", icon: Users, label: "Customer Experience" },
    { href: "/nucleo/{entity}/coo/projects", icon: Layout, label: "Project Management" },
    { href: "/nucleo/{entity}/coo/supply", icon: Truck, label: "Supply Chain" },
    { href: "/nucleo/{entity}/coo/facilities", icon: Building, label: "Facilities" },
    { href: "/nucleo/{entity}/coo/logistics", icon: Truck, label: "Logistics Hub" },
    { href: "/nucleo/{entity}/coo/quality", icon: Shield, label: "Quality Control" },
    { href: "/nucleo/{entity}/coo/procurement", icon: CreditCard, label: "Procurement" },
];

export const CHRO_MENU = [
    { href: "/nucleo/{entity}/chro/recruitment", icon: UserPlus, label: "Recruitment" },
    { href: "/nucleo/{entity}/chro/onboarding", icon: GraduationCap, label: "Onboarding" },
    { href: "/nucleo/{entity}/chro/payroll", icon: DollarSign, label: "Payroll & Benefits" },
    { href: "/nucleo/{entity}/chro/culture", icon: Heart, label: "Culture & Wellness" },
    { href: "/nucleo/{entity}/chro/training", icon: BookOpen, label: "Training & Dev" },
    { href: "/nucleo/{entity}/chro/performance", icon: TrendingUp, label: "Performance Reviews" },
    { href: "/nucleo/{entity}/chro/workforce-planning", icon: Users, label: "Workforce Planning" },
    { href: "/nucleo/{entity}/chro/hris", icon: Database, label: "HRIS System" },
    { href: "/nucleo/{entity}/chro/surveys", icon: MessageSquare, label: "Employee Feedback" },
    { href: "/nucleo/{entity}/chro/mediation", icon: Gavel, label: "Employee Mediation" },
];

// --- FINANCE & LEGAL ---
export const CFO_MENU = [
    { href: "/nucleo/{entity}/cfo/revenue", icon: DollarSign, label: "Revenue & Treasury" },
    { href: "/nucleo/{entity}/cfo/billing", icon: FileText, label: "Invoices & Billing" },
    { href: "/nucleo/{entity}/cfo/tax", icon: Shield, label: "Tax Vault" },
    { href: "/nucleo/{entity}/cfo/fundraising", icon: TrendingUp, label: "Fundraising" },
    { href: "/nucleo/{entity}/cfo/budgeting", icon: PieChart, label: "Budgeting" },
    { href: "/nucleo/{entity}/cfo/cash-flow", icon: Activity, label: "Cash Flow" },
    { href: "/nucleo/{entity}/cfo/audit-prep", icon: FileCheck, label: "Audit Readiness" },
    { href: "/nucleo/{entity}/cfo/risk-modeling", icon: Target, label: "Financial Risk" },
    { href: "/nucleo/{entity}/cfo/investments", icon: Landmark, label: "Capital Investments" },
];

export const CLO_MENU = [
    { href: "/nucleo/{entity}/clo/contracts", icon: FileText, label: "Legal Contracts" },
    { href: "/nucleo/{entity}/clo/compliance", icon: Shield, label: "Compliance & Risk" },
    { href: "/nucleo/{entity}/clo/ip", icon: Lock, label: "IP & Patents" },
    { href: "/nucleo/{entity}/clo/disputes", icon: Gavel, label: "Dispute Resolution" },
    { href: "/nucleo/{entity}/clo/regulatory", icon: Landmark, label: "Regulatory Affairs" },
];

export const CSO_MENU = [
    { href: "/nucleo/{entity}/cso/growth", icon: TrendingUp, label: "Growth Initiatives" },
    { href: "/nucleo/{entity}/cso/intelligence", icon: Target, label: "Market Intelligence" },
    { href: "/nucleo/{entity}/cso/roadmap", icon: Zap, label: "Strategic Roadmap" },
    { href: "/nucleo/{entity}/cso/partnerships", icon: Users, label: "Corporate Partnerships" },
    { href: "/nucleo/{entity}/cso/expansion", icon: Globe, label: "Market Expansion" },
];

export const CDO_MENU = [
    { href: "/nucleo/{entity}/cdo/ai-engine", icon: Brain, label: "AI Engine" },
    { href: "/nucleo/{entity}/cdo/lake", icon: Database, label: "Data Lake" },
    { href: "/nucleo/{entity}/cdo/neural", icon: Cpu, label: "Neural Pipeline" },
    { href: "/nucleo/{entity}/cdo/governance", icon: Shield, label: "Data Governance" },
    { href: "/nucleo/{entity}/cdo/viz", icon: PieChart, label: "Data Visualization" },
    { href: "/nucleo/{entity}/cdo/mining", icon: Search, label: "Data Mining" },
    { href: "/nucleo/{entity}/cdo/bi", icon: BarChart, label: "Business Intelligence" },
    { href: "/nucleo/{entity}/cdo/privacy", icon: Lock, label: "Data Privacy" },
];

export const CISO_MENU = [
    { href: "/nucleo/{entity}/ciso/map", icon: Shield, label: "Cyber Threat Map" },
    { href: "/nucleo/{entity}/ciso/identity", icon: Lock, label: "Identity & Access" },
    { href: "/nucleo/{entity}/ciso/audit", icon: Shield, label: "Risk Audit" },
    { href: "/nucleo/{entity}/ciso/incident", icon: Activity, label: "Incident Response" },
    { href: "/nucleo/{entity}/ciso/awareness", icon: BookOpen, label: "Security Awareness" },
    { href: "/nucleo/{entity}/ciso/forensics", icon: Search, label: "Digital Forensics" },
    { href: "/nucleo/{entity}/ciso/compliance", icon: FileCheck, label: "Security Compliance" },
    { href: "/nucleo/{entity}/ciso/endpoint", icon: Server, label: "Endpoint Protection" },
];

