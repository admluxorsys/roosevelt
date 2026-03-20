
// src/components/CustomNodes.tsx
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
    MessageSquare, Edit2, Zap, AlertTriangle, CheckCircle, Code, Variable,
    StopCircle, Rows, ImageIcon, CheckSquare, Contact, MapPin, BrainCircuit,
    Database, Clock, ShoppingCart, CreditCard, Rocket, Mic, Smile, Users, ThumbsUp, Send, Bot,
    Mail, Phone, Calendar, FileText, Video
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// --- COMPONENTES BASE MEJORADOS CON TAILWIND ---

interface NodeWrapperProps {
    children: React.ReactNode;
    header: string;
    icon: React.ReactNode;
    label?: string;
    color: string; // Tailwind color class e.g., 'border-blue-500'
}

const NodeWrapper = ({ children, header, icon, label, color }: NodeWrapperProps) => (
    <div className={cn("rounded-[1.2rem] shadow-xl border bg-black/80 backdrop-blur-xl w-[20rem] hover:scale-[1.01] transition-all duration-300", color)}>
        {/* HEADER */}
        <div className={cn("px-4 py-3 rounded-t-[1.1rem] flex items-center gap-3 border-b border-white/5", color.replace('border-', 'bg-').replace('-500', '-500/10'))}>
            <div className={cn("p-2 rounded-lg bg-white/5 ring-1 ring-inset ring-white/10 shadow-inner scale-90")}>{icon}</div>
            <div className="flex-grow">
                <p className="font-bold text-white text-sm tracking-tight">{label || header}</p>
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{header}</p>
            </div>
            {/* Visual Indicator for 'Maximized' feel */}
            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50 animate-pulse"></div>
        </div>

        {/* CONTENT */}
        <div className="p-3 text-xs text-neutral-300 space-y-2 bg-gradient-to-b from-transparent to-white/[0.02]">
            {children}
        </div>
    </div>
);

// --- CORRECCIÓN DEL ERROR DE BUILD ---
// Se añade 'id = undefined' para que el prop 'id' sea opcional.
// React Flow internamente asignará un id 'null' si no se provee uno, lo cual es válido.
const HandleStyled = ({ type, position, id = undefined, ...props }) => (
    <Handle
        type={type}
        position={position}
        id={id}
        className="!w-3 !h-3 !bg-neutral-600 !border-2 !border-neutral-800 hover:!bg-blue-500 hover:!border-white transition-all"
        {...props}
    />
);

const OptionRow = ({ children, handleId }) => (
    <div className="flex justify-between items-center p-2 rounded-md bg-neutral-700/80 relative">
        <span className="truncate text-xs">{children}</span>
        <HandleStyled type="source" position={Position.Right} id={handleId} />
    </div>
);


// --- NODOS ESPECÍFICOS REDISEÑADOS --- (No necesitan cambios, heredan de NodeWrapper)

export const StartNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Inicio" icon={<CheckCircle size={16} className="text-green-400" />} label={data.label} color="border-green-500">
        <p className="text-xs text-neutral-400 text-center py-2">Punto de inicio de la conversación.</p>
        <HandleStyled type="source" position={Position.Right} />
    </NodeWrapper>
);

export const EndNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Fin / Transferir" icon={<StopCircle size={16} className="text-red-400" />} label={data.label} color="border-red-500">
        <p className="text-xs text-neutral-400 text-center py-2">Finaliza el flujo del bot.</p>
        <HandleStyled type="target" position={Position.Left} />
    </NodeWrapper>
);

export const TextMessageNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Mensaje de Texto" icon={<MessageSquare size={16} className="text-blue-400" />} label={data.label} color="border-blue-500">
        <p className="text-xs text-neutral-400">Contenido:</p>
        <p className="whitespace-pre-wrap bg-neutral-900/70 p-2 rounded-md text-white max-h-28 overflow-y-auto text-xs">
            {data.content || 'Haz clic para editar el texto...'}
        </p>
        <HandleStyled type="target" position={Position.Left} />
        <HandleStyled type="source" position={Position.Right} />
    </NodeWrapper>
);

export const CaptureInputNode = ({ data = {} }: NodeProps) => {
    const iconMap: Record<string, React.ReactNode> = {
        email: <Mail size={12} className="text-purple-400" />,
        phone: <Phone size={12} className="text-blue-400" />,
        number: <Database size={12} className="text-green-400" />,
        date: <Calendar size={12} className="text-orange-400" />,
        image: <ImageIcon size={12} className="text-yellow-400" />,
    };

    return (
        <NodeWrapper header="Capturar Entrada" icon={<Edit2 size={16} className="text-cyan-400" />} label={data.label} color="border-cyan-500">
            <p className="text-xs text-neutral-400">Espera y guarda la respuesta del usuario.</p>
            <div className="space-y-2 pt-1">
                {data.variableName && (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-purple-900/30 border border-purple-800/50">
                        <Variable size={12} className="text-purple-400" />
                        <span className="text-xs font-mono text-purple-300">@{data.variableName}</span>
                    </div>
                )}
                {data.inputType && data.inputType !== 'text' && (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-neutral-900/50 border border-neutral-800">
                        {iconMap[data.inputType] || <CheckCircle size={12} className="text-neutral-500" />}
                        <span className="text-[10px] uppercase text-neutral-400 font-bold">{data.inputType}</span>
                    </div>
                )}
            </div>
            <HandleStyled type="target" position={Position.Left} />
            <HandleStyled type="source" position={Position.Right} />
        </NodeWrapper>
    );
};

export const QuickReplyNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Respuesta Rápida" icon={<Zap size={16} className="text-purple-400" />} label={data.label} color="border-purple-500">
        <p className="text-xs text-neutral-400">Texto:</p>
        <p className="whitespace-pre-wrap bg-neutral-900/70 p-2 rounded-md text-white max-h-20 overflow-y-auto text-xs">
            {data.bodyText || data.text || 'Haz clic para editar.'}
        </p>
        <div className="space-y-1.5 pt-1">
            {(data.buttons || []).filter(b => b).map((btn, i) => {
                const isObject = typeof btn === 'object' && btn !== null;
                const label = isObject ? btn.title : btn;
                const id = isObject ? (btn.id || btn.payload || btn.title) : btn;
                return (
                    <OptionRow key={i} handleId={id}>{label}</OptionRow>
                )
            })}
        </div>
        <HandleStyled type="target" position={Position.Left} />
    </NodeWrapper>
);

export const ListMessageNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Mensaje de Lista" icon={<Rows size={16} className="text-indigo-400" />} label={data.label} color="border-indigo-500">
        <p className="text-xs text-neutral-400">Texto Principal:</p>
        <p className="whitespace-pre-wrap bg-neutral-900/70 p-2 rounded-md text-white max-h-20 overflow-y-auto text-xs">
            {data.body || data.text || 'Haz clic para editar.'}
        </p>
        {(data.sections || []).map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-1.5 pt-1">
                <p className="text-xs text-indigo-300 font-semibold">{section.title || `Sección ${sectionIndex + 1}`}</p>
                {(section.rows || section.options || []).map((opt, optIndex) => {
                    const isObject = typeof opt === 'object' && opt !== null;
                    const label = isObject ? opt.title : opt;
                    const id = isObject ? opt.id : opt;
                    return (
                        <OptionRow key={optIndex} handleId={id}>{label || `Opción ${optIndex + 1}`}</OptionRow>
                    );
                })}
            </div>
        ))}
        <HandleStyled type="target" position={Position.Left} />
    </NodeWrapper>
);

export const MediaMessageNode = ({ data = {} }: NodeProps) => {
    const isImage = data.mediaType === 'image' || (data.url && /\.(jpg|jpeg|png|gif|webp)/i.test(data.url));
    const isVideo = data.mediaType === 'video' || (data.url && /\.(mp4|webm|ogg)/i.test(data.url));
    const isAudio = data.mediaType === 'audio' || (data.url && /\.(mp3|wav|ogg)/i.test(data.url));

    const getIcon = () => {
        if (isImage) return <ImageIcon size={16} className="text-yellow-400" />;
        if (isVideo) return <Video size={16} className="text-red-400" />;
        if (isAudio) return <Mic size={16} className="text-blue-400" />;
        return <FileText size={16} className="text-neutral-400" />;
    };

    return (
        <NodeWrapper 
            header="Mensaje Multimedia" 
            icon={getIcon()} 
            label={data.label} 
            color="border-yellow-500"
        >
            <div className="space-y-3">
                {!data.url ? (
                    <p className="text-[10px] text-neutral-500 italic text-center py-2 border border-dashed border-neutral-800 rounded-lg">
                        Sin archivo seleccionado
                    </p>
                ) : (
                    <>
                        {isImage && data.url && (
                            <div className="relative group overflow-hidden rounded-lg border border-white/5 shadow-inner bg-neutral-900">
                                <img 
                                    src={data.url} 
                                    alt="Preview" 
                                    className="w-full h-24 object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                        )}
                        
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-900/80 border border-white/5 group hover:border-yellow-500/30 transition-colors">
                            <div className="shrink-0">
                                {isImage ? <ImageIcon size={14} className="text-yellow-500/70" /> : 
                                 isVideo ? <Video size={14} className="text-red-500/70" /> :
                                 isAudio ? <Mic size={14} className="text-blue-500/70" /> :
                                 <FileText size={14} className="text-neutral-500" />}
                            </div>
                            <p className="text-[9px] font-medium text-neutral-300 truncate flex-1">
                                {data.filename || 'Archivo sin nombre'}
                            </p>
                        </div>
                    </>
                )}

                {data.caption && (
                    <div className="relative pt-1">
                        <div className="absolute left-0 top-1 bottom-0 w-0.5 bg-yellow-500/40 rounded-full" />
                        <p className="text-[10px] text-neutral-400 leading-relaxed pl-3 italic">
                            "{data.caption}"
                        </p>
                    </div>
                )}
            </div>
            <HandleStyled type="target" position={Position.Left} />
            <HandleStyled type="source" position={Position.Right} />
        </NodeWrapper>
    );
};

export const ConditionNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Condición" icon={<BrainCircuit size={16} className="text-amber-400" />} label={data.label} color="border-amber-500">
        <p className="text-xs text-neutral-400">Bifurca el flujo según reglas.</p>
        <div className="space-y-1.5 pt-1">
            {(data.routes || []).map((route: any) => (
                <OptionRow key={route.id} handleId={route.id}>
                    {route.label || 'Caso'}
                </OptionRow>
            ))}
            <OptionRow handleId="else">{data.defaultLabel || 'Si no coincide (Else)'}</OptionRow>
        </div>
        <HandleStyled type="target" position={Position.Left} />
    </NodeWrapper>
);

export const WebhookNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Webhook" icon={<Code size={16} className="text-pink-400" />} label={data.label} color="border-pink-500">
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] font-bold bg-pink-900/20 text-pink-400 border-pink-900/50 px-1.5">
                    {data.method || 'POST'}
                </Badge>
                <p className="text-[10px] text-neutral-400 truncate max-w-[180px] font-mono">
                    {data.url?.replace('https://', '') || 'URL no definida'}
                </p>
            </div>
            <div className="space-y-1 pt-1">
                <OptionRow handleId="success">Éxito</OptionRow>
                <OptionRow handleId="failure">Fallo</OptionRow>
            </div>
        </div>
        <HandleStyled type="target" position={Position.Left} />
    </NodeWrapper>
);

export const SetVariableNode = ({ data = {} }: NodeProps) => {
    // Generar resumen visual de la operación (mismo que en settings pero simplificado)
    const getSummary = () => {
        const v = data.variableName || 'var';
        const val = data.value || '?';
        const cat = data.operationCategory || 'set';

        if (cat === 'math') return `${v} = ${v} ${data.operation === 'add' ? '+' : data.operation === 'subtract' ? '-' : '*'} ${val}`;
        if (cat === 'list') return `${v}.push(${val})`;
        return `${v} = ${val}`;
    };

    return (
        <NodeWrapper header="Asignar Variable" icon={<Variable size={16} className="text-lime-400" />} label={data.label} color="border-lime-500">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-neutral-900 border border-neutral-800">
                <Variable size={14} className="text-lime-400" />
                <p className="font-mono text-xs text-lime-300 truncate">{getSummary()}</p>
            </div>
            <HandleStyled type="target" position={Position.Left} />
            <HandleStyled type="source" position={Position.Right} />
        </NodeWrapper>
    );
};

// --- NUEVOS NODOS (PLACEHOLDERS) ---

export const PollNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Encuesta Nativa" icon={<CheckSquare size={16} className="text-teal-400" />} label={data.label} color="border-teal-500">
        <p className="text-xs text-neutral-400">Pregunta:</p>
        <p className="whitespace-pre-wrap bg-neutral-900/70 p-2 rounded-md text-white max-h-20 overflow-y-auto text-xs mb-2">
            {data.question || 'Escribe tu pregunta...'}
        </p>
        <div className="space-y-1">
            {(data.options || []).map((opt: any, i: number) => (
                <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-neutral-700/50 text-[10px]">
                    <CheckSquare size={10} className="text-teal-400" />
                    <span className="truncate">{opt.text || `Opción ${i + 1}`}</span>
                </div>
            ))}
        </div>
        <HandleStyled type="target" position={Position.Left} />
        <HandleStyled type="source" position={Position.Right} />
    </NodeWrapper>
);

export const ContactNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Contacto (VCard)" icon={<Contact size={16} className="text-orange-400" />} label={data.label} color="border-orange-500">
        <div className="space-y-1">
            <p className="text-xs font-bold text-white truncate">{data.formattedName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Nuevo Contacto'}</p>
            {data.organization && <p className="text-[10px] text-neutral-400 truncate">{data.organization}</p>}
            {data.phones?.[0]?.number && <p className="text-[10px] text-orange-400 font-mono italic">{data.phones[0].number}</p>}
        </div>
        <HandleStyled type="target" position={Position.Left} />
        <HandleStyled type="source" position={Position.Right} />
    </NodeWrapper>
);

export const LocationNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Ubicación" icon={<MapPin size={16} className="text-red-400" />} label={data.label} color="border-red-500">
        <div className="space-y-1">
            <p className="text-xs font-bold text-white truncate">{data.name || 'Sin nombre'}</p>
            <p className="text-[10px] text-neutral-400 line-clamp-2">{data.address || 'Sin dirección'}</p>
            {data.latitude && data.longitude && (
                <p className="text-[9px] font-mono text-neutral-500">{data.latitude}, {data.longitude}</p>
            )}
        </div>
        <HandleStyled type="target" position={Position.Left} />
        <HandleStyled type="source" position={Position.Right} />
    </NodeWrapper>
);

export const FirestoreReadWriteNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Consulta Firestore" icon={<Database size={16} className="text-gray-400" />} label={data.label} color="border-gray-500">
        <p className="text-xs text-neutral-400">Lee o escribe en la base de datos.</p>
        <HandleStyled type="target" position={Position.Left} />
        <HandleStyled type="source" position={Position.Right} />
    </NodeWrapper>
);

export const DelayNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Espera / Delay" icon={<Clock size={16} className="text-gray-400" />} label={data.label} color="border-gray-500">
        <div className="flex flex-col items-center justify-center py-2 gap-1 px-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
            <span className="text-xl font-bold text-white font-mono">
                {data.mode === 'random' ? `${data.minSeconds || 1}-${data.maxSeconds || 3}` : (data.durationSeconds || 2)}s
            </span>
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">{data.mode === 'random' ? 'Aleatorio' : 'Tiempo Fijo'}</span>
        </div>
        <HandleStyled type="target" position={Position.Left} />
        <HandleStyled type="source" position={Position.Right} />
    </NodeWrapper>
);

export const CatalogNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Catálogo de Productos" icon={<ShoppingCart size={16} className="text-green-400" />} label={data.label} color="border-green-500">
        <p className="text-xs text-neutral-400">Muestra un catálogo de productos.</p>
        <HandleStyled type="target" position={Position.Left} />
        <HandleStyled type="source" position={Position.Right} />
    </NodeWrapper>
);

export const ProductNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Producto Único/Múltiple" icon={<CreditCard size={16} className="text-green-400" />} label={data.label} color="border-green-500">
        <p className="text-xs text-neutral-400">Envía uno o varios productos.</p>
        <HandleStyled type="target" position={Position.Left} />
        <HandleStyled type="source" position={Position.Right} />
    </NodeWrapper>
);

export const kambanFlowsNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="kamban Flows" icon={<Rocket size={16} className="text-green-400" />} label={data.label} color="border-green-500">
        <p className="text-xs text-neutral-400">Inicia un formulario interactivo.</p>
        <HandleStyled type="target" position={Position.Left} />
        <HandleStyled type="source" position={Position.Right} />
    </NodeWrapper>
);

export const CheckoutNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Nodo de Pago" icon={<ThumbsUp size={16} className="text-green-400" />} label={data.label} color="border-green-500">
        <p className="text-xs text-neutral-400">Integra una pasarela de pago.</p>
        <HandleStyled type="target" position={Position.Left} />
        <HandleStyled type="source" position={Position.Right} />
    </NodeWrapper>
);

export const GenerativeAINode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="IA Generativa (LLM)" icon={<Bot size={16} className="text-sky-400" />} label={data.label} color="border-sky-500">
        <p className="text-xs text-neutral-400">Conecta con un modelo de lenguaje.</p>
        <HandleStyled type="target" position={Position.Left} />
        <HandleStyled type="source" position={Position.Right} />
    </NodeWrapper>
);

export const TranscriptionNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Transcripción (Audio)" icon={<Mic size={16} className="text-sky-400" />} label={data.label} color="border-sky-500">
        <p className="text-xs text-neutral-400">Convierte audio a texto.</p>
        <HandleStyled type="target" position={Position.Left} />
        <HandleStyled type="source" position={Position.Right} />
    </NodeWrapper>
);

export const SentimentAnalysisNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Análisis de Sentimiento" icon={<Smile size={16} className="text-sky-400" />} label={data.label} color="border-sky-500">
        <p className="text-xs text-neutral-400">Clasifica la emoción del usuario.</p>
        <HandleStyled type="target" position={Position.Left} />
        <HandleStyled type="source" position={Position.Right} />
    </NodeWrapper>
);

export const TemplateNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Plantillas (Templates)" icon={<Send size={16} className="text-fuchsia-400" />} label={data.label} color="border-fuchsia-500">
        <p className="text-xs text-neutral-400">Envía notificaciones aprobadas por Meta.</p>
        <HandleStyled type="target" position={Position.Left} />
        <HandleStyled type="source" position={Position.Right} />
    </NodeWrapper>
);

export const HumanHandoffNode = ({ data = {} }: NodeProps) => (
    <NodeWrapper header="Transferencia a Humano" icon={<Users size={16} className="text-fuchsia-400" />} label={data.label} color="border-fuchsia-500">
        <p className="text-xs text-neutral-400">Transfiere la conversación a un agente.</p>
        <HandleStyled type="target" position={Position.Left} />
        <HandleStyled type="source" position={Position.Right} />
    </NodeWrapper>
);

