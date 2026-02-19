import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { X, Moon, Sun, Monitor, Keyboard, Command } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const { theme, setTheme } = useTheme();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Appearance Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Appearance</h3>
                        <div className="grid grid-cols-3 gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                            <button
                                onClick={() => setTheme('light')}
                                className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${theme === 'light'
                                        ? 'bg-white dark:bg-zinc-700 text-purple-600 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                    }`}
                            >
                                <Sun className="w-4 h-4" />
                                Light
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${theme === 'dark'
                                        ? 'bg-white dark:bg-zinc-700 text-purple-600 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                    }`}
                            >
                                <Moon className="w-4 h-4" />
                                Dark
                            </button>
                            <button
                                onClick={() => setTheme('system')}
                                className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${theme === 'system'
                                        ? 'bg-white dark:bg-zinc-700 text-purple-600 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                    }`}
                            >
                                <Monitor className="w-4 h-4" />
                                System
                            </button>
                        </div>
                    </div>

                    {/* Shortcuts Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 uppercase tracking-wider">
                            <Keyboard className="w-4 h-4" />
                            <h3>Keyboard Shortcuts</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-700 dark:text-zinc-300">New Task</span>
                                <div className="flex gap-1">
                                    <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border-b-2 border-zinc-200 dark:border-zinc-700 rounded text-xs font-mono text-zinc-500">⌘</kbd>
                                    <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border-b-2 border-zinc-200 dark:border-zinc-700 rounded text-xs font-mono text-zinc-500">K</kbd>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-700 dark:text-zinc-300">Close Modal</span>
                                <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border-b-2 border-zinc-200 dark:border-zinc-700 rounded text-xs font-mono text-zinc-500">Esc</kbd>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-700 dark:text-zinc-300">Save Task</span>
                                <div className="flex gap-1">
                                    <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border-b-2 border-zinc-200 dark:border-zinc-700 rounded text-xs font-mono text-zinc-500">⌘</kbd>
                                    <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border-b-2 border-zinc-200 dark:border-zinc-700 rounded text-xs font-mono text-zinc-500">Enter</kbd>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 text-center">
                    <p className="text-xs text-zinc-400">
                        Eisenhower Matrix v1.0.0 • Made with ❤️
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
