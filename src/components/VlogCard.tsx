import React from 'react';
import { Vlog } from '../types';
import { Eye, Heart, MessageSquare, Play } from 'lucide-react';

interface VlogCardProps {
  vlog: Vlog;
  onSelect: (vlogId: number) => void;
  onAuthorClick?: (username: string) => void;
}

export function VlogCard({ vlog, onSelect, onAuthorClick }: VlogCardProps) {
  // Format creation date
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect(vlog.id);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAuthorClick && vlog.author) {
      onAuthorClick(vlog.author.username);
    }
  };

  return (
    <article 
      onClick={handleCardClick}
      className="group cursor-pointer flex flex-col bg-transparent transition-transform duration-200"
    >
      {/* Thumbnail Aspect 16:9 */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
        <img
          src={vlog.thumbnail_path || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80'}
          alt={vlog.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Video Scrim & Hover Play indicator */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 text-zinc-950 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </div>
        </div>

        {/* Bottom duration / views chip */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[11px] font-mono text-zinc-200 tabular-nums">
          {vlog.views_count.toLocaleString()} views
        </div>
      </div>

      {/* Metadata & Title */}
      <div className="mt-3 flex gap-3">
        {vlog.author && (
          <button 
            onClick={handleAuthorClick}
            className="shrink-0 focus:outline-none"
            aria-label={`View ${vlog.author.username}'s profile`}
          >
            <img
              src={vlog.author.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${vlog.author.username}`}
              alt={vlog.author.username}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover bg-zinc-200 dark:bg-zinc-800 hover:opacity-90 transition"
            />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors line-clamp-2 leading-snug">
            {vlog.title}
          </h3>

          {/* Clean unboxed metadata with typographic separators */}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {vlog.author && (
              <span 
                onClick={handleAuthorClick}
                className="hover:text-zinc-900 dark:hover:text-zinc-200 font-medium truncate max-w-[120px]"
              >
                {vlog.author.username}
              </span>
            )}
            {vlog.category && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{vlog.category.name}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{formatDate(vlog.created_at)}</span>
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1 tabular-nums">
              <Heart className={`w-3.5 h-3.5 ${vlog.has_liked ? 'text-rose-500 fill-rose-500' : ''}`} />
              {vlog.likes_count}
            </span>
            <span className="flex items-center gap-1 tabular-nums">
              <MessageSquare className="w-3.5 h-3.5" />
              {vlog.comments_count}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
