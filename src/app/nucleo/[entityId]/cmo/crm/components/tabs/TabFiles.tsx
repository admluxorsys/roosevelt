import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Image as ImageIcon, X, Loader2, Eye, Plus } from 'lucide-react';
import { storage } from '@/lib/firebase'; // Ensure this exports your storage instance
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { toast } from 'sonner';

interface TabFilesProps {
    contact: any;
    updateField: (field: string, value: any) => void;
    isEditing?: boolean;
}

export const TabFiles: React.FC<TabFilesProps> = ({ contact, updateField, isEditing = false }) => {
    const [uploading, setUploading] = useState(false);

    // Documents structure: contact.documents = [{ name: 'ID Front', url: '...', type: 'image/jpeg', path: '...' }]
    const documents = contact.documents || [];

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'id_photo' | 'document') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error("El archivo es demasiado grande (Máx 5MB)");
            return;
        }

        setUploading(true);
        try {
            // Create a unique path: contacts/{contactId}/{timestamp}_{filename}
            // If contact.id doesn't exist yet (new contact), use a temp ID or timestamp
            const contactId = contact.id || `temp_${Date.now()}`;
            const path = `contacts/${contactId}/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, path);

            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            const newDoc = {
                name: file.name,
                url: url,
                type: file.type,
                path: path, // stored to allow deletion later
                category: type,
                uploadedAt: new Date().toISOString()
            };

            updateField('documents', [...documents, newDoc]);
            toast.success("Archivo subido exitosamente");

        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Error al subir archivo");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (index: number) => {
        if (!window.confirm("¿Eliminar este archivo?")) return;

        const docToDelete = documents[index];
        const newDocs = documents.filter((_: any, i: number) => i !== index);

        // Optimistic update
        updateField('documents', newDocs);

        // Try to delete from storage if path exists
        if (docToDelete.path) {
            try {
                const storageRef = ref(storage, docToDelete.path);
                await deleteObject(storageRef);
            } catch (error) {
                console.error("Delete error:", error);
                // We don't rollback state here because purely DB reference removal is often enough if storage fails
            }
        }
    };

    return (
        <fieldset disabled={!isEditing} className="space-y-6 block border-0 p-0 m-0 min-w-0">
            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">Foto ID (Tipo Pasaporte 5x5)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 bg-neutral-950 rounded-full border-2 border-dashed border-neutral-800 flex items-center justify-center overflow-hidden relative group">
                            {/* Display latest ID photo if exists */}
                            {documents.find((d: any) => d.category === 'id_photo') ? (
                                <img
                                    src={documents.find((d: any) => d.category === 'id_photo').url}
                                    alt="ID"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <UserIconPlaceholder />
                            )}
                        </div>
                        <div>
                            <Label htmlFor="id-upload" className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2">
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                Subir Foto ID
                            </Label>
                            <input id="id-upload" type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => handleFileUpload(e, 'id_photo')} disabled={uploading} />
                            <p className="text-[10px] text-neutral-500 mt-2">JPEG/PNG, Máx 5MB. Formato 5x5 recomendado.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-white uppercase tracking-wider">Documentos Adjuntos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {documents.map((doc: any, index: number) => (
                            <div key={index} className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 relative group hover:border-neutral-700 transition-all">
                                <button
                                    onClick={() => handleDelete(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>

                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-md bg-neutral-900 flex items-center justify-center text-neutral-500">
                                        {doc.type?.includes('image') ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-neutral-300 truncate" title={doc.name}>{doc.name}</p>
                                        <p className="text-[10px] text-neutral-600 truncate">{new Date(doc.uploadedAt || Date.now()).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full text-center bg-neutral-900 hover:bg-neutral-800 text-neutral-400 py-1.5 rounded text-[10px] font-medium transition-colors"
                                >
                                    <Eye className="w-3 h-3 inline mr-1" /> Ver Archivo
                                </a>
                            </div>
                        ))}

                        <label className="bg-neutral-950 p-3 rounded-lg border-2 border-dashed border-neutral-800 flex flex-col items-center justify-center cursor-pointer hover:border-neutral-600 transition-all min-h-[100px]">
                            {uploading ? <Loader2 className="w-6 h-6 animate-spin text-neutral-500" /> : <Plus className="w-6 h-6 text-neutral-500" />}
                            <span className="text-[10px] text-neutral-500 font-medium mt-2 uppercase tracking-wider">Agregar PDF/IMG</span>
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'document')} disabled={uploading} />
                        </label>
                    </div>
                </CardContent>
            </Card>
        </fieldset>
    );
};

const UserIconPlaceholder = () => (
    <svg className="w-12 h-12 text-neutral-800" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
);

