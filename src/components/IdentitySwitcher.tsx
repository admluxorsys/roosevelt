'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface Entity {
  id: string;
  name?: string;
  type?: string;
}

const GlassPill = ({ ent, isActive, index, onSelect }: { ent: Entity, isActive: boolean, index: number, onSelect: (id: string, type: string | undefined) => void }) => {
  const isEntPersonal = ent.id === 'life' || ent.type === 'persona';
  const [isPillHovered, setIsPillHovered] = useState(false);

  return (
    <motion.button
      onClick={() => onSelect(ent.id, ent.type)}
      onMouseEnter={() => setIsPillHovered(true)}
      onMouseLeave={() => setIsPillHovered(false)}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
      className="relative group flex items-center justify-center w-[200px] h-[52px] rounded-full cursor-pointer transition-all duration-500 overflow-hidden"
      style={{
        // Fondo base MUY opaco para las láminas no seleccionadas/no hovereadas
        background: isPillHovered 
          ? 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 100%)' 
          : 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        
        // Bordes suaves y biselados (luz en el borde superior, sombra en el inferior)
        boxShadow: isPillHovered 
          ? 'inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -1px 4px rgba(0,0,0,0.9), 0 15px 35px rgba(0,0,0,0.8)'
          : 'inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.6), 0 5px 15px rgba(0,0,0,0.5)',
        
        // Desenfoque de fondo pronunciado en Hover
        backdropFilter: isPillHovered ? 'blur(24px)' : 'blur(8px)',
        
        // Transformación física de profundidad al hacer Hover
        transform: isPillHovered ? 'scale(1.05)' : 'scale(1)',
        zIndex: isPillHovered ? 10 : 1
      }}
    >
      {/* Texto claro y nítido que SOLO aparece en la lámina resaltada */}
      <AnimatePresence>
        {isPillHovered && (
          <motion.div
            initial={{ opacity: 0, filter: 'blur(5px)', scale: 0.9 }}
            animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0, filter: 'blur(5px)', scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          >
            <span className="text-white text-[11px] uppercase font-bold tracking-[0.2em] leading-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
              {ent.name || ent.id}
            </span>
            <span className="text-white/40 text-[8px] uppercase tracking-[0.4em] font-light mt-0.5">
              {isEntPersonal ? 'PERFIL' : 'MENÚ'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Punto brillante sutil para marcar la activa cuando NO hay hover */}
      {isActive && !isPillHovered && (
        <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white/50 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
      )}
    </motion.button>
  );
};

export function IdentitySwitcher() {
  const [isHovered, setIsHovered] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const { currentUser, activeEntity } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      const q = collection(db, `users/${currentUser.uid}/entities`);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ents = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Entity));
        setEntities(ents);
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const handleSelect = (id: string, type: string | undefined) => {
    setIsHovered(false);
    if (id === 'life' || type === 'persona') {
      router.push('/nucleo/life');
    } else {
      router.push(`/nucleo/${id}`);
    }
  };

  const currentEnt = entities.find(e => e.id === activeEntity) || entities[0];

  return (
    <div 
      className="fixed top-8 left-8 z-[9000] flex flex-col gap-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Zona de activación invisible (Arriba a la izquierda) */}
      <div className="absolute -top-8 -left-8 w-64 h-32 bg-transparent cursor-default" />

      {/* Stack Vertical de Láminas (Glass Layers) */}
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            className="absolute top-0 left-0 flex flex-col gap-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {entities.map((ent, idx) => (
              <GlassPill 
                key={ent.id} 
                ent={ent} 
                isActive={activeEntity === ent.id} 
                index={idx}
                onSelect={handleSelect}
              />
            ))}
            
            {/* Pequeña placa base de REGRESO */}
            <motion.button
              onClick={() => router.push('/nucleo')}
              className="mt-4 w-[200px] text-[9px] uppercase tracking-[0.4em] font-medium text-white/20 hover:text-white/60 transition-colors text-center"
            >
              CORE HUB
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
