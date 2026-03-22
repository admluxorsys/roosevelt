"use client";

import Link from "next/link";
import {
  Search,
  FileCheck,
  ClipboardCheck,
  MessageSquare,
  MapPin,
  Activity,
  Map,
  Mic,
  Plane,
  ShieldCheck,
  Users,
  PhoneCall,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  Car,
  Smartphone,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";

const paths = [
  {
    title: "Visa de Turismo B1/B2",
    subtitle: "Viajes de placer, negocios o salud sin fronteras.",
    description: "Estrategia técnica para asegurar tu aprobación en tiempo récord.",
    features: [
      { text: "Auditoría de Perfil de Riesgo", icon: Search, desc: "Detectamos debilidades antes de aplicar." },
      { text: "Optimización DS-160", icon: FileCheck, desc: "Redacción estratégica sin errores." },
      { text: "Narrativa de Viaje Coherente", icon: Map, desc: "Propósito sólido y veraz ante el cónsul." },
      { text: "Entrenamiento Anti-Trampa", icon: Mic, desc: "Respuestas seguras a preguntas críticas." },
      { text: "Monitoreo de Citas 24/7", icon: Clock, desc: "Buscamos adelantar tu fecha de entrevista." },
      { text: "Dossier de Evidencias Pro", icon: ClipboardCheck, desc: "Qué documentos llevar y cuáles no." }
    ],
    href: "/visas/tourist",
    buttonText: "Solicitar visa ahora",
    glowColor: "bg-white/20",
    tag: "¡Cupos Limitados!",
    tagColor: "bg-gradient-to-r from-orange-600 to-red-600"
  },
  {
    title: "Visa de Estudiante F-1",
    subtitle: "Lanza tu carrera profesional en universidades americanas.",
    description: "Un plan 360° para estudiar, trabajar legalmente y establecerte en USA.",
    features: [
      { text: "Diagnóstico de Perfil 360°", icon: Activity, desc: "Evaluación de probabilidades reales." },
      { text: "Gestión de Admisión I-20", icon: FileCheck, desc: "Tramitación directa con la universidad." },
      { text: "Recogida Aeropuerto & Traslado", icon: Car, desc: "Te recibimos personalmente al llegar." },
      { text: "Sim Card & Móvil USA", icon: Smartphone, desc: "Conectividad total desde el día 1." },
      { text: "Apertura Cuenta Bancaria", icon: Building2, desc: "Gestión financiera local sin estrés." },
      { text: "Alojamiento & Vivienda Pro", icon: MapPin, desc: "Opciones seguras cerca de tu escuela." },
      { text: "Comunidad Udreamms Plus", icon: Users, desc: "Networking y eventos exclusivos." }
    ],
    href: "/visas/student",
    buttonText: "Solicitar visa ahora",
    highlighted: true,
    glowColor: "bg-white/20",
    tag: "¡Cupos Limitados!",
    tagColor: "bg-gradient-to-r from-orange-600 to-red-600"
  },
  {
    title: "FIFA Fan Pass 2026",
    subtitle: "Asegura tu logística para el evento deportivo más grande del mundo.",
    description: "Tu pasaporte VIP para vivir la Copa Mundial 2026 sin estrés.",
    features: [
      { text: "Ruta de Visa Prioritaria", icon: Plane, desc: "Urgencia justificada por evento FIFA." },
      { text: "Logística Multi-Sede USA", icon: Map, desc: "Transporte optimizado entre estadios." },
      { text: "Alertas de Fan ID & Boletos", icon: ShieldCheck, desc: "Información crítica en tiempo real." },
      { text: "Comunidad de Fans Mundial", icon: Users, desc: "Comparte costos y experiencias." },
      { text: "Concierge de Emergencia 24/7", icon: PhoneCall, desc: "Soporte total durante tu estadía." },
      { text: "Guía de Supervivencia Fan", icon: Sparkles, desc: "Hoteles, Fan Zones y Seguridad." }
    ],
    href: "/visas/fifa",
    buttonText: "Solicitar visa ahora",
    glowColor: "from-white/40 to-white/5",
    tag: "¡Cupos Limitados!",
    tagColor: "bg-gradient-to-r from-orange-600 to-red-600"
  }
];

export default function ChooseYourPath() {
  const commonGradient = "from-blue-600 to-cyan-600";

  return (
    <section className="pt-24 pb-40 bg-[#050507] relative overflow-hidden font-sans">
      {/* Sutil efecto de cuadrícula de fondo */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

      {/* Degradado superior para suavizar la unión con el Hero */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#050507] -translate-y-full" />

      <div className="container max-w-[1500px] mx-auto px-6 relative z-10">

        {/* Header Centrado Simplificado - "Planes" tamaño reducido */}
        <div className="mb-24 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-normal tracking-tight text-white leading-tight mb-6">
            Planes
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Selecciona la ruta ideal para tu objetivo. Estrategias probadas para turismo, educación y eventos mundiales.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mx-auto">
          {paths.map((path, index) => (
            <div key={index} className="relative group w-full flex flex-col">

              {/* Glow Effect Background */}
              <div className={`absolute -inset-2 ${path.glowColor} rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              {/* Card Content */}
              <div className="relative flex-1 bg-black border border-white/10 rounded-[2.5rem] p-10 flex flex-col ring-1 ring-white/5 shadow-2xl overflow-hidden hover:bg-black transition-colors duration-300">

                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl" />

                {/* Floating Tag for FIFA */}
                {path.tag && (
                  <div className={`absolute top-0 right-0 ${path.tagColor} text-white text-[10px] font-medium uppercase tracking-widest px-6 py-2 rounded-bl-3xl shadow-lg z-20 animate-pulse`}>
                    {path.tag}
                  </div>
                )}

                <div className="flex flex-col items-center text-center mb-10">
                  <h3 className="text-4xl md:text-5xl font-normal text-white tracking-tight mb-4 leading-tight">{path.title}</h3>
                  <p className="text-slate-400 text-lg font-light leading-relaxed">{path.subtitle}</p>
                </div>

                {/* Price/Description removed as requested */}
                <div className="mb-0"></div>

                <Link href={path.href} className="w-full mb-12">
                  <button className={`w-full py-4 rounded-full bg-transparent text-white font-normal text-lg shadow-2xl hover:scale-[1.03] active:scale-95 transition-all duration-300 border border-white/40 hover:bg-blue-600 hover:border-blue-600`}>
                    {path.buttonText}
                  </button>
                </Link>

                <div className="space-y-8 flex-1">
                  <p className="text-white font-normal text-sm uppercase tracking-widest opacity-50 mb-4 text-center">¿Qué incluye el paquete?</p>
                  {path.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-5 text-slate-300 group/item cursor-default leading-relaxed">
                      <div className="mt-1.5 transition-transform group-hover/item:scale-110 shrink-0">
                        <feature.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                      </div>
                      <span className="text-lg font-normal text-slate-100 group-hover/item:text-white transition-colors">
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </div>

                {/* Trust Badge at bottom */}
                <div className="mt-12 pt-10 border-t border-white/5 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[12px] text-slate-500 font-normal uppercase tracking-tighter">Satisfacción 100% Garantizada</span>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Closing trust message */}
        <div className="mt-20 text-center">
          <p className="text-gray-500 text-sm font-normal">
            Pagos seguros procesados por Stripe o Zelle. Sin cargos ocultos.
            <br />
            <span className="text-white/60">¿Tienes dudas? <Link href="/contact" className="text-primary hover:underline">Habla con un asesor por kamban</Link></span>
          </p>
        </div>

      </div>
    </section>
  );
}


