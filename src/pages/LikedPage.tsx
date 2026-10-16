import React, { useState, useEffect } from 'react';
import { Vlog } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { VlogCard } from '../components/VlogCard';
import { Heart, Compass } from 'lucide-react';

interface LikedPageProps {
  onSelectVlog: (id: number) => void;
  onNavigate: (view: string, param?: any) => void;
}

export function LikedPage({ onSelectVlog, onNavigate }: LikedPageProps) {
  const { user } = useAuth();
  const [vlogs, setVlogs] = useState<Vlog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      onNavigate('signin');
      return;
    }
    api.getLikedVlogs()
      .then(res => setVlogs(res.vlogs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-500">Loading your liked collection...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900">
          <Heart className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
            Liked Vlogs
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {vlogs.length} films and creator stories saved to your personal library.
          </p>
        </div>
      </div>

      {vlogs.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
          <Compass className="w-8 h-8 text-zinc-400 mx-auto" />
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">No liked vlogs yet</h3>
          <p className="text-xs text-zinc-500">Explore videos and click the heart icon to save them here.</p>
          <button
            onClick={() => onNavigate('explore')}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
          >
            Explore Vlogs
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vlogs.map((vlog) => (
            <VlogCard
              key={vlog.id}
              vlog={vlog}
              onSelect={onSelectVlog}
              onAuthorClick={(username) => onNavigate('profile', username)}
            />
          ))}
        </div>
      )}

    </div>
  );
}
