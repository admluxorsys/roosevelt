
// src/lib/hooks/useFileUpload.ts
import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

const sendkambanMediaMessage = httpsCallable(functions, 'sendkambanMediaMessage');

interface FileUploadOptions {
    cardId: string;
    groupId: string;
    toNumber: string;
}

export const useFileUpload = () => {
    const [user] = useAuthState(auth);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const uploadFile = (file: File, options: FileUploadOptions) => {
        if (!user) {
            toast.error("Debes estar autenticado para subir archivos.");
            return;
        }

        const { cardId, groupId, toNumber } = options;
        if (!cardId || !groupId || !toNumber) {
            toast.error("Faltan datos para enviar el archivo multimedia.");
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

                        await sendkambanMediaMessage({
                            cardId,
                            groupId,
                            fileUrl: downloadURL,
                            toNumber,
                            fileName: file.name
                        });

                        // Save document metadata to Firestore
                        const fileData = {
                            id: `doc_${Date.now()}`,
                            name: file.name,
                            url: downloadURL,
                            type: file.type,
                            size: file.size,
                            uploadedAt: Timestamp.now()
                        };

                        await updateDoc(doc(db, 'kamban-groups', groupId, 'cards', cardId), {
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

