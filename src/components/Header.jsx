import React, { useState } from 'react';
import { useGoogleTasks } from '../contexts/GoogleTasksContext';
import { LogOut, LayoutGrid, ChevronDown, CheckSquare, Settings, Flame, Info } from 'lucide-react';
import SessionExpiredModal from './SessionExpiredModal';
import SettingsModal from './SettingsModal';
import BurnoutDashboard from './BurnoutDashboard';
import HelpModal from './HelpModal';

const Header = () => {
    const { user, login, logout, taskLists, currentListId, switchList, isDemo, enterDemoMode, exitDemoMode } = useGoogleTasks();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isBurnoutOpen, setIsBurnoutOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    return (
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-4 sticky top-0 z-10">
            <div className="flex items-center gap-2">
                <div className="bg-purple-600 p-1.5 rounded-lg">
                    <LayoutGrid className="w-5 h-5 text-white" />
                </div>
                <h1 className="font-bold text-xl text-zinc-800 dark:text-zinc-100 hidden sm:block">Eisenhower Matrix</h1>
            </div>

            <div className="flex items-center gap-4">
                {user ? (
                    <>
                        {taskLists.length > 0 && (
                            <div className="relative group">
                                <select
                                    value={currentListId || ''}
                                    onChange={(e) => switchList(e.target.value)}
                                    className="appearance-none bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors max-w-[150px] sm:max-w-[200px] truncate"
                                >
                                    {taskLists.map(list => (
                                        <option key={list.id} value={list.id}>
                                            {list.title}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                            </div>
                        )}

                        <div className="hidden sm:flex items-center gap-2">
                            <img
                                src={user.picture}
                                alt={user.name}
                                className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700"
                            />
                            <div className="text-xs">
                                <p className="font-medium text-zinc-700 dark:text-zinc-200">{user.name}</p>
                                <p className="text-zinc-500">{user.email}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsBurnoutOpen(true)}
                            className="p-2 text-zinc-500 hover:text-orange-500 dark:text-zinc-400 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                            title="Productivity Heatmap"
                        >
                            <Flame className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => setIsHelpOpen(true)}
                            className="p-2 text-zinc-500 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Help & Info"
                        >
                            <Info className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>

                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        {isDemo ? (
                            <button
                                onClick={exitDemoMode}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Exit Demo</span>
                            </button>
                        ) : (
                            <button
                                onClick={enterDemoMode}
                                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors px-3 py-2"
                            >
                                Try Demo
                            </button>
                        )}

                        {!isDemo && (
                            <button
                                onClick={() => login()}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-purple-200 dark:shadow-none"
                            >
                                <CheckSquare className="w-4 h-4" />
                                Sign In with Google
                            </button>
                        )}
                    </div>
                )}
            </div>

            <SessionExpiredModal />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <BurnoutDashboard isOpen={isBurnoutOpen} onClose={() => setIsBurnoutOpen(false)} />
            <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        </header>
    );
};

export default Header;
