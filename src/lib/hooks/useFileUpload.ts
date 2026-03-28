
// src/lib/hooks/useFileUpload.ts
import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';

interface FileUploadOptions {
    cardId: string;
    groupId: string;
    toNumber: string;
}

export const useFileUpload = () => {
    const { currentUser: user, activeEntity } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const uploadFile = (file: File, options: FileUploadOptions) => {
        if (!user) {
            toast.error("Debes estar autenticado para subir archivos.");
            return;
        }

        const { cardId, groupId, toNumber } = options;
        if (!cardId || !groupId || !toNumber || !activeEntity) {
            toast.error("Faltan datos o contexto (entidad) para enviar el archivo multimedia.");
            return;
        }

        // Create a unique file path
        const storagePath = `uploads/${user.uid}/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        setUploading(true);
        setProgress(0);

        const promise = new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    setProgress(prog);
                },
                (error) => {
                    console.error("Upload error:", error);
                    setUploading(false);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                        const response = await fetch('/api/whatsapp/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                message: `Archivo enviado: ${file.name}`,
                                toNumber: toNumber,
                                cardId: cardId,
                                groupId: groupId,
                                type: 'media',
                                url: downloadURL,
                                filename: file.name,
                                userId: user.uid,
                                entityId: activeEntity
                            })
                        });

                        if (!response.ok) {
                            throw new Error('Error enviando archivo a través de la API');
                        }

                        // Save document metadata to Firestore (Multi-Tenant path)
                        const fileData = {
                            id: `doc_${Date.now()}`,
                            name: file.name,
                            url: downloadURL,
                            type: file.type,
                            size: file.size,
                            uploadedAt: Timestamp.now()
                        };

                        await updateDoc(doc(db, 'users', user.uid, 'entities', activeEntity, 'kanban-groups', groupId, 'cards', cardId), {
                            documents: arrayUnion(fileData),
                            history: arrayUnion({
                                id: `hist_${Date.now()}`,
                                type: 'file',
                                content: `Archivo enviado: ${file.name}`,
                                timestamp: Timestamp.now(),
                                author: 'Agente'
                            })
                        });

                        setUploading(false);
                        resolve();
                    } catch (error) {
                        console.error("Cloud function error:", error);
                        setUploading(false);
                        reject(error);
                    }
                }
            );
        });

        toast.promise(promise, {
            loading: `Subiendo ${file.name}... ${progress}%`,
            success: `¡Archivo "${file.name}" enviado!`,
            error: `Error al enviar "${file.name}".`,
        });
    };

    return { uploading, progress, uploadFile };
};


