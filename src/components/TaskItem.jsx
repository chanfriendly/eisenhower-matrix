import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Check, Calendar, Trash2, Zap, Brain, AlertTriangle, Send } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';
import { useGoogleTasks } from '../contexts/GoogleTasksContext';

export const TaskCard = ({ task, isDragging, listeners, attributes, style, setNodeRef, onToggleComplete, onUpdate, onDelete, isLowEnergyMode }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [editTitle, setEditTitle] = React.useState(task.title);
    const [editNotes, setEditNotes] = React.useState(task.displayNotes || '');
    const [editDue, setEditDue] = React.useState(task.due ? task.due.split('T')[0] : '');

    const { tasks: allTasks, addTask: addGoogleTask } = useGoogleTasks();
    const [subtaskTitle, setSubtaskTitle] = React.useState('');
    const subtasks = allTasks ? allTasks.filter(t => t.parent === task.id) : [];

    const handleAddSubtask = async (e) => {
        if (e.key === 'Enter' && subtaskTitle.trim() !== '') {
            e.preventDefault();
            await addGoogleTask(subtaskTitle.trim(), '', task.quadrantId, null, task.id);
            setSubtaskTitle('');
        }
    };

    const handleBlur = () => {
        const hasChanges =
            editTitle !== task.title ||
            editNotes !== (task.displayNotes || '') ||
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

    const isStagnantQ2 = () => {
        if (task.quadrantId !== 'schedule' || !task.updated) return false;
        const updatedDate = new Date(task.updated);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return updatedDate < sevenDaysAgo;
    };

    const isProjectCreep = () => {
        return (task.displayNotes && task.displayNotes.length > 500) || task.subtaskCount > 5;
    };

    const promoteToQ1 = (e) => {
        e.stopPropagation();
        onUpdate(task.id, { quadrantId: 'do-first' });
    };

    const handleDelegate = (e) => {
        e.stopPropagation();
        const subject = encodeURIComponent(`Delegation: ${task.title}`);
        const body = encodeURIComponent(`Task: ${task.title}\n\nDetails:\n${task.displayNotes || 'No additional details provided.'}`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    };

    const setEnergy = (e, energyLevel) => {
        e.stopPropagation();
        const newEnergy = task.energy === energyLevel ? null : energyLevel;
        onUpdate(task.id, { energy: newEnergy });
    };

    // Low Energy Styles
    let energyClasses = '';
    if (isLowEnergyMode) {
        if (task.energy === 'quick') {
            energyClasses = 'ring-2 ring-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10';
        } else if (task.energy === 'deep') {
            energyClasses = 'opacity-30 grayscale';
        }
    }

    // Stagnation Styles
    const stagnantClasses = isStagnantQ2() ? 'animate-pulse ring-2 ring-orange-500' : '';

    return (
        <div
            ref={setNodeRef} style={style}
            className={`group flex flex-col p-3 mb-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 hover:border-purple-300 dark:hover:border-purple-800 transition-all ${isDragging ? 'opacity-50' : 'opacity-100'} ${energyClasses} ${stagnantClasses}`}
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
                    {task.displayNotes && !isExpanded && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 truncate">{task.displayNotes}</p>
                    )}

                    {!isExpanded && isProjectCreep() && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-500 font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Project Creep: Breakdown recommended</span>
                        </div>
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

                    {/* Subtasks Section */}
                    {subtasks.length > 0 && (
                        <div className="mb-3 space-y-1 pl-2 border-l-2 border-zinc-200 dark:border-zinc-700">
                            {subtasks.map(st => (
                                <div key={st.id} className="flex items-center gap-2 group/sub">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleComplete(st.id, st.status !== 'completed');
                                        }}
                                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 
                                        ${st.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-zinc-300 dark:border-zinc-600 hover:border-green-500'}`}
                                    >
                                        {st.status === 'completed' && <Check className="w-2.5 h-2.5" />}
                                    </button>
                                    <span className={`text-xs truncate ${st.status === 'completed' ? 'line-through text-zinc-400' : 'text-zinc-600 dark:text-zinc-300'}`}>
                                        {st.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add subtask input */}
                    <div className="mb-3 pl-2">
                        <input
                            type="text"
                            placeholder="Add subtask..."
                            className="w-full text-xs bg-transparent border-dashed border-b border-zinc-300 dark:border-zinc-700 focus:border-zinc-500 text-zinc-600 dark:text-zinc-400 focus:outline-none pb-0.5"
                            value={subtaskTitle}
                            onChange={(e) => setSubtaskTitle(e.target.value)}
                            onKeyDown={handleAddSubtask}
                        />
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-zinc-400" />
                            <input
                                type="date"
                                className="text-xs text-zinc-600 dark:text-zinc-400 bg-transparent focus:outline-none cursor-pointer"
                                value={editDue}
                                onClick={(e) => {
                                    try {
                                        e.target.showPicker();
                                    } catch (err) { }
                                }}
                                onChange={(e) => setEditDue(e.target.value)}
                                onBlur={handleBlur}
                            />
                        </div>
                        <div className="flex gap-1 items-center">
                            <button
                                onClick={(e) => setEnergy(e, 'quick')}
                                className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 border rounded-full transition-colors ${task.energy === 'quick' ? 'bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-400' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700'}`}
                            >
                                <Zap className="w-3 h-3" /> Quick
                            </button>
                            <button
                                onClick={(e) => setEnergy(e, 'deep')}
                                className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 border rounded-full transition-colors ${task.energy === 'deep' ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-400' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700'}`}
                            >
                                <Brain className="w-3 h-3" /> Deep
                            </button>
                            <button
                                onClick={handleDelete}
                                className="text-zinc-400 hover:text-red-500 transition-colors p-1 ml-1"
                                title="Delete Task"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Guardrail Actions outside of expanded view for immediate access */}
            {isStagnantQ2() && (
                <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-900 border-dashed flex justify-end">
                    <button
                        onClick={promoteToQ1}
                        className="text-xs flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:text-orange-700 font-medium"
                    >
                        <AlertTriangle className="w-3 h-3" /> Promote to Do First
                    </button>
                </div>
            )}

            {task.quadrantId === 'delegate' && task.status !== 'completed' && (
                <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-700 border-dashed flex justify-end">
                    <button
                        onClick={handleDelegate}
                        className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium"
                    >
                        <Send className="w-3 h-3" /> Delegate via Email
                    </button>
                </div>
            )}

        </div>
    );
};


const TaskItem = ({ task, id, onToggleComplete, onUpdate, onDelete, isLowEnergyMode }) => {
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
                isLowEnergyMode={isLowEnergyMode}
            />
        </ErrorBoundary>
    );
};

export default TaskItem;
