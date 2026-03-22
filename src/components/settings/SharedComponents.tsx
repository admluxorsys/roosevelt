// src/components/settings/SharedComponents.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';
import { UploadCloud, XCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase';

export const SettingsSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="flex flex-col space-y-4 py-3 border-b border-neutral-800/50 last:border-0 px-1">
        <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.15em] mb-1">{title}</h4>
        <div className="flex flex-col gap-3">{children}</div>
    </div>
);

export const Field = ({ label, htmlFor, children, description = null }: { label: string, htmlFor: string, children: React.ReactNode, description?: string | null }) => (
    <div className="flex flex-col space-y-1.5 px-1 py-1">
        <div className="flex flex-col">
            <Label htmlFor={htmlFor} className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.15em] leading-tight mb-1">{label}</Label>
            {description && <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-wider leading-tight mb-2">{description}</p>}
        </div>
        <div className="w-full">
            {children}
        </div>
    </div>
);

export const FileUploader = ({ onUploadSuccess, initialUrl = null, initialFilename = null }: { onUploadSuccess: (url: string, filename: string, fileType: string) => void, initialUrl: string | null, initialFilename: string | null }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [fileUrl, setFileUrl] = useState<string | null>(initialUrl);
    const [filename, setFilename] = useState<string | null>(initialFilename);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setFileUrl(initialUrl);
        setFilename(initialFilename);
    }, [initialUrl, initialFilename]);

    const onDrop = useCallback((acceptedFiles: any) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        const storage = getStorage(app);
        const storageRef = ref(storage, `chatbot_media/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setProgress(prog);
            },
            (err) => {
                console.error("Error al subir archivo:", err);
                setError('Error al subir el archivo.');
                setUploading(false);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    setFileUrl(downloadURL);
                    setFilename(file.name);
                    onUploadSuccess(downloadURL, file.name, file.type);
                    setUploading(false);
                });
            }
        );
    }, [onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

    const handleRemoveFile = () => {
        setFileUrl(null);
        setFilename(null);
        onUploadSuccess('', '', '');
    };

    if (fileUrl) {
        return (
            <div className="p-3 bg-neutral-800 rounded-lg flex items-center justify-between border border-neutral-700">
                <p className="text-sm text-white truncate pr-4">{filename}</p>
                <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-7 w-7">
                    <XCircle className="text-red-500 hover:text-red-400" size={18} />
                </Button>
            </div>
        );
    }

    return (
        <div {...getRootProps()} className={cn("p-6 border-2 border-dashed rounded-lg cursor-pointer text-center transition-colors", isDragActive ? "border-purple-500 bg-purple-900/20" : "border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800/50")}>
            <input {...getInputProps()} />
            {uploading ? (
                <div className="space-y-2">
                    <Progress value={progress} className="w-full bg-neutral-700" />
                    <p className="text-sm text-neutral-400">Subiendo... {Math.round(progress)}%</p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-500">
                    <UploadCloud size={32} />
                    <p className="text-sm">
                        {isDragActive ? "Suelta el archivo aquí" : "Arrastra un archivo o haz clic"}
                    </p>
                    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
            )}
        </div>
    );
};

