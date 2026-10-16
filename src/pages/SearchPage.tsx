import React, { useState, useEffect } from 'react';
import { Vlog, BlogPost, User } from '../types';
import { api } from '../api';
import { VlogCard } from '../components/VlogCard';
import { Search, Film, BookOpen, Users, Compass } from 'lucide-react';

interface SearchPageProps {
  query: string;
  onSelectVlog: (id: number) => void;
  onNavigate: (view: string, param?: any) => void;
}

export function SearchPage({ query, onSelectVlog, onNavigate }: SearchPageProps) {
  const [vlogs, setVlogs] = useState<Vlog[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [creators, setCreators] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'vlogs' | 'posts' | 'creators'>('all');

  useEffect(() => {
    async function doSearch() {
      if (!query.trim()) {
        setVlogs([]);
        setPosts([]);
        setCreators([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await api.search(query.trim());
        setVlogs(res.vlogs);
        setPosts(res.posts);
        setCreators(res.creators);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    doSearch();
  }, [query]);

  const totalResults = vlogs.length + posts.length + creators.length;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Search Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Search className="w-3.5 h-3.5" />
          <span>Search Results for</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
          "{query}"
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Found {totalResults} matching results across vlogs, stories, and creators.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition ${activeTab === 'all' ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          All ({totalResults})
        </button>
        <button
          onClick={() => setActiveTab('vlogs')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${activeTab === 'vlogs' ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <Film className="w-3.5 h-3.5" />
          Vlogs ({vlogs.length})
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${activeTab === 'posts' ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Stories ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('creators')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${activeTab === 'creators' ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <Users className="w-3.5 h-3.5" />
          Creators ({creators.length})
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-500">Searching VlogVerse index...</p>
        </div>
      ) : totalResults === 0 ? (
        <div className="p-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
          <Compass className="w-8 h-8 text-zinc-400 mx-auto" />
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">No results found for "{query}"</h3>
          <p className="text-xs text-zinc-500">Try searching for keywords like "tokyo", "cinematography", "coffee", or creator names.</p>
          <button
            onClick={() => onNavigate('explore')}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
          >
            Browse All Vlogs
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* Creators Section */}
          {(activeTab === 'all' || activeTab === 'creators') && creators.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Creators ({creators.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {creators.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onNavigate('profile', c.username)}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-3 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                  >
                    <img
                      src={c.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${c.username}`}
                      alt={c.username}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover bg-zinc-200 dark:bg-zinc-800"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        @{c.username}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {c.bio || 'Creator'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Vlogs Section */}
          {(activeTab === 'all' || activeTab === 'vlogs') && vlogs.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Vlogs ({vlogs.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {vlogs.map((v) => (
                  <VlogCard
                    key={v.id}
                    vlog={v}
                    onSelect={onSelectVlog}
                    onAuthorClick={(username) => onNavigate('profile', username)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Posts Section */}
          {(activeTab === 'all' || activeTab === 'posts') && posts.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Stories & Field Notes ({posts.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((p) => (
                  <article
                    key={p.id}
                    onClick={() => onNavigate('story_detail', p.id)}
                    className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                  >
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-white line-clamp-2">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500 line-clamp-3">
                      {p.content}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

        </div>
      )}

    </div>
  );
}
