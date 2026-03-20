// src/components/settings/nodes/CheckoutSettings.tsx
'use client';
import React, { useCallback, useState } from 'react';
import { Node } from 'reactflow';
import { produce } from 'immer';
import { Input } from '@/components/ui/input';
import { SettingsSection, Field } from '../SharedComponents';
import { Button } from '@/components/ui/button';
import { 
    CreditCard, 
    Receipt, 
    Truck, 
    Tag, 
    Plus, 
    Trash2, 
    DollarSign,
    Calculator,
    AlertCircle
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number; // Precio humano (ej: 10.50)
}

interface CheckoutData {
    currency?: string;
    items?: OrderItem[];
    tax?: number;
    shipping?: number;
    discount?: number;
    referenceId?: string;
    paymentConfigId?: string;
}

interface NodeSettingsProps {
    node: Node<CheckoutData>;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

export const CheckoutSettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    const data = node.data || {};
    const items = data.items || [];

    const updateConfig = useCallback((fn: (draft: CheckoutData) => void) => {
        const newData = produce(data, fn);
        updateNodeConfig(node.id, newData);
    }, [data, node.id, updateNodeConfig]);

    // Items Logic
    const addItem = () => {
        updateConfig(d => {
            if (!d.items) d.items = [];
            d.items.push({ id: crypto.randomUUID(), name: '', quantity: 1, price: 0 });
        });
    };

    const removeItem = (id: string) => {
        updateConfig(d => { if(d.items) d.items = d.items.filter(i => i.id !== id); });
    };

    const updateItem = (id: string, field: keyof OrderItem, val: any) => {
        updateConfig(d => {
            const item = d.items?.find(i => i.id === id);
            if (item) {
                // @ts-ignore
                item[field] = val;
            }
        });
    };

    // Math Logic
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = data.tax || 0;
    const shipping = data.shipping || 0;
    const discount = data.discount || 0;
    const total = subtotal + tax + shipping - discount;
    
    // Offset Logic (Conversión a centavos para API)
    const apiTotal = Math.round(total * 100);

    return (
        <div className="space-y-4">
            <SettingsSection title="🧾 Detalles del Pedido">
                <Field label="Moneda (ISO 4217)" htmlFor="currency">
                     <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                        <Input 
                            value={data.currency || 'USD'}
                            onChange={(e) => updateConfig(d => { d.currency = e.target.value.toUpperCase() })}
                            maxLength={3}
                            className="pl-9 bg-neutral-950 border-neutral-800 font-mono w-24 text-center font-bold"
                        />
                    </div>
                </Field>

                <div className="space-y-2 mt-3">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-semibold text-neutral-400">Lista de Ítems</span>
                    </div>
                    
                    {items.map((item) => (
                        <div key={item.id} className="grid grid-cols-[1fr,60px,80px,auto] gap-2 items-center bg-neutral-900 p-2 rounded border border-neutral-800">
                            <Input 
                                placeholder="Nombre Producto" 
                                value={item.name}
                                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                className="h-7 text-xs bg-neutral-950 border-neutral-800"
                            />
                            <Input 
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                className="h-7 text-xs bg-neutral-950 border-neutral-800 text-center"
                            />
                            <Input 
                                type="number"
                                min={0}
                                step={0.01}
                                value={item.price}
                                onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                className="h-7 text-xs bg-neutral-950 border-neutral-800 text-right"
                            />
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-600 hover:text-red-400" onClick={() => removeItem(item.id)}>
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addItem} className="w-full h-8 text-xs border-dashed border-neutral-800 text-neutral-500 hover:text-white hover:bg-neutral-800">
                        <Plus className="w-3 h-3 mr-1" /> Agregar Ítem
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
                    <Field label="Impuestos (+)" htmlFor="tax">
                         <div className="relative">
                            <Receipt className="absolute left-3 top-2.5 w-3 h-3 text-neutral-500" />
                            <Input 
                                type="number" 
                                step={0.01}
                                value={data.tax || 0}
                                onChange={(e) => updateConfig(d => { d.tax = parseFloat(e.target.value) || 0 })}
                                className="pl-8 h-8 text-xs bg-neutral-950 border-neutral-800"
                            />
                        </div>
                    </Field>
                    <Field label="Envío (+)" htmlFor="shipping">
                         <div className="relative">
                            <Truck className="absolute left-3 top-2.5 w-3 h-3 text-neutral-500" />
                            <Input 
                                type="number" 
                                step={0.01}
                                value={data.shipping || 0}
                                onChange={(e) => updateConfig(d => { d.shipping = parseFloat(e.target.value) || 0 })}
                                className="pl-8 h-8 text-xs bg-neutral-950 border-neutral-800"
                            />
                        </div>
                    </Field>
                    <Field label="Descuento (-)" htmlFor="discount">
                         <div className="relative">
                            <Tag className="absolute left-3 top-2.5 w-3 h-3 text-neutral-500" />
                            <Input 
                                type="number" 
                                step={0.01}
                                value={data.discount || 0}
                                onChange={(e) => updateConfig(d => { d.discount = parseFloat(e.target.value) || 0 })}
                                className="pl-8 h-8 text-xs bg-neutral-950 border-neutral-800 text-green-400"
                            />
                        </div>
                    </Field>
                    <div className="flex flex-col justify-end">
                        <div className="text-right">
                            <p className="text-[10px] text-neutral-500 uppercase font-bold">Total a Cobrar</p>
                            <p className="text-xl font-bold text-white">{data.currency || '$'} {total.toFixed(2)}</p>
                            <p className="text-[9px] text-neutral-600 font-mono">API Offset: {apiTotal}</p>
                        </div>
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection title="💳 Configuración de Pago">
                <Field label="Payment Config ID" htmlFor="pay-id" description="ID de la configuración en WABA.">
                    <Input 
                        value={data.paymentConfigId || ''}
                        onChange={(e) => updateConfig(d => { d.paymentConfigId = e.target.value })}
                        placeholder="payment_config_xyz"
                        className="bg-neutral-950 border-neutral-800 font-mono text-xs"
                    />
                </Field>

                <Field label="Reference ID (Idempotencia)" htmlFor="ref-id" description="ÚNICO por pedido. Usa variables.">
                     <div className="relative">
                        <AlertCircle className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                        <Input 
                            value={data.referenceId || ''}
                            onChange={(e) => updateConfig(d => { d.referenceId = e.target.value })}
                            placeholder="{{order_id}}"
                            className={cn("pl-9 bg-neutral-950 border-neutral-800 font-mono text-xs", !data.referenceId && "border-red-900/50")}
                        />
                    </div>
                </Field>
                {!data.referenceId && <p className="text-[10px] text-red-400 mt-1">* Requerido para evitar cobros dobles.</p>}
            </SettingsSection>
        </div>
    );
};
