import React, { useState, useEffect } from 'react';
import { BlogPost, Category } from '../types';
import { api } from '../api';
import { BookOpen, PenTool, ArrowRight } from 'lucide-react';

interface StoriesPageProps {
  onSelectStory: (id: number) => void;
  onNavigate: (view: string) => void;
}

export function StoriesPage({ onSelectStory, onNavigate }: StoriesPageProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getPosts()
      .then(res => setPosts(res.posts))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-16">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
            Creator Stories & Field Notes
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Essays on cinematography, audio recording, color craft, and filmmaker expeditions.
          </p>
        </div>

        <button
          onClick={() => onNavigate('write')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition shadow"
        >
          <PenTool className="w-3.5 h-3.5" />
          Write Story
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-500">Loading stories...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <BookOpen className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">No stories published yet. Be the first to share your notes!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectStory(post.id)}
              className="group cursor-pointer p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition flex flex-col justify-between"
            >
              <div>
                {post.cover_image && (
                  <div className="aspect-[16/9] w-full mb-4 overflow-hidden rounded-xl bg-zinc-900">
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                  {post.category && <span>{post.category.name}</span>}
                  <span aria-hidden="true">·</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>

                <h2 className="font-display font-semibold text-base text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors line-clamp-2 mb-2">
                  {post.title}
                </h2>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                  {post.content}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-900 dark:text-zinc-200">
                  {post.author?.username}
                </span>
                <span className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white font-medium flex items-center gap-1 transition-colors">
                  Read article <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

    </div>
  );
}
