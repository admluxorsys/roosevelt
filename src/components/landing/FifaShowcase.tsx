"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Play } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const fifaFeatures = [
    {
        id: "estrategia",
        title: "Estrategia FIFA",
        description: "Diseño de un perfil migratorio sólido enfocado específicamente en tu asistencia al Mundial 2026 para maximizar probabilidades de aprobación.",
        image: "/assets/generated/fifa_showcase_stadium.png",
        video: "https://www.youtube.com/embed/wlJmb3TwPF4"
    },
    {
        id: "logistica",
        title: "Logística de Estadios",
        description: "Asesoría completa sobre sedes, transporte entre ciudades anfitrionas y mejores zonas de alojamiento estratégicas.",
        image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop",
    },
    {
        id: "documentacion",
        title: "Documentación Fan",
        description: "Gestión de todos los requisitos adicionales para fanáticos, vinculando tu pasión deportiva con un propósito de viaje coherente.",
        image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000&auto=format&fit=crop",
    },
    {
        id: "red",
        title: "Red Udreamms",
        description: "Conexión exclusiva con otros fanáticos y estudiantes para organizar grupos de viaje, Fan Zones y experiencias compartidas.",
        image: "https://images.unsplash.com/photo-1517603951060-129814008162?q=80&w=1000&auto=format&fit=crop",
    },
];

export default function FifaShowcase() {
    const [activeTab, setActiveTab] = useState(fifaFeatures[0]);

    return (
        <section className="py-24 bg-white text-black overflow-hidden">
            <div className="container mx-auto px-6">

                {/* Header: Title + Learn More Pill */}
                <div className="flex justify-between items-center mb-16">
                    <div>
                        <h3 className="text-2xl font-medium tracking-tight text-black">FIFA Fan Pass</h3>
                        <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-black mt-1">
                            Asegura tu lugar en el Mundial
                        </h2>
                    </div>
                    <Link
                        href="https://www.state.gov/fifa-world-cup-26-visas"
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
                        {fifaFeatures.map((feature) => {
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

