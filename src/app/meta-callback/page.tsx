'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

/**
 * META CALLBACK PAGE
 * Handles the redirect from Meta's OAuth dialog (Embedded Signup)
 */
export default function MetaCallbackPage() {
    const { currentUser, activeEntity } = useAuth();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Procesando respuesta de Meta...');
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            // Meta sends the token in the hash fragment for response_type=token
            const hash = window.location.hash;
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            
            // Meta a veces usa nombres distintos segun la version de la API o el flujo
            const wabaIdFromMeta = params.get('whatsapp_business_account_id') || params.get('waba_id');
            const phoneNumberIdFromMeta = params.get('phone_number_id');
            
            if (!accessToken) {
                setStatus('error');
                setMessage('No se recibió el token de acceso de Meta.');
                return;
            }

            // Esperar a que la sesión esté lista antes de dar error
            if (!currentUser || !activeEntity) {
                // No hacemos nada, dejaremos que el useEffect re-dispare cuando currentUser cambie
                return;
            }

            try {
                // En un flujo real, aquí llamaríamos a una Cloud Function para 
                // intercambiar este token de corta duración por uno de larga duración
                // y obtener el WABA_ID y PHONE_NUMBER_ID.
                
                // Por ahora, simulamos el guardado para probar el "Molde Maestro"
                const configRef = doc(db, `users/${currentUser.uid}/entities/${activeEntity}/integrations/whatsapp`);
                await setDoc(configRef, {
                    accessToken,
                    phoneNumberId: phoneNumberIdFromMeta || '',
                    wabaId: wabaIdFromMeta || '',
                    status: 'Connected',
                    provider: 'whatsapp',
                    updatedAt: new Date(),
                }, { merge: true });

                setStatus('success');
                setMessage('¡WhatsApp conectado correctamente! Ya puedes cerrar esta ventana.');
                
                // Notificar a la ventana padre si existe
                if (window.opener) {
                    window.opener.postMessage({ type: 'META_CONNECTED', success: true }, window.location.origin);
                    setTimeout(() => window.close(), 2000);
                }
            } catch (error) {
                console.error(error);
                setStatus('error');
                setMessage('Error al guardar la configuración técnica.');
            }
        };

        handleCallback();
    }, [currentUser, activeEntity]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-white font-sans">
            <div className="max-w-md w-full bg-neutral-900/50 border border-white/10 p-10 rounded-[40px] text-center shadow-2xl backdrop-blur-xl">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-6" />
                        <h1 className="text-xl font-light mb-2">Finalizando Conexión</h1>
                        <p className="text-neutral-500 text-sm">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h1 className="text-xl font-light mb-2">¡Todo listo!</h1>
                        <p className="text-neutral-400 text-sm mb-8">{message}</p>
                        <button 
                            onClick={() => window.close()}
                            className="w-full h-12 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-neutral-200 transition-all"
                        >
                            Cerrar Ventana
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-xl font-light mb-2">Algo salió mal</h1>
                        <p className="text-neutral-400 text-sm mb-8">{message}</p>
                        <button 
                            onClick={() => window.close()}
                            className="w-full h-12 bg-white/5 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/10 transition-all"
                        >
                            Intentar de nuevo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
