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
        console.error("Token expired or invalid.");
        setSessionExpired(true);
        // Do NOT clear user data immediately so they can still read local state
    };

    const [isDemo, setIsDemo] = useState(false);
    const [silentRefreshFailed, setSilentRefreshFailed] = useState(false);

    // Helper to extract quadrant from notes
    const parseQuadrantFromNotes = (notes) => {
        if (!notes) return null;
        const match = notes.match(/\[#q:([a-zA-Z-]+)\]/);
        return match ? match[1] : null;
    };

    // Helper to extract energy from notes
    const parseEnergyFromNotes = (notes) => {
        if (!notes) return null;
        const match = notes.match(/\[#energy:([a-zA-Z-]+)\]/);
        return match ? match[1] : null;
    };

    // Helper to inject/update tags in notes
    const updateNotesWithTags = (notes, quadrantId, energy) => {
        let newNotes = notes || '';

        // Handle Quadrant
        const qTag = `[#q:${quadrantId}]`;
        if (newNotes.includes('[#q:')) {
            newNotes = newNotes.replace(/\[#q:[a-zA-Z-]+\]/, qTag);
        } else {
            newNotes = newNotes.trim() ? `${newNotes}\n\n${qTag}` : qTag;
        }

        // Handle Energy
        if (energy) {
            const eTag = `[#energy:${energy}]`;
            if (newNotes.includes('[#energy:')) {
                newNotes = newNotes.replace(/\[#energy:[a-zA-Z-]+\]/, eTag);
            } else {
                newNotes = `${newNotes} ${eTag}`;
            }
        } else {
            // Remove energy tag if set to null/empty
            newNotes = newNotes.replace(/\s*\[#energy:[a-zA-Z-]+\]/, '');
        }

        return newNotes;
    };

    // Clean notes for display (remove tags)
    const cleanNotes = (notes) => {
        if (!notes) return '';
        return notes
            .replace(/\[#q:[a-zA-Z-]+\]/, '')
            .replace(/\[#energy:[a-zA-Z-]+\]/, '')
            .trim();
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
            setSilentRefreshFailed(false);

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
        ux_mode: 'redirect',
    });

    const silentRefresh = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            setAccessToken(tokenResponse.access_token);
            localStorage.setItem('accessToken', tokenResponse.access_token);
            setSessionExpired(false);
            setSilentRefreshFailed(false);
            setError(null);
        },
        onError: () => {
            // Silent refresh failed — user must log in manually
            setSilentRefreshFailed(true);
        },
        scope: SCOPE,
        prompt: 'none',
        // popup mode (no ux_mode) so a failed silent auth doesn't redirect-loop
    });

    // Attempt silent re-auth on mount if we have a stored user
    useEffect(() => {
        const storedDemo = localStorage.getItem('isDemo');
        if (storedDemo === 'true') return;
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            silentRefresh();
        }
    }, []);

    // Attempt silent re-auth whenever the session expires
    useEffect(() => {
        if (sessionExpired) {
            silentRefresh();
        }
    }, [sessionExpired]);


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
                const listToUse = currentListId === 'ALL'
                    ? 'ALL'
                    : (currentListId && items.find(l => l.id === currentListId)
                        ? currentListId
                        : items[0].id);

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

        const fetchAllTasksForSingleList = async (singleListId) => {
            const items = [];
            let pageToken = null;
            do {
                let url = `https://tasks.googleapis.com/tasks/v1/lists/${singleListId}/tasks?showCompleted=true&showHidden=true&maxResults=100`;
                if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
                const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
                if (!res.ok) {
                    if (res.status === 401) throw new Error('401');
                    throw new Error(`Failed to fetch tasks: ${res.status}`);
                }
                const data = await res.json();
                items.push(...(data.items || []).map(t => ({ ...t, listId: singleListId })));
                pageToken = data.nextPageToken || null;
            } while (pageToken);
            return items;
        };

        try {
            let allItems = [];

            if (listId === 'ALL') {
                const listPromises = taskLists.map(list =>
                    fetchAllTasksForSingleList(list.id).catch(e => {
                        if (e.message === '401') throw e;
                        return [];
                    })
                );

                try {
                    const results = await Promise.all(listPromises);
                    allItems = results.flat();
                } catch (e) {
                    if (e.message === '401') {
                        handleSessionExpired();
                        return;
                    }
                    throw e;
                }
            } else {
                allItems = await fetchAllTasksForSingleList(listId);
            }

            const subtaskCounts = {};
            allItems.forEach(t => {
                if (t.parent) {
                    subtaskCounts[t.parent] = (subtaskCounts[t.parent] || 0) + 1;
                }
            });

            const processedTasks = allItems.map(task => {
                const quadrantId = parseQuadrantFromNotes(task.notes);
                const energy = parseEnergyFromNotes(task.notes);
                return {
                    ...task,
                    quadrantId: quadrantId || null,
                    energy: energy,
                    subtaskCount: subtaskCounts[task.id] || 0,
                    displayNotes: cleanNotes(task.notes),
                    originalNotes: task.notes
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

    const createTaskList = async (title) => {
        if (!accessToken) return null;
        try {
            const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title })
            });

            if (!res.ok) {
                if (res.status === 401) {
                    handleSessionExpired();
                    return null;
                }
                throw new Error(`Failed to create task list: ${res.status}`);
            }

            const data = await res.json();
            setTaskLists(prev => [...prev, data]);
            return data;
        } catch (error) {
            console.error("Failed to create task list", error);
            setError(error.message);
            return null;
        }
    };

    const addTask = async (title, notes, quadrantId = 'do-first', due = null, parent = null, targetListId = currentListId) => {
        if (!targetListId || targetListId === 'ALL') {
            targetListId = taskLists.length > 0 ? taskLists[0].id : null;
        }

        if (!targetListId) {
            setError("No task list selected");
            return null;
        }

        // Prepare notes with tags
        const taggedNotes = updateNotesWithTags(notes || '', quadrantId, null);

        // Optimistic update
        const tempId = 'temp-' + Date.now();
        const newTask = {
            id: tempId,
            title,
            notes: taggedNotes,
            displayNotes: cleanNotes(taggedNotes),
            quadrantId,
            energy: null,
            subtaskCount: 0,
            status: 'needsAction',
            due: due,
            parent: parent,
            listId: targetListId
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
                displayNotes: cleanNotes(taggedNotes),
                energy: null,
                subtaskCount: 0,
                originalNotes: taggedNotes,
                listId: targetListId
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

            const url = `https://tasks.googleapis.com/tasks/v1/lists/${targetListId}/tasks${parent ? `?parent=${parent}` : ''}`;

            const res = await fetch(url, {
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
                energy: parseEnergyFromNotes(data.notes),
                subtaskCount: 0, // Newly added tasks have no subtasks
                displayNotes: cleanNotes(data.notes),
                originalNotes: data.notes,
                listId: targetListId
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

        const targetListId = currentTask.listId || currentListId;
        if (!targetListId || targetListId === 'ALL') return;

        // Handle specific fields
        // if (updates.status === 'needsAction') {
        //     apiUpdates.completed = null;
        // }

        // If client sends 'notes', 'quadrantId', or 'energy' updates
        if (updates.notes !== undefined || updates.quadrantId || updates.energy !== undefined) {
            // Determine base notes (edited text, or existing text minus tags)
            let baseNotes = updates.notes !== undefined ? updates.notes : cleanNotes(currentTask.originalNotes);

            // Determine quadrant and energy
            const updatedQuadrant = updates.quadrantId || currentTask.quadrantId;
            const updatedEnergy = updates.energy !== undefined ? updates.energy : currentTask.energy;

            apiUpdates.notes = updateNotesWithTags(baseNotes, updatedQuadrant, updatedEnergy);
        }

        const optimisticTask = {
            ...currentTask,
            ...updates,
            // Update UI fields
            ...(apiUpdates.notes !== undefined ? { displayNotes: cleanNotes(apiUpdates.notes) } : {}),
            ...(updates.quadrantId ? { quadrantId: updates.quadrantId } : {}),
            ...(updates.energy !== undefined ? { energy: updates.energy } : {}),
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
            delete finalApiPayload.energy;
            delete finalApiPayload.subtaskCount;

            const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${targetListId}/tasks/${taskId}`, {
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
                energy: parseEnergyFromNotes(data.notes),
                subtaskCount: currentTask.subtaskCount, // Preserve local count
                displayNotes: cleanNotes(data.notes),
                originalNotes: data.notes,
                listId: targetListId
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

        const targetListId = taskToDelete.listId || currentListId;
        if (!targetListId || targetListId === 'ALL') return;

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
            const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${targetListId}/tasks/${taskId}`, {
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

    const moveTaskToList = async (taskId, targetListId) => {
        if (!targetListId) return;

        const taskToMove = tasks.find(t => t.id === taskId);
        if (!taskToMove) return;

        const originalListId = taskToMove.listId;
        if (!originalListId || originalListId === targetListId) return;

        // Optimistically remove from current view if not 'ALL'
        if (currentListId !== 'ALL') {
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } else {
            // If in ALL view, purely update listId optimistically
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, listId: targetListId } : t));
        }

        if (isDemo) {
            const localTasks = JSON.parse(localStorage.getItem('demo-tasks') || '[]');
            const updatedLocal = localTasks.map(t => t.id === taskId ? { ...t, listId: targetListId } : t);
            localStorage.setItem('demo-tasks', JSON.stringify(updatedLocal));
            return;
        }

        if (!accessToken) return;

        try {
            // 1. Create task in new list
            const payload = {
                title: taskToMove.title,
                notes: taskToMove.originalNotes || taskToMove.notes
            };
            if (taskToMove.due) payload.due = taskToMove.due;

            const addRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${targetListId}/tasks`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!addRes.ok) throw new Error("Failed to copy task to new list");

            // 2. Delete task from original list
            const delRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${originalListId}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!delRes.ok) console.error("Failed to delete original task after moving");

            // We could update the task's ID cleanly, but fetching is safer to get the new Google Task ID.
            if (currentListId === 'ALL') {
                // Background fetch to sync the newly created ID in "All Tasks"
                fetchTasksForList('ALL');
            }
        } catch (error) {
            console.error("Failed to move task", error);
            setError("Failed to move task correctly. " + error.message);

            // Revert optimistic update
            if (currentListId !== 'ALL') {
                setTasks(prev => [...prev, taskToMove]);
            } else {
                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, listId: originalListId } : t));
            }
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
            createTaskList,
            updateTask,
            deleteTask,
            moveTaskToList,
            loading,
            error,
            sessionExpired,
            silentRefreshFailed
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
