// src/components/settings/nodes/GeneralSettings.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Input } from '@/components/ui/input';
import { SettingsSection, Field } from '../SharedComponents';

interface NodeSettingsProps {
    node: Node;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

export const GeneralSettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    const [nodeName, setNodeName] = useState(node.data.label || '');

    useEffect(() => {
        setNodeName(node.data.label || '');
    }, [node.data.label]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNodeName(e.target.value);
    };

    const handleBlur = () => {
        updateNodeConfig(node.id, { ...node.data, label: nodeName });
    };

    return (
        <SettingsSection title="Ajustes Generales">
            <Field label="Nombre del Nodo" htmlFor="node-name" description="Útil para identificar el nodo en el flujo.">
                <Input id="node-name" value={nodeName} onChange={handleNameChange} onBlur={handleBlur} placeholder="Ej: Saludo Inicial" />
            </Field>
        </SettingsSection>
    );
};

