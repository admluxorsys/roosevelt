"use client";

import { Instagram, ChevronLeft, ChevronRight, Volume2, VolumeX, Youtube, Play } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// YouTube Shorts IDs provided by user
const baseVideos = [
  "BMUmTjVBqxI",
  "4VLdkd8Slko",
  "YqSJmu3Au0k",
  "_YjuuYRG08c"
];

// Recycling videos to fill 7 slots
const studentVideos = [
  {
    id: 1,
    videoId: baseVideos[0],
    handle: "@udreamms",
    title: "Cumpliendo metas en USA 🇺🇸"
  },
  {
    id: 2,
    videoId: baseVideos[1],
    handle: "@udreamms",
    title: "Tu futuro empieza aquí ✨"
  },
  {
    id: 3,
    videoId: baseVideos[2],
    handle: "@udreamms",
    title: "Experiencias inolvidables 🎓"
  },
  {
    id: 4,
    videoId: baseVideos[3],
    handle: "@udreamms",
    title: "Viviendo el sueño americano 🗽"
  },
  {
    id: 5,
    videoId: baseVideos[0],
    handle: "@udreamms",
    title: "Explorando nuevas ciudades 🌆"
  },
  {
    id: 6,
    videoId: baseVideos[1],
    handle: "@udreamms",
    title: "Comunidad Udreamms 🤝"
  },
  {
    id: 7,
    videoId: baseVideos[2],
    handle: "@udreamms",
    title: "Historias que inspiran 🚀"
  }
];

export default function JoinOurStudents() {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Track which video is currently unmuted (active). Null means all are muted.
  const [activeVideoId, setActiveVideoId] = useState<number | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getEmbedUrl = (videoId: string, isUnmuted: boolean) => {
    // Basic params for both states
    // mute=1 is standard for autoplay. mute=0 enables sound.
    // We add a random param to force iframe refresh if needed, but changing src usually does it.
    let params = `autoplay=1&loop=1&playlist=${videoId}&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&playsinline=1&controls=0`;

    if (isUnmuted) {
      params += `&mute=0`;
    } else {
      params += `&mute=1`;
    }

    return `https://www.youtube.com/embed/${videoId}?${params}`;
  };

  const toggleAudio = (id: number) => {
    if (activeVideoId === id) {
      setActiveVideoId(null); // Mute if already active
    } else {
      setActiveVideoId(id); // Set new active (unmutes this one, mutes others)
    }
  };

  return (
    <section className="py-24 bg-white overflow-hidden w-full">
      <div className="container px-6 md:px-12 mx-auto">

        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="max-w-3xl">
            <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-4 text-black">
              Historias de Éxito <br className="hidden md:block" />
              <span className="text-black font-medium">Reales.</span>
            </h2>
            <p className="text-xl text-black font-normal leading-relaxed">
              Descubre por qué cientos de estudiantes confían en nosotros para su futuro.
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

        {/* Stories Grid/Scroll */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-12 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {studentVideos.map((story) => {
            const isUnmuted = activeVideoId === story.id;

            return (
              <div
                key={story.id}
                onClick={() => toggleAudio(story.id)}
                className="relative shrink-0 snap-center w-[280px] md:w-[320px] aspect-[9/16] rounded-[2rem] overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 bg-black"
              >
                {/* YouTube Embed as Background */}
                <div className="absolute inset-0 bg-black pointer-events-none">
                  {/* Key is crucial here to force React to re-mount the iframe when mute state changes, ensuring the video reloads with new mute param */}
                  <iframe
                    key={`${story.id}-${isUnmuted ? 'sound' : 'muted'}`}
                    src={getEmbedUrl(story.videoId, isUnmuted)}
                    className="w-[300%] h-full -ml-[100%] object-cover pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                    title={`YouTube Short ${story.id}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    frameBorder="0"
                  />
                  {/* Gradient Overlay for Text Visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Volume Control Icon (Visual Cue) */}
                <div className="absolute top-6 right-6 flex items-center justify-center z-10 transition-transform duration-300 transform scale-0 group-hover:scale-100 mobile-visible">
                  <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition-colors hover:bg-black/60">
                    {isUnmuted ? (
                      <Volume2 className="w-5 h-5 text-white" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-white/70" />
                    )}
                  </div>
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                  <div className="flex items-center gap-2 mb-3">
                    <Youtube className="w-5 h-5 text-red-500 fill-current" />
                    <span className="font-medium text-sm tracking-wide">{story.handle}</span>
                  </div>

                  <p className="font-medium text-lg leading-snug text-white/90">
                    {story.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Navigation Arrows */}
        <div className="md:hidden flex justify-center gap-4 mt-2 mb-12">
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

        {/* Bottom CTA */}
        <div className="flex justify-center">
          <Button
            className="rounded-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-medium px-10 py-6 text-lg shadow-xl shadow-orange-500/20 transition-all hover:scale-105 flex items-center gap-2"
            onClick={() => window.open('https://www.instagram.com/udreamms/?hl=en', '_blank')}
          >
            Ver más en Instagram
            <Instagram className="w-5 h-5" />
          </Button>
        </div>

        <style jsx>{`
          @media (hover: none) {
            .mobile-visible {
              transform: scale(1) !important;
            }
          }
        `}</style>

      </div>
    </section>
  );
}

