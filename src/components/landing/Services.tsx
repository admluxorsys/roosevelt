"use client";

import { useRef } from "react";
import {
  Shield,
  GraduationCap,
  Globe,
  Users,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServicesProps {
  onStartQuote?: () => void;
  onAppClick?: () => void;
}

export default function Services({ onStartQuote, onAppClick }: ServicesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const services = [
    {
      category: "Servicio Migratorio",
      title: "Tu Visa F-1 Aprobada",
      description: "Expertos en formulario I-20 y preparación para la entrevista consular. 95% de aprobación.",
      image: "/assets/services/migratorio.jpg",
      icon: Shield,
    },
    {
      category: "Programas de Inglés",
      title: "Inglés de Alto Nivel",
      description: "Cursos intensivos, preparación TOEFL/IELTS e inglés de negocios en las mejores escuelas.",
      image: "/assets/services/ingles.png",
      icon: GraduationCap,
    },
    {
      category: "Servicio Aeropuerto",
      title: "Llega conectado",
      description: "Recogida en aeropuerto, SIM Card activa y cuenta bancaria lista desde el día 1.",
      image: "/assets/services/aeropuerto.png",
      icon: Globe,
    },
    {
      category: "Servicio Vivienda",
      title: "Hogar lejos de casa",
      description: "Homestays con familias americanas o residencias estudiantiles modernas y seguras.",
      image: "/assets/services/vivienda.png",
      icon: Users,
    }
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 450;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll = direction === 'left'
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-24 bg-white text-black relative overflow-hidden">
      <div className="container px-6 md:px-12 mx-auto relative z-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-4xl">
            <h2 className="text-4xl md:text-6xl font-medium tracking-tighter mb-4 text-black">
              Todo lo que necesitas para <br />
              triunfar en USA.
            </h2>
            <p className="text-xl text-black font-normal leading-relaxed w-full">
              Un ecosistema de servicios diseñado para acompañarte en cada etapa de tu viaje.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex gap-4">
            <button
              onClick={() => scroll('left')}
              className="w-14 h-14 rounded-full bg-white hover:bg-black/5 text-black flex items-center justify-center transition-all border border-black/10 active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-14 h-14 rounded-full bg-white hover:bg-black/5 text-black flex items-center justify-center transition-all border border-black/10 active:scale-95"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-8 overflow-x-auto snap-x snap-mandatory pb-12 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {services.map((service, index) => (
            <div
              key={index}
              className="group snap-center shrink-0 w-[85vw] md:w-[450px] relative"
            >
              <div className="relative h-[600px] w-full rounded-[3rem] overflow-hidden bg-black shadow-2xl transition-transform duration-500 group-hover:scale-[0.98]">
                {/* Image Background */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                  style={{ backgroundImage: `url('${service.image}')` }}
                />

                {/* Overlay Gradient (Legibility) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* Content Inside Card */}
                <div className="absolute inset-0 p-10 flex flex-col justify-between">
                  {/* Top Badge/Icon */}
                  <div className="flex justify-between items-start">
                    <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium">
                      {service.category}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                      <service.icon className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Bottom Content */}
                  <div>
                    <h3 className="text-3xl font-medium text-white mb-2 tracking-tight">
                      {service.title}
                    </h3>
                    <p className="text-white/80 text-lg font-normal mb-8 leading-relaxed line-clamp-2">
                      {service.description}
                    </p>

                    {/* Bottom Pill Buttons */}
                    <div className="flex gap-3">
                      <Button className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 font-medium px-8 py-6 flex items-center gap-2 text-lg">
                        Saber más
                        <ArrowUpRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

