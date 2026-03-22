"use client";

export default function YouTubeSubscription() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary-glow to-secondary overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.05),transparent_50%)]" />

      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-2xl animate-pulse">
              <svg className="w-12 h-12 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <h2 className="text-4xl md:text-5xl font-medium text-white mb-4">
              ¡Síguenos en YouTube!
            </h2>
            <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
              Descubre consejos, testimonios y guías completas sobre cómo estudiar y vivir en Estados Unidos.
              ¡No te pierdas ningún video!
            </p>
          </div>

          <a
            href="https://www.youtube.com/@udreamms"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-10 py-5 text-lg font-medium bg-white text-primary rounded-lg shadow-2xl hover:scale-105 transition-all hover:shadow-[0_20px_60px_-10px_rgba(255,255,255,0.5)] group"
          >
            <svg className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Suscríbete Ahora
          </a>

          <div className="mt-8 flex items-center justify-center gap-8 text-white">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-medium">Tips de Visa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              <span className="text-sm font-medium">Testimonios</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
              <span className="text-sm font-medium">Guías Completas</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

