"use client";

import {
  Heart,
  Target,
  Lightbulb,
  Zap,
  Plus,
  GraduationCap,
  Shield,
  Globe,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useRef } from "react";

export default function WhyChooseUs() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 350;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const reasons = [
    {
      id: 1,
      category: "Soporte",
      title: "Acompañamiento Humano",
      description: "Sabemos que irte a otro país da miedo. Por eso nuestro equipo está contigo no solo en los papeles, sino cuando necesitas a alguien con quien hablar.",
      icon: Heart,
      color: "text-red-500",
    },
    {
      id: 2,
      category: "Eficacia",
      title: "Enfoque en Resultados",
      description: "Optimizamos cada aplicación para maximizar tus chances de aceptación. Tu éxito es nuestra única métrica importante.",
      icon: Target,
      color: "text-orange-500",
    },
    {
      id: 3,
      category: "Tecnología",
      title: "Innovación Constante",
      description: "Usamos tecnología propia para hacer tu proceso más rápido y transparente. Olvídate del papeleo innecesario.",
      icon: Lightbulb,
      color: "text-yellow-500",
    },
    {
      id: 4,
      category: "Velocidad",
      title: "Rapidez y Eficiencia",
      description: "Sin burocracia. Nuestro sistema digital agiliza la recolección de documentos y evita errores comunes.",
      icon: Zap,
      color: "text-purple-500",
    },
    {
      id: 5,
      category: "Calidad",
      title: "Escuelas Certificadas",
      description: "Trabajamos solo con instituciones acreditadas.",
      icon: GraduationCap,
      color: "text-pink-500",
    },
    {
      id: 6,
      category: "Confianza",
      title: "Proceso Seguro",
      description: "Te guiamos en cada paso del proceso migratorio.",
      icon: Shield,
      color: "text-rose-500",
    },
    {
      id: 7,
      category: "Comodidad",
      title: "Todo Incluido",
      description: "Aeropuerto, vivienda y servicios adicionales.",
      icon: Globe,
      color: "text-red-400",
    }
  ];

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container px-6 md:px-12 mx-auto">

        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="max-w-4xl">
            <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-4 text-black">
              Por qué Udreamms es <br />
              <span className="text-gray-400">la mejor decisión.</span>
            </h2>
            <p className="text-xl text-gray-500 font-normal leading-relaxed max-w-2xl">
              Beneficios exclusivos diseñados para garantizar tu éxito en USA.
            </p>
          </div>

          {/* Desktop Navigation Arrows */}
          <div className="hidden md:flex gap-3">
            <button
              onClick={() => scroll('left')}
              className="w-12 h-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-12 h-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Container - Scrollbar Hidden */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-12 -mx-6 px-6 md:mx-0 md:px-0"
          style={{
            scrollbarWidth: 'none',  /* Firefox */
            msOverflowStyle: 'none',  /* IE and Edge */
          }}
        >
          {/* Hide Scrollbar for Webkit */}
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {reasons.map((card) => (
            <div
              key={card.id}
              className="relative shrink-0 snap-center w-[300px] md:w-[340px] h-[500px] bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-100 border border-gray-100 flex flex-col justify-between transition-transform hover:scale-[1.02] duration-300"
            >
              {/* Top Content */}
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3 block">
                  {card.category}
                </span>
                <h3 className="text-3xl font-medium text-gray-900 mb-4 leading-tight">
                  {card.title}.
                </h3>
                <p className="text-gray-500 font-medium text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Bottom Content (Icon + Plus Button) */}
              <div className="relative h-32 flex items-center justify-center mt-6">
                {/* Large Icon replacing the image */}
                <card.icon
                  className={`w-32 h-32 opacity-20 ${card.color}`}
                  strokeWidth={1}
                />

                {/* Floating real icon on top for better visibility */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <card.icon
                    className={`w-16 h-16 ${card.color} drop-shadow-md`}
                    strokeWidth={1.5}
                  />
                </div>

                {/* Plus Button in bottom right corner */}
                <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors shadow-lg">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Navigation Arrows */}
        <div className="md:hidden flex justify-center gap-4 mt-4">
          <button
            onClick={() => scroll('left')}
            className="w-12 h-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-12 h-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

      </div>
    </section>
  );
}

