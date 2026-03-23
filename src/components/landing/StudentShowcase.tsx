"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const studentFeatures = [
  {
    id: "i20",
    title: "Aplicación I-20 y Gestión de Visa",
    description: "Gestionamos todo tu proceso migratorio para que obtengas tu visa F-1: preparación profesional de documentos, seguimiento personalizado y simulaciones de entrevista consular.",
    image: "/assets/generated/student_showcase_campus.png",
    video: "https://firebasestorage.googleapis.com/v0/b/roosevelt-platform-1.firebasestorage.app/o/chatbot_media%2FVideo%20completo.mov?alt=media&token=f11b4b46-3521-45e7-bbd0-46c18a10bcb8"
  },
  {
    id: "nivelacion",
    title: "Programas de Inglés Intensivo y Académico",
    description: "Acceso a instituciones reconocidas en Estados Unidos con programas de inglés ESL, TOEFL, inglés de negocios y preparación académica. Te ayudamos a elegir el programa que se adapte a tus objetivos educativos.",
    image: "https://images.unsplash.com/photo-1523050853063-bd388fef54ce?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "vida",
    title: "Servicios de Vida Estudiantil en EE. UU.",
    description: "Apoyo integral para tu experiencia en el extranjero: alojamiento seguro, transporte, apertura de cuentas bancarias y orientación cultural para estudiantes internacionales.",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "finanzas",
    title: "Planificación Financiera y Estrategia de Estudio",
    description: "Asesoría financiera para tu estancia estudiantil y planificación académica estratégica, incluyendo becas, costos de vida y gestión de pagos escolares.",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1000&auto=format&fit=crop",
  },
];

export default function StudentShowcase() {
  const [activeTab, setActiveTab] = useState(studentFeatures[0]);
  const [isMuted, setIsMuted] = useState(true);

  return (
    <section className="py-24 bg-white text-black overflow-hidden">
      <div className="container mx-auto px-6">

        {/* Header: Title + Learn More Pill */}
        <div className="flex justify-between items-center mb-16">
          <div>
            <h3 className="text-2xl font-medium tracking-tight text-black">Visa de Estudiante</h3>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-black mt-1">
              Tu futuro académico empieza aquí
            </h2>
          </div>
          <Link
            href="https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="rounded-full px-10 py-7 bg-black hover:bg-black/90 text-white font-medium text-lg shadow-xl transition-all">
              Saber más
            </Button>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row-reverse gap-16 items-start">

          {/* Left Column (now on right visually): Interactive List */}
          <div className="w-full lg:w-1/3 flex flex-col">
            {studentFeatures.map((feature) => {
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

          {/* Right Column (now on left visually): Dynamic Visual */}
          <div className="w-full lg:w-2/3 h-full min-h-[500px] relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="w-full h-full relative aspect-video lg:aspect-auto lg:h-[600px] rounded-[2.5rem] overflow-hidden bg-white shadow-2xl"
              >
                {activeTab.video ? (
                  <div className="relative w-full h-full">
                    <video
                      src={activeTab.video}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted={isMuted}
                      loop
                      playsInline
                      preload="metadata"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                      className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center text-white transition-all z-10"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
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

