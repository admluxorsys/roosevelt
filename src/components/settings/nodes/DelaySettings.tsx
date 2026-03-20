import React from 'react';
import { Node } from 'reactflow';
import { Clock, Shuffle, Timer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface NodeSettingsProps {
    node: Node;
    updateNodeConfig: (nodeId: string, data: object) => void;
}

export const DelaySettings = ({ node, updateNodeConfig }: NodeSettingsProps) => {
    const data = node.data || {};
    const mode = data.mode || 'fixed'; // 'fixed' or 'random'
    const durationSeconds = data.durationSeconds || 2;
    const minSeconds = data.minSeconds || 1;
    const maxSeconds = data.maxSeconds || 3;

    const handleChange = (key: string, value: any) => {
        updateNodeConfig(node.id, { [key]: value });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header / Mode Selection */}
            <div className="space-y-3">
                <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={12} /> CONFIGURACIÓN DE ESPERA
                </Label>
                
                <Tabs value={mode} onValueChange={(val) => handleChange('mode', val)} className="w-full">
                    <TabsList className="grid grid-cols-2 bg-neutral-900 border border-neutral-800 p-1 h-10 rounded-xl">
                        <TabsTrigger 
                            value="fixed" 
                            className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                            <Timer size={14} className="mr-2" /> Fijo
                        </TabsTrigger>
                        <TabsTrigger 
                            value="random" 
                            className="rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                            <Shuffle size={14} className="mr-2" /> Aleatorio
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Content based on Mode */}
            <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 space-y-6">
                {mode === 'fixed' ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <Label className="text-[11px] font-bold text-neutral-300">Tiempo de espera</Label>
                            <span className="text-xl font-mono font-black text-blue-400">{durationSeconds}s</span>
                        </div>
                        
                        <Slider
                            value={[durationSeconds]}
                            min={0.5}
                            max={10}
                            step={0.5}
                            onValueChange={([val]) => handleChange('durationSeconds', val)}
                            className="py-2"
                        />
                        
                        <div className="flex justify-between text-[9px] text-neutral-600 font-bold uppercase tracking-widest">
                            <span>0.5s</span>
                            <span>10s</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <Label className="text-[11px] font-bold text-neutral-300">Mínimo</Label>
                                <span className="text-lg font-mono font-black text-purple-400">{minSeconds}s</span>
                            </div>
                            <Slider
                                value={[minSeconds]}
                                min={0.5}
                                max={maxSeconds}
                                step={0.5}
                                onValueChange={([val]) => handleChange('minSeconds', val)}
                                className="py-2"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <Label className="text-[11px] font-bold text-neutral-300">Máximo</Label>
                                <span className="text-lg font-mono font-black text-purple-400">{maxSeconds}s</span>
                            </div>
                            <Slider
                                value={[maxSeconds]}
                                min={minSeconds}
                                max={20}
                                step={0.5}
                                onValueChange={([val]) => handleChange('maxSeconds', val)}
                                className="py-2"
                            />
                        </div>
                        
                        <p className="text-[10px] text-neutral-500 italic text-center bg-neutral-950/50 p-2 rounded-lg border border-neutral-800">
                            El bot esperará un tiempo aleatorio entre {minSeconds}s y {maxSeconds}s.
                        </p>
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                <Clock className="shrink-0 text-blue-500" size={16} />
                <p className="text-[10px] text-neutral-400 leading-relaxed font-medium">
                    Usa este nodo para simular pausas naturales o dar tiempo al usuario para leer mensajes anteriores.
                </p>
            </div>
        </div>
    );
};
