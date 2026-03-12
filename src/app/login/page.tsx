'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetColor: { r: number, g: number, b: number, br: number };
  size: number;
  seed: number;
}

interface ImagePoint {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  br: number;
}

// Interactive Particle Face System
const InteractiveParticleFace = ({ isHovered }: { isHovered: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationFrame = useRef<number>();
  const imagePoints = useRef<ImagePoint[]>([]);
  const imageAspect = useRef<number>(3/4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const img = new Image();
    img.src = '/assets/particle_face.png';
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageAspect.current = img.width / img.height;
      
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;
      
      const sampleHeight = 500;
      const sampleWidth = Math.round(sampleHeight * imageAspect.current);
      
      tempCanvas.width = sampleWidth;
      tempCanvas.height = sampleHeight;
      tempCtx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
      
      const imageData = tempCtx.getImageData(0, 0, sampleWidth, sampleHeight).data;
      const points: ImagePoint[] = [];
      
      for (let y = 0; y < sampleHeight; y += 1) {
        for (let x = 0; x < sampleWidth; x += 1) {
          const i = (y * sampleWidth + x) * 4;
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const br = (r * 0.299 + g * 0.587 + b * 0.114);
          
          if (br > 10) { 
            points.push({ 
              x: (x / sampleWidth), 
              y: (y / sampleHeight),
              r, g, b, br
            });
          }
        }
      }
      imagePoints.current = points;

      const particleCount = 65000; 
      particles.current = Array.from({ length: particleCount }).map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        targetColor: { r: 251, g: 191, b: 36, br: 255 },
        size: Math.random() * 0.9 + 0.1,
        seed: Math.random()
      }));
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      const screenAspect = canvas.width / canvas.height;
      let displayHeight, displayWidth;
      
      // Calculate dimensions to fit face properly
      if (screenAspect > imageAspect.current) {
        displayHeight = canvas.height * 0.88;
        displayWidth = displayHeight * imageAspect.current;
      } else {
        displayWidth = canvas.width * 0.92;
        displayHeight = displayWidth / imageAspect.current;
        if (displayHeight > canvas.height * 0.8) {
          displayHeight = canvas.height * 0.8;
          displayWidth = displayHeight * imageAspect.current;
        }
      }

      particles.current.forEach((p, i) => {
        if (isHovered && imagePoints.current.length > 0) {
          const pointIdx = i % imagePoints.current.length;
          const target = imagePoints.current[pointIdx];
          
          const tx = centerX + (target.x - 0.5) * displayWidth;
          const ty = centerY + (target.y - 0.5) * displayHeight; 

          p.x += (tx - p.x) * 0.09;
          p.y += (ty - p.y) * 0.09;
          p.targetColor = { r: target.r, g: target.g, b: target.b, br: target.br };
          
          const brFactor = target.br / 255;
          p.size = (0.6 + brFactor * 1.0) + Math.sin(Date.now() * 0.003 + p.seed * 10) * 0.15;
        } else {
          p.x += p.vx + Math.sin(Date.now() * 0.0003 + p.seed * 20) * 0.5;
          p.y += p.vy + Math.cos(Date.now() * 0.0003 + p.seed * 20) * 0.25;
          p.targetColor = { r: 251, g: 191, b: 36, br: 40 };
          
          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.y > canvas.height) p.y = 0;
          
          p.size = 0.4 + p.seed * 0.4;
        }

        const brFactor = p.targetColor.br / 255;
        const opacity = isHovered ? (0.08 + brFactor * 0.92) : (0.03 + p.seed * 0.1);
        
        ctx.fillStyle = `rgba(${p.targetColor.r}, ${p.targetColor.g}, ${p.targetColor.b}, ${opacity})`;
        
        if (isHovered && p.targetColor.br > 200 && p.seed > 0.96) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = `rgba(${p.targetColor.r}, ${p.targetColor.g}, ${p.targetColor.b}, 1)`;
          ctx.fillRect(p.x, p.y, p.size * 2, p.size * 2);
          ctx.shadowBlur = 0;
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationFrame.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [isHovered]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 bg-transparent pointer-events-none" />;
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isHoveringText, setIsHoveringText] = useState(false);
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Sesión iniciada correctamente');
      router.push('/suite/life');
    } catch (error: any) {
      toast.error('Error al iniciar sesión: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col items-center justify-end overflow-hidden selection:bg-white/10">
      {/* Dynamic Background Layer */}
      <div className="absolute inset-0 bg-black z-0" />
      <InteractiveParticleFace isHovered={isHoveringText || showForm} />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center pb-24">
        <AnimatePresence mode="wait">
          {!showForm ? (
            <motion.div
              key="buttons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-4 flex flex-col items-center"
              onMouseEnter={() => setIsHoveringText(true)}
              onMouseLeave={() => setIsHoveringText(false)}
            >
              <h1 className="text-3xl md:text-4xl font-extralight tracking-tighter text-center mb-16 text-white/90 drop-shadow-2xl">
                Bienvenido a tu <br/> <span className="text-white font-light uppercase tracking-[0.3em] text-xs mt-2 block opacity-60">Administrador Personal</span>
              </h1>

              <Button
                variant="outline"
                className="w-full max-w-sm h-14 rounded-full bg-white/5 border-white/10 text-white/40 cursor-not-allowed hover:bg-white/5 font-light text-sm tracking-widest transition-all"
                disabled
              >
                OBTENER MI PERSONAJE DIGITAL
              </Button>

              <Button
                variant="outline"
                className="w-full max-w-sm h-14 rounded-full bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20 font-medium text-sm tracking-widest transition-all shadow-[0_0_40px_rgba(255,255,255,0.05)]"
                onClick={() => setShowForm(true)}
              >
                YA TENGO MI PERSONAJE DIGITAL
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm space-y-8"
            >
              <div className="text-center">
                <h2 className="text-xl font-light tracking-[0.2em] text-white/90 uppercase">Acceso Personal</h2>
                <div className="h-px w-12 bg-white/20 mx-auto mt-4" />
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1">
                  <Input
                    type="email"
                    placeholder="IDENTIDAD DIGITAL (EMAIL)"
                    className="bg-white/5 border-white/10 rounded-full h-12 focus:border-white/30 text-white placeholder:text-white/20 transition-all text-xs tracking-widest px-6"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Input
                    type="password"
                    placeholder="CONTRASEÑA"
                    className="bg-white/5 border-white/10 rounded-full h-12 focus:border-white/30 text-white placeholder:text-white/20 transition-all text-xs tracking-widest px-6"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-12 rounded-full bg-white text-black hover:bg-white/90 font-bold text-xs tracking-[0.2em] transition-all disabled:opacity-50 mt-4 uppercase"
                  disabled={loading}
                >
                  {loading ? 'Sincronizando...' : 'Establecer Conexión'}
                </Button>

                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="w-full text-center text-[10px] text-white/30 hover:text-white/60 mt-6 transition-colors uppercase tracking-[0.3em]"
                >
                  — Volver atrás —
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 text-[9px] tracking-[0.6em] uppercase text-white/40"
      >
        Autonomous Management System
      </motion.div>
    </div>
  );
}
