import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

export const Toast = ({ message, type, onClose }: ToastProps) => {
    const icons = {
        success: CheckCircle,
        error: XCircle,
        info: Info,
        warning: AlertTriangle
    };

    const colors = {
        success: 'bg-green-500/10 border-green-500/30 text-green-400',
        error: 'bg-red-500/10 border-red-500/30 text-red-400',
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
    };

    const Icon = icons[type];

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${colors[type]} shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-300`}>
            <Icon className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium flex-1">{message}</p>
            <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

interface ToastContainerProps {
    toasts: Array<{ id: string; message: string; type: ToastType }>;
    onRemove: (id: string) => void;
}

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
    return (
        <div className="fixed bottom-6 right-4 z-[100] flex flex-col gap-2 max-w-md">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => onRemove(toast.id)}
                />
            ))}
        </div>
    );
};

// Hook for managing toasts
export const useToast = () => {
    const [toasts, setToasts] = React.useState<Array<{ id: string; message: string; type: ToastType }>>([]);

    const showToast = React.useCallback((message: string, type: ToastType = 'info', duration = 5000) => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = React.useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, showToast, removeToast };
};

