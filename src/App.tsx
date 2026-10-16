import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { WatchPage } from './pages/WatchPage';
import { UploadPage } from './pages/UploadPage';
import { WritePage } from './pages/WritePage';
import { AuthPages } from './pages/AuthPages';
import { ProfilePage } from './pages/ProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import { LikedPage } from './pages/LikedPage';
import { SearchPage } from './pages/SearchPage';
import { StoriesPage } from './pages/StoriesPage';
import { StoryDetailPage } from './pages/StoryDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';

function AppContent() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeVlogId, setActiveVlogId] = useState<number | null>(null);
  const [activeUsername, setActiveUsername] = useState<string>('');
  const [activeStoryId, setActiveStoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleNavigate = (view: string, param?: any) => {
    if (view === 'watch' && typeof param === 'number') {
      setActiveVlogId(param);
      setCurrentView('watch');
    } else if (view === 'profile' && typeof param === 'string') {
      setActiveUsername(param);
      setCurrentView('profile');
    } else if (view === 'story_detail' && typeof param === 'number') {
      setActiveStoryId(param);
      setCurrentView('story_detail');
    } else if (view === 'search') {
      if (param) setSearchQuery(param);
      setCurrentView('search');
    } else {
      setCurrentView(view);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    setCurrentView('search');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomePage
            onSelectVlog={(id) => handleNavigate('watch', id)}
            onNavigate={handleNavigate}
          />
        );

      case 'explore':
        return (
          <ExplorePage
            onSelectVlog={(id) => handleNavigate('watch', id)}
            onNavigate={handleNavigate}
          />
        );

      case 'watch':
        if (!activeVlogId) return <NotFoundPage onNavigate={handleNavigate} />;
        return (
          <WatchPage
            vlogId={activeVlogId}
            onSelectVlog={(id) => handleNavigate('watch', id)}
            onNavigate={handleNavigate}
          />
        );

      case 'upload':
        return (
          <UploadPage
            onSuccess={(newId) => {
              showToast('Vlog uploaded successfully!');
              handleNavigate('watch', newId);
            }}
            onNavigate={handleNavigate}
          />
        );

      case 'write':
        return (
          <WritePage
            onSuccess={() => {
              showToast('Story published successfully!');
              handleNavigate('stories');
            }}
            onNavigate={handleNavigate}
          />
        );

      case 'signin':
        return (
          <AuthPages
            initialMode="signin"
            onSuccess={() => {
              showToast('Welcome back to VlogVerse!');
              handleNavigate('home');
            }}
            onNavigate={handleNavigate}
          />
        );

      case 'signup':
        return (
          <AuthPages
            initialMode="signup"
            onSuccess={() => {
              showToast('Channel created! Welcome to VlogVerse.');
              handleNavigate('home');
            }}
            onNavigate={handleNavigate}
          />
        );

      case 'profile':
        return (
          <ProfilePage
            username={activeUsername || user?.username || 'alex_creates'}
            onSelectVlog={(id) => handleNavigate('watch', id)}
            onNavigate={handleNavigate}
          />
        );

      case 'dashboard':
        return (
          <DashboardPage
            onSelectVlog={(id) => handleNavigate('watch', id)}
            onNavigate={handleNavigate}
          />
        );

      case 'liked':
        return (
          <LikedPage
            onSelectVlog={(id) => handleNavigate('watch', id)}
            onNavigate={handleNavigate}
          />
        );

      case 'search':
        return (
          <SearchPage
            query={searchQuery}
            onSelectVlog={(id) => handleNavigate('watch', id)}
            onNavigate={handleNavigate}
          />
        );

      case 'stories':
        return (
          <StoriesPage
            onSelectStory={(id) => handleNavigate('story_detail', id)}
            onNavigate={handleNavigate}
          />
        );

      case 'story_detail':
        if (!activeStoryId) return <NotFoundPage onNavigate={handleNavigate} />;
        return (
          <StoryDetailPage
            storyId={activeStoryId}
            onNavigate={handleNavigate}
          />
        );

      default:
        return <NotFoundPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {renderCurrentView()}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
