import React from 'react';
import { Film, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (view: string) => void;
}

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <div className="py-24 text-center space-y-5 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto text-zinc-400 border border-zinc-200 dark:border-zinc-800">
        <Film className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="font-display text-4xl font-extrabold text-zinc-900 dark:text-white">
          404
        </h1>
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
          Scene Not Found
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          The frame or film reel you were looking for doesn't exist, was renamed, or has moved to another frequency.
        </p>
      </div>

      <div className="pt-2">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Featured Vlogs
        </button>
      </div>
    </div>
  );
}
