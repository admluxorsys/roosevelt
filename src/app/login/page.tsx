'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
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
  size: number;
  seed: number;
}

const BlueParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationFrame = useRef<number>();

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

    const particleCount = 450; // Restored to 450 as requested
    particles.current = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 1.5 + 0.5,
      seed: Math.random()
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.current.forEach((p) => {
        p.x += p.vx + Math.sin(Date.now() * 0.001 + p.seed * 10) * 0.2;
        p.y += p.vy + Math.cos(Date.now() * 0.001 + p.seed * 10) * 0.2;
        
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        
        const opacity = 0.1 + p.seed * 0.3;
        ctx.fillStyle = `rgba(59, 130, 246, ${opacity})`;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Removed expensive shadowBlur effect
      });

      animationFrame.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[5] pointer-events-none" />;
};



export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isHoveringText, setIsHoveringText] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/suite/life');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // toast.success('Sesión iniciada correctamente');
      router.push('/suite/life');
    } catch (error: any) {
      toast.error('Error al iniciar sesión: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col items-center justify-end overflow-hidden selection:bg-white/10">
      {/* Central Roosevelt AI GIF - Low Z-index */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <motion.img 
          src="/assets/Roosevelt Ai.gif" 
          alt="Roosevelt AI"
          initial={{ opacity: 0, scale: 1.1, y: -40 }}
          animate={{ opacity: 1, scale: 1.4, y: -80 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="w-full max-w-5xl h-auto"
        />
      </div>

      {/* Blue Particles - Middle Z-index (Over the GIF) */}
      <BlueParticles />

      {/* Content Container - High Z-index (Over Particles and GIF) */}
      <div className="relative z-[10] w-full max-w-lg px-6 flex flex-col items-center pb-24">
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
              <h1 className="text-3xl md:text-4xl font-extralight tracking-tighter text-center mb-16 text-white/90">
                Welcome to your <br /> <span className="text-white font-light uppercase tracking-[0.3em] text-xs mt-2 block opacity-60">Personal Administrator</span>
              </h1>

              <Button
                variant="outline"
                className="w-full max-w-sm h-14 rounded-full bg-white/5 border-white/10 text-white/40 cursor-not-allowed hover:bg-white/5 font-light text-sm tracking-widest transition-all"
                disabled
              >
                GET MY DIGITAL CHARACTER
              </Button>

              <Button
                variant="outline"
                className="w-full max-w-sm h-14 rounded-full bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20 font-medium text-sm tracking-widest transition-all"
                onClick={() => setShowForm(true)}
              >
                I ALREADY HAVE MY DIGITAL CHARACTER
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
                <h2 className="text-xl font-light tracking-[0.2em] text-white/90">Personal Access</h2>
                <div className="h-px w-12 bg-white/20 mx-auto mt-4" />
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1">
                  <Input
                    type="email"
                    placeholder="Digital Identity (Email)"
                    className="bg-white/5 border-white/10 rounded-full h-12 focus:border-white/30 text-white placeholder:text-white/20 transition-all text-xs tracking-widest px-6"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Input
                    type="password"
                    placeholder="Password"
                    className="bg-white/5 border-white/10 rounded-full h-12 focus:border-white/30 text-white placeholder:text-white/20 transition-all text-xs tracking-widest px-6"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-full bg-white text-black hover:bg-white/90 font-bold text-sm tracking-[0.2em] transition-all disabled:opacity-50 mt-4"
                  disabled={loading}
                >
                  {loading ? 'Synchronizing...' : 'Login'}
                </Button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="w-full text-center text-[10px] text-white/30 hover:text-white/60 mt-6 transition-colors tracking-[0.3em]"
                >
                  — Go back —
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
