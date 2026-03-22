// src/app/cso/automation/chatbots/[id]/page.tsx
'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ChatbotCanvas from '@/components/ChatbotCanvas';
import { Loader2, ArrowLeft, Cloud, Check, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function FlowPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [chatbotName, setChatbotName] = useState('Cargando...');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const chatbotId = params.id as string;
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const saveData = useCallback(async (currentNodes: Node[], currentEdges: Edge[], name: string) => {
    if (!chatbotId) return;

    setSaveStatus('saving');
    try {
      const chatbotRef = doc(db, 'chatbots', chatbotId);
      const edgesToSave = currentEdges.map(({ selected, ...edge }) => edge);

      await setDoc(chatbotRef, {
        name: name,
        flow: {
          nodes: currentNodes,
          edges: edgesToSave,
        }
      }, { merge: true });

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error("Error al guardar:", error);
      setSaveStatus('error');
    }
  }, [chatbotId]);

  useEffect(() => {
    const fetchChatbotData = async () => {
      if (!chatbotId) {
        setIsLoading(false);
        setChatbotName('ID de chatbot no encontrado');
        return;
      }

      setIsLoading(true);
      const docRef = doc(db, 'chatbots', chatbotId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setChatbotName(data.name || 'Mi Chatbot');

        const flowData = data.flow || {};
        const savedNodes = flowData.nodes || [];
        const savedEdges = (flowData.edges || []).map(({ animated, style, ...edge }: any) => ({
          ...edge,
          type: 'custom',
        }));

        setNodes(Array.isArray(savedNodes) ? savedNodes : []);
        setEdges(Array.isArray(savedEdges) ? savedEdges : []);

      } else {
        console.log('No se encontró el documento, creando un chatbot de inicio.');
        setChatbotName('Nuevo Chatbot');
        const startNodes = [{ id: '1', type: 'startNode', position: { x: 250, y: 5 }, data: { label: 'Inicio' } }];
        setNodes(startNodes);
        setEdges([]);
        saveData(startNodes, [], 'Nuevo Chatbot');
      }
      setIsLoading(false);
    };

    fetchChatbotData();
  }, [chatbotId, saveData]);

  // Efecto de Auto-guardado (Triggered by nodes/edges/name changes)
  useEffect(() => {
    if (isLoading) return;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      // Solo guardar si hay contenido
      if (nodes.length > 0 || edges.length > 0) {
        saveData(nodes, edges, chatbotName);
      }
    }, 1500);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [nodes, edges, chatbotName, saveData, isLoading]);

  const onNodesChange: OnNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange: OnEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
  const onConnect: OnConnect = useCallback((connection) => setEdges((eds) => addEdge({ ...connection, type: 'custom' }, eds)), [setEdges]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-900 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-neutral-500" />
        <p className="ml-4 text-lg">Cargando chatbot...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col h-screen bg-neutral-900 text-white overflow-hidden">
      <style jsx global>{`
        html, body {
          overflow: hidden !important;
          height: 100% !important;
          width: 100% !important;
          position: fixed;
        }
      `}</style>
      
      {/* HEADER BAR */}
      <div className="h-14 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-4 z-20 shrink-0">

        {/* Izquierda: Volver y Nombre */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/nucleo/udreamms/cto/automation/chatbots')}
            className="text-neutral-400 hover:text-white hover:bg-neutral-800"
            title="Volver a mis bots"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center group">
            <Input
              value={chatbotName}
              onChange={(e) => setChatbotName(e.target.value)}
              className="bg-transparent border-transparent hover:border-neutral-700 focus:border-neutral-600 focus:bg-neutral-900 text-lg font-medium text-white w-[300px] h-9 px-2 transition-all"
              placeholder="Nombre del Chatbot"
            />
            <span className="opacity-0 group-hover:opacity-100 text-neutral-600 text-[10px] ml-2 transition-opacity uppercase tracking-wider font-medium">
              Editar
            </span>
          </div>
        </div>

        {/* Derecha: Estado de Guardado */}
        <div className="flex items-center gap-3">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-2 text-neutral-400 text-sm animate-pulse">
              <Cloud className="w-4 h-4" />
              <span>Guardando...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-2 text-green-500 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <Check className="w-4 h-4" />
              <span>Guardado</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <Save className="w-4 h-4" />
              <span>Error al guardar</span>
            </div>
          )}
          {saveStatus === 'idle' && (
            <div className="flex items-center gap-2 text-neutral-600 text-sm">
              <Cloud className="w-4 h-4" />
              <span>Al día</span>
            </div>
          )}
        </div>
      </div>

      {/* CANVAS AREA */}
      <div className="flex-1 min-h-0 relative w-full">
        <ChatbotCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          setNodes={setNodes}
          setEdges={setEdges}
        />
      </div>
    </div>
  );
}

export default FlowPage;
