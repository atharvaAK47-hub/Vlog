import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { api } from '../api';
import { ArrowLeft, Calendar, Share2, Check } from 'lucide-react';

interface StoryDetailPageProps {
  storyId: number;
  onNavigate: (view: string, param?: any) => void;
}

export function StoryDetailPage({ storyId, onNavigate }: StoryDetailPageProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    api.getPost(storyId)
      .then(res => setPost(res.post))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [storyId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-500">Loading story...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-20 text-center space-y-3">
        <h2 className="text-xl font-bold">Story Not Found</h2>
        <button
          onClick={() => onNavigate('stories')}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
        >
          Return to Stories
        </button>
      </div>
    );
  }

  return (
    <article className="max-w-2xl mx-auto py-6 pb-20 space-y-8">
      
      <button
        onClick={() => onNavigate('stories')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All Stories
      </button>

      {/* Title & Metadata */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          {post.category && <span>{post.category.name}</span>}
          <span aria-hidden="true">·</span>
          <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white leading-tight text-balance">
          {post.title}
        </h1>

        {/* Author Byline */}
        <div className="flex items-center justify-between pt-2 border-y border-zinc-200/80 dark:border-zinc-800/80 py-3">
          <div 
            onClick={() => onNavigate('profile', post.author?.username)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src={post.author?.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author?.username}`}
              alt=""
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover bg-zinc-200 dark:bg-zinc-800"
            />
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:underline">
                @{post.author?.username}
              </p>
              <p className="text-[11px] text-zinc-400">
                Author & Cinephile
              </p>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Share'}
          </button>
        </div>
      </div>

      {/* Cover Image */}
      {post.cover_image && (
        <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <img
            src={post.cover_image}
            alt={post.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article Body */}
      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-line space-y-4 font-sans">
        {post.content}
      </div>

    </article>
  );
}
