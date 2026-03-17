'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, DoorOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function LogoutButton() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  // Debug log to see if the component is alive
  // console.log("LogoutButton: Current User:", currentUser?.email);

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
      {/* Main Trigger Area - Corner sensitive zone */}
      <div 
        className="fixed bottom-0 left-0 w-[120px] h-[120px] z-[1000000] pointer-events-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ opacity: 0, x: -10, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -10, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={handleLogout}
              className="absolute bottom-6 left-6 p-4 flex flex-col items-center gap-2 group outline-none bg-transparent border-none shadow-none"
            >
              <div className="transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                <DoorOpen size={28} className="text-white/40 group-hover:text-white transition-all duration-300" />
              </div>
              <span className="text-[9px] uppercase font-bold tracking-[0.4em] text-white/20 group-hover:text-white/90 transition-all duration-300">
                EXIT SYSTEM
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
