import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Calendar, RefreshCw, CreditCard, Plus, ChevronDown, MoreVertical, Clock, CheckCheck, ChevronRight, ArrowUpRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { CardData, PaymentMethod } from '../types';

interface PaymentsTabProps {
    liveCardData: CardData | null;
    isAddingPayment: boolean;
    setIsAddingPayment: (val: boolean) => void;
    newPayment: {
        type: 'visa' | 'mastercard' | 'amex' | 'paypal' | 'bank_transfer' | 'other';
        last4: string;
        expiry: string;
        brand: string;
    };
    setNewPayment: React.Dispatch<React.SetStateAction<{
        type: 'visa' | 'mastercard' | 'amex' | 'paypal' | 'bank_transfer' | 'other';
        last4: string;
        expiry: string;
        brand: string;
    }>>;
    handleSavePaymentMethod: () => Promise<void>;
    serviceType?: string;
    setServiceType?: (type: string) => void;
    serviceDetails?: string;
    setServiceDetails?: (details: string) => void;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({
    liveCardData,
    isAddingPayment,
    setIsAddingPayment,
    newPayment,
    setNewPayment,
    handleSavePaymentMethod,
    serviceType,
    setServiceType,
    serviceDetails,
    setServiceDetails
}) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = React.useState(false);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            setShowScrollButton(scrollHeight - scrollTop > clientHeight + 50);
        }
    };

    React.useEffect(() => {
        const timer = setTimeout(checkScroll, 100);
        return () => clearTimeout(timer);
    }, [liveCardData, isAddingPayment]);

    const totalSpent = liveCardData?.transactions?.reduce((acc, curr) => {
        return curr.status === 'completed' ? acc + curr.amount : acc;
    }, 0) || 0;

    const today = new Date();
    const nextBillingSub = liveCardData?.subscriptions
        ?.filter(sub => sub.status === 'active' && sub.nextBillingDate?.toDate() > today)
        .sort((a, b) => a.nextBillingDate.toDate().getTime() - b.nextBillingDate.toDate().getTime())[0];

    const nextBillingDateStr = nextBillingSub
        ? nextBillingSub.nextBillingDate.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
        : '--';

    const nextBillingAmount = nextBillingSub ? `$${nextBillingSub.price.toFixed(2)}` : '--';

    return (
        <div className="relative flex-1 flex flex-col min-h-0 h-full overflow-hidden">
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex-1 overflow-y-auto custom-scrollbar p-5 pb-24"
            >
                {/* Header / Summary Section */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="group p-3 border-l-2 border-neutral-600 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-r-md">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign size={10} className="text-neutral-500" />
                            <h5 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em]">CAPITAL CONSOLIDADO</h5>
                        </div>
                        <p className="text-xl font-bold text-white tracking-tight font-mono">${totalSpent.toFixed(2)}</p>
                    </div>
                    <div className="group p-3 border-l-2 border-neutral-700 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-r-md">
                        <div className="flex items-center gap-2 mb-1">
                            <Calendar size={10} className="text-neutral-500" />
                            <h5 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em]">PRÓXIMO DÉBITO</h5>
                        </div>
                        <p className="text-xl font-bold text-white tracking-tight font-mono">{nextBillingDateStr}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* SERVICE SELECTION */}
                    {setServiceType && !serviceDetails && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <h4 className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] px-1 mb-2 border-b border-neutral-800/50 pb-2">
                                TIPO DE SERVICIO
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    onClick={() => setServiceType('visa_b1_b2')}
                                    className={cn(
                                        "relative group flex flex-col p-3 rounded-xl border transition-all duration-300 text-left h-full",
                                        serviceType === 'visa_b1_b2'
                                            ? "bg-neutral-800 border-neutral-600 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                                            : "bg-neutral-900/40 border-white/5 hover:border-white/10 hover:bg-neutral-800/40"
                                    )}
                                >
                                    <div className="flex flex-col h-full">
                                        <div className="mb-2">
                                            {serviceType === 'visa_b1_b2' && (
                                                <div className="absolute top-2 right-2">
                                                    <CheckCheck size={12} className="text-neutral-300" />
                                                </div>
                                            )}
                                            <span className={cn(
                                                "text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block",
                                                serviceType === 'visa_b1_b2' ? "bg-neutral-700 text-neutral-200" : "bg-white/5 text-neutral-500"
                                            )}>
                                                TURISMO
                                            </span>
                                            <h3 className={cn("text-[11px] font-bold leading-tight mb-1", serviceType === 'visa_b1_b2' ? "text-white" : "text-neutral-300")}>
                                                Visa B1/B2
                                            </h3>
                                        </div>
                                        <p className="text-[9px] text-neutral-500 leading-snug">
                                            Viajes de placer, negocios o salud sin fronteras.
                                        </p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setServiceType('visa_f1')}
                                    className={cn(
                                        "relative group flex flex-col p-3 rounded-xl border transition-all duration-300 text-left h-full",
                                        serviceType === 'visa_f1'
                                            ? "bg-neutral-800 border-neutral-600 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                                            : "bg-neutral-900/40 border-white/5 hover:border-white/10 hover:bg-neutral-800/40"
                                    )}
                                >
                                    <div className="flex flex-col h-full">
                                        <div className="mb-2">
                                            {serviceType === 'visa_f1' && (
                                                <div className="absolute top-2 right-2">
                                                    <CheckCheck size={12} className="text-neutral-300" />
                                                </div>
                                            )}
                                            <span className={cn(
                                                "text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block",
                                                serviceType === 'visa_f1' ? "bg-neutral-700 text-neutral-200" : "bg-white/5 text-neutral-500"
                                            )}>
                                                ESTUDIANTE
                                            </span>
                                            <h3 className={cn("text-[11px] font-bold leading-tight mb-1", serviceType === 'visa_f1' ? "text-white" : "text-neutral-300")}>
                                                Visa F-1
                                            </h3>
                                        </div>
                                        <p className="text-[9px] text-neutral-500 leading-snug">
                                            Lanza tu carrera profesional en universidades.
                                        </p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setServiceType('fifa_2026')}
                                    className={cn(
                                        "relative group flex flex-col p-3 rounded-xl border transition-all duration-300 text-left h-full",
                                        serviceType === 'fifa_2026'
                                            ? "bg-neutral-800 border-neutral-600 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                                            : "bg-neutral-900/40 border-white/5 hover:border-white/10 hover:bg-neutral-800/40"
                                    )}
                                >
                                    <div className="flex flex-col h-full">
                                        <div className="mb-2">
                                            {serviceType === 'fifa_2026' && (
                                                <div className="absolute top-2 right-2">
                                                    <CheckCheck size={12} className="text-neutral-300" />
                                                </div>
                                            )}
                                            <span className={cn(
                                                "text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block",
                                                serviceType === 'fifa_2026' ? "bg-neutral-700 text-neutral-200" : "bg-white/5 text-neutral-500"
                                            )}>
                                                EVENTO
                                            </span>
                                            <h3 className={cn("text-[11px] font-bold leading-tight mb-1", serviceType === 'fifa_2026' ? "text-white" : "text-neutral-300")}>
                                                FIFA Fan 2026
                                            </h3>
                                        </div>
                                        <p className="text-[9px] text-neutral-500 leading-snug">
                                            Asegura tu logística para el evento mundial.
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Plans Selection */}
                    {serviceType && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between mb-3 px-1 border-b border-white/5 pb-2">
                                <h5 className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                    {serviceType === 'visa_b1_b2' && 'PLANES TURISMO'}
                                    {serviceType === 'visa_f1' && 'PLANES ESTUDIANTE'}
                                    {serviceType === 'fifa_2026' && 'PLANES MUNDIAL 2026'}
                                </h5>
                                {serviceDetails && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setServiceDetails && setServiceDetails('')}
                                        className="h-5 px-2 text-[9px] text-neutral-400 hover:text-white hover:bg-white/5 uppercase tracking-wider gap-1.5"
                                    >
                                        <RefreshCw size={10} />
                                        Cambiar Plan
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {(() => {
                                    const getPlansAndTheme = () => {
                                        if (serviceType === 'visa_b1_b2') return {
                                            theme: 'blue',
                                            plans: [
                                                { name: 'TURISTA BÁSICO', price: '$380', original: '$494', desc: 'Lo esencial para tu solicitud.', off: '30% OFF' },
                                                { name: 'TURISTA PREMIUM', price: '$3,500', original: '$4,550', desc: 'La experiencia completa y cómoda.', off: '30% OFF' },
                                                { name: 'EXPERIENCIA VIP', price: '$4,990', original: '$6,500', desc: 'Lujo y atención exclusiva.', off: '30% OFF' }
                                            ]
                                        };
                                        if (serviceType === 'visa_f1') return {
                                            theme: 'purple',
                                            plans: [
                                                { name: 'PLAN 1: ESENCIAL', price: '$380', original: '$494', desc: 'El punto de partida ideal.', off: '30% OFF' },
                                                { name: 'PLAN 2: PRO', price: '$850', original: '$1,700', desc: 'Para quienes buscan seguridad.', off: '50% OFF', popular: true },
                                                { name: 'PLAN 3: ELITE', price: '$2,500', original: '$3,250', desc: 'Soporte completo y alojamiento.', off: '30% OFF' },
                                                { name: 'PLAN 4: ALL-INCLUSIVE', price: '$10,000', original: '$13,000', desc: 'La experiencia VIP definitiva.', off: '30% OFF' }
                                            ]
                                        };
                                        return {
                                            theme: 'emerald',
                                            plans: [
                                                { name: 'FAN PASS', price: '$450', original: '$585', desc: 'Lo esencial para tu viaje.', off: '30% OFF' },
                                                { name: 'FAN FOLLOW (PRO)', price: '$1,850', original: '$2,405', desc: 'Movilidad y estancia resuelta.', off: '30% OFF', popular: true },
                                                { name: 'WORLD CUP ELITE', price: '$5,000+', original: '$6,500', desc: 'La experiencia VIP completa.', off: '30% OFF' }
                                            ]
                                        };
                                    };

                                    const { plans, theme } = getPlansAndTheme();
                                    const selectedPlan = plans.find(p => p.name === serviceDetails);
                                    const list = selectedPlan ? [selectedPlan] : plans;

                                    const getThemeClasses = (isActive: boolean) => {
                                        return isActive ? "bg-neutral-800 border-neutral-600 shadow-[0_0_20px_rgba(255,255,255,0.05)]" : "bg-neutral-900/40 border-white/5 hover:border-white/10 hover:bg-neutral-800/60";
                                    };

                                    const getButtonClasses = (isActive: boolean) => {
                                        return isActive ? "bg-neutral-700 text-white shadow-lg shadow-black/20" : "bg-white/5 text-neutral-400 group-hover:bg-white/10 group-hover:text-neutral-200";
                                    };

                                    const getTextClasses = (isActive: boolean) => {
                                        if (isActive) return "text-white";
                                        return "text-neutral-400";
                                    };

                                    const getBulletColor = () => {
                                        return "marker:text-neutral-600";
                                    };

                                    return (
                                        <div className="space-y-3">
                                            {list.map((plan) => (
                                                <div
                                                    key={plan.name}
                                                    onClick={() => !selectedPlan && setServiceDetails && setServiceDetails(plan.name)}
                                                    className={cn(
                                                        "group relative p-5 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden",
                                                        getThemeClasses(serviceDetails === plan.name)
                                                    )}
                                                >
                                                    {plan.popular && !selectedPlan && (
                                                        <div className={cn(
                                                            "absolute -top-3 left-1/2 -translate-x-1/2 bg-neutral-950 border border-neutral-700/50 text-neutral-400 text-[8px] font-bold px-3 py-0.5 rounded-full shadow-lg z-10 uppercase tracking-widest"
                                                        )}>
                                                            Más Popular
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="text-[11px] font-black text-white uppercase tracking-wider">{plan.name}</h4>
                                                        <div className="bg-white/10 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                                                            {plan.off}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-baseline gap-2 mb-3">
                                                        <span className="text-3xl font-black text-white tracking-tight">{plan.price}</span>
                                                        <span className="text-[11px] text-neutral-600 line-through decoration-neutral-600/50 font-medium">{plan.original}</span>
                                                    </div>

                                                    <p className="text-[11px] text-neutral-400 font-medium leading-relaxed mb-5 border-b border-white/5 pb-4">
                                                        {plan.desc}
                                                    </p>

                                                    <div className={cn(
                                                        "w-full h-9 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-widest transition-all mb-5",
                                                        getButtonClasses(serviceDetails === plan.name)
                                                    )}>
                                                        {serviceDetails === plan.name ? 'PLAN SELECCIONADO' : 'Elegir Plan'}
                                                    </div>

                                                    <div>
                                                        <p className="text-[9px] font-bold text-neutral-600 uppercase mb-2 tracking-wider">LO QUE INCLUYE:</p>
                                                        <ul className={cn("space-y-1.5 list-disc pl-3", getBulletColor())}>
                                                            <li className="text-[10px] text-neutral-400 font-medium pl-0.5">Visa Express (Asesoría Urgente)</li>
                                                            <li className="text-[10px] text-neutral-400 font-medium pl-0.5">Guía Logística Sedes Mundial</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* 0. SUSCRIPCIONES ACTIVAS */}
                    <div>
                        <h4 className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] px-1 mb-2 border-b border-neutral-800/50 pb-2">
                            SUSCRIPCIONES
                        </h4>

                        <div className="flex flex-col">
                            {liveCardData?.subscriptions && liveCardData.subscriptions.length > 0 ? (
                                liveCardData.subscriptions.map((sub) => (
                                    <div key={sub.id} className="group flex items-center justify-between px-2 py-3 hover:bg-white/[0.02] transition-colors rounded-md border-b border-transparent">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h5 className="font-medium text-neutral-200 text-sm">{sub.name}</h5>
                                                <span className={cn(
                                                    "text-[8px] font-medium px-1.5 py-0.5 rounded-full uppercase tracking-widest bg-neutral-800/50",
                                                    sub.status === 'active' ? "text-neutral-300" :
                                                        sub.status === 'past_due' ? "text-neutral-400" :
                                                            "text-neutral-500"
                                                )}>
                                                    {sub.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-[11px] text-neutral-400 font-medium">
                                                    ${sub.price.toFixed(2)} / {sub.interval === 'month' ? 'MES' : 'AÑO'}
                                                </p>
                                                <span className="text-[10px] text-neutral-700">|</span>
                                                <p className="text-[9px] text-neutral-500 font-medium uppercase tracking-wider">
                                                    Próximo: {sub.nextBillingDate?.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-neutral-600 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical size={14} />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="py-4 text-center opacity-30 italic text-[9px]">No subscriptions</div>
                            )}
                        </div>
                    </div>

                    {/* 1. MÉTODOS DE PAGO */}
                    <div>
                        <div className="flex items-center justify-between px-1 mb-2 border-b border-neutral-800/50 pb-2">
                            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em]">
                                BÓVEDA DE PAGOS
                            </h4>
                            <Button
                                variant="ghost"
                                onClick={() => setIsAddingPayment(true)}
                                className="h-5 w-5 p-0 text-neutral-600 hover:text-white rounded-full hover:bg-neutral-800"
                            >
                                <Plus size={12} />
                            </Button>
                        </div>

                        {isAddingPayment && (
                            <div className="mb-4 p-3 border border-white/10 bg-neutral-900/50">
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="space-y-1">
                                        <label className="text-[8px] uppercase font-medium text-neutral-500">Proveedor</label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full h-7 text-left justify-start bg-transparent border-white/10 text-[10px] px-2 text-neutral-300">
                                                    {newPayment.type.toUpperCase()}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-[#0a0a0a] border-white/10">
                                                <DropdownMenuItem onClick={() => setNewPayment(p => ({ ...p, type: 'visa' }))} className="text-[10px]">VISA</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setNewPayment(p => ({ ...p, type: 'mastercard' }))} className="text-[10px]">MASTERCARD</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setNewPayment(p => ({ ...p, type: 'paypal' }))} className="text-[10px]">PAYPAL</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] uppercase font-medium text-neutral-500">Últimos 4</label>
                                        <Input
                                            maxLength={4}
                                            value={newPayment.last4}
                                            onChange={(e) => setNewPayment(p => ({ ...p, last4: e.target.value.replace(/\D/g, '') }))}
                                            className="h-7 bg-transparent border-white/10 text-[10px]"
                                            placeholder="4242"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" onClick={() => setIsAddingPayment(false)} className="h-6 text-[9px] text-neutral-500 uppercase">Cancelar</Button>
                                    <Button onClick={handleSavePaymentMethod} className="h-6 bg-neutral-700 text-[9px] uppercase px-3">Guardar</Button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col">
                            {liveCardData?.paymentMethods && liveCardData.paymentMethods.length > 0 ? (
                                liveCardData.paymentMethods.map((method) => (
                                    <div
                                        key={method.id}
                                        className="group flex items-center justify-between px-2 py-3 hover:bg-white/[0.02] transition-colors rounded-md border-b border-transparent cursor-default"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-6 rounded-[4px] bg-neutral-800 flex items-center justify-center border border-neutral-700/50 shrink-0">
                                                <CreditCard size={12} className="text-neutral-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="text-[13px] font-medium text-neutral-200 tracking-wider">
                                                    •••• {method.last4 || '0000'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] text-neutral-500 font-medium uppercase tracking-wider">
                                                        EXP: {method.expiry || '--/--'}
                                                    </span>
                                                    {method.isDefault && <span className="text-[8px] text-neutral-400 font-medium uppercase tracking-[0.1em]">PREDETERMINADA</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-neutral-600 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical size={14} />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="py-4 text-center opacity-30 italic text-[9px]" onClick={() => setIsAddingPayment(true)}>
                                    No payment methods
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. TRANSACTION HISTORY */}
                    <div>
                        <div className="flex items-center justify-between px-1 mb-2 border-b border-neutral-800/50 pb-2">
                            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em]">
                                HISTORIAL DE TRANSACCIONES
                            </h4>
                        </div>

                        <div className="space-y-0">
                            {liveCardData?.transactions && liveCardData.transactions.length > 0 ? (
                                <div className="flex flex-col">
                                    {liveCardData.transactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between px-2 py-3 hover:bg-white/[0.02] transition-colors group rounded-md border-b border-transparent">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    tx.status === 'completed' ? "bg-neutral-500 shadow-[0_0_8px_rgba(255,255,255,0.1)]" :
                                                        tx.status === 'pending' ? "bg-neutral-600" : "bg-neutral-800"
                                                )} />
                                                <div>
                                                    <p className="text-[11px] font-bold text-neutral-200 tracking-tight">{tx.description.toUpperCase()}</p>
                                                    <p className="text-[9px] text-neutral-500 font-medium uppercase tracking-wider mt-0.5">
                                                        {tx.date?.toDate ? tx.date.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-white tracking-tight font-mono">${tx.amount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <p className="text-[9px] text-neutral-600 opacity-50 italic">No activity</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showScrollButton && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 10, x: '-50%' }}
                        className="absolute bottom-6 left-1/2 z-20"
                    >
                        <Button
                            onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
                            className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-full h-12 w-12 shadow-[0_0_20px_rgba(255,255,255,0.05)] flex items-center justify-center border border-white/10 group animate-bounce"
                        >
                            <ChevronDown className="w-6 h-6 group-hover:translate-y-0.5 transition-transform" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
