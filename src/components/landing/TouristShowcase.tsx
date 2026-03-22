"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
    {
        id: "ds160",
        title: "Aplicación y Gestión de Visa de Turista",
        description: "Gestionamos todo tu proceso migratorio para que obtengas tu visa de turista B1/B2: preparación profesional de documentos, seguimiento personalizado y simulaciones de entrevista consular.",
        image: "/assets/generated/tourist_showcase_disney.png",
        video: "https://www.youtube.com/embed/ksaKUwErSGw"
    },
    {
        id: "entrevista",
        title: "Planes de Viaje y Itinerarios Personalizados",
        description: "Te ayudamos a diseñar tu viaje a Estados Unidos con itinerarios a medida, recomendaciones de destinos, rutas turísticas y actividades adaptadas a tus intereses.",
        image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1000&auto=format&fit=crop",
    },
    {
        id: "itinerario",
        title: "Servicios de Alojamiento y Logística",
        description: "Asistencia para encontrar alojamiento seguro, transporte y servicios esenciales durante tu estadía, garantizando una experiencia cómoda y sin contratiempos.",
        image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1000&auto=format&fit=crop",
    },
    {
        id: "citas",
        title: "Citas Prioritarias",
        description: "Monitoreo constante del sistema para obtener tu cita en el menor tiempo posible, adelantando meses de espera.",
        image: "https://images.unsplash.com/photo-1506784917876-491d607bd931?q=80&w=1000&auto=format&fit=crop",
    },
];

export default function TouristShowcase() {
    const [activeTab, setActiveTab] = useState(features[0]);

    return (
        <section className="py-24 bg-white text-black overflow-hidden">
            <div className="container mx-auto px-6">

                {/* Header: Title + Learn More Pill */}
                <div className="flex justify-between items-center mb-16">
                    <div>
                        <h3 className="text-2xl font-medium tracking-tight text-black">Visa de Turismo</h3>
                        <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-black mt-1">
                            Tu puerta de entrada a USA
                        </h2>
                    </div>
                    <Link
                        href="https://travel.state.gov/content/travel/en/us-visas/tourism-visit.html"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button className="rounded-full px-10 py-7 bg-black hover:bg-black/90 text-white font-medium text-lg shadow-xl transition-all">
                            Saber más
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-col lg:flex-row gap-16 items-start">

                    {/* Left Column: Interactive List */}
                    <div className="w-full lg:w-1/3 flex flex-col">
                        {features.map((feature) => {
                            const isActive = activeTab.id === feature.id;
                            return (
                                <div
                                    key={feature.id}
                                    className="group cursor-pointer"
                                    onClick={() => setActiveTab(feature)}
                                >
                                    <div className="py-4">
                                        <h4 className={`text-xl transition-colors duration-300 ${isActive ? 'font-medium text-black' : 'font-medium text-black group-hover:underline underline-offset-8'}`}>
                                            {feature.title}
                                        </h4>

                                        <AnimatePresence>
                                            {isActive && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                                    className="overflow-hidden"
                                                >
                                                    <p className="pt-4 text-black leading-relaxed font-normal text-lg">
                                                        {feature.description}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Column: Dynamic Visual */}
                    <div className="w-full lg:w-2/3 h-full min-h-[500px] relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                className="w-full h-full relative aspect-video lg:aspect-auto lg:h-[600px] rounded-[2.5rem] overflow-hidden bg-white shadow-2xl"
                            >
                                {activeTab.video ? (
                                    <iframe
                                        src={activeTab.video}
                                        className="w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <img
                                        src={activeTab.image}
                                        alt={activeTab.title}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </section>
    );
}

