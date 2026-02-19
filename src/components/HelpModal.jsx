import React from 'react';
import { X, Globe, Smartphone, Calendar, Info } from 'lucide-react';

const HelpModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-zinc-800">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Info className="w-5 h-5 text-purple-600" />
                        About Eisenhower Matrix
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                            <Globe className="w-5 h-5 text-blue-500" />
                            Cross-Device Sync
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Your tasks are synced seamlessly with <strong>Google Tasks</strong>.
                            To remember which quadrant a task belongs to, we automatically add a small tag
                            (like <code>[#q:do-first]</code>) to the task's notes.
                            This ensures your matrix layout is preserved across all your devices!
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                            <Smartphone className="w-5 h-5 text-purple-500" />
                            Mobile Friendly
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            On mobile devices, the matrix transforms into a vertical stack view for easier scrolling and management.
                            The same drag-and-drop functionality works perfectly on touch screens.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                            <Calendar className="w-5 h-5 text-green-500" />
                            Due Dates
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Set due dates for your tasks to keep track of deadlines. Tasks will display their due date
                            and highlight in red if they are overdue.
                        </p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
                        <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-2">How to Prioritize</h4>
                        <ul className="text-sm space-y-1 text-purple-800 dark:text-purple-400">
                            <li>🔴 <strong>Do First:</strong> Urgent & Important (Crises, deadlines)</li>
                            <li>🔵 <strong>Schedule:</strong> Not Urgent & Important (Planning, relationships)</li>
                            <li>🟡 <strong>Delegate:</strong> Urgent & Not Important (Interruptions, meetings)</li>
                            <li>🟢 <strong>Delete:</strong> Not Urgent & Not Important (Distractions)</li>
                        </ul>
                    </div>
                </div>

                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
