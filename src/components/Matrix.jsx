import React, { useState, useEffect, useRef } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useGoogleTasks } from '../contexts/GoogleTasksContext';
import { useToast } from '../contexts/ToastContext';
import DroppableQuadrant from './DroppableQuadrant';
import TaskItem, { TaskCard } from './TaskItem';
import SearchBar from './SearchBar';

const Matrix = () => {
    const { tasks: googleTasks, loading, addTask, updateTask, deleteTask, error } = useGoogleTasks();
    const { showToast } = useToast();
    const [activeId, setActiveId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const doFirstRef = useRef(null);

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Initialize/Load mapping
    const [showCompleted, setShowCompleted] = useState(false);
    const [isLowEnergyMode, setIsLowEnergyMode] = useState(false);

    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            // Cmd+K or Ctrl+K to add task
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (doFirstRef.current) {
                    doFirstRef.current.startAdding();
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    // Migration from local storage to Google Tasks
    useEffect(() => {
        const savedMapping = localStorage.getItem('eisenhower-mapping');
        if (savedMapping && googleTasks.length > 0) {
            try {
                const mapping = JSON.parse(savedMapping);
                localStorage.removeItem('eisenhower-mapping');
                for (const [taskId, mappedQuadrant] of Object.entries(mapping)) {
                    const task = googleTasks.find(t => t.id === taskId);
                    if (task && task.quadrantId !== mappedQuadrant) {
                        updateTask(taskId, { quadrantId: mappedQuadrant });
                    }
                }
            } catch (e) {
                localStorage.removeItem('eisenhower-mapping');
            }
        }
    }, [googleTasks]);

    // Organize tasks into quadrants
    const getTasksForQuadrant = (quadrantId) => {
        return googleTasks.filter(task => {
            if (!showCompleted && task.status === 'completed') return false;

            // Filter out subtasks from main view
            if (task.parent) return false;

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesTitle = task.title?.toLowerCase().includes(query);
                const matchesNotes = task.displayNotes?.toLowerCase().includes(query);
                if (!matchesTitle && !matchesNotes) return false;
            }

            return task.quadrantId === quadrantId;
        });
    };

    const handleAddTask = async (title, notes, quadrantId) => {
        await addTask(title, notes, quadrantId); // Pass quadrantId to addTask
    };

    const handleDelete = async (taskId) => {
        const task = googleTasks.find(t => t.id === taskId);
        if (!task) return;

        await deleteTask(taskId);

        showToast("Task deleted", "info", async () => {
            // Undo Delete: Re-create task
            const quadrant = task.quadrantId || 'do-first';
            await addTask(task.title, task.displayNotes, quadrant, task.due);
        });
    };

    const handleToggleComplete = (taskId, completed) => {
        updateTask(taskId, { status: completed ? 'completed' : 'needsAction' });

        if (completed) {
            showToast("Task completed", "success", () => {
                updateTask(taskId, { status: 'needsAction' });
            });
        }
    };


    const handleUpdateTask = (taskId, updates) => {
        // Call context update
        updateTask(taskId, updates);
    };

    function handleDragStart(event) {
        setActiveId(event.active.id);
    }

    function handleDragOver(event) {
        const { active, over } = event;
        if (!over) return;

        // Find the container (quadrant) we are over
        // If over a task, find its container. If over a container, use it.
        // For simplicity in this matrix, we'll let handleDragEnd handle the re-assignment
        // because we are just mapping ID -> Quadrant, not strict ordering within the list yet
        // (though SortableContext allows ordering, we rely on the list order from Google + local sort if needed)
    }

    function handleDragEnd(event) {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeTaskId = active.id;
        let targetQuadrant = over.id;

        // Check if over.id is actually a task ID (by checking if it exists in tasks)
        const overTask = googleTasks.find(t => t.id === over.id);
        if (overTask) {
            targetQuadrant = overTask.quadrantId || 'do-first';
        }

        // Verify valid quadrant
        if (!['do-first', 'schedule', 'delegate', 'delete'].includes(targetQuadrant)) {
            setActiveId(null);
            return;
        }

        const currentTask = googleTasks.find(t => t.id === activeTaskId);
        if (currentTask && currentTask.quadrantId !== targetQuadrant) {
            updateTask(activeTaskId, { quadrantId: targetQuadrant });
        }

        setActiveId(null);
    }

    if (loading) {
        return <div className="flex items-center justify-center h-[calc(100vh-64px)] text-zinc-500">Loading tasks...</div>;
    }

    const activeTask = googleTasks.find(t => t.id === activeId);

    const renderQuadrant = (id, title, color, bg) => (
        <DroppableQuadrant
            key={id}
            ref={id === 'do-first' ? doFirstRef : null}
            id={id}
            title={title}
            color={color}
            bg={bg}
            items={getTasksForQuadrant(id)}
            onAddTask={handleAddTask}
            isLowEnergyMode={isLowEnergyMode}
        >
            {getTasksForQuadrant(id).map(task => (
                <TaskItem
                    key={task.id}
                    task={task}
                    id={task.id}
                    onToggleComplete={handleToggleComplete}
                    onUpdate={updateTask}
                    onDelete={handleDelete}
                    isLowEnergyMode={isLowEnergyMode}
                />
            ))}
        </DroppableQuadrant>
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4 mb-0">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                {error}
                            </p>
                            {error.includes("403") && (
                                <p className="text-xs text-red-600 mt-1">
                                    Please ensure the <strong>Google Tasks API</strong> is enabled in your Google Cloud Console.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-center px-4 pt-4 gap-4">
                <div className="w-full md:w-1/3">
                    <SearchBar value={searchQuery} onChange={setSearchQuery} />
                </div>
                <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isLowEnergyMode}
                            onChange={(e) => setIsLowEnergyMode(e.target.checked)}
                            className="rounded border-zinc-300 text-yellow-500 focus:ring-yellow-500"
                        />
                        <span className="flex items-center gap-1">Low Energy Mode <span role="img" aria-label="battery">🔋</span></span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={showCompleted}
                            onChange={(e) => setShowCompleted(e.target.checked)}
                            className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span>Show Completed Tasks</span>
                    </label>
                </div>
            </div>

            <div className="flex flex-col md:grid md:grid-cols-2 md:grid-rows-2 gap-4 p-4 md:h-[calc(100vh-96px)] md:max-h-[calc(100vh-96px)] md:overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                <div className="h-[350px] sm:h-[400px] md:h-full">
                    {renderQuadrant('do-first', 'Do First (Urgent & Important)', 'border-red-200 dark:border-red-900/30', 'bg-red-100 dark:bg-red-900/20')}
                </div>
                <div className="h-[350px] sm:h-[400px] md:h-full">
                    {renderQuadrant('schedule', 'Schedule (Not Urgent & Important)', 'border-blue-200 dark:border-blue-900/30', 'bg-blue-100 dark:bg-blue-900/20')}
                </div>
                <div className="h-[350px] sm:h-[400px] md:h-full">
                    {renderQuadrant('delegate', 'Delegate (Urgent & Not Important)', 'border-amber-200 dark:border-amber-900/30', 'bg-amber-100 dark:bg-amber-900/20')}
                </div>
                <div className="h-[350px] sm:h-[400px] md:h-full">
                    {renderQuadrant('delete', 'Delete (Not Urgent & Not Important)', 'border-green-200 dark:border-green-900/30', 'bg-green-100 dark:bg-green-900/20')}
                </div>
            </div>

            <DragOverlay>
                {activeId && activeTask ? (
                    <div className="opacity-90 rotate-2 cursor-grabbing w-[300px]">
                        <TaskCard task={activeTask} isLowEnergyMode={isLowEnergyMode} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default Matrix;

