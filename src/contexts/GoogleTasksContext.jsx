import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin, googleLogout } from '@react-oauth/google';

const GoogleTasksContext = createContext(null);

export const useGoogleTasks = () => useContext(GoogleTasksContext);

const SCOPE = 'https://www.googleapis.com/auth/tasks';

export const GoogleTasksProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [taskLists, setTaskLists] = useState([]);
    const [currentListId, setCurrentListId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sessionExpired, setSessionExpired] = useState(false);



    const handleSessionExpired = () => {
        console.error("Token expired or invalid");
        setSessionExpired(true);
        // Do NOT clear user data immediately so they can still read local state
    };

    const [isDemo, setIsDemo] = useState(false);

    // Helper to extract quadrant from notes
    const parseQuadrantFromNotes = (notes) => {
        if (!notes) return null;
        const match = notes.match(/\[#q:([a-zA-Z-]+)\]/);
        return match ? match[1] : null;
    };

    // Helper to inject/update quadrant in notes
    const updateNotesWithQuadrant = (notes, quadrantId) => {
        const tag = `[#q:${quadrantId}]`;
        if (!notes) return tag;
        if (notes.includes('[#q:')) {
            return notes.replace(/\[#q:[a-zA-Z-]+\]/, tag);
        }
        return `${notes}\n\n${tag}`; // Add to end with some spacing
    };

    // Clean notes for display (remove tag)
    const cleanNotes = (notes) => {
        if (!notes) return '';
        return notes.replace(/\[#q:[a-zA-Z-]+\]/, '').trim();
    };

    // Load user/demo from local storage on mount
    useEffect(() => {
        const storedDemo = localStorage.getItem('isDemo');
        if (storedDemo === 'true') {
            setIsDemo(true);
            setUser({ name: 'Guest User', email: 'demo@example.com', picture: null });
            // Mock lists for demo
            setTaskLists([{ id: 'demo-list', title: 'My Tasks (Demo)' }]);
            setCurrentListId('demo-list');
            return;
        }

        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('accessToken');
        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setAccessToken(storedToken);
        }
    }, []);

    // Fetch tasks whenever accessToken depends changes and is valid
    useEffect(() => {
        if (accessToken) {
            fetchTasks();
        } else if (isDemo) {
            fetchTasks();
        }
    }, [accessToken, isDemo]);


    const login = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            console.log(tokenResponse);
            if (isDemo) exitDemoMode(); // Ensure we exit demo mode

            setAccessToken(tokenResponse.access_token);
            localStorage.setItem('accessToken', tokenResponse.access_token);
            setError(null); // Clear previous errors
            setSessionExpired(false);

            // Fetch user profile (optional, for display)
            fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            })
                .then(res => res.json())
                .then(profile => {
                    setUser(profile);
                    localStorage.setItem('user', JSON.stringify(profile));
                });
        },
        onError: (err) => {
            console.error("Login Failed", err);
            setError("Login failed. Please try again.");
        },
        scope: SCOPE,
    });

    const logout = () => {
        googleLogout();
        setUser(null);
        setAccessToken(null);
        setTasks([]);
        setTaskLists([]);
        setCurrentListId(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        setError(null);
        setSessionExpired(false);
        setIsDemo(false);
        localStorage.removeItem('isDemo');
    };

    const enterDemoMode = () => {
        setIsDemo(true);
        localStorage.setItem('isDemo', 'true');
        setUser({ name: 'Guest User', email: 'demo@example.com', picture: null });
        setTaskLists([{ id: 'demo-list', title: 'My Tasks (Demo)' }]);
        setCurrentListId('demo-list');
        // Fetch/Load Local Tasks handled by useEffect
    };

    const exitDemoMode = () => {
        setIsDemo(false);
        localStorage.removeItem('isDemo');
        setUser(null);
        setTasks([]);
        setTaskLists([]);
        setCurrentListId(null);
    };

    const fetchTasks = async () => {
        setLoading(true);
        setError(null);

        if (isDemo) {
            // Load from local storage
            const localTasks = JSON.parse(localStorage.getItem('demo-tasks') || '[]');
            setTasks(localTasks);
            setLoading(false);
            return;
        }

        if (!accessToken) return;

        try {
            // Fetch task lists first
            const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!listsRes.ok) {
                if (listsRes.status === 401) {
                    handleSessionExpired();
                    return;
                }
                const errData = await listsRes.json();
                console.error("Lists Fetch Error", errData);
                throw new Error(errData.error?.message || `API Error: ${listsRes.status}`);
            }

            const listsData = await listsRes.json();
            const items = listsData.items || [];
            setTaskLists(items);

            // If we have lists and no current list is selected, select the first one
            // Or if the current list isn't in the new list of lists (unlikely but possible)
            if (items.length > 0) {
                const listToUse = currentListId && items.find(l => l.id === currentListId)
                    ? currentListId
                    : items[0].id;

                if (listToUse !== currentListId) {
                    setCurrentListId(listToUse);
                    // The useEffect on currentListId will trigger the actual task fetch
                } else {
                    // If list didn't change, we still might need to fetch tasks if called manually
                    fetchTasksForList(listToUse);
                }
            }
        } catch (error) {
            console.error("Failed to fetch task lists", error);
            setError(error.message);
            setLoading(false);
        }
    };

    const fetchTasksForList = async (listId) => {
        if (isDemo) {
            const localTasks = JSON.parse(localStorage.getItem('demo-tasks') || '[]');
            setTasks(localTasks);
            setLoading(false);
            return;
        }

        if (!accessToken || !listId) return;
        setLoading(true);
        try {
            const tasksRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=true&showHidden=true`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!tasksRes.ok) {
                if (tasksRes.status === 401) {
                    handleSessionExpired();
                    return;
                }
                throw new Error(`Failed to fetch tasks: ${tasksRes.status}`);
            }

            const tasksData = await tasksRes.json();

            // Process tasks to extract quadrant metadata and clean notes for display
            const processedTasks = (tasksData.items || []).map(task => {
                const quadrantId = parseQuadrantFromNotes(task.notes);
                return {
                    ...task,
                    quadrantId, // Store identified quadrant
                    displayNotes: cleanNotes(task.notes), // Clean notes for UI
                    originalNotes: task.notes // Keep original for updates
                };
            });

            setTasks(processedTasks);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Effect to fetch tasks when currentListId changes
    useEffect(() => {
        if (currentListId) {
            fetchTasksForList(currentListId);
        }
    }, [currentListId]);


    const switchList = (listId) => {
        if (listId !== currentListId) {
            setCurrentListId(listId);
            // useEffect will handle fetching
        }
    };

    const addTask = async (title, notes, quadrantId = 'do-first', due = null) => {
        if (!currentListId) {
            setError("No task list selected");
            return null;
        }

        // Prepare notes with tag
        const taggedNotes = updateNotesWithQuadrant(notes || '', quadrantId);

        // Optimistic update
        const tempId = 'temp-' + Date.now();
        const newTask = {
            id: tempId,
            title,
            notes: taggedNotes,
            displayNotes: notes,
            quadrantId,
            status: 'needsAction',
            due: due
        };
        setTasks(prev => [newTask, ...prev]);

        if (isDemo) {
            const updatedTasks = [newTask, ...(JSON.parse(localStorage.getItem('demo-tasks') || '[]'))];
            localStorage.setItem('demo-tasks', JSON.stringify(updatedTasks));
            // Simulate async
            await new Promise(r => setTimeout(r, 100));
            // In demo, the "optimistic" one IS the real one, but we should make sure it has the same structure
            const processedDemoTask = {
                ...newTask,
                id: 'demo-' + Date.now(), // Give it a stable ID
                quadrantId,
                displayNotes: notes,
                originalNotes: taggedNotes
            };
            // Replace optimstic with "saved" one
            setTasks(prev => prev.map(t => t.id === tempId ? processedDemoTask : t));

            // Update local storage with reliable ID
            const finalTasks = updatedTasks.map(t => t.id === tempId ? processedDemoTask : t);
            localStorage.setItem('demo-tasks', JSON.stringify(finalTasks));
            return processedDemoTask;
        }

        if (!accessToken) return newTask;

        try {
            const payload = { title, notes: taggedNotes };
            if (due) payload.due = due;

            const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${currentListId}/tasks`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                if (res.status === 401) {
                    handleSessionExpired();
                    // Keep optimistic task? Probably safer to remove it locally or mark as failed
                    // For now, removing to be safe
                    setTasks(prev => prev.filter(t => t.id !== tempId));
                    return null;
                }
                throw new Error(`API Error: ${res.status}`);
            }

            const data = await res.json();

            // Process the returned task
            const processedData = {
                ...data,
                quadrantId: parseQuadrantFromNotes(data.notes),
                displayNotes: cleanNotes(data.notes),
                originalNotes: data.notes
            };

            // Replace temp task with real one
            setTasks(prev => prev.map(t => t.id === tempId ? processedData : t));
            return processedData;

        } catch (error) {
            console.error("Failed to add task", error);
            setError(error.message); // Set error here too
            // Remove the optimistic task to prevent ghost/corrupt tasks in UI
            setTasks(prev => prev.filter(t => t.id !== tempId));
            return null;
        }
    };

    const updateTask = async (taskId, updates) => {
        if (!currentListId) return;

        // If updating notes or moving quadrant, we need to handle the tag
        let apiUpdates = { ...updates };

        // Find current task to get its latest state
        const currentTask = tasks.find(t => t.id === taskId);
        if (!currentTask) return;

        // Handle specific fields
        // if (updates.status === 'needsAction') {
        //     apiUpdates.completed = null;
        // }

        // If client sends 'notes' update (user edited notes in UI)
        if (updates.notes !== undefined) {
            // Re-inject the EXISTING quadrant tag into the NEW notes
            // We use currentTask.quadrantId because formatting notes shouldn't change quadrant
            apiUpdates.notes = updateNotesWithQuadrant(updates.notes, currentTask.quadrantId);
        }

        // If client sends 'quadrantId' update (drag and drop)
        if (updates.quadrantId) {
            // We need to update the notes field with the NEW quadrant tag
            // Use originalNotes as base to preserve any hidden data, or updates.notes if provided
            const baseNotes = updates.notes !== undefined ? updates.notes : cleanNotes(currentTask.originalNotes);
            apiUpdates.notes = updateNotesWithQuadrant(baseNotes, updates.quadrantId);
        }

        const optimisticTask = {
            ...currentTask,
            ...updates,
            // If notes updated, update display notes
            ...(updates.notes !== undefined ? { displayNotes: updates.notes } : {}),
            // If quadrant updated
            ...(updates.quadrantId ? { quadrantId: updates.quadrantId } : {}),
            // Store the "real" notes that will be sent to server
            originalNotes: apiUpdates.notes || currentTask.originalNotes
        };

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === taskId ? optimisticTask : t));

        if (isDemo) {
            const localTasks = JSON.parse(localStorage.getItem('demo-tasks') || '[]');
            const updatedLocal = localTasks.map(t => t.id === taskId ? { ...t, ...optimisticTask } : t);
            localStorage.setItem('demo-tasks', JSON.stringify(updatedLocal));
            return;
        }

        if (!accessToken) return;

        try {
            // Ensure we don't send internal fields to API
            const finalApiPayload = { ...apiUpdates };
            delete finalApiPayload.displayNotes;
            delete finalApiPayload.originalNotes;
            delete finalApiPayload.quadrantId;

            const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${currentListId}/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(finalApiPayload)
            });


            if (!res.ok) {
                if (res.status === 401) {
                    handleSessionExpired();
                    return;
                }
                throw new Error(`Failed to update task: ${res.status}`);
            }

            const data = await res.json();

            const processedData = {
                ...data,
                quadrantId: parseQuadrantFromNotes(data.notes),
                displayNotes: cleanNotes(data.notes),
                originalNotes: data.notes
            };

            // Ensure state matches server (sometimes server adds fields)
            setTasks(prev => prev.map(t => t.id === taskId ? processedData : t));

        } catch (error) {
            console.error("Failed to update task", error);
            setError(error.message);
            // Revert might be complex here without undo history, 
            // for now, we rely on next fetch to fix sync or user retry
        }
    };

    const deleteTask = async (taskId) => {
        if (!currentListId) return;

        // Find task to backup in case of error
        const taskToDelete = tasks.find(t => t.id === taskId);
        if (!taskToDelete) return;

        // Optimistic update
        setTasks(prev => prev.filter(t => t.id !== taskId));

        if (isDemo) {
            const localTasks = JSON.parse(localStorage.getItem('demo-tasks') || '[]');
            const updatedLocal = localTasks.filter(t => t.id !== taskId);
            localStorage.setItem('demo-tasks', JSON.stringify(updatedLocal));
            return;
        }

        if (!accessToken) return;

        try {
            const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${currentListId}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!res.ok) {
                if (res.status === 401) {
                    handleSessionExpired();
                    return;
                }
                throw new Error(`Failed to delete task: ${res.status}`);
            }

            // Success (204 No Content usually)

        } catch (error) {
            console.error("Failed to delete task", error);
            setError(error.message);
            // Revert state
            setTasks(prev => [...prev, taskToDelete]);
        }
    };

    return (
        <GoogleTasksContext.Provider value={{
            user,
            login,
            logout,
            isDemo,
            enterDemoMode,
            exitDemoMode,
            tasks,
            taskLists,
            currentListId,
            switchList,
            fetchTasks,
            addTask,
            updateTask,
            deleteTask,
            loading,
            error,
            sessionExpired
        }}>
            {children}
        </GoogleTasksContext.Provider>
    );
};

export const GoogleAuthProviderWrapper = ({ children }) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-900 text-white p-8">
                <div className="max-w-md text-center">
                    <h1 className="text-2xl font-bold mb-4">Configuration Required</h1>
                    <p className="mb-4">Please create a <code>.env</code> file in the project root with your Google Client ID:</p>
                    <pre className="bg-zinc-800 p-4 rounded text-left overflow-auto mb-4">
                        VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
                    </pre>
                </div>
            </div>
        )
    }

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <GoogleTasksProvider>
                {children}
            </GoogleTasksProvider>
        </GoogleOAuthProvider>
    )
}
