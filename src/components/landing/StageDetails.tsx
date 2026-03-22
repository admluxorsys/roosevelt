"use client";

import { motion } from "framer-motion";
import {
  FileCheck,
  GraduationCap,
  Plane,
  MapPin,
  Users,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const stages = [
  {
    id: 1,
    tag: "Fase 1",
    title: "Preparación Inicial",
    description: "No tienes pasaporte ni fondos suficientes. Te ayudamos con clases de inglés y programas para generar ingresos.",
    icon: FileCheck,
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 2,
    tag: "Fase 2",
    title: "Aplicación y Obtención de Visa",
    description: "Tienes documentos listos. Es hora de aplicar a la escuela, gestionar el I-20 y prepararte para la embajada.",
    icon: GraduationCap,
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 3,
    tag: "Fase 3",
    title: "Planificación de Viaje",
    description: "¿Y ahora qué sigue? Búsqueda de vivienda, compra de vuelos y el checklist final antes de partir.",
    icon: Plane,
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109c0f?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 4,
    tag: "Fase 4",
    title: "Llegada y Primeros Días",
    description: "Adaptación inicial: Recogida en aeropuerto, cuenta bancaria, ITIN/SSN y acceso a la comunidad Udreamms.",
    icon: MapPin,
    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 5,
    tag: "Fase 5",
    title: "¿Ya vives en USA?",
    description: "Si ya lograste tu sueño, únete a nuestra red de Alumnos. Te ayudamos a encontrar trabajo part-time y networking.",
    icon: Users,
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=800&auto=format&fit=crop"
  }
];

export default function StageDetails() {
  return (
    <section className="py-24 bg-white overflow-hidden" id="fases-viaje">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="mb-16">
          <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-4 text-slate-900">
            ¿En qué fase <br />
            <span className="text-gray-400">te encuentras?</span>
          </h2>
          <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-2xl">
            Identifica dónde estás en tu viaje y descubre cómo te podemos ayudar hoy mismo.
          </p>
        </div>

        {/* Infinite Automatic Horizontal Scroll of Essential-style Cards */}
        <div className="flex overflow-hidden group/scroll py-4">
          <motion.div
            className="flex gap-8 shrink-0"
            animate={{
              x: ["0%", "-50%"]
            }}
            transition={{
              duration: 40, // Adjust speed here (higher = slower)
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop"
            }}
          >
            {/* Quadruple the items to ensure the loop is absolutely seamless */}
            {[...stages, ...stages, ...stages, ...stages].map((stage, index) => {
              const Icon = stage.icon;
              return (
                <motion.div
                  key={`${stage.id}-${index}`}
                  className="group relative flex-shrink-0 w-[300px] md:w-[350px] aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-2xl cursor-pointer bg-slate-100"
                >
                  <img
                    src={stage.image}
                    alt={stage.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Essential-style Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

                  {/* Bottom Content Card Layout */}
                  <div className="absolute bottom-0 left-0 p-8 w-full backdrop-blur-[2px] bg-black/5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-lg">
                        <Icon size={20} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                        {stage.tag}
                      </span>
                    </div>
                    <h4 className="text-2xl font-bold text-white tracking-tight leading-tight mb-2 drop-shadow-md">
                      {stage.title}
                    </h4>

                    {/* Hover Description expansion */}
                    <div className="h-0 overflow-hidden group-hover:h-auto transition-all duration-500 opacity-0 group-hover:opacity-100">
                      <p className="text-white/80 text-sm leading-relaxed border-t border-white/10 pt-4 mt-4 drop-shadow-sm font-medium">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Footer Call to Action - Now White background with Black button */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between p-10 bg-white border border-slate-100 rounded-[3rem] text-slate-950 gap-8 shadow-2xl shadow-slate-200/50">
          <div className="max-w-xl text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-medium tracking-tight mb-2 text-slate-950">¿Ya identificaste tu fase?</h3>
            <p className="text-slate-500 font-medium">Nuestros expertos están listos para impulsarte al siguiente nivel sin importar dónde empieces.</p>
          </div>
          <Button
            size="lg"
            className="rounded-full px-10 py-8 bg-slate-950 text-white hover:bg-slate-900 font-bold text-xl shadow-xl transition-all hover:-translate-y-1 active:scale-95 shrink-0"
            onClick={() => document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Comienza Ahora
            <ArrowRight className="w-5 h-5 ml-3" />
          </Button>
        </div>
      </div>
    </section>
  );
}

