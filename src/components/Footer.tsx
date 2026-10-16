import React from 'react';
import { Video, Heart, Shield, Terminal, Film, BookOpen } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950">
                <Video className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-lg text-zinc-900 dark:text-white">
                VlogVerse
              </span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              A high-performance vlog sharing platform for filmmakers, visual storytellers, and creative explorers.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-zinc-900 dark:hover:text-white transition">
                  Trending Vlogs
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('stories')} className="hover:text-zinc-900 dark:hover:text-white transition">
                  Creator Stories
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-zinc-900 dark:hover:text-white transition">
                  Cinematography
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-zinc-900 dark:hover:text-white transition">
                  Travel & Expeditions
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-3">
              Creator Studio
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('upload')} className="hover:text-zinc-900 dark:hover:text-white transition">
                  Upload Vlog
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('write')} className="hover:text-zinc-900 dark:hover:text-white transition">
                  Publish Story
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-zinc-900 dark:hover:text-white transition">
                  Channel Analytics
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('liked')} className="hover:text-zinc-900 dark:hover:text-white transition">
                  Liked Media
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-3">
              Full-Stack Architecture
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Equipped with HTTP 206 range streaming, PBKDF2 password security, relational SQLite/PostgreSQL models, and Python test suite.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
              <Shield className="w-3.5 h-3.5 text-zinc-500" />
              <span>Full-Stack Verified</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <p>© {new Date().getFullYear()} VlogVerse Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a 
              href="/api/download-zip" 
              download="vlogverse_complete_project.zip"
              className="text-zinc-900 dark:text-zinc-100 font-semibold hover:underline flex items-center gap-1"
            >
              Download Full Source (.ZIP)
            </a>
            <span className="hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer">Terms of Service</span>
            <span className="hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer">API Documentation</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
