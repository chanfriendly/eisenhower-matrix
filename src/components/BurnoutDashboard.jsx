import React from 'react';
import { Flame, Activity, X } from 'lucide-react';
import { useGoogleTasks } from '../contexts/GoogleTasksContext';

const BurnoutDashboard = ({ isOpen, onClose }) => {
    const { tasks } = useGoogleTasks();

    if (!isOpen) return null;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Filter for completed tasks in the last 7 days
    const recentCompletedTasks = tasks.filter(task => {
        if (task.status !== 'completed' || !task.updated) return false;
        const updatedDate = new Date(task.updated);
        return updatedDate >= sevenDaysAgo;
    });

    const totalRecent = recentCompletedTasks.length;

    const q1Count = recentCompletedTasks.filter(t => t.quadrantId === 'do-first').length;
    const q3Count = recentCompletedTasks.filter(t => t.quadrantId === 'delegate').length;

    const firefightingCount = q1Count + q3Count;
    const burnoutRatio = totalRecent > 0 ? (firefightingCount / totalRecent) : 0;
    const isBurnoutWarning = burnoutRatio > 0.8;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        <h2>Productivity Heatmap (7 Days)</h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Total Completed Tasks</p>
                        <p className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">{totalRecent}</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-red-600 dark:text-red-400 font-medium">Q1 (Urgent/Important)</span>
                                <span className="text-zinc-600 dark:text-zinc-400">{q1Count} tasks</span>
                            </div>
                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${totalRecent > 0 ? (q1Count / totalRecent) * 100 : 0}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-amber-600 dark:text-amber-400 font-medium">Q3 (Urgent/Not Important)</span>
                                <span className="text-zinc-600 dark:text-zinc-400">{q3Count} tasks</span>
                            </div>
                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${totalRecent > 0 ? (q3Count / totalRecent) * 100 : 0}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {totalRecent > 0 ? (
                        <div className={`p-4 rounded-lg border ${isBurnoutWarning ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50'}`}>
                            <div className="flex items-start gap-3">
                                {isBurnoutWarning ? (
                                    <Flame className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0 mt-0.5 border border-green-200 dark:border-green-800">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    </div>
                                )}
                                <div>
                                    <h3 className={`font-semibold text-sm ${isBurnoutWarning ? 'text-red-800 dark:text-red-400' : 'text-green-800 dark:text-green-400'}`}>
                                        {isBurnoutWarning ? 'Burnout Warning' : 'Healthy Balance'}
                                    </h3>
                                    <p className={`text-xs mt-1 ${isBurnoutWarning ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-300'}`}>
                                        {isBurnoutWarning
                                            ? `You are spending ${(burnoutRatio * 100).toFixed(0)}% of your time fighting fires. Re-prioritize Q2 (Growth) tasks!`
                                            : `Great job! Only ${(burnoutRatio * 100).toFixed(0)}% of your tasks consist of firefighting. You have time for deep work.`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 italic">Complete some tasks to see your heatmap!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BurnoutDashboard;
