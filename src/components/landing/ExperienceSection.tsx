"use client";

import { ArrowUpRight, Play, Globe, ChevronDown, ChevronUp, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

const experiences = [
    {
        date: "Llegada",
        category: "Finanzas",
        title: "Cuenta Bancaria: Tu dinero seguro desde el primer día",
        image: "/assets/services/aeropuerto.png",
        hasVideo: false,
    },
    {
        date: "Movilidad",
        category: "Transporte",
        title: "Compra/Renta de Auto: Opciones flexibles para estudiantes",
        image: "/assets/services/vivienda.png",
        hasVideo: true,
    },
    {
        date: "Ciudad",
        category: "Transporte",
        title: "Pase de Autobús: Muévete por la ciudad con 50% de descuento",
        image: "/assets/services/ingles.png",
        hasVideo: false,
    },
    {
        date: "Aventura",
        category: "Diversión",
        title: "Scooter: La forma más rápida de llegar al campus",
        image: "/assets/services/aeropuerto.png",
        hasVideo: true,
    },
    {
        date: "Conectividad",
        category: "Tecnología",
        title: "Plan de Celular: Datos ilimitados 5G sin contratos",
        image: "/assets/services/ingles.png",
        hasVideo: false,
    },
    {
        date: "Legal",
        category: "Trámites",
        title: "Licencia de Conducir: Guía paso a paso para tu ID americana",
        image: "/assets/services/migratorio.jpg",
        hasVideo: true,
    },
    {
        date: "Salud",
        category: "Seguridad",
        title: "Seguro Médico: Cobertura total para tu visa F-1",
        image: "/assets/services/vivienda.png",
        hasVideo: false,
    },
    {
        date: "Viajes",
        category: "Vuelos",
        title: "Vuelos Económicos: Visita a tu familia con tarifas partner",
        image: "/assets/services/migratorio.jpg",
        hasVideo: true,
    }
];

export default function ExperienceSection() {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'up' | 'down') => {
        if (scrollRef.current) {
            const scrollAmount = 200; // Adjusted for py-10
            const currentScroll = scrollRef.current.scrollTop;
            const targetScroll = direction === 'up'
                ? currentScroll - scrollAmount
                : currentScroll + scrollAmount;

            scrollRef.current.scrollTo({
                top: targetScroll,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section className="py-32 bg-black text-white overflow-hidden border-t border-white/5">
            <div className="container px-6 md:px-12 mx-auto">

                {/* New App Download CTA (Transferred from AppSection) */}
                <div className="flex flex-col items-center text-center mb-32 group">
                    <p className="text-red-500 font-medium mb-6 tracking-tight uppercase text-sm md:text-base">
                        Esta aplicación solo está disponible para estudiantes en USA
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 mb-8">
                        <h2 className="text-5xl md:text-8xl font-medium tracking-tighter text-white">
                            Descarga
                        </h2>
                        <div className="w-20 h-20 md:w-32 md:h-32 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                            <img
                                src="/assets/udreamms-app-shield.png"
                                alt="Udreamms App Logo"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <h2 className="text-5xl md:text-8xl font-medium tracking-tighter text-white">
                            Udreamms
                        </h2>
                    </div>

                    <h2 className="text-5xl md:text-8xl font-medium tracking-tighter text-white mb-10">
                        para comenzar
                    </h2>

                    <p className="text-xl md:text-2xl text-white/60 font-medium mb-12 max-w-2xl tracking-tight">
                        Utilizada por cientos de estudiantes en Estados Unidos
                    </p>

                    <Button className="rounded-full bg-white text-black hover:bg-white/90 font-medium px-12 py-8 text-xl shadow-2xl transition-all border-none flex items-center gap-3">
                        <Smartphone className="w-6 h-6" />
                        Descargar Udreamms App
                    </Button>
                </div>

                <div className="w-full h-px bg-white/10 mb-32" />

                {/* Header */}
                <div className="flex justify-between items-center mb-16">
                    <h2 className="text-2xl font-medium tracking-tight text-white uppercase opacity-40">Latest Experience</h2>
                    <Button variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10 transition-colors">
                        View all
                    </Button>
                </div>

                {/* Header Title for Video & List */}
                <div className="mb-12">
                    <h3 className="text-4xl md:text-7xl font-medium tracking-tighter mb-6 leading-none text-white max-w-5xl">
                        Udreamms Reality: <br /> Construida para ti
                    </h3>
                    <div className="flex items-center gap-6 text-gray-400 text-sm">
                        <span className="text-white font-medium tracking-tight">FEBRERO 2026</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <span className="flex items-center gap-2 font-medium">
                            <Globe className="w-4 h-4" />
                            Experiencia Real
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

                    {/* Featured Video (Left Side - Wider) */}
                    <div className="flex flex-col lg:col-span-8">
                        <div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden bg-gray-900 group border border-white/10 shadow-2xl">
                            <iframe
                                src="https://www.youtube.com/embed/wIh31q-3dPM?autoplay=1&mute=1&controls=1&loop=1&playlist=wIh31q-3dPM"
                                className="absolute inset-0 w-full h-full border-0 object-cover"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                            {/* Overlay - removed shadow to allow better visibility of controls if needed, or keeping it but ensuring it doesn't block interaction */}
                            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"></div>
                        </div>
                    </div>

                    {/* List of items (Right Side - Narrower) */}
                    <div className="relative lg:col-span-4 min-h-[400px]">
                        <div
                            ref={scrollRef}
                            className="absolute inset-0 flex flex-col gap-0 overflow-y-auto scrollbar-hide snap-y snap-mandatory rounded-3xl"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {experiences.map((exp, index) => (
                                <div key={index} className="group cursor-pointer border-t border-white/10 py-5 first:border-0 snap-start shrink-0">
                                    <div className="flex gap-8 items-start">
                                        <div className="flex-1">
                                            <h4 className="text-lg font-medium mb-2 group-hover:text-red-500 transition-colors leading-tight tracking-tight">
                                                {exp.title}
                                            </h4>
                                            <div className="flex items-center gap-4 text-gray-400 text-xs">
                                                <span className="font-medium tracking-tight text-white/50">{exp.date}</span>
                                                <span className="font-medium">{exp.category}</span>
                                                <span className="flex items-center gap-1 text-white font-medium group-hover:translate-x-1 transition-transform">
                                                    Saber más <ArrowUpRight className="w-4 h-4" />
                                                </span>
                                            </div>
                                        </div>

                                        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                                            <img
                                                src={exp.image}
                                                alt={exp.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            {exp.hasVideo && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                                    <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                                        <Play className="w-4 h-4 text-white fill-white" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Navigation Arrows at the bottom of the list */}
                        <div className="flex justify-center gap-4 mt-8">
                            <button
                                onClick={() => scroll('up')}
                                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors active:scale-95 shadow-xl"
                            >
                                <ChevronUp className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => scroll('down')}
                                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors active:scale-95 shadow-xl"
                            >
                                <ChevronDown className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

