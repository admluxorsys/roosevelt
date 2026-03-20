"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

export default function AppSection() {
  const [isMuted, setIsMuted] = useState(true);
  const videoId = "4tiRi0L9ciw";

  return (
    <section id="app-section" className="py-12 bg-white relative overflow-hidden">
      <div className="w-full px-0 mx-auto">
        {/* Larger video container - No border, increased height */}
        <div className="relative aspect-video md:aspect-[16/7] bg-slate-900 overflow-hidden shadow-2xl group cursor-pointer transition-all">

          {/* Video Background */}
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1`}
            className="absolute inset-0 w-full h-full object-cover scale-[1.01] group-hover:scale-100 transition-transform [transition-duration:5s]"
            allow="autoplay; encrypted-media"
          />

          {/* Clean Overlay Mesh */}
          <div className="absolute inset-0 bg-black/10 z-10 pointer-events-none" />

          {/* Central Play Indicator - Refined for transparency and white colors */}
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-500">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all duration-700 group-hover:scale-110">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-3xl">
                {/* Transparent white play icon */}
                <div className="w-0 h-0 border-t-[14px] border-t-transparent border-l-[24px] border-l-white/60 border-b-[14px] border-b-transparent ml-2" />
              </div>
            </div>
          </div>

          {/* Audio Toggle Button - Minimalist Style */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute bottom-8 right-8 z-30 w-14 h-14 md:w-16 md:h-16 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/40 transition-all active:scale-90 shadow-xl"
          >
            {isMuted ? <VolumeX className="w-5 h-5 md:w-6 md:h-6" /> : <Volume2 className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
        </div>
      </div>
    </section>
  );
}
