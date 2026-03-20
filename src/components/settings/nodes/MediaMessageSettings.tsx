// src/components/settings/nodes/MediaMessageSettings.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Node } from 'reactflow';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label'; // <--- Importación agregada
import { 
    Bold, Italic, Code, Smile, Link as LinkIcon, 
    Image as ImageIcon, Film, FileText, Music, Edit2, Copy, Check, AlertTriangle
} from 'lucide-react';
import { SettingsSection, Field, FileUploader } from '../SharedComponents';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface NodeSettingsProps {
    node: Node;
    allNodes: Node[];
    updateNodeConfig: (nodeId: string, data: object) => void;
}

const COMMON_VARIABLES = [
    { label: 'Nombre', value: '{{first_name}}' },
    { label: 'Apellido', value: '{{last_name}}' },
    { label: 'Empresa', value: '{{company}}' }
];

export const MediaMessageSettings = ({ node, allNodes, updateNodeConfig }: NodeSettingsProps) => {
    const [config, setConfig] = useState({
        url: node.data.url || '',
        caption: node.data.caption || '',
        filename: node.data.filename || '',
        mediaType: node.data.mediaType || 'image',
    });
    const [inputType, setInputType] = useState<'upload' | 'url'>('upload');
    const [copied, setCopied] = useState(false);
    const captionRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setConfig(prev => ({ ...prev, ...node.data }));
        if (node.data.url && node.data.url.startsWith('http') && !node.data.url.includes('firebase')) {
            setInputType('url');
        }
    }, [node.data]);

    const handleUpdate = (data: any) => {
        const newConfig = { ...config, ...data };
        setConfig(newConfig);
        updateNodeConfig(node.id, newConfig);
    };
    
    // Auto-detect media type from URL or MimeType
    const detectMediaType = (filenameOrMime: string) => {
        const lower = filenameOrMime.toLowerCase();
        if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/) || lower.startsWith('image/')) return 'image';
        if (lower.match(/\.(mp4|3gp|mov|avi|mkv)$/) || lower.startsWith('video/')) return 'video';
        if (lower.match(/\.(mp3|aac|ogg|wav|m4a)$/) || lower.startsWith('audio/')) return 'audio';
        return 'document';
    };

    const handleUploadSuccess = (url: string, filename: string, fileType: string) => {
        const type = detectMediaType(fileType || filename);
        handleUpdate({ url, filename, mediaType: type });
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        const type = detectMediaType(url);
        // Try to extract filename from URL
        const filename = url.split('/').pop()?.split('?')[0] || 'archivo_externo';
        handleUpdate({ url, filename, mediaType: type });
    };

    // --- Rich Text Logic for Caption ---
    const insertText = (textToInsert: string, wrap: boolean = false) => {
        if (!captionRef.current) return;
        const start = captionRef.current.selectionStart;
        const end = captionRef.current.selectionEnd;
        const text = config.caption || '';
        let newText = '';
        
        if (wrap) {
            const selectedText = text.substring(start, end);
            newText = text.substring(0, start) + textToInsert + selectedText + textToInsert + text.substring(end);
        } else {
            newText = text.substring(0, start) + textToInsert + text.substring(end);
        }
        
        handleUpdate({ caption: newText });
        setTimeout(() => captionRef.current?.focus(), 0);
    };

    const copyToClipboard = () => {
        if (!config.url) return;
        navigator.clipboard.writeText(config.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const verifyUrl = () => {
        if (config.url) window.open(config.url, '_blank');
    };

    return (
        <SettingsSection title="🖼️ Mensaje Multimedia">
            
            {/* 1. Selección de Origen */}
            <Tabs value={inputType} onValueChange={(v) => setInputType(v as 'upload' | 'url')} className="w-full mb-6">
                <TabsList className="grid w-full grid-cols-2 bg-neutral-900">
                    <TabsTrigger value="upload">Subir Archivo</TabsTrigger>
                    <TabsTrigger value="url">Usar URL Pública</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="mt-4">
                    <div className="mb-4 p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                        <p className="text-[10px] text-neutral-400 leading-relaxed mb-2">
                           <ImageIcon size={10} className="inline mr-1" /> Imágen, <Film size={10} className="inline mr-1" /> Video (MP4/MOV), <Music size={10} className="inline mr-1" /> Audio o <FileText size={10} className="inline mr-1" /> Documento.
                        </p>
                        <FileUploader onUploadSuccess={handleUploadSuccess} initialUrl={config.url} initialFilename={config.filename} />
                    </div>
                </TabsContent>
                
                <TabsContent value="url" className="mt-4 space-y-3">
                    <Field label="Enlace directo del archivo" htmlFor="media-url">
                        <div className="flex gap-2">
                            <Input 
                                id="media-url" 
                                placeholder="https://ejemplo.com/imagen.jpg" 
                                value={config.url} 
                                onChange={handleUrlChange}
                                className="font-mono text-[10px] h-9 bg-neutral-900 border-neutral-800"
                            />
                            <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={copyToClipboard}
                                className="h-9 w-9 border-neutral-800 hover:bg-neutral-800 shrink-0"
                                title="Copiar Enlace"
                            >
                                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14}/>}
                            </Button>
                        </div>
                        {config.url && !config.url.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv|3gp|mp3|wav|ogg|m4a|aac|pdf|doc|docx|xls|xlsx|txt|csv)$/i) && !config.url.includes('firebasestorage') && (
                            <div className="mt-3 p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg space-y-2">
                                <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                                    <AlertTriangle size={14} />
                                    <span>¿Es un enlace de redes sociales?</span>
                                </div>
                                <p className="text-[10px] text-blue-300 leading-relaxed">
                                    Los enlaces de <b>YouTube, TikTok o Instagram</b> no son archivos directos. 
                                    Para que el bot los envíe con vista previa, utiliza un nodo de <b>Mensaje de Texto</b> en su lugar.
                                </p>
                            </div>
                        )}
                    </Field>
                </TabsContent>
            </Tabs>

            {/* 2. Previsualización y Renombrado (Solo si hay URL) */}
            {config.url && (
                <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-3 mb-6 space-y-3 overflow-hidden">
                    <div className="flex items-start gap-3 overflow-hidden">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 bg-black rounded border border-neutral-800 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer group relative" onClick={verifyUrl}>
                            {config.mediaType === 'image' ? (
                                <img src={config.url} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            ) : config.mediaType === 'video' ? (
                                <Film size={24} className="text-blue-400" />
                            ) : config.mediaType === 'audio' ? (
                                <Music size={24} className="text-pink-400" />
                            ) : (
                                <FileText size={24} className="text-orange-400" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <LinkIcon size={14} className="text-white" />
                            </div>
                        </div>

                        {/* Metadata Editor */}
                        <div className="flex-1 min-w-0 space-y-2 overflow-hidden">
                            <div className="flex items-center justify-between gap-2 overflow-hidden">
                                <Badge variant="outline" className="uppercase text-[9px] tracking-wider bg-neutral-900 border-neutral-700 shrink-0">
                                    {config.mediaType}
                                </Badge>
                                <span className="text-[10px] text-neutral-500 font-mono truncate select-none hover:text-neutral-400 text-right flex-1">
                                    {config.url}
                                </span>
                            </div>

                            {/* Warning for non-direct links */}
                            {config.url && !config.url.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv|3gp|mp3|wav|ogg|m4a|aac|pdf|doc|docx|xls|xlsx|txt|csv)$/i) && !config.url.includes('firebasestorage') && (
                                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-950/30 border border-blue-900/50 rounded text-[9px] text-blue-400">
                                    <LinkIcon size={10} />
                                    <span>Se detectó un link externo. Los archivos directos funcionan mejor aquí.</span>
                                </div>
                            )}
                            
                            <div className="relative">
                                <Edit2 size={12} className="absolute left-2 top-2.5 text-neutral-500" />
                                <Input 
                                    value={config.filename} 
                                    onChange={(e) => handleUpdate({ filename: e.target.value })}
                                    className="h-8 pl-7 text-xs font-medium bg-neutral-900 border-neutral-800 focus:border-purple-500"
                                    placeholder="Nombre del archivo..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Editor de Caption (Solo para Image/Video/Doc) */}
            {['image', 'video', 'document'].includes(config.mediaType) && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs font-semibold text-neutral-400">Pie de Foto (Caption)</Label>
                        
                        {/* Mini Toolbar */}
                        <div className="flex bg-neutral-800 rounded-md border border-neutral-700 p-0.5">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertText('*', true)}><Bold size={12}/></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertText('_', true)}><Italic size={12}/></Button>
                            
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6"><Smile size={12}/></Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-none" align="end">
                                    <EmojiPicker onEmojiClick={(e) => insertText(e.emoji)} theme={Theme.DARK} height={300} width={280} />
                                </PopoverContent>
                            </Popover>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-purple-400"><Code size={12}/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-neutral-900 border-neutral-700">
                                    {COMMON_VARIABLES.map(v => (
                                        <DropdownMenuItem key={v.value} onClick={() => insertText(v.value)} className="cursor-pointer text-xs">
                                            {v.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <Textarea 
                        ref={captionRef}
                        id="media-caption" 
                        value={config.caption || ''} 
                        onChange={(e) => handleUpdate({ caption: e.target.value })} 
                        placeholder="Escribe una descripción..." 
                        className="h-[120px] text-[13px] leading-relaxed resize-none bg-neutral-900 border-neutral-700/50 scrollbar-thin scrollbar-thumb-neutral-800/40 scrollbar-track-transparent pr-2"
                    />
                </div>
            )}
        </SettingsSection>
    );
};
