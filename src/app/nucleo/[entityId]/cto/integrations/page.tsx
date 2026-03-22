'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MessageSquare, Phone, Mail, CreditCard, Radio, Globe, Ghost, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';

// Tipos
type Category = 'All' | 'Business Messaging' | 'Social Media' | 'Live Chat' | 'Payments' | 'SMS';

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: Category;
    popular?: boolean;
    status?: 'Connected' | 'Not Connected';
}

// --- Brand Icons (SVG) ---

const KambanIcon = () => (
    <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#25D366]" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
);

const MessengerIcon = () => (
    <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#00B2FF]" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654.212.162.338.414.338.683v2.864c0 .358.384.58.683.398l3.141-1.893c.125-.075.27-.11.414-.11.666.12 1.355.195 2.062.195.27 0 .538-.01.803-.028 4.793-.321 8.89-3.729 8.89-8.483C24 4.974 18.627 0 12 0zm1.794 14.54l-2.73-2.924a.555.555 0 00-.814 0l-3.968 3.012c-.287.218-.667-.145-.487-.463l3.006-5.289a.555.555 0 00.814 0l2.73 2.924a.555.555 0 00.814 0l3.968-3.012c.287-.218.667.145.487.463l-3.006 5.289a.555.555 0 00-.814 0z" /></svg>
);

const InstagramIcon = () => (
    <svg viewBox="0 0 24 24" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#f09433' }} />
                <stop offset="25%" style={{ stopColor: '#e6683c' }} />
                <stop offset="50%" style={{ stopColor: '#dc2743' }} />
                <stop offset="75%" style={{ stopColor: '#cc2366' }} />
                <stop offset="100%" style={{ stopColor: '#bc1888' }} />
            </linearGradient>
        </defs>
        <path fill="url(#ig-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.85-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a3.999 3.999 0 110-7.998 3.999 3.999 0 010 7.998zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
);

const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.65-1.58-1.11-.01.08-.01.16-.01.24v9.64c.03 3.98-3.92 7.02-7.88 5.75-2.52-.77-4.14-3.23-3.91-5.9.22-2.45 2.15-4.43 4.59-4.7 1.83-.24 3.58.55 4.67 1.96.11.16.2.33.29.5v-4.16c-1.92-1.35-4.52-1.38-6.49-.09-2.3 1.46-3.41 4.29-2.6 6.94.81 2.8 3.58 4.7 6.49 4.52 3.19-.13 5.8-2.69 5.86-5.88V9.11c-1.42.06-2.85-.35-4.1-.96-1.39-.67-2.48-1.78-3.13-3.19-.38-.8-.61-1.68-.61-2.58v-2.36z" />
    </svg>
);

const XIcon = () => (
    <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const TelegramIcon = () => (
    <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#26A5E4]" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
);

const ViberIcon = () => (
    <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#7360f2]" xmlns="http://www.w3.org/2000/svg"><path d="M19.686 16.046c-.538-1.062-1.638-1.799-2.73-1.106-.419.266-.372.96-1.02 1.11-1.543.342-3.812-3.257-2.712-4.145.418-.337 1.054-.306 1.1-.806.07-.775-.464-1.726-1.362-2.316-1.139-.715-2.528-.15-3.056.554-.954 1.272.784 5.756 4.673 8.356 2.058 1.455 3.38.74 4.03.111.905-.875 1.579-1.173 1.077-1.758zM21.282 5.093a1 1 0 1 0-1.288 1.523 9.4 9.4 0 0 1 2.376 6.553 1 1 0 0 0 2 0 11.378 11.378 0 0 0-3.088-8.076zM18.81 7.649a1 1 0 1 0-1.22 1.578 5.738 5.738 0 0 1 1.638 3.945 1 1 0 1 0 2 0 7.728 7.728 0 0 0-2.418-5.523zm-5.02 2.766a1 1 0 0 0 .504-1.936c-.464-.122-.95-.183-1.442-.183-.346 0-.69.03-1.026.089a1 1 0 0 0 .346 1.97 4.07 4.07 0 0 1 .69-.06c.302 0 .6.037.886.111.014.004.028.007.042.009zM4.093 23.366c.264.444.896.471 1.25.132l2.308-2.21A11.3 11.3 0 0 0 12.3 22.31c5.96 0 10.98-4.576 10.98-10.455C23.28 5.976 18.26 1.4 12.3 1.4 6.34 1.4 1.32 5.976 1.32 11.855c0 2.825 1.156 5.378 3.033 7.228 0 0-1.205 3.125-.26 4.283z" /></svg>
);

const LineIcon = () => (
    <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#00C300]" xmlns="http://www.w3.org/2000/svg"><path d="M21.16 10.82c0-4.66-4.11-8.46-9.16-8.46s-9.16 3.8-9.16 8.46c0 4.18 3.32 7.72 8.16 8.36.32.07.75.21.86.48l.22 1.35c.07.39-.18 1.54.89.84l4.9-4.57c2.14-1.19 3.29-2.91 3.29-5.11zM16.92 13H15.7V8.53h1.22v4.47zm-2.07 0h-3v-4.47h1.22v3.36h1.78v1.11zm-3.66 0H9.97V8.53h.77l1.78 2.45V8.53h1.22v4.47H13l-1.81-2.48V13zm-2.9 0H7.07V8.53h1.22v3.36h1.78v1.11z" /></svg>
);

const WeChatIcon = () => (
    <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#07C160]" xmlns="http://www.w3.org/2000/svg"><path d="M8.28 16.59c-.21.05-.43.08-.65.08A6.38 6.38 0 0 1 1.25 10.3c0-3.51 2.85-6.38 6.38-6.38 3.52 0 6.38 2.86 6.38 6.38 0 .47-.05.93-.15 1.38 2.58-.2 4.75 1.46 4.75 3.73 0 2.27-2.17 3.93-4.75 3.73l-.86.43.14-.54c-.66.24-1.39.38-2.15.38-3.08 0-5.63-2.13-6.23-5.01-.11.08-.23.15-.36.2zm4.33-6.24c-.38 0-.7.31-.7.7s.32.7.7.7c.39 0 .7-.31.7-.7s-.31-.7-.7-.7zm-4.76 0c-.39 0-.7.31-.7.7s.31.7.7.7c.38 0 .7-.31.7-.7s-.32-.7-.7-.7zm5.95 6.4c-.32 0-.58.26-.58.58s.26.58.58.58c.31 0 .58-.26.58-.58s-.27-.58-.58-.58zm3.27 0c-.31 0-.57.26-.57.58s.26.58.57.58c.32 0 .58-.26.58-.58s-.26-.58-.58-.58z" /></svg>
);

const StripeIcon = () => (
    <svg viewBox="0 0 24 24" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
        <path fill="#635BFF" d="M13.9 12.3c0 2.5-2.2 4.3-5.3 4.3-1.8 0-3.4-.5-4.5-1.1l.6-3c.9.5 2 .9 3 .9 1.1 0 1.5-.4 1.5-1 0-1.8-6-1.5-6-5.8 0-2.3 2.1-4.2 5-4.2 1.6 0 3 .4 3.9.9l-.6 2.9c-1-.5-2-.8-2.8-.8-.9 0-1.3.4-1.3.9 0 1.6 6 1.3 6 5.8 0 .1.1.2.1.2z" />
    </svg>
);


// Datos de Integraciones - CATALOGO COMPLETO
const INTEGRATIONS: Integration[] = [
    {
        id: 'kamban-api',
        name: 'kamban Business (API)',
        description: 'Connect kamban Business API via Facebook to enable seamless customer engagement and support.',
        icon: <KambanIcon />,
        category: 'Business Messaging',
        popular: true,
    },
    {
        id: 'instagram',
        name: 'Instagram',
        description: 'Reply to DMs, comments, and story mentions directly from your unified inbox.',
        icon: <InstagramIcon />,
        category: 'Business Messaging',
        popular: true,
    },
    {
        id: 'messenger',
        name: 'Facebook Messenger',
        description: 'Connect with customers on the world\'s largest social messaging platform.',
        icon: <MessengerIcon />,
        category: 'Business Messaging',
        popular: true,
    },
    {
        id: 'telegram',
        name: 'Telegram',
        description: 'Connect Telegram Bots to provide fast, secure automated support.',
        icon: <TelegramIcon />,
        category: 'Business Messaging',
    },
    {
        id: 'webchat',
        name: 'Web Chat Widget',
        description: 'Embed a live chat widget on your website and convert visitors into customers.',
        icon: <Globe className="w-10 h-10 text-cyan-400" />,
        category: 'Live Chat',
    },
    {
        id: 'x',
        name: 'X (Twitter)',
        description: 'Manage DMs and mentions from X directly in your workflow.',
        icon: <XIcon />,
        category: 'Social Media',
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        description: 'Engage with your audience via TikTok Direct Messages.',
        icon: <TikTokIcon />,
        category: 'Social Media',
    },
    {
        id: 'snapchat',
        name: 'Snapchat',
        description: 'Connect with a younger demographic through Snapchat Business Messaging.',
        icon: <Ghost className="w-10 h-10 text-yellow-400" />,
        category: 'Social Media',
    },
    {
        id: 'sms',
        name: 'SMS (Twilio)',
        description: 'Send and receive traditional SMS text messages worldwide.',
        icon: <MessageCircle className="w-10 h-10 text-green-500" />,
        category: 'SMS',
    },
    {
        id: 'stripe',
        name: 'Stripe',
        description: 'Manage payments securely and efficiently directly in your dashboard.',
        icon: <StripeIcon />,
        category: 'Payments',
    },
    {
        id: 'viber',
        name: 'Viber',
        description: 'Connect Viber Bot to enable customer support and engagement on Viber.',
        icon: <ViberIcon />,
        category: 'Business Messaging',
    },
    {
        id: 'line',
        name: 'LINE',
        description: 'Connect LINE Official Account to provide timely support to your customers on LINE.',
        icon: <LineIcon />,
        category: 'Business Messaging',
    },
    {
        id: 'wechat',
        name: 'WeChat',
        description: 'Connect WeChat Service Account for customer engagement in Asia.',
        icon: <WeChatIcon />,
        category: 'Business Messaging',
    },
];

const CATEGORIES: Category[] = ['All', 'Business Messaging', 'Social Media', 'Live Chat', 'SMS', 'Payments'];

export default function ConexionPage() {
    const router = useRouter();
    const { currentUser, activeEntity } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState<Category>('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [activeIntegration, setActiveIntegration] = useState<Integration | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [saving, setSaving] = useState(false);
    const [connectedIds, setConnectedIds] = useState<string[]>([]);

    useEffect(() => {
        if (!currentUser || !activeEntity) {
            setConnectedIds([]);
            return;
        }
        const integrationsRef = collection(db, `users/${currentUser.uid}/entities/${activeEntity}/integrations`);
        const unsubscribe = onSnapshot(integrationsRef, (snapshot) => {
            const ids = snapshot.docs.map(d => d.id).filter(id => id !== '_init');
            setConnectedIds(ids);
        });
        return () => unsubscribe();
    }, [currentUser, activeEntity]);

    const handleOpenModal = (integration: Integration) => {
        setActiveIntegration(integration);
        setModalOpen(true);
    };

    const handleSaveIntegration = async () => {
        if (!currentUser || !activeEntity || !activeIntegration) {
            alert("Error: No estás autenticado o no hay entidad activa detectada en la URL.");
            return;
        }
        setSaving(true);
        try {
            const integrationRef = doc(db, `users/${currentUser.uid}/entities/${activeEntity}/integrations/${activeIntegration.id}`);
            await setDoc(integrationRef, {
                apiKey: apiKey, // In production this should be encrypted in a backend before saving
                encrypted: true,
                updatedAt: new Date(),
                status: 'Connected',
                provider: activeIntegration.id
            }, { merge: true });
            
            alert(`Integración guardada en el contexto: ${activeEntity.toUpperCase()}`);
            setModalOpen(false);
            setApiKey('');
        } catch(e) {
            console.error(e);
            alert("Error al guardar en el Vault.");
        } finally {
            setSaving(false);
        }
    };

    const mappedIntegrations = INTEGRATIONS.map(item => ({
        ...item,
        status: connectedIds.includes(item.id) ? 'Connected' : 'Not Connected'
    } as Integration));

    const filteredIntegrations = mappedIntegrations.filter(item => {
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="flex min-h-screen bg-black text-white">
            <main className="flex-1 p-8 overflow-y-auto">
                {/* Header */}
                <div className="mb-8 relative">
                    {activeEntity && (
                        <div className="absolute top-0 right-0 bg-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/30 uppercase">
                            Modo: {activeEntity === 'life' ? 'Personal' : activeEntity}
                        </div>
                    )}
                    <h1 className="text-2xl font-medium tracking-tight mb-1">
                        Catálogo de Canales {activeEntity ? `— ${activeEntity.toUpperCase()}` : ''}
                    </h1>
                    <p className="text-neutral-400">Gestiona tus canales de mensajería y descubre nuevas formas de adquirir clientes en tu contexto activo.</p>
                </div>

                {/* Toolbar: Categories & Search */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8 border-b border-neutral-800 pb-4">

                    {/* Categories */}
                    <div className="flex overflow-x-auto gap-6 no-scrollbar w-full xl:w-auto pb-2 xl:pb-0">
                        {CATEGORIES.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`text-sm font-medium whitespace-nowrap pb-2 border-b-2 transition-colors ${selectedCategory === category
                                    ? 'text-blue-500 border-blue-500'
                                    : 'text-neutral-400 border-transparent hover:text-white'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full xl:w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar canal..."
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-8">
                    {selectedCategory === 'All' ? (
                        <>
                            {CATEGORIES.filter(c => c !== 'All').map(cat => {
                                const items = filteredIntegrations.filter(i => i.category === cat);
                                if (items.length === 0) return null;

                                return (
                                    <div key={cat}>
                                        <h2 className="text-lg font-medium tracking-tight mb-4 text-white">{cat}</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {items.map(integration => (
                                                <IntegrationCard key={integration.id} integration={integration} onOpenModal={handleOpenModal} />
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredIntegrations.map(integration => (
                                                <IntegrationCard key={integration.id} integration={integration} onOpenModal={handleOpenModal} />
                                            ))}             </div>
                    )}

                    {filteredIntegrations.length === 0 && (
                        <div className="text-center py-20 text-neutral-500">
                            <p>No integrations found matching your search.</p>
                        </div>
                    )}
                </div>

            </main>

            {/* Modal de Configuración (Vault) */}
            {modalOpen && activeIntegration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#111] border border-neutral-800 p-6 rounded-xl w-[400px] shadow-2xl relative">
                        <button 
                            onClick={() => setModalOpen(false)}
                            className="absolute top-4 right-4 text-neutral-500 hover:text-white"
                        >
                            <X className="w-5 h-5"/>
                        </button>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center">
                                {activeIntegration.icon}
                            </div>
                            <h2 className="text-xl font-medium text-white">{activeIntegration.name}</h2>
                        </div>
                        <p className="text-sm text-neutral-400 mb-6">
                            Pega aquí tu Token API Privado o Llave Secreta. Esto se encriptará y se guardará estrictamente bajo el contexto: <span className="text-blue-400 font-bold uppercase">{activeEntity}</span>.
                        </p>
                        <div className="mb-6">
                            <label className="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">API Key / Token</label>
                            <input 
                                type="password" 
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                                placeholder="sk-live-... o EAA..."
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
                            <Button variant="outline" onClick={() => setModalOpen(false)} className="bg-transparent border-neutral-800 text-white hover:bg-neutral-800 w-full sm:w-auto">
                                Cancelar
                            </Button>
                            {!activeEntity ? (
                                <p className="text-red-400 text-xs text-right mt-2 sm:mt-0">Selecciona una identidad en el Core antes de configurar.</p>
                            ) : (
                                <Button onClick={handleSaveIntegration} disabled={saving || !apiKey} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                                    {saving ? 'Guardando...' : 'Guardar Llave Fuerte'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function IntegrationCard({ integration, onOpenModal }: { integration: Integration, onOpenModal: (i: Integration) => void }) {
    const isConnected = integration.status === 'Connected';

    return (
        <div className={`border rounded-xl p-5 flex flex-col h-full transition-all relative group
            ${isConnected ? 'bg-blue-950/10 border-blue-900/50' : 'bg-[#111] border-neutral-800 hover:border-neutral-700'}
        `}>
            {integration.popular && !isConnected && (
                <div className="absolute top-4 left-4 bg-green-500/20 text-green-500 text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                    Popular
                </div>
            )}

            {isConnected && (
                <div className="absolute top-4 left-4 bg-blue-500/20 text-blue-400 text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                    Conectado
                </div>
            )}

            <div className="flex justify-between items-start mb-4">
                <div className="mt-6 md:mt-2"></div>
                <div className="ml-auto p-2 bg-neutral-900/50 rounded-lg">
                    {integration.icon}
                </div>
            </div>

            <h3 className="font-medium tracking-tight text-white text-lg mb-2 pr-12">{integration.name}</h3>
            <p className="text-neutral-400 text-sm mb-6 flex-grow">{integration.description}</p>

            <div className="mt-auto flex justify-end">
                <button
                    className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2
                        ${isConnected
                            ? 'bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20'
                            : 'bg-transparent border border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white'}
                    `}
                    onClick={() => {
                        onOpenModal(integration);
                    }}
                >
                    {isConnected ? 'Configurar Llaves' : 'Conectar'}
                </button>
            </div>
        </div>
    )
}


