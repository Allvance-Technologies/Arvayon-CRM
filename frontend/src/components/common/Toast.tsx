import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContainerProps {
    toasts: Toast[];
    removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: Toast; removeToast: (id: string) => void }> = ({ toast, removeToast }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            removeToast(toast.id);
        }, 5000);

        return () => clearTimeout(timer);
    }, [toast.id, removeToast]);

    const typeConfig = {
        success: { icon: CheckCircle, colors: 'bg-green-50 text-green-800 border-green-200' },
        error: { icon: AlertCircle, colors: 'bg-red-50 text-red-800 border-red-200' },
        warning: { icon: AlertCircle, colors: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
        info: { icon: Info, colors: 'bg-blue-50 text-blue-800 border-blue-200' },
    };

    const { icon: Icon, colors } = typeConfig[toast.type];

    return (
        <div className={`flex items-center gap-3 p-4 rounded-lg border shadow-sm max-w-sm w-full font-medium ${colors} transition-all duration-300 animate-in slide-in-from-right-full`}>
            <Icon className="w-5 h-5 shrink-0" />
            <span className="flex-1 text-sm">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="shrink-0 p-1 hover:bg-black/5 rounded-md transition-colors">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
