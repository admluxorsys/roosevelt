'use client';

import { useState, useEffect } from 'react';
import { Search, Zap, ArrowRight, Settings2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

import { Category, Integration, INTEGRATIONS, CATEGORIES } from './config';
import { WhatsAppCloudAPIModal } from './components/whatsapp_cloud_api/WhatsAppCloudAPIModal';
import { WhatsAppQRBusinessModal } from './components/whatsapp_qr_business/WhatsAppQRBusinessModal';
import { WhatsAppQRPersonalModal } from './components/whatsapp_qr_personal/WhatsAppQRPersonalModal';

export default function IntegrationsPage() {
    const { currentUser, activeEntity } = useAuth();
    const getTenantPath = () => {
        if (!currentUser?.uid || !activeEntity) return '';
        return `users/${currentUser.uid}/entities/${activeEntity}`;
    };

    const [selectedCategory, setSelectedCategory] = useState<Category>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [connectedIds, setConnectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal Control
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeIntegration, setActiveIntegration] = useState<Integration | null>(null);

    useEffect(() => {
        if (!currentUser || !activeEntity) return;
        
        const integrationsRef = collection(db, `users/${currentUser.uid}/entities/${activeEntity}/integrations`);
        const q = query(integrationsRef);
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ids = snapshot.docs.map(d => d.id).filter(id => id !== '_init');
            setConnectedIds(ids);
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, [currentUser, activeEntity]);

    const handleConnect = async (integration: Integration) => {
        setActiveIntegration(integration);
        setIsModalOpen(true);
    };

    const filteredIntegrations = INTEGRATIONS.filter(item => {
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-black text-white relative flex flex-col no-scrollbar">
            {/* Background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <main className="relative z-10 flex-1 p-6 md:p-12">
                {/* Header Section */}
                <div className="max-w-7xl mx-auto mb-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">
                                <Zap className="w-3 h-3 fill-current" />
                                <span>Master Connect</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extralight tracking-tighter mb-4">
                                Integraciones del <span className="font-medium text-white">CTO</span>
                            </h1>
                            <p className="text-neutral-500 max-w-2xl leading-relaxed">
                                Orquestación centralizada de canales externos. Conecta tus activos digitales para que la inteligencia autónoma de <span className="text-white font-medium">Roosevelt</span> pueda operar por ti.
                            </p>
                        </div>
                        
                        <div className="flex bg-neutral-900/40 backdrop-blur-md border border-white/5 p-1 rounded-full">
                            {CATEGORIES.slice(0, 3).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-6 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                                        selectedCategory === cat ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-white'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 w-4 h-4" />
                        <input 
                            type="text"
                            placeholder="Buscar integración..."
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/50 backdrop-blur-xl transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Grid Section */}
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredIntegrations.map((integration, idx) => (
                            <IntegrationCard 
                                key={integration.id}
                                integration={integration}
                                isConnected={connectedIds.includes(integration.id)}
                                onConnect={() => handleConnect(integration)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </main>

            {/* Modals Dispatcher */}
            <WhatsAppCloudAPIModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                activeIntegration={activeIntegration} 
            />
            <WhatsAppQRBusinessModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                activeIntegration={activeIntegration} 
            />
            <WhatsAppQRPersonalModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                activeIntegration={activeIntegration} 
            />
        </div>
    );
}

function IntegrationCard({ integration, isConnected, onConnect }: { integration: Integration, isConnected: boolean, onConnect: () => void }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative group p-6 rounded-[32px] border transition-all duration-500 flex flex-col h-full bg-[#0a0a0a] ${
                isConnected ? 'border-blue-500/30 ring-1 ring-blue-500/20' : 'border-white/5 hover:border-white/20'
            }`}
        >
            {/* Status Badge */}
            <div className="flex justify-between items-start mb-6">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] uppercase font-black border transition-all ${
                    isConnected ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/10 text-neutral-600'
                }`}>
                    <div className={`w-1 h-1 rounded-full ${isConnected ? 'bg-blue-400 shadow-[0_0_5px_rgba(59,130,246,1)]' : 'bg-neutral-600'}`} />
                    {isConnected ? 'Activo' : 'Offline'}
                </div>
                {integration.popular && !isConnected && (
                    <div className="px-3 py-1 bg-white text-black rounded-full text-[9px] font-black uppercase tracking-tighter shadow-xl">
                        Popular
                    </div>
                )}
            </div>

            {/* Icon */}
            <div className="mb-6 relative">
                 <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 group-hover:border-white/10 overflow-hidden relative">
                    {integration.icon}
                    {/* Glossy reflection overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-none" />
                 </div>
            </div>

            {/* Content */}
            <h3 className="text-xl font-medium text-white mb-2">{integration.name}</h3>
            <p className="text-neutral-500 text-xs leading-relaxed mb-8 flex-grow">
                {integration.description}
            </p>

            {/* Action */}
            <button
                onClick={onConnect}
                className={`w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                    isConnected 
                        ? 'border border-blue-500/30 text-blue-400 hover:bg-blue-500/10' 
                        : 'bg-white text-black hover:scale-[1.02] hover:shadow-xl active:scale-95'
                }`}
            >
                {isConnected ? (
                    <>
                        <Settings2 className="w-3 h-3" />
                        Ajustes
                    </>
                ) : (
                    <>
                        Conectar
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
        </motion.div>
    );
}
