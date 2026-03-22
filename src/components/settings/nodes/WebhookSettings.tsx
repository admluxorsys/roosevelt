'use client';
import React, { useCallback } from 'react';
import { Node } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsSection, Field } from '../SharedComponents';
import { produce } from 'immer';

interface WebhookData {
    url?: string;
    method?: string;
    headers?: any[];
    saveResponseTo?: string;
}

interface NodeSettingsProps {
    node: Node<WebhookData>;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

export const WebhookSettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    const data = node.data || {};

    const updateConfig = useCallback((path: keyof WebhookData, value: any) => {
        const newData = produce(data, draft => {
            // @ts-ignore
            draft[path] = value;
        });
        updateNodeConfig(node.id, newData);
    }, [data, node.id, updateNodeConfig]);

    return (
        <div className="space-y-6">
            <SettingsSection title="🔗 Petición HTTP">
                <div className="flex gap-2">
                    <Select value={data.method || 'POST'} onValueChange={(v) => updateConfig('method', v)}>
                        <SelectTrigger className="w-[100px] bg-neutral-950 border-neutral-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        value={data.url || ''}
                        onChange={(e) => updateConfig('url', e.target.value)}
                        placeholder="https://api.ejemplo.com/v1..."
                        className="font-mono text-xs bg-neutral-950 border-neutral-800"
                    />
                </div>
            </SettingsSection>

            <SettingsSection title="Respuesta">
                <Field label="Guardar respuesta en variable" htmlFor="res-var">
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-neutral-500 font-mono text-xs">@</span>
                        <Input
                            id="res-var"
                            value={data.saveResponseTo || ''}
                            onChange={(e) => updateConfig('saveResponseTo', e.target.value)}
                            placeholder="ej: api_response"
                            className="pl-7 font-mono text-green-400 bg-neutral-950 border-neutral-800"
                        />
                    </div>
                </Field>
                <p className="text-[10px] text-neutral-500 mt-2">
                    La respuesta JSON completa se guardará en esta variable para usarla después (ej: <code>{`{{api_response.id}}`}</code>).
                </p>
            </SettingsSection>
        </div>
    );
};

