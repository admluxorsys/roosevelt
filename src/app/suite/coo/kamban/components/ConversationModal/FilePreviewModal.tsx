'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Image as ImageIcon, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileUrl: string;
    fileName: string;
    fileType: string;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
    isOpen,
    onClose,
    fileUrl,
    fileName,
    fileType
}) => {
    const isPDF = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
    const isImage = fileType?.startsWith('image/');
    const isWord = fileType?.includes('word') || fileType?.includes('document') ||
        fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc');
    const isExcel = fileType?.includes('sheet') ||
        fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls');
    const isPowerPoint = fileType?.includes('presentation') ||
        fileName.toLowerCase().endsWith('.pptx') || fileName.toLowerCase().endsWith('.ppt');

    // Any Office document that can be previewed with Google Docs Viewer
    const isOfficeDocument = isWord || isExcel || isPowerPoint;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderPreview = () => {
        if (isImage) {
            return (
                <div className="flex items-center justify-center h-full p-8">
                    <img
                        src={fileUrl}
                        alt={fileName}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                </div>
            );
        }

        if (isPDF) {
            return (
                <iframe
                    src={fileUrl}
                    className="w-full h-full rounded-lg"
                    title={fileName}
                />
            );
        }

        if (isOfficeDocument) {
            // Use Google Docs Viewer for all Office documents (Word, Excel, PowerPoint)
            return (
                <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                    className="w-full h-full rounded-lg"
                    title={fileName}
                />
            );
        }

        // Fallback for unsupported file types
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <File size={64} className="text-neutral-500 mb-4" />
                <p className="text-lg font-medium tracking-tight text-white mb-2">{fileName}</p>
                <p className="text-sm text-neutral-400 mb-6">
                    No se puede previsualizar este tipo de archivo
                </p>
                <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
                    <Download size={16} className="mr-2" />
                    Descargar Archivo
                </Button>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.3 }}
                        className="relative w-[95vw] h-[95vh] max-w-7xl bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {isPDF ? (
                                    <FileText size={20} className="text-red-500 flex-shrink-0" />
                                ) : isImage ? (
                                    <ImageIcon size={20} className="text-blue-500 flex-shrink-0" />
                                ) : (
                                    <File size={20} className="text-neutral-500 flex-shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium tracking-tight text-white truncate">{fileName}</p>
                                    <p className="text-xs text-neutral-500">
                                        {isPDF ? 'PDF Document' : isImage ? 'Imagen' : isWord ? 'Word Document' : isExcel ? 'Excel Spreadsheet' : 'Archivo'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDownload}
                                    className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                                >
                                    <Download size={16} className="mr-2" />
                                    Descargar
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                                >
                                    <X size={20} />
                                </Button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="w-full h-full pt-16 bg-neutral-950">
                            {renderPreview()}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FilePreviewModal;
