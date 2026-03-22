import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface ImportDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onDrop: (acceptedFiles: File[]) => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
    isOpen,
    onOpenChange,
    onDrop
}) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        multiple: false
    });

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-12 bg-neutral-900/50 backdrop-blur-xl border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 text-white rounded-xl px-5 transition-all">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-950 border-neutral-800 text-white sm:max-w-md rounded-2xl p-8 backdrop-blur-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-medium tracking-tight">Bulk Import</DialogTitle>
                    <DialogDescription className="text-neutral-300 text-base mt-2">
                        Effortlessly scale your database by uploading Excel or CSV files.
                    </DialogDescription>
                </DialogHeader>
                <div
                    {...getRootProps()}
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer group mt-6 relative overflow-hidden ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-neutral-800 hover:border-blue-500/50 hover:bg-blue-500/5'
                        }`}
                >
                    <input {...getInputProps()} />
                    <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors" />
                    <Upload className={`w-12 h-12 mb-4 transition-transform group-hover:scale-110 ${isDragActive ? 'text-blue-500 scale-110' : 'text-neutral-400 group-hover:text-blue-500'}`} />
                    <p className="text-base text-neutral-400 font-medium mb-1">
                        {isDragActive ? 'Suelte el archivo aquí' : 'Haz clic o arrastra un archivo'}
                    </p>
                    <p className="text-xs text-neutral-400">CSV (Standard contact format)</p>
                </div>
                <div className="mt-4 p-4 bg-neutral-900/50 rounded-xl border border-white/5">
                    <h4 className="text-[10px] font-medium uppercase tracking-widest text-blue-500 mb-2">Formato Requerido (CSV)</h4>
                    <code className="text-[9px] text-neutral-400 break-all leading-relaxed">
                        name, email, phone, source, stage, city, profession, company
                    </code>
                </div>
                <DialogFooter className="mt-8">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-neutral-300 hover:text-white rounded-xl">Cancelar</Button>
                    <Button onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()} className="bg-blue-600 hover:bg-blue-700 px-8 rounded-xl shadow-lg shadow-blue-600/20 font-medium">Seleccionar Archivo</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

