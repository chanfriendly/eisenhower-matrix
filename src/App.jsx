import React from 'react';
import Header from './components/Header';
import Matrix from './components/Matrix';
import { GoogleTasksProvider, GoogleAuthProviderWrapper } from './contexts/GoogleTasksContext';

function App() {
  return (
    <GoogleAuthProviderWrapper>
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <Header />
        <div className="flex-1">
          <Matrix />
        </div>
      </div>
    </GoogleAuthProviderWrapper>
  );
}

export default App;
