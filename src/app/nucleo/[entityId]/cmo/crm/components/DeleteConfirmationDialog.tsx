import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    itemCount?: number;
}

export function DeleteConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    itemCount = 1
}: DeleteConfirmationDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-red-900/50 text-white rounded-2xl p-0 overflow-hidden shadow-2xl border-white/5">
                <DialogTitle className="sr-only">{title}</DialogTitle>
                <DialogDescription className="sr-only">{description}</DialogDescription>
                <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-white tracking-tight">
                                {title}
                            </h2>
                            <p className="text-sm text-neutral-400 leading-relaxed px-4">
                                {description}
                            </p>
                        </div>

                        {itemCount > 1 && (
                            <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                {itemCount} CONTACTOS SELECCIONADOS
                            </Badge>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                        <Button
                            onClick={onConfirm}
                            className="bg-red-600 hover:bg-red-500 text-white font-semibold py-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-red-900/20"
                        >
                            Eliminar Permanentemente
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-neutral-500 hover:text-white hover:bg-white/5 py-6 rounded-xl transition-all"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

