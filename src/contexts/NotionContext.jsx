import React, { createContext, useContext, useState, useEffect } from 'react';

const NotionContext = createContext(null);

export const useNotion = () => useContext(NotionContext);

export const NotionProvider = ({ children }) => {
    const [notionToken, setNotionToken] = useState(null);
    const [workspaceName, setWorkspaceName] = useState(null);

    useEffect(() => {
        // Check for token in URL hash (from our OAuth callback)
        const hash = window.location.hash.substring(1);
        if (hash) {
            const params = new URLSearchParams(hash);
            const token = params.get('notion_token');
            const workspace = params.get('workspace');

            if (token) {
                setNotionToken(token);
                setWorkspaceName(workspace || 'Notion');
                localStorage.setItem('notionToken', token);
                localStorage.setItem('notionWorkspace', workspace || 'Notion');

                // Clean the URL to avoid leaving the token in the browser history
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        } else {
            // Load from local storage
            const storedToken = localStorage.getItem('notionToken');
            const storedWorkspace = localStorage.getItem('notionWorkspace');
            if (storedToken) {
                setNotionToken(storedToken);
                setWorkspaceName(storedWorkspace);
            }
        }
    }, []);

    const loginNotion = () => {
        // Redirect to our serverless function that initiates the OAuth flow
        window.location.href = '/api/notion-auth';
    };

    const logoutNotion = () => {
        setNotionToken(null);
        setWorkspaceName(null);
        localStorage.removeItem('notionToken');
        localStorage.removeItem('notionWorkspace');
    };

    return (
        <NotionContext.Provider value={{ notionToken, workspaceName, loginNotion, logoutNotion }}>
            {children}
        </NotionContext.Provider>
    );
};
