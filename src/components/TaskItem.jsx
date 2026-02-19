import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Check, Calendar, Trash2 } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

export const TaskCard = ({ task, isDragging, listeners, attributes, style, setNodeRef, onToggleComplete, onUpdate, onDelete }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [editTitle, setEditTitle] = React.useState(task.title);
    const [editNotes, setEditNotes] = React.useState(task.notes || '');
    const [editDue, setEditDue] = React.useState(task.due ? task.due.split('T')[0] : '');

    const handleBlur = () => {
        const hasChanges =
            editTitle !== task.title ||
            editNotes !== (task.notes || '') ||
            (editDue ? editDue + 'T00:00:00.000Z' : null) !== task.due;

        if (hasChanges) {
            const updates = { title: editTitle, notes: editNotes };
            // Simple date handling: append timestamp if date is set
            if (editDue) {
                updates.due = editDue + 'T00:00:00.000Z';
            } else {
                updates.due = null; // Clear if empty
            }
            onUpdate(task.id, updates);
        }
    };

    const toggleComplete = (e) => {
        e.stopPropagation();
        onToggleComplete(task.id, task.status !== 'completed');
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (onDelete && confirm('Delete this task?')) {
            onDelete(task.id);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const isOverdue = (dateString) => {
        if (!dateString) return false;
        // Compare dates (ignoring time)
        const d = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // If due date is before today (and not today)
        return d < today && d.toDateString() !== today.toDateString();
    };

    return (
        <div
            ref={setNodeRef} style={style}
            className={`group flex flex-col p-3 mb-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 hover:border-purple-300 dark:hover:border-purple-800 transition-colors ${isDragging ? 'opacity-50' : 'opacity-100'}`}
        >
            <div className="flex items-start gap-3">
                <div {...attributes} {...listeners} className="mt-1 text-zinc-400 hover:text-zinc-600 cursor-grab active:cursor-grabbing flex-shrink-0">
                    <GripVertical className="w-4 h-4" />
                </div>

                <button
                    onClick={toggleComplete}
                    className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 
                        ${task.status === 'completed'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-zinc-300 dark:border-zinc-600 hover:border-green-500'}`}
                >
                    {task.status === 'completed' && <Check className="w-3.5 h-3.5" />}
                </button>

                <div className="flex-1 text-left min-w-0" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="flex justify-between items-start">
                        <p className={`text-sm text-zinc-800 dark:text-zinc-200 truncate cursor-pointer ${task.status === 'completed' ? 'line-through text-zinc-400' : ''}`}>
                            {task.title}
                        </p>
                        {task.due && !isExpanded && (
                            <div className={`flex items-center text-xs ml-2 flex-shrink-0 ${isOverdue(task.due) && task.status !== 'completed' ? 'text-red-500 font-medium' : 'text-zinc-400'}`}>
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDate(task.due)}
                            </div>
                        )}
                    </div>
                    {task.notes && !isExpanded && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 truncate">{task.notes}</p>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="mt-3 pl-8 animate-in slide-in-from-top-1 fade-in duration-200">
                    <input
                        type="text"
                        className="w-full text-sm font-medium mb-2 bg-transparent border-b border-transparent focus:border-zinc-300 dark:focus:border-zinc-600 text-zinc-900 dark:text-zinc-100 focus:outline-none pb-1"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleBlur}
                    />
                    <textarea
                        className="w-full text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded resize-none focus:outline-none focus:ring-1 focus:ring-zinc-200 mb-2"
                        rows="3"
                        placeholder="Add details..."
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        onBlur={handleBlur}
                    />
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-zinc-400" />
                            <input
                                type="date"
                                className="text-xs text-zinc-600 dark:text-zinc-400 bg-transparent focus:outline-none cursor-pointer"
                                value={editDue}
                                onChange={(e) => setEditDue(e.target.value)}
                                onBlur={handleBlur}
                            />
                        </div>
                        <button
                            onClick={handleDelete}
                            className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                            title="Delete Task"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


const TaskItem = ({ task, id, onToggleComplete, onUpdate, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id, data: { task } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <ErrorBoundary>
            <TaskCard
                task={task}
                isDragging={isDragging}
                listeners={listeners}
                attributes={attributes}
                style={style}
                setNodeRef={setNodeRef}
                onToggleComplete={onToggleComplete}
                onUpdate={onUpdate}
                onDelete={onDelete}
            />
        </ErrorBoundary>
    );
};

export default TaskItem;
