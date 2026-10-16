import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Video, 
  Search, 
  Upload, 
  PenTool, 
  Sun, 
  Moon, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard, 
  Heart, 
  Menu, 
  X,
  Compass,
  Download
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: any) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
}

export function Navbar({ 
  currentView, 
  onNavigate, 
  searchQuery, 
  onSearchChange, 
  onSearchSubmit 
}: NavbarProps) {
  const { user, theme, toggleTheme, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearchSubmit();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6 md:gap-8">
        
        {/* Zone 1: Single-element Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => onNavigate('home')} 
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 transition-transform group-hover:scale-105">
              <Video className="w-5 h-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-zinc-900 dark:text-white whitespace-nowrap">
              VlogVerse
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links & Search */}
        <div className="hidden md:flex items-center gap-6 flex-1 max-w-2xl">
          <nav className="flex items-center gap-5 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <button 
              onClick={() => onNavigate('home')} 
              className={`hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap ${currentView === 'home' ? 'text-zinc-950 dark:text-white font-semibold' : ''}`}
            >
              Home
            </button>
            <button 
              onClick={() => onNavigate('explore')} 
              className={`hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap ${currentView === 'explore' ? 'text-zinc-950 dark:text-white font-semibold' : ''}`}
            >
              Explore Vlogs
            </button>
            <button 
              onClick={() => onNavigate('stories')} 
              className={`hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap ${currentView === 'stories' ? 'text-zinc-950 dark:text-white font-semibold' : ''}`}
            >
              Creator Stories
            </button>
          </nav>

          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search vlogs, stories, creators..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-colors"
            />
          </div>
        </div>

        {/* Zone 3: Primary Action & User Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Direct Download ZIP Button */}
          <a
            href="/api/download-zip"
            download="vlogverse_complete_project.zip"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition whitespace-nowrap shadow-xs"
            title="Download complete project ZIP"
          >
            <Download className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
            <span className="hidden sm:inline">Download ZIP</span>
          </a>

          {user ? (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onNavigate('upload')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-zinc-900 dark:bg-white dark:text-zinc-950 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors whitespace-nowrap shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Vlog
              </button>

              <button
                onClick={() => onNavigate('write')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors whitespace-nowrap border border-zinc-200 dark:border-zinc-800"
              >
                <PenTool className="w-3.5 h-3.5" />
                Write Story
              </button>

              {/* User Avatar Menu Trigger */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 focus:outline-none p-1 rounded-full hover:ring-2 hover:ring-zinc-300 dark:hover:ring-zinc-700 transition"
                >
                  <img
                    src={user.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`}
                    alt={user.username}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover bg-zinc-200 dark:bg-zinc-800"
                  />
                </button>

                {userMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 text-sm z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="font-semibold text-zinc-900 dark:text-white truncate">@{user.username}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => { onNavigate('profile', user.username); setUserMenuOpen(false); }}
                      className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-zinc-500" />
                      View Channel
                    </button>

                    <button
                      onClick={() => { onNavigate('dashboard'); setUserMenuOpen(false); }}
                      className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-zinc-500" />
                      Creator Studio
                    </button>

                    <button
                      onClick={() => { onNavigate('liked'); setUserMenuOpen(false); }}
                      className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-zinc-500" />
                      Liked Vlogs
                    </button>

                    <a
                      href="/api/download-zip"
                      download="vlogverse_complete_project.zip"
                      className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span className="w-4 h-4 flex items-center justify-center font-mono text-xs font-bold text-zinc-500">ZIP</span>
                      Download Source Code
                    </a>

                    <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />

                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('signin')}
                className="px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-zinc-900 dark:bg-white dark:text-zinc-950 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors whitespace-nowrap shadow-sm"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white focus:outline-none"
            aria-label="Open mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 pt-3 pb-5 space-y-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search vlogs, stories..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearchSubmit();
                  setMobileMenuOpen(false);
                }
              }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col space-y-2 text-sm font-medium">
            <button
              onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
              className="text-left px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
            >
              Home
            </button>
            <button
              onClick={() => { onNavigate('explore'); setMobileMenuOpen(false); }}
              className="text-left px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
            >
              Explore Vlogs
            </button>
            <button
              onClick={() => { onNavigate('stories'); setMobileMenuOpen(false); }}
              className="text-left px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
            >
              Creator Stories
            </button>

            {user ? (
              <>
                <button
                  onClick={() => { onNavigate('upload'); setMobileMenuOpen(false); }}
                  className="text-left px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Upload Vlog
                </button>
                <button
                  onClick={() => { onNavigate('write'); setMobileMenuOpen(false); }}
                  className="text-left px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex items-center gap-2"
                >
                  <PenTool className="w-4 h-4" /> Write Story
                </button>
                <button
                  onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
                  className="text-left px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" /> Creator Studio
                </button>
                <button
                  onClick={() => { onNavigate('liked'); setMobileMenuOpen(false); }}
                  className="text-left px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" /> Liked Vlogs
                </button>
                <a
                  href="/api/download-zip"
                  download="vlogverse_complete_project.zip"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download Code (.ZIP)
                </a>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="text-left px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            ) : (
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <a
                  href="/api/download-zip"
                  download="vlogverse_complete_project.zip"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 text-center text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download Project (.ZIP)
                </a>
                <div className="flex gap-2">
                  <button
                    onClick={() => { onNavigate('signin'); setMobileMenuOpen(false); }}
                    className="flex-1 py-2 text-center text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-800"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { onNavigate('signup'); setMobileMenuOpen(false); }}
                    className="flex-1 py-2 text-center text-sm font-medium rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
