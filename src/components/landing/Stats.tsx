"use client";

import { Shield, Users, Globe, CheckCircle2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";

// Componente para animar el conteo
const CountUp = ({ end, duration = 2000, suffix = "" }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return (
    <span ref={countRef} className="tabular-nums">
      {count}{suffix}
    </span>
  );
};

export default function Stats() {
  const stats = [
    {
      icon: Shield,
      number: 30,
      suffix: "+",
      title: "Experiencia Educativa",
      description: "Escuelas aliadas con más de 30 años en el mercado",
    },
    {
      icon: Users,
      number: 783,
      suffix: "+",
      title: "Estudiantes Felices",
      description: "Sueños cumplidos en USA",
    },
    {
      icon: Globe,
      number: 25,
      suffix: "+",
      title: "Estados Disponibles",
      description: "Cobertura en todo el país",
    },
    {
      icon: CheckCircle2,
      number: 95,
      suffix: "%",
      title: "Tasa de Aprobación",
      description: "Garantía en tus trámites",
    },
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container px-6 md:px-12 mx-auto relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-16 gap-x-8">

          {stats.map((stat, index) => {
            return (
              <div key={index} className="flex flex-col items-center text-center group">

                {/* Icono minimalista */}
                <div className="mb-8 p-5 rounded-full bg-white border border-black/5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-8 h-8 text-black" strokeWidth={1.5} />
                </div>

                {/* Número Grande Minimalista */}
                <div className="text-6xl md:text-7xl font-medium mb-4 tracking-tighter text-black">
                  <CountUp end={stat.number} suffix={stat.suffix} />
                </div>

                {/* Título y Descripción en Negro Sólido */}
                <h3 className="text-xl font-medium text-black mb-3">
                  {stat.title}
                </h3>
                <p className="text-base text-black font-normal max-w-[220px] leading-relaxed">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

