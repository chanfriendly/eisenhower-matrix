import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, X, CalendarDays } from 'lucide-react';

const DroppableQuadrant = forwardRef(({ id, title, color, bg, items, onAddTask, children }, ref) => {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });
    const [isAdding, setIsAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskNotes, setNewTaskNotes] = useState('');
    const [newTaskDue, setNewTaskDue] = useState('');

    useImperativeHandle(ref, () => ({
        startAdding: () => {
            setIsAdding(true);
        }
    }));

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            // Allow multi-line notes, submit with Cmd+Enter
            submitTask();
        } else if (e.key === 'Enter' && !e.shiftKey && document.activeElement.tagName === 'INPUT' && document.activeElement.type !== 'date') {
            // Submit on Enter in title field, but not date field (let date picker handle UI)
            submitTask();
        } else if (e.key === 'Escape') {
            setIsAdding(false);
        }
    };

    const submitTask = () => {
        if (newTaskTitle.trim()) {
            // Format due date to RFC 3339 if present (date only -> T00:00:00Z)
            const due = newTaskDue ? newTaskDue + 'T00:00:00.000Z' : null;
            onAddTask(newTaskTitle, newTaskNotes, id, due);
            setNewTaskTitle('');
            setNewTaskNotes('');
            setNewTaskDue('');
            // Keep adding mode open if quick adding? Or close? 
            // Standard behavior usually closes or keeps focus. Let's keep it open for now or reset.
            // Actually, for "Do First" quick capture, maybe keeping it open is better?
            // For now, let's close it to be safe and clean.
            setIsAdding(false);
        }
    };

    // Determine background color: Hover state takes precedence, then prop bg, then default
    const backgroundClass = isOver
        ? 'bg-zinc-100 dark:bg-zinc-800 ring-2 ring-purple-400/20'
        : bg || 'bg-white dark:bg-zinc-900/50';

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col h-full rounded-xl border ${color} ${backgroundClass}
                backdrop-blur-sm overflow-hidden shadow-sm transition-all duration-200`}
        >
            <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/80 dark:bg-zinc-900/80 flex justify-between items-center group">
                <h3 className="font-semibold text-zinc-700 dark:text-zinc-200 text-sm">{title}</h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                        {items.length}
                    </span>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 dark:text-purple-300 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 px-2 py-1 rounded transition-colors"
                        title="Add task"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Task
                    </button>
                </div>
            </div>
            <div className="flex-1 p-3 overflow-y-auto">
                {isAdding && (
                    <div className="mb-3 px-1 p-2 bg-white dark:bg-zinc-800 rounded border border-purple-300 shadow-sm">
                        <input
                            autoFocus
                            type="text"
                            className="w-full text-sm font-medium mb-2 focus:outline-none bg-transparent text-zinc-800 dark:text-zinc-200"
                            placeholder="Task title..."
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <textarea
                            className="w-full text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded resize-none focus:outline-none focus:ring-1 focus:ring-zinc-200 mb-2"
                            rows="2"
                            placeholder="Details (optional)..."
                            value={newTaskNotes}
                            onChange={e => setNewTaskNotes(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-zinc-400" />
                                <input
                                    type="date"
                                    className="text-xs text-zinc-600 dark:text-zinc-400 bg-transparent focus:outline-none cursor-pointer"
                                    value={newTaskDue}
                                    onChange={(e) => setNewTaskDue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAdding(false)} className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">Cancel</button>
                            <button onClick={submitTask} className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700">Add</button>
                        </div>
                    </div>
                )}
                <SortableContext
                    id={id}
                    items={items.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {children}
                </SortableContext>
                {items.length === 0 && !isOver && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60 p-4">
                        <img
                            src={`/images/${id}.png`}
                            alt={`${title} empty state`}
                            className="w-24 h-24 mb-3 object-contain"
                        />
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            {id === 'do-first' && "Focus mode. What is the one thing you must do today?"}
                            {id === 'schedule' && "Plan for success. What important tasks can you schedule?"}
                            {id === 'delegate' && "Teamwork makes the dream work. Who can help you?"}
                            {id === 'delete' && "Declutter your mind. Eliminate non-essential tasks."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
});

export default DroppableQuadrant;
