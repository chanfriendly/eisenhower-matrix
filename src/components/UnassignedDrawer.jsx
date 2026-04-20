import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Inbox, X } from 'lucide-react';
import { TaskCard } from './TaskItem';

const QUADRANT_OPTIONS = [
    { id: 'do-first', label: 'Do First', color: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60' },
    { id: 'schedule', label: 'Schedule', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60' },
    { id: 'delegate', label: 'Delegate', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60' },
    { id: 'delete', label: 'Delete', color: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/60' },
];

const DraggableDrawerTask = ({ task, onUpdate, onDelete, isLowEnergyMode }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        touchAction: 'none',
    };

    return (
        <div ref={setNodeRef} style={style}>
            <TaskCard
                task={task}
                isDragging={isDragging}
                listeners={listeners}
                attributes={attributes}
                onUpdate={onUpdate}
                onDelete={onDelete}
                isLowEnergyMode={isLowEnergyMode}
            />
        </div>
    );
};

const UnassignedDrawer = ({ tasks, isOpen, onOpen, onClose, onUpdate, onDelete, isLowEnergyMode }) => {
    const count = tasks.length;

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30"
                    onClick={onClose}
                />
            )}

            {/* Persistent right-edge tab — hides when drawer is open */}
            <button
                onClick={onOpen}
                aria-label="Open uncategorized tasks"
                className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center gap-1.5 py-4 px-2.5 bg-zinc-700 hover:bg-zinc-600 dark:bg-zinc-600 dark:hover:bg-zinc-500 text-white rounded-l-xl shadow-xl transition-all duration-300 ${isOpen ? 'translate-x-full' : 'translate-x-0'}`}
            >
                <Inbox size={16} />
                {count > 0 && (
                    <span className="bg-purple-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                        {count > 99 ? '99+' : count}
                    </span>
                )}
                <span
                    className="text-xs font-medium tracking-wide"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                    Inbox
                </span>
            </button>

            {/* Sliding drawer panel */}
            <div
                className={`fixed top-0 right-0 h-full w-80 z-40 flex flex-col bg-white dark:bg-zinc-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-700 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Inbox size={18} className="text-purple-500" />
                        <h2 className="font-semibold text-zinc-800 dark:text-zinc-100">Uncategorized</h2>
                        {count > 0 && (
                            <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full px-2 py-0.5">
                                {count}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 rounded"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                {count === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 gap-3 p-6 text-center">
                        <Inbox size={36} strokeWidth={1.5} />
                        <div>
                            <p className="text-sm font-medium">All caught up!</p>
                            <p className="text-xs mt-1">Tasks from Google Tasks without a quadrant will appear here.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 px-1">
                            Drag into a quadrant or use the quick-assign buttons below each task.
                        </p>
                        {tasks.map(task => (
                            <div key={task.id} className="space-y-1.5">
                                <DraggableDrawerTask
                                    task={task}
                                    onUpdate={onUpdate}
                                    onDelete={onDelete}
                                    isLowEnergyMode={isLowEnergyMode}
                                />
                                <div className="flex gap-1 flex-wrap px-1">
                                    {QUADRANT_OPTIONS.map(q => (
                                        <button
                                            key={q.id}
                                            onClick={() => onUpdate(task.id, { quadrantId: q.id })}
                                            className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${q.color}`}
                                        >
                                            {q.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default UnassignedDrawer;
