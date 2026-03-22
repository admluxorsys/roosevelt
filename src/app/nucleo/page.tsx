'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';

interface Entity {
  id: string;
  name?: string;
  description?: string;
  type?: string;
}

export default function NucleoPage() {
  const router = useRouter();
  const { currentUser, loading, setActiveEntity } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [transitioning, setTransitioning] = useState<string | null>(null);
  
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [creatingProgress, setCreatingProgress] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    if (currentUser) {
      const q = collection(db, `users/${currentUser.uid}/entities`);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ents = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Entity));
        setEntities(ents);
      }, (error) => {
        console.error("Error cargando entidades (Asegúrate de tener las reglas de Firestore correctas):", error);
        // Fallback robusto para no dejar la pantalla vacía en dev
        setEntities([{id: 'life', name: 'Personal', type: 'persona'}]);
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  if (!mounted || loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white/50 tracking-widest text-sm">Cargando...</div>;
  if (!currentUser) return null;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleSelectEntity = async (entityId: string) => {
    if (!currentUser) return;
    setTransitioning(entityId); // Trigger UI transition state
    
    // 1. Connection with AuthContext
    setActiveEntity(entityId);
    localStorage.setItem('roosevelt_active_entity', entityId);

    // 2. Smart Routing
    setTimeout(() => {
        router.push(`/nucleo/${entityId}`);
    }, 400); // smooth cinematic transition
  };

  const handleCreateEntity = async () => {
    if (!currentUser || !newEntityName.trim()) return;
    setCreatingProgress(true);
    const randomId = `bs_${Math.random().toString(36).substring(2, 9)}`;
    const entityRef = doc(db, `users/${currentUser.uid}/entities/${randomId}`);
    
    await setDoc(entityRef, {
      initialized: true,
      name: newEntityName,
      type: 'empresa',
      description: 'Business OS',
      createdAt: new Date()
    });
    await setDoc(doc(db, `users/${currentUser.uid}/entities/${randomId}/settings/general`), { theme: 'dark', branding: newEntityName });
    await setDoc(doc(db, `users/${currentUser.uid}/entities/${randomId}/integrations/_init`), { encrypted: false, updatedAt: new Date() });
    
    setIsCreating(false);
    setNewEntityName('');
    setCreatingProgress(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex flex-col items-center justify-center selection:bg-white/10 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Logout Button Top Right */}
      <button onClick={handleLogout} className="absolute top-8 right-8 text-neutral-500 hover:text-white flex items-center gap-2 transition-colors">
        <LogOut className="w-4 h-4" />
        <span className="text-sm">Cerrar Sesión</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 w-full max-w-4xl px-6 flex flex-col items-center"
      >
        <h1 className="text-3xl md:text-4xl font-light tracking-wide text-center mb-16 text-white/90">
          ¿Qué entorno vas a conectar?
        </h1>

        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          
          <AnimatePresence>
            {/* Dynamic Rendering of Entities */}
            {entities.map((entity) => (
              <motion.div
                key={entity.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-4 cursor-pointer group transition-all duration-500 ${transitioning && transitioning !== entity.id ? 'opacity-20 scale-95 blur-sm' : ''}`}
                onClick={() => handleSelectEntity(entity.id)}
              >
                <div className="w-32 h-32 rounded-full border-4 border-transparent group-hover:border-white/20 transition-all p-1">
                  <Avatar className="w-full h-full">
                    {entity.type === 'persona' && <AvatarImage src={currentUser.photoURL || undefined} alt="Personal" />}
                    <AvatarFallback className={`text-white text-4xl font-light ${entity.type === 'persona' || entity.id === 'life' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                      {entity.name ? entity.name[0].toUpperCase() : (entity.id === 'life' ? 'P' : entity.id[0].toUpperCase())}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg font-light text-white/70 group-hover:text-white transition-colors">
                    {entity.name || (entity.id === 'life' ? 'Personal' : entity.id.toUpperCase())}
                  </span>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">
                    {entity.type || (entity.id === 'life' ? 'Persona' : 'Workspace')}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add Account Option */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex flex-col items-center gap-4 cursor-pointer group transition-all duration-500 ${transitioning ? 'opacity-20 scale-95 blur-sm' : ''}`}
            onClick={() => setIsCreating(true)}
          >
            <div className="w-32 h-32 rounded-full border-4 border-transparent group-hover:border-white/20 transition-all p-1">
              <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Plus className="w-12 h-12 text-white/50 group-hover:text-white transition-colors" />
              </div>
            </div>
            <span className="text-lg font-light text-white/50 group-hover:text-white transition-colors mt-6">
              Nueva Empresa
            </span>
          </motion.div>

        </div>
      </motion.div>

      {/* Modal Crear Nueva Entidad */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-neutral-800 p-6 rounded-xl w-[400px] shadow-2xl relative">
                <button 
                    onClick={() => setIsCreating(false)}
                    className="absolute top-4 right-4 text-neutral-500 hover:text-white"
                >
                    <X className="w-5 h-5"/>
                </button>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center">
                        <Plus className="w-5 h-5 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-medium text-white">Registrar Empresa</h2>
                </div>
                <p className="text-sm text-neutral-400 mb-6">
                    Al crear una nueva empresa se generará un "Motor Vacío" con su propia base de datos aislada, sus propias configuraciones e integraciones.
                </p>
                <div className="mb-6">
                    <label className="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">Nombre del Proyecto o Empresa</label>
                    <input 
                        type="text" 
                        value={newEntityName}
                        onChange={(e) => setNewEntityName(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="Ej: Starlink, LuxorSys..."
                        autoFocus
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsCreating(false)} className="bg-transparent border-neutral-800 text-white hover:bg-neutral-800">
                        Cancelar
                    </Button>
                    <Button onClick={handleCreateEntity} disabled={creatingProgress || !newEntityName.trim()} className="bg-white hover:bg-neutral-200 text-black">
                        {creatingProgress ? 'Creando Motor...' : 'Crear Entidad'}
                    </Button>
                </div>
            </div>
        </div>
      )}

      {/* Admin Branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 text-[10px] tracking-[0.4em] uppercase text-white/40"
      >
        Roosevelt Identity Core
      </motion.div>
    </div>
  );
}
