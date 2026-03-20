// src/components/ChatbotCanvas.tsx
'use client';
import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    Edge,
    Node,
    BackgroundVariant,
    OnNodesChange,
    OnEdgesChange,
    ReactFlowInstance,
    OnConnect,
    ReactFlowProvider,
    updateEdge,
    Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Button } from './ui/button';
import * as nodeComponents from './CustomNodes';
import CustomEdge from './CustomEdge';
import SettingsPanel from './SettingsPanel';
import {
    Menu, MessageSquare, Image as ImageIcon, Zap, Rows, Edit2, AlertTriangle, Code, Variable, StopCircle, ChevronLeft,
    CheckSquare, Contact, MapPin, BrainCircuit, Bot, Database, Clock, ShoppingCart, CreditCard,
    Rocket, Mic, Smile, Users, ThumbsUp, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// --- STATIC CONFIGURATION (DEFINED OUTSIDE COMPONENT) ---
// This prevents React Flow warning #002 about unnecessary re-renders.

const nodeTypes = {
    startNode: nodeComponents.StartNode,
    endNode: nodeComponents.EndNode,
    textMessageNode: nodeComponents.TextMessageNode,
    mediaMessageNode: nodeComponents.MediaMessageNode,
    quickReplyNode: nodeComponents.QuickReplyNode,
    listMessageNode: nodeComponents.ListMessageNode,
    pollNode: nodeComponents.PollNode,
    contactNode: nodeComponents.ContactNode,
    locationNode: nodeComponents.LocationNode,
    captureInputNode: nodeComponents.CaptureInputNode,
    conditionNode: nodeComponents.ConditionNode,
    setVariableNode: nodeComponents.SetVariableNode,
    webhookNode: nodeComponents.WebhookNode,
    firestoreReadWriteNode: nodeComponents.FirestoreReadWriteNode,
    delayNode: nodeComponents.DelayNode,
    catalogNode: nodeComponents.CatalogNode,
    productNode: nodeComponents.ProductNode,
    kambanFlowsNode: nodeComponents.kambanFlowsNode,
    checkoutNode: nodeComponents.CheckoutNode,
    generativeAINode: nodeComponents.GenerativeAINode,
    transcriptionNode: nodeComponents.TranscriptionNode,
    sentimentAnalysisNode: nodeComponents.SentimentAnalysisNode,
    templateNode: nodeComponents.TemplateNode,
    humanHandoffNode: nodeComponents.HumanHandoffNode,
};

const edgeTypes = {
    custom: CustomEdge,
};

const sidebarNodeGroups = [
    {
        title: 'Mensajería y UI',
        nodes: [
            { type: 'textMessageNode', label: 'Mensaje de Texto', icon: <MessageSquare className="text-blue-400" /> },
            { type: 'mediaMessageNode', label: 'Mensaje Multimedia', icon: <ImageIcon className="text-yellow-400" /> },
            { type: 'quickReplyNode', label: 'Respuesta Rápida', icon: <Zap className="text-purple-400" /> },
            { type: 'listMessageNode', label: 'Mensaje de Lista', icon: <Rows className="text-indigo-400" /> },
            { type: 'pollNode', label: 'Encuesta Nativa', icon: <CheckSquare className="text-teal-400" />, disabled: true },
            { type: 'contactNode', label: 'Contacto (VCard)', icon: <Contact className="text-orange-400" />, disabled: true },
            { type: 'locationNode', label: 'Ubicación', icon: <MapPin className="text-red-400" />, disabled: true },
        ]
    },
    {
        title: 'Lógica y Procesamiento',
        nodes: [
            { type: 'captureInputNode', label: 'Capturar Entrada', icon: <Edit2 className="text-cyan-400" /> },
            { type: 'conditionNode', label: 'Condición (If/Else)', icon: <BrainCircuit className="text-amber-400" />, disabled: true },
            { type: 'setVariableNode', label: 'Asignar Variable', icon: <Variable className="text-lime-400" />, disabled: true },
            { type: 'webhookNode', label: 'Webhook', icon: <Code className="text-pink-400" />, disabled: true },
            { type: 'firestoreReadWriteNode', label: 'Consulta Firestore', icon: <Database className="text-gray-400" />, disabled: true },
            { type: 'delayNode', label: 'Espera / Delay', icon: <Clock className="text-gray-400" />, disabled: true },
            { type: 'endNode', label: 'Fin de Flujo', icon: <StopCircle className="text-red-500" /> },
        ]
    },
    {
        title: 'Comercio y Ventas',
        nodes: [
            { type: 'catalogNode', label: 'Catálogo de Productos', icon: <ShoppingCart className="text-green-400" />, disabled: true },
            { type: 'productNode', label: 'Producto Único/Múltiple', icon: <CreditCard className="text-green-400" />, disabled: true },
            { type: 'kambanFlowsNode', label: 'kamban Flows', icon: <Rocket className="text-green-400" />, disabled: true },
            { type: 'checkoutNode', label: 'Nodo de Pago', icon: <ThumbsUp className="text-green-400" />, disabled: true },
        ]
    },
    {
        title: 'Inteligencia Artificial',
        nodes: [
            { type: 'generativeAINode', label: 'IA Generativa (LLM)', icon: <Bot className="text-sky-400" />, disabled: true },
            { type: 'transcriptionNode', label: 'Transcripción (Audio)', icon: <Mic className="text-sky-400" />, disabled: true },
            { type: 'sentimentAnalysisNode', label: 'Análisis de Sentimiento', icon: <Smile className="text-sky-400" />, disabled: true },
        ]
    },
    {
        title: 'Gestión y Soporte',
        nodes: [
            { type: 'templateNode', label: 'Plantillas (Templates)', icon: <Send className="text-fuchsia-400" />, disabled: true },
            { type: 'humanHandoffNode', label: 'Transferencia a Humano', icon: <Users className="text-fuchsia-400" />, disabled: true },
        ]
    }
];
const sidebarNodes = sidebarNodeGroups.flatMap(group => group.nodes);


export interface ChatbotCanvasRef { }
interface ChatbotCanvasProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

interface SidebarNodeProps {
    icon: React.ReactElement;
    label: string;
    type: string;
    onDragStart: (event: React.DragEvent, nodeType: string) => void;
    isCollapsed: boolean;
    disabled?: boolean;
}

const SidebarNode = ({ icon, label, type: nodeType, onDragStart, isCollapsed, disabled }: SidebarNodeProps) => {
    const nodeContent = (
        <div
            className={cn(
                "flex items-center p-2 mb-0.5 rounded-md transition-all group",
                disabled ? "opacity-30 grayscale cursor-not-allowed" : "cursor-grab hover:bg-white/5",
                isCollapsed && "justify-center"
            )}
            onDragStart={disabled ? undefined : (event) => onDragStart(event, nodeType)}
            draggable={!disabled}
        >
            <div className="text-neutral-500 group-hover:text-blue-400 transition-colors">
                {React.cloneElement(icon, { size: 16 } as any)}
            </div>
            <span className={cn("ml-2.5 text-[11px] font-bold text-neutral-400 group-hover:text-white transition-colors uppercase tracking-tight", isCollapsed && "hidden")}>
                {label}
            </span>
        </div>
    );

    return isCollapsed ? (
        <Tooltip>
            <TooltipTrigger asChild>{nodeContent}</TooltipTrigger>
            <TooltipContent side="right" className="bg-neutral-800 text-white border-neutral-700">
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    ) : (
        nodeContent
    );
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 320; // Matches NodeWrapper width roughly
const nodeHeight = 160;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 80 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return {
        layoutedNodes: nodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);

            return {
                ...node,
                targetPosition: isHorizontal ? Position.Left : Position.Top,
                sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
                position: {
                    x: nodeWithPosition.x - nodeWidth / 2,
                    y: nodeWithPosition.y - nodeHeight / 2,
                },
            };
        }),
        layoutedEdges: edges,
    };
};

const ChatbotCanvas = forwardRef<ChatbotCanvasRef, ChatbotCanvasProps>(
    ({ nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, setEdges }, ref) => {

        // nodeTypes and edgeTypes are now defined OUTSIDE the component
        // No useMemo needed inside here anymore.

        const [selectedNode, setSelectedNode] = useState<Node | null>(null);
        const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
        const [isLeftSidebarOpen, setLeftSidebarOpen] = useState(true);
        const [isRightSidebarOpen, setRightSidebarOpen] = useState(false);

        const onLayout = useCallback(
            (direction: string) => {
                const { layoutedNodes, layoutedEdges } = getLayoutedElements(
                    nodes,
                    edges,
                    direction
                );

                setNodes([...layoutedNodes]);
                setEdges([...layoutedEdges]);
            },
            [nodes, edges, setNodes, setEdges]
        );

        const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);

        const onDrop = useCallback(
            (event) => {
                event.preventDefault();
                const type = event.dataTransfer.getData('application/reactflow');
                if (typeof type === 'undefined' || !type || !reactFlowInstance) return;

                const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
                const newNodeData = sidebarNodes.find(n => n.type === type);
                const newNode: Node = { id: `dndnode_${+new Date()}`, type, position, data: { label: newNodeData?.label || 'Nuevo Nodo' } };
                setNodes((nds) => nds.concat(newNode));
            },
            [reactFlowInstance, setNodes],
        );

        const onEdgeUpdate = useCallback(
            (oldEdge, newConnection) => setEdges((els) => updateEdge(oldEdge, newConnection, els)),
            [setEdges]
        );

        const onNodeClick = (_: React.MouseEvent, node: Node) => {
            setSelectedNode(node);
            setRightSidebarOpen(true);
        };

        const onPaneClick = () => {
            setSelectedNode(null);
            setRightSidebarOpen(false);
        };

        const updateNodeConfig = useCallback((nodeId: string, data: object) => {
            setNodes((nds) =>
                nds.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node))
            );
            if (selectedNode?.id === nodeId) {
                setSelectedNode(prev => ({ ...prev!, data: { ...prev!.data, ...data } }));
            }
        }, [selectedNode, setNodes]);

        const onNodesDelete = useCallback(
            (deletedNodes: Node[]) => {
                const deletedNodeIds = new Set(deletedNodes.map((n) => n.id));
                if (selectedNode && deletedNodeIds.has(selectedNode.id)) {
                    setSelectedNode(null);
                    setRightSidebarOpen(false);
                }
            },
            [selectedNode]
        );

        const deleteNode = useCallback((nodeId: string) => {
            setNodes((nds) => nds.filter((node) => node.id !== nodeId));
            setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
            setSelectedNode(null);
            setRightSidebarOpen(false);
        }, [setNodes, setEdges]);

        useImperativeHandle(ref, () => ({}));

        return (
            <div className="flex h-full bg-neutral-950 overflow-hidden">
                <aside className={cn(
                    "bg-neutral-950/90 backdrop-blur-md p-4 border border-neutral-800/50 transition-all duration-300 ease-in-out my-6 ml-4 shadow-2xl rounded-2xl flex flex-col",
                    isLeftSidebarOpen ? "w-56" : "w-16"
                )}>
                    <div className="flex items-center justify-between mb-4 h-8 flex-shrink-0">
                        <h2 className={cn("text-[10px] font-black text-neutral-500 uppercase tracking-widest", !isLeftSidebarOpen && "hidden")}>Library</h2>
                        <div className="flex items-center gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onLayout('LR')}
                                        className={cn("hover:bg-neutral-800 text-neutral-400 hover:text-white", !isLeftSidebarOpen && "hidden")}
                                    >
                                        <Zap className="h-4 w-4 text-amber-400" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-neutral-800 text-white border-neutral-700">
                                    <p>Auto-organizar (L-R)</p>
                                </TooltipContent>
                            </Tooltip>
                            <Button variant="ghost" size="icon" onClick={() => setLeftSidebarOpen(!isLeftSidebarOpen)} className="hover:bg-neutral-800 text-neutral-400 hover:text-white">
                                {isLeftSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>
                    <div className="overflow-y-auto h-[calc(100%-3rem)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                        {sidebarNodeGroups.map((group, index) => (
                            <div key={index}>
                                <h3 className={cn("text-[9px] font-black text-white/20 uppercase tracking-[2px] mb-3 mt-6 border-b border-white/5 pb-1", isLeftSidebarOpen ? "px-1" : "text-center")}>
                                    {isLeftSidebarOpen ? group.title : "•"}
                                </h3>
                                {group.nodes.map(nodeInfo => (
                                    <SidebarNode key={nodeInfo.type} {...nodeInfo} onDragStart={(e, type) => e.dataTransfer.setData('application/reactflow', type)} isCollapsed={!isLeftSidebarOpen} />
                                ))}
                            </div>
                        ))}
                    </div>
                </aside>

                <div className="flex-1 relative" onDrop={onDrop} onDragOver={onDragOver}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onEdgeUpdate={onEdgeUpdate}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        onNodesDelete={onNodesDelete}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        onInit={setReactFlowInstance}
                        fitView
                        snapToGrid
                        snapGrid={[20, 20]}
                        className="bg-neutral-950"
                    >
                        <Controls className="[&>button]:bg-neutral-800/80 [&>button]:border-neutral-700 hover:[&>button]:bg-neutral-700" />
                        <MiniMap nodeStrokeWidth={3} zoomable pannable className="!bg-neutral-900/80 !border-neutral-700" />
                        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#2d2d2d" />
                    </ReactFlow>
                </div>

                <SettingsPanel
                    selectedNode={selectedNode}
                    allNodes={nodes}
                    updateNodeConfig={updateNodeConfig}
                    deleteNode={deleteNode}
                    isOpen={isRightSidebarOpen}
                    onToggle={() => setRightSidebarOpen(o => !o)}
                />
            </div>
        );
    });
ChatbotCanvas.displayName = 'ChatbotCanvas';

const ChatbotCanvasWithProvider = forwardRef<ChatbotCanvasRef, ChatbotCanvasProps>((props, ref) => (
    <TooltipProvider delayDuration={0}>
        <ReactFlowProvider>
            <ChatbotCanvas {...props} ref={ref} />
        </ReactFlowProvider>
    </TooltipProvider>
));
ChatbotCanvasWithProvider.displayName = 'ChatbotCanvasWithProvider';

export default ChatbotCanvasWithProvider;

