// src/components/settings/nodes/PlaceholderSettings.tsx
'use client';
import React, { useCallback, useState } from 'react';
import { Node } from 'reactflow';
import { produce } from 'immer';
import { Input } from '@/components/ui/input';
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { SettingsSection, Field } from '../SharedComponents';
import { 
    Clock, 
    MoreHorizontal, 
    Zap, 
    AlertTriangle, 
    CalendarClock,
    Wand2,
    ShoppingBag,
    Plus,
    Trash2,
    Layers,
    Globe,
    CheckCircle2,
    Search,
    List,
    LayoutGrid,
    Braces
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// --- Tipos para DELAY ---
interface DelayData {
    mode?: 'fixed' | 'random';
    durationSeconds?: number;
    minSeconds?: number;
    maxSeconds?: number;
    showTyping?: boolean;
}

// --- Tipos para CATALOG / PRODUCT ---
interface ProductItem {
    id: string;
    productRetailerId: string; // SKU o ID
}

interface ProductSection {
    id: string;
    title: string;
    products: ProductItem[];
}

interface CatalogData {
    // Modo de Visualización (Solo para Product Node)
    productMode?: 'single' | 'multi'; 
    
    // Contenido
    bodyText?: string;
    footerText?: string;
    
    // Single Product
    singleProductId?: string;
    
    // Multi Product (Manual)
    sections?: ProductSection[];
    
    // Multi Product (Dinámico)
    useDynamicList?: boolean;
    dynamicListVariable?: string; // Variable que contiene ['sku1', 'sku2']

    // Configuración General
    catalogId?: string; // Opcional, override
    fallbackMessage?: string;
}

interface NodeSettingsProps {
    node: Node;
    updateNodeConfig: (nodeId: string, data: object) => void;
}

export const PlaceholderSettings = ({ node, updateNodeConfig }: NodeSettingsProps) => {
    
    // --- 1. LÓGICA PARA NODO DELAY ---
    if (node.type === 'delayNode') {
        const data = (node.data || {}) as DelayData;
        const [warning, setWarning] = useState<string | null>(null);
        const [error, setError] = useState<string | null>(null);

        const updateDelayConfig = useCallback((fn: (draft: DelayData) => void) => {
            const newData = produce(data, draft => {
                fn(draft);
            });
            
            const duration = newData.mode === 'random' ? (newData.maxSeconds || 5) : (newData.durationSeconds || 2);
            if (duration > 300) setError("Límite técnico excedido (> 5 min).");
            else setError(null);
            
            if (duration > 10 && duration <= 300) setWarning("Atención: El usuario podría abandonar.");
            else setWarning(null);

            updateNodeConfig(node.id, newData);
        }, [data, node.id, updateNodeConfig]);

        const calculateSmartPacing = () => {
            const idealTime = 3; 
            updateDelayConfig(d => {
                d.mode = 'fixed';
                d.durationSeconds = idealTime;
            });
        };

        return (
            <div className="space-y-4">
                <SettingsSection title="⏳ Configuración de Espera">
                    <Tabs value={data.mode || 'fixed'} onValueChange={(v) => updateDelayConfig(d => { d.mode = v as any })} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="fixed">Fijo</TabsTrigger>
                            <TabsTrigger value="random">Aleatorio (Humano)</TabsTrigger>
                        </TabsList>
                        
                        <div className="mt-4 bg-neutral-900 p-4 rounded-lg border border-neutral-800 space-y-4">
                            <TabsContent value="fixed" className="mt-0 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-neutral-300">Duración Exacta</label>
                                    <span className="text-xl font-bold text-white font-mono">{data.durationSeconds || 2}s</span>
                                </div>
                                <Slider 
                                    value={[data.durationSeconds || 2]} 
                                    min={1} 
                                    max={60} 
                                    step={1}
                                    onValueChange={(val) => updateDelayConfig(d => { d.durationSeconds = val[0] })}
                                    className="py-2"
                                />
                            </TabsContent>

                            <TabsContent value="random" className="mt-0 space-y-4">
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <label className="text-xs text-neutral-400">Mínimo</label>
                                            <span className="text-xs font-mono text-white">{data.minSeconds || 1}s</span>
                                        </div>
                                        <Slider 
                                            value={[data.minSeconds || 1]} 
                                            min={1} 
                                            max={20} 
                                            step={0.5}
                                            onValueChange={(val) => updateDelayConfig(d => { d.minSeconds = val[0] })}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <label className="text-xs text-neutral-400">Máximo</label>
                                            <span className="text-xs font-mono text-white">{data.maxSeconds || 3}s</span>
                                        </div>
                                        <Slider 
                                            value={[data.maxSeconds || 3]} 
                                            min={(data.minSeconds || 1) + 1} 
                                            max={30} 
                                            step={0.5}
                                            onValueChange={(val) => updateDelayConfig(d => { d.maxSeconds = val[0] })}
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>

                    <Button variant="outline" size="sm" onClick={calculateSmartPacing} className="w-full text-xs border-dashed border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800">
                        <Wand2 className="w-3 h-3 mr-2" /> Calcular Tiempo de Lectura Ideal
                    </Button>
                </SettingsSection>

                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-md transition-colors", data.showTyping ? "bg-green-500/20 text-green-400" : "bg-neutral-800 text-neutral-500")}>
                            <MoreHorizontal className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium text-white">Indicador "Escribiendo..."</label>
                        </div>
                    </div>
                    <Switch 
                        checked={data.showTyping !== false} 
                        onCheckedChange={(c) => updateDelayConfig(d => { d.showTyping = c })}
                    />
                </div>
                 {warning && !error && (
                    <div className="flex gap-2 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg items-start">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-200">{warning}</p>
                    </div>
                )}
                {error && (
                    <div className="flex gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg items-start">
                        <CalendarClock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-200">{error}</p>
                    </div>
                )}
            </div>
        );
    }

    // --- 2. LÓGICA PARA NODO CATALOG / PRODUCT ---
    if (node.type === 'catalogNode' || node.type === 'productNode') {
        const data = (node.data || {}) as CatalogData;
        const sections = data.sections || [];
        const isProductNode = node.type === 'productNode';
        
        const [verifying, setVerifying] = useState(false);
        const [verifiedStatus, setVerifiedStatus] = useState<'none' | 'success' | 'error'>('none');

        const totalProducts = sections.reduce((acc, sec) => acc + sec.products.length, 0);
        const MAX_PRODUCTS = 30;

        const updateCatalogConfig = useCallback((fn: (draft: CatalogData) => void) => {
            const newData = produce(data, draft => {
                fn(draft);
                // Si cambia a modo single, podríamos advertir, pero aquí simplificamos
            });
            updateNodeConfig(node.id, newData);
        }, [data, node.id, updateNodeConfig]);

        // Simulación de verificación de inventario
        const checkInventory = () => {
            setVerifying(true);
            setVerifiedStatus('none');
            setTimeout(() => {
                setVerifying(false);
                // Random success/fail simulation
                const isValid = Math.random() > 0.3; 
                setVerifiedStatus(isValid ? 'success' : 'error');
            }, 1000);
        };

        // Acciones de Secciones (Reutilizadas)
        const addSection = () => {
            updateCatalogConfig(d => {
                if (!d.sections) d.sections = [];
                if (d.sections.length >= 10) return; 
                d.sections.push({ id: crypto.randomUUID(), title: `Sección ${d.sections.length + 1}`, products: [] });
            });
        };
        const removeSection = (id: string, e: React.MouseEvent) => {
            e.stopPropagation();
            updateCatalogConfig(d => { if (d.sections) d.sections = d.sections.filter(s => s.id !== id); });
        };
        const updateSectionTitle = (id: string, title: string) => updateCatalogConfig(d => { const s = d.sections?.find(s => s.id === id); if(s) s.title = title; });
        const addProduct = (sectionId: string) => {
            if (totalProducts >= MAX_PRODUCTS) return;
            updateCatalogConfig(d => { const s = d.sections?.find(s => s.id === sectionId); if (s) s.products.push({ id: crypto.randomUUID(), productRetailerId: '' }); });
        };
        const removeProduct = (sectionId: string, prodId: string) => updateCatalogConfig(d => { const s = d.sections?.find(s => s.id === sectionId); if(s) s.products = s.products.filter(p => p.id !== prodId); });
        const updateProduct = (sectionId: string, prodId: string, val: string) => updateCatalogConfig(d => { const s = d.sections?.find(s => s.id === sectionId); const p = s?.products.find(p => p.id === prodId); if(p) p.productRetailerId = val.trim(); });

        return (
            <div className="space-y-4">
                <Tabs defaultValue="content" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="content">Contenido</TabsTrigger>
                        <TabsTrigger value="advanced">Avanzado</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-4 mt-4">
                        
                        {/* Selector de Modo (Solo Product Node) */}
                        {isProductNode && (
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <button
                                    onClick={() => updateCatalogConfig(d => { d.productMode = 'single' })}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-2 h-20",
                                        data.productMode === 'single' 
                                            ? "bg-purple-500/20 border-purple-500 text-purple-300" 
                                            : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:bg-neutral-800"
                                    )}
                                >
                                    <ShoppingBag size={20} />
                                    <span className="text-xs font-bold">Un Producto</span>
                                </button>
                                <button
                                    onClick={() => updateCatalogConfig(d => { d.productMode = 'multi' })}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-2 h-20",
                                        data.productMode === 'multi' 
                                            ? "bg-purple-500/20 border-purple-500 text-purple-300" 
                                            : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:bg-neutral-800"
                                    )}
                                >
                                    <LayoutGrid size={20} />
                                    <span className="text-xs font-bold">Multi (Lista)</span>
                                </button>
                            </div>
                        )}

                        <SettingsSection title="📝 Texto del Mensaje">
                            <Field label="Cuerpo (Requerido *)" htmlFor="body">
                                <Textarea 
                                    value={data.bodyText || ''}
                                    onChange={(e) => updateCatalogConfig(d => { d.bodyText = e.target.value })}
                                    placeholder={isProductNode ? "Mira esta recomendación..." : "Nuestro catálogo completo..."}
                                    className={cn("h-20 bg-neutral-950 border-neutral-800", !data.bodyText && "border-red-900/50")}
                                />
                            </Field>
                            <Field label="Pie de Página" htmlFor="footer">
                                <Input 
                                    value={data.footerText || ''}
                                    onChange={(e) => updateCatalogConfig(d => { d.footerText = e.target.value })}
                                    className="text-xs bg-neutral-950 border-neutral-800"
                                />
                            </Field>
                        </SettingsSection>

                        {/* Configuración SINGLE Product */}
                        {isProductNode && data.productMode === 'single' && (
                            <SettingsSection title="📦 Producto Único">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <ShoppingBag className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                                        <Input 
                                            value={data.singleProductId || ''}
                                            onChange={(e) => updateCatalogConfig(d => { d.singleProductId = e.target.value.trim() })}
                                            placeholder="Retailer ID (SKU)"
                                            className="pl-9 bg-neutral-950 border-neutral-800 font-mono text-purple-400"
                                        />
                                    </div>
                                    <Button 
                                        size="icon" 
                                        variant="outline" 
                                        onClick={checkInventory}
                                        className={cn("shrink-0 border-neutral-700", verifiedStatus === 'success' && "border-green-500 text-green-500", verifiedStatus === 'error' && "border-red-500 text-red-500")}
                                        title="Verificar disponibilidad en API"
                                    >
                                        {verifying ? <Search className="w-4 h-4 animate-spin" /> : 
                                         verifiedStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                                         verifiedStatus === 'error' ? <AlertTriangle className="w-4 h-4" /> :
                                         <Search className="w-4 h-4" />}
                                    </Button>
                                </div>
                                {verifiedStatus === 'error' && <p className="text-[10px] text-red-400 mt-1">Error: Producto no encontrado o sin stock.</p>}
                            </SettingsSection>
                        )}

                        {/* Configuración MULTI Product & CATALOG */}
                        {(!isProductNode || data.productMode === 'multi') && (
                            <SettingsSection title="🛍️ Selección de Productos">
                                
                                {/* Toggle Dinámico (Solo Multi Product) */}
                                {isProductNode && (
                                    <div className="flex items-center justify-between mb-4 p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Braces className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm font-medium">Usar Variable Dinámica</span>
                                        </div>
                                        <Switch 
                                            checked={data.useDynamicList || false}
                                            onCheckedChange={(c) => updateCatalogConfig(d => { d.useDynamicList = c })}
                                        />
                                    </div>
                                )}

                                {data.useDynamicList ? (
                                    <Field label="Variable de Lista (Array)" htmlFor="dyn-var" description="Debe contener IDs: ['sku1', 'sku2']">
                                        <Input 
                                            value={data.dynamicListVariable || ''}
                                            onChange={(e) => updateCatalogConfig(d => { d.dynamicListVariable = e.target.value })}
                                            placeholder="{{recomendaciones_ia}}"
                                            className="font-mono text-blue-400 bg-neutral-950 border-neutral-800"
                                        />
                                    </Field>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="outline" className={cn("text-[10px]", totalProducts >= MAX_PRODUCTS ? "text-red-400 border-red-900" : "text-neutral-400")}>
                                                {totalProducts} / {MAX_PRODUCTS} Productos
                                            </Badge>
                                            <Button size="sm" variant="secondary" onClick={addSection} disabled={sections.length >= 10} className="h-6 text-xs bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-800/50">
                                                <Plus className="w-3 h-3 mr-1" /> Nueva Sección
                                            </Button>
                                        </div>

                                        <Accordion type="single" collapsible className="w-full space-y-2">
                                            {sections.map((section) => (
                                                <AccordionItem key={section.id} value={section.id} className="border border-neutral-800 bg-neutral-900/50 rounded-lg overflow-hidden">
                                                    <div className="flex items-center px-3 py-2 border-b border-neutral-800 bg-neutral-900 gap-2">
                                                        <Layers className="w-3 h-3 text-neutral-500 shrink-0" />
                                                        <Input 
                                                            className="h-6 text-xs bg-transparent border-transparent hover:border-neutral-700 focus:border-neutral-600 focus:bg-neutral-950 w-full font-medium p-0" 
                                                            value={section.title}
                                                            onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                                            placeholder="Título de Sección"
                                                        />
                                                        <AccordionTrigger className="hover:no-underline py-0 pr-1 pl-1" />
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-neutral-500 hover:text-red-400" onClick={(e) => removeSection(section.id, e)}>
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                    
                                                    <AccordionContent className="p-2 space-y-2 bg-neutral-950/30">
                                                        {section.products.map((prod) => (
                                                            <div key={prod.id} className="flex items-center gap-2">
                                                                <div className="relative flex-1">
                                                                    <ShoppingBag className="absolute left-2 top-2 w-3 h-3 text-neutral-500" />
                                                                    <Input 
                                                                        placeholder="ID de Producto (SKU)" 
                                                                        value={prod.productRetailerId} 
                                                                        onChange={(e) => updateProduct(section.id, prod.id, e.target.value)}
                                                                        className="h-7 text-xs pl-7 font-mono text-blue-400 bg-neutral-950 border-neutral-800"
                                                                    />
                                                                </div>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-600 hover:text-red-400" onClick={() => removeProduct(section.id, prod.id)}>
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => addProduct(section.id)} 
                                                            disabled={totalProducts >= MAX_PRODUCTS}
                                                            className="w-full h-6 text-[10px] border-dashed border-neutral-800 text-neutral-500 hover:text-white hover:bg-neutral-800"
                                                        >
                                                            <Plus className="w-3 h-3 mr-1" /> Añadir Producto
                                                        </Button>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                        
                                        {sections.length === 0 && (
                                            <div className="text-center p-4 border border-dashed border-neutral-800 rounded-lg">
                                                <p className="text-xs text-neutral-500">No hay secciones creadas.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </SettingsSection>
                        )}
                    </TabsContent>

                    <TabsContent value="advanced" className="space-y-4 mt-4">
                        <SettingsSection title="🌐 Configuración Multi-País">
                            <div className="p-3 bg-blue-900/10 border border-blue-900/50 rounded-md text-xs text-blue-300 mb-3 flex gap-2">
                                <Globe className="w-4 h-4 shrink-0" />
                                <p>Por defecto se usa el catálogo conectado a la cuenta de kamban (WABA). Usa esto solo si necesitas forzar otro catálogo.</p>
                            </div>
                            <Field label="Catalog ID (Override)" htmlFor="cat-id">
                                <Input 
                                    value={data.catalogId || ''}
                                    onChange={(e) => updateCatalogConfig(d => { d.catalogId = e.target.value })}
                                    placeholder="ej: 1234567890 (Opcional)"
                                    className="bg-neutral-950 border-neutral-800 font-mono text-xs"
                                />
                            </Field>
                        </SettingsSection>

                        <SettingsSection title="🛡️ Estrategia de Fallo">
                            <Field label="Mensaje de Respaldo" htmlFor="fallback" description="Se enviará si los productos no son válidos o fallan.">
                                <Textarea 
                                    value={data.fallbackMessage || ''}
                                    onChange={(e) => updateCatalogConfig(d => { d.fallbackMessage = e.target.value })}
                                    placeholder="Lo sentimos, no pudimos cargar los productos..."
                                    className="h-20 bg-neutral-950 border-neutral-800 text-xs"
                                />
                            </Field>
                        </SettingsSection>
                    </TabsContent>
                </Tabs>
            </div>
        );
    }

    // --- 3. PLACEHOLDER GENÉRICO ---
    return (
        <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto text-neutral-500">
                <Zap size={32} />
            </div>
            <div>
                <h3 className="text-lg font-medium text-white">Próximamente</h3>
                <p className="text-sm text-neutral-500 mt-1">
                    La configuración avanzada para el nodo <span className="text-purple-400 font-mono">{node.type}</span> está en desarrollo.
                </p>
            </div>
        </div>
    );
};

