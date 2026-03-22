"use client";


import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

export const LiveChatButton = () => {
  const pathname = usePathname();

  // Detectar si estamos en el editor de chatbot
  const isInChatbotEditor = pathname?.includes('/automation/chatbots/') && pathname !== '/cso/automation/chatbots';

  // Número de teléfono actualizado
  const phoneNumber = "16507840581";
  // Mensaje predeterminado corregido y mejorado
  const message = "Buen día, ¿cómo están? Me gustaría recibir asesoría personalizada.";

  // Codificamos el mensaje para URL
  const encodedMessage = encodeURIComponent(message);

  // Construimos el enlace completo
  const kambanLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <a
      href={kambanLink}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 group cursor-pointer border border-white/10 shadow-lg ${isInChatbotEditor
          ? 'p-3 rounded-full'
          : 'px-5 py-3 rounded-full'
        }`}
      title={isInChatbotEditor ? "Hablar con un Asesor" : undefined}
    >
      <div className="relative">
        <MessageCircle className="w-6 h-6 fill-current" />
        {/* Indicador de estado "En línea" */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white/20"></span>
        </span>
      </div>
      {!isInChatbotEditor && (
        <span className="font-bold text-base tracking-wide pr-1">Hablar con un Asesor</span>
      )}
    </a>
  );
};

export default LiveChatButton;


