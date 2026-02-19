import React from 'react';
import { useGoogleTasks } from '../contexts/GoogleTasksContext';
import { LogIn } from 'lucide-react';

const SessionExpiredModal = () => {
    const { sessionExpired, login } = useGoogleTasks();

    if (!sessionExpired) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-sm w-full p-6 text-center border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LogIn className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>

                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                    Session Expired
                </h3>

                <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
                    Your connection to Google Tasks has expired. Please sign in again to continue syncing your changes.
                </p>

                <button
                    onClick={() => login()}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <LogIn className="w-4 h-4" />
                    Sign In
                </button>
            </div>
        </div>
    );
};

export default SessionExpiredModal;
