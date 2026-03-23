
"use client";
// src/components/CsoAutomationContent.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Zap, Clock, Users, FileText, Settings, ArrowRight } from "lucide-react";
import { useRouter } from 'next/navigation';

export function CsoAutomationContent() {
  const router = useRouter();

  const features = [
    {
      icon: <FileText className="w-8 h-8 text-sky-400" />,
      title: "Respuestas Rápidas",
      description: "Crea y gestiona plantillas de mensajes para responder más rápido a las preguntas comunes.",
      action: "Gestionar Plantillas",
      href: "#"
    },
    {
      icon: <Bot className="w-8 h-8 text-emerald-400" />,
      title: "Chatbots",
      description: "Construye y despliega chatbots para gestionar conversaciones automáticamente 24/7.",
      action: "Ir a Chatbots",
      href: "/nucleo/roosevelt/cto/automation/chatbots"
    },
    {
      icon: <Zap className="w-8 h-8 text-amber-400" />,
      title: "Sugerencias de IA",
      description: "Activa sugerencias de respuesta impulsadas por IA basadas en los mensajes del cliente.",
      action: "Configurar IA",
      href: "#"
    },
    {
      icon: <Users className="w-8 h-8 text-rose-400" />,
      title: "Asignación de Chats",
      description: "Establece reglas para asignar automáticamente nuevas conversaciones a miembros específicos del equipo.",
      action: "Definir Reglas",
      href: "#"
    },
    {
      icon: <Clock className="w-8 h-8 text-indigo-400" />,
      title: "Mensajes Programados",
      description: "Gestiona y visualiza todos los mensajes que están programados para ser enviados en el futuro.",
      action: "Ver Programación",
      href: "#"
    },
    {
      icon: <Settings className="w-8 h-8 text-slate-400" />,
      title: "Flujos de Trabajo",
      description: "Crea flujos de trabajo avanzados, como añadir una etiqueta si un mensaje contiene una palabra específica.",
      action: "Crear Flujos",
      href: "#"
    }
  ];

  const handleCardClick = (href: string) => {
    if (href && href !== "#") {
      router.push(href);
    }
    // Puedes añadir un toast o alerta si el href es "#" para indicar que está en desarrollo.
  };

  return (
    <main className="flex-1 p-6 bg-neutral-950 text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Centro de Automatización</h1>
        <p className="text-neutral-400 mt-1 text-sm">
          Configura herramientas para agilizar tu comunicación y ahorrar tiempo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group relative flex flex-col bg-neutral-900 border border-neutral-800 rounded-lg shadow-sm hover:border-blue-500/50 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
            onClick={() => handleCardClick(feature.href)}
          >
            <div className="p-4 flex-grow">
              <div className="mb-3">
                {React.cloneElement(feature.icon as React.ReactElement, { className: "w-6 h-6 " + (feature.icon as React.ReactElement).props.className.split(' ').filter((c: string) => !c.startsWith('w-') && !c.startsWith('h-')).join(' ') })}
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">{feature.title}</h2>
              <p className="text-neutral-400 mt-1.5 text-xs leading-relaxed">{feature.description}</p>
            </div>
            <div className="p-4 pt-0 mt-auto">
              <div className="flex items-center text-blue-500 font-bold text-[10px] uppercase tracking-wider">
                <span>{feature.action}</span>
                <ArrowRight className="w-3 h-3 ml-1.5 transform transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

