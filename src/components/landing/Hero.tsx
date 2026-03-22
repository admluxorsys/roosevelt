"use client";

import { useState, useEffect } from "react";

interface HeroProps {
  onStartQuote: () => void;
}

const videoLinks = [
  "https://firebasestorage.googleapis.com/v0/b/udreamms-platform-1.firebasestorage.app/o/chatbot_media%2F9.mp4?alt=media&token=b4de0daa-1003-4f43-bef6-8eaeb4bc57e0",
  "https://firebasestorage.googleapis.com/v0/b/udreamms-platform-1.firebasestorage.app/o/chatbot_media%2F8.mp4?alt=media&token=89677f42-404e-41c9-87ae-1aefad506099",
  "https://firebasestorage.googleapis.com/v0/b/udreamms-platform-1.firebasestorage.app/o/chatbot_media%2F7.mp4?alt=media&token=d1f44bb4-e469-48a3-ba0c-52f325e62da3",
  "https://firebasestorage.googleapis.com/v0/b/udreamms-platform-1.firebasestorage.app/o/chatbot_media%2F6.mp4?alt=media&token=4323fe1c-71b3-4be7-84bc-05cfc9496bf6",
  "https://firebasestorage.googleapis.com/v0/b/udreamms-platform-1.firebasestorage.app/o/chatbot_media%2F5.mp4?alt=media&token=69cab0ea-6587-4642-b19e-900a6279df3b",
  "https://firebasestorage.googleapis.com/v0/b/udreamms-platform-1.firebasestorage.app/o/chatbot_media%2F4.mp4?alt=media&token=2d6bdf3c-e66b-4e8e-b13c-4f483cbf3a8b",
  "https://firebasestorage.googleapis.com/v0/b/udreamms-platform-1.firebasestorage.app/o/chatbot_media%2F3.mp4?alt=media&token=d69b168f-4c89-4edf-a214-95594eb42553",
  "https://firebasestorage.googleapis.com/v0/b/udreamms-platform-1.firebasestorage.app/o/chatbot_media%2F2.mp4?alt=media&token=30cf0664-af66-480f-bf0f-c2688607ab89",
  "https://firebasestorage.googleapis.com/v0/b/udreamms-platform-1.firebasestorage.app/o/chatbot_media%2F15.mp4?alt=media&token=d250de08-c183-4434-a6b7-ceb43d7d69ed",
  "https://firebasestorage.googleapis.com/v0/b/udreamms-platform-1.firebasestorage.app/o/chatbot_media%2F14.mp4?alt=media&token=d9825363-cad0-4093-8f94-e5a1265ee060",
  "https://firebasestorage.googleapis.com/v0/b/udreamms-platform-1.firebasestorage.app/o/chatbot_media%2F12.mp4?alt=media&token=9b03cdbd-1997-4b0b-8657-2081e4163e09",
  "https://firebasestorage.googleapis.com/v0/b/udreamms-platform-1.firebasestorage.app/o/chatbot_media%2F11.mp4?alt=media&token=5d571e45-0c77-4ad5-a283-92823cbc2a5b",
  "https://firebasestorage.googleapis.com/v0/b/udreamms-platform-1.firebasestorage.app/o/chatbot_media%2F10.mp4?alt=media&token=91d87b50-5e61-4a6a-a3ad-6b62d9da0ef7",
  "https://firebasestorage.googleapis.com/v0/b/udreamms-platform-1.firebasestorage.app/o/chatbot_media%2F1.mp4?alt=media&token=e23c109b-04e8-45b6-8f88-36460500dfd4",
];

export default function Hero({ onStartQuote }: HeroProps) {
  const heroImage = "/assets/hero-statue-liberty.jpg";
  const [videoSrc, setVideoSrc] = useState("");

  useEffect(() => {
    const randomNum = Math.floor(Math.random() * videoLinks.length);
    setVideoSrc(videoLinks[randomNum]);
  }, []);

  return (
    <section className="relative h-screen min-h-[600px] flex items-end overflow-hidden">
      {/* Background Container */}
      <div className="absolute inset-0 w-full h-full">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />

        {videoSrc && (
          <video
            key={videoSrc}
            className="absolute top-0 left-0 w-full h-full object-cover fade-in"
            autoPlay
            loop
            muted
            playsInline
            poster={heroImage}
          >
            <source src={videoSrc} type="video/mp4" />
            Tu navegador no soporta videos HTML5.
          </video>
        )}

        {/* Overlays para legibilidad y transición suave a negro */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent" />
      </div>

      {/* Contenido con márgenes de 5cm */}
      <div className="relative z-10 w-full pb-24 px-[5cm]">
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-12 w-full">

          <div className="max-w-[70%] text-left space-y-4">
            {/* Texto superior (Eyebrow) */}
            <p className="text-gray-300 text-lg md:text-xl font-medium tracking-[0.2em] uppercase">
              ESTUDIA | VIAJA | DISFRUTA
            </p>

            {/* Título Principal */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium leading-[1.05] text-white tracking-tighter">
              Tu experiencia <br />
              en Estados Unidos <br />
              comienza aquí
            </h1>

            <div className="pt-2">
              <p className="text-gray-300 text-lg md:text-xl font-medium tracking-tight">
                Asesoría integral para que vivas la mejor experiencia en Estados Unidos.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4 shrink-0 mb-4">
            <button
              onClick={onStartQuote}
              className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-medium text-white overflow-hidden rounded-full bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20"
            >
              Obtén tu Cotización Gratis
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}

