import React from 'react';
import { useGoogleTasks } from '../contexts/GoogleTasksContext';
import { LogIn } from 'lucide-react';

const SessionExpiredModal = () => {
    const { sessionExpired, login } = useGoogleTasks();

    if (!sessionExpired) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-sm w-full p-4 border border-red-200 dark:border-red-900/30 flex items-start gap-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex-shrink-0 flex items-center justify-center">
                    <LogIn className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
                        Session Expired
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 text-xs mb-3">
                        Your connection to Google Tasks expired. Please sign in again to sync changes.
                    </p>
                    <button
                        onClick={() => login({ prompt: 'consent' })}
                        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <LogIn className="w-4 h-4" />
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionExpiredModal;
