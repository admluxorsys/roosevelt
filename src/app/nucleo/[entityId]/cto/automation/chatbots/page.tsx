
'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, MessageCircle, Power, ArrowLeft, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface Bot {
  id: string;
  name: string;
  isActive: boolean;
}

const ChatbotsPage = () => {
  const router = useRouter();
  const { currentUser, activeEntity } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingBots, setUpdatingBots] = useState<string[]>([]);
  const [botToDelete, setBotToDelete] = useState<Bot | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    if (!currentUser || !activeEntity) return;

    const botsCollection = collection(db, 'users', currentUser.uid, 'entities', activeEntity, 'chatbots');

    const unsubscribe = onSnapshot(
      botsCollection,
      (querySnapshot) => {
        const botsData = querySnapshot.docs.map(
          (doc) =>
          ({
            id: doc.id,
            name: doc.data().name || 'Bot sin nombre',
            isActive: doc.data().isActive || false,
            ...doc.data(),
          } as Bot)
        );
        setBots(botsData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching bots with snapshot: ', error);
        toast.error('No se pudieron cargar los bots.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, activeEntity]);

  const handleGoBack = () => {
    router.push(`/nucleo/${activeEntity}/cto/automation`);
  };

  const handleCreateNewBot = async () => {
    if (!currentUser || !activeEntity) return;
    setIsLoading(true);

    try {
        const counterRef = doc(db, 'users', currentUser.uid, 'entities', activeEntity, 'system_metadata', 'chatbot_counter');
        
        const newBotId = await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            let currentCount = 0;
            if (counterDoc.exists()) {
                currentCount = counterDoc.data().count || 0;
            }
            
            const nextCount = currentCount + 1;
            transaction.set(counterRef, { count: nextCount }, { merge: true });
            
            const formattedId = String(nextCount).padStart(20, '0');
            
            const botRef = doc(db, 'users', currentUser.uid, 'entities', activeEntity, 'chatbots', formattedId);
            transaction.set(botRef, {
                id: formattedId,
                name: 'Nuevo Chatbot',
                isActive: false,
                createdAt: new Date(),
                flow: {
                    nodes: [{ id: '1', type: 'startNode', position: { x: 250, y: 5 }, data: { label: 'Inicio' } }],
                    edges: []
                }
            });
            
            return formattedId;
        });

        router.push(`/nucleo/${activeEntity}/cto/automation/chatbots/${newBotId}`);
    } catch (error) {
        console.error("Error creating bot:", error);
        toast.error("No se pudo crear el chatbot.");
        setIsLoading(false);
    }
  };

  const handleBotClick = (botId: string) => {
    router.push(`/nucleo/${activeEntity}/cto/automation/chatbots/${botId}`);
  };

  const handleToggleBotStatus = async (bot: Bot) => {
    setUpdatingBots((prev) => [...prev, bot.id]);
    try {
      const newStatus = !bot.isActive;

      // Si vamos a ACTIVAR este bot, primero desactivamos todos los demás
      if (newStatus) {
        const otherActiveBots = bots.filter(b => b.isActive && b.id !== bot.id);
        for (const otherBot of otherActiveBots) {
          const otherBotRef = doc(db, 'users', currentUser!.uid, 'entities', activeEntity!, 'chatbots', otherBot.id);
          await updateDoc(otherBotRef, { isActive: false });
        }
      }

      const botRef = doc(db, 'users', currentUser!.uid, 'entities', activeEntity!, 'chatbots', bot.id);
      await updateDoc(botRef, { isActive: newStatus });

      toast.success(
        `Bot "${bot.name}" ${newStatus ? 'activado' : 'desactivado'}.`
      );
    } catch (error) {
      console.error('Error updating bot status:', error);
      toast.error('No se pudo actualizar el estado del bot.');
    } finally {
      setUpdatingBots((prev) => prev.filter((id) => id !== bot.id));
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, bot: Bot) => {
    e.stopPropagation();
    setBotToDelete(bot);
    setDeleteConfirmation('');
  };

  const confirmDelete = async () => {
    if (!botToDelete || deleteConfirmation !== 'delete') return;

    try {
      await deleteDoc(doc(db, 'users', currentUser!.uid, 'entities', activeEntity!, 'chatbots', botToDelete.id));
      toast.success(`Bot "${botToDelete.name}" eliminado correctamente.`);
      setBotToDelete(null);
    } catch (error) {
      console.error('Error deleting bot:', error);
      toast.error('Error al eliminar el bot.');
    }
  };

  return (
    <div className="p-6 bg-neutral-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={handleGoBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-medium tracking-tight">Mis Chatbots</h1>
        </div>
        <Button
          onClick={handleCreateNewBot}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg shadow-md transform transition-transform duration-200 hover:scale-105 h-8"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Crear Nuevo Bot
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center mt-20">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {bots.length > 0 ? (
            bots.map((bot) => (
              <div
                key={bot.id}
                className="bg-neutral-800 border border-neutral-700 rounded-lg shadow-sm hover:shadow-blue-500/10 transition-all duration-300 flex flex-col group relative"
              >
                <div
                  onClick={() => handleBotClick(bot.id)}
                  className="p-4 cursor-pointer flex-grow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <MessageCircle className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] uppercase font-medium tracking-wider rounded-full ${bot.isActive
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-neutral-600/50 text-neutral-400'
                          }`}
                      >
                        {bot.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-neutral-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={(e) => handleDeleteClick(e, bot)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <h2 className="text-sm font-medium text-white truncate mb-1">
                    {bot.name}
                  </h2>
                  <p className="text-[10px] text-neutral-500 font-mono break-all leading-tight">
                    {bot.id}
                  </p>
                </div>

                <div className="px-6 py-4 bg-neutral-800/50 rounded-b-xl border-t border-neutral-700">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleBotStatus(bot);
                    }}
                    className={`w-full font-medium transition-colors duration-200 flex items-center justify-center ${bot.isActive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    disabled={updatingBots.includes(bot.id)}
                  >
                    {updatingBots.includes(bot.id) ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Power className="mr-2 h-4 w-4" />
                        {bot.isActive ? 'Desactivar' : 'Activar'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-neutral-800 rounded-xl border border-dashed border-neutral-700">
              <p className="text-neutral-400 text-lg">
                No se encontraron bots.
              </p>
              <p className="text-neutral-500 mt-2">
                ¡Crea uno nuevo para empezar a automatizar!
              </p>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!botToDelete} onOpenChange={(open) => !open && setBotToDelete(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar Bot</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Esta acción no se puede deshacer. Esto eliminará permanentemente el bot <span className="font-medium text-white">{botToDelete?.name}</span> y eliminará sus datos de nuestros servidores.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-neutral-300">
                Escribe <span className="font-medium select-none">delete</span> para confirmar.
              </p>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white focus:ring-red-500 focus:border-red-500"
                placeholder="Escribe delete"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button
              variant="secondary"
              onClick={() => setBotToDelete(null)}
              className="bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmation !== 'delete'}
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatbotsPage;

