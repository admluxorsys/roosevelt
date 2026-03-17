'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DoorOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function LogoutButton() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  // If not logged in or on the login page, don't show the button
  if (!currentUser || pathname === '/login') return null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Sesión cerrada correctamente');
      router.push('/login');
    } catch (error: any) {
      toast.error('Error al cerrar sesión: ' + error.message);
    }
  };

  return (
    <>
      {/* Invisible trigger area in the bottom-left corner */}
      <div 
        className="fixed bottom-0 left-0 w-32 h-32 z-[9998] pointer-events-auto"
        onMouseEnter={() => setIsHovered(true)}
      />

      <AnimatePresence>
        {isHovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, x: -20, y: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20, y: 20 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleLogout}
            className="fixed bottom-8 left-8 z-[9999] p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all shadow-xl group"
            title="Cerrar Sesión"
          >
            <DoorOpen size={24} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
