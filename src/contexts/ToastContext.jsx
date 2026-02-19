import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', onUndo = null, duration = 5000) => {
        const id = Date.now().toString();
        // Remove existing toast if we want to avoid stacking too many?
        // Let's allow stacking for now, limit to 3 maybe.

        setToasts(prev => {
            const newToast = { id, message, type, onUndo, duration };
            const updated = [...prev, newToast];
            if (updated.length > 5) return updated.slice(updated.length - 5);
            return updated;
        });

        // Auto remove
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {createPortal(
                <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                    {toasts.map(toast => (
                        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};

const Toast = ({ message, type, onUndo, onClose }) => {
    // Stop propagation to allow clicking buttons
    return (
        <div className="pointer-events-auto bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-100 px-4 py-3 rounded-lg shadow-lg flex items-center gap-4 min-w-[300px] animate-in slide-in-from-bottom-2 fade-in duration-300">
            <span className="text-sm font-medium flex-1">{message}</span>
            <div className="flex items-center gap-3 border-l border-zinc-700 pl-3">
                {onUndo && (
                    <button
                        onClick={() => {
                            onUndo();
                            onClose();
                        }}
                        className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Undo
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
