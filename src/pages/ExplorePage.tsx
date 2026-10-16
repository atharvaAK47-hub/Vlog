import React, { useState, useEffect } from 'react';
import { Vlog, Category } from '../types';
import { api } from '../api';
import { VlogCard } from '../components/VlogCard';
import { Search, Compass, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface ExplorePageProps {
  onSelectVlog: (id: number) => void;
  onNavigate: (view: string, param?: any) => void;
  initialCategory?: string;
}

export function ExplorePage({ onSelectVlog, onNavigate, initialCategory = 'all' }: ExplorePageProps) {
  const [vlogs, setVlogs] = useState<Vlog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQ, setSearchQ] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchVlogs = async () => {
    try {
      setLoading(true);
      const res = await api.getVlogs({
        category: activeCategory === 'all' ? undefined : activeCategory,
        q: searchQ || undefined,
        sort: sortBy,
        page,
        per_page: 12
      });
      setVlogs(res.vlogs);
      setTotalPages(res.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getCategories().then(res => setCategories(res.categories)).catch(console.error);
  }, []);

  useEffect(() => {
    fetchVlogs();
  }, [activeCategory, sortBy, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchVlogs();
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
          Explore Vlogs
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Discover visual narratives, indie films, and daily diaries from creators across the globe.
        </p>
      </div>

      {/* Controls: Search, Category Filters, Sort Selector */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search vlogs by title, tag, or creator..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
          </form>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="latest">Latest Published</option>
              <option value="popular">Most Liked</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills (Functional Buttons) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => { setActiveCategory('all'); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${activeCategory === 'all' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
          >
            All Channels
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => { setActiveCategory(c.slug); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${activeCategory === c.slug ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <div key={n} className="animate-pulse space-y-3">
              <div className="aspect-video bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : vlogs.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
          <Compass className="w-8 h-8 text-zinc-400 mx-auto" />
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">No vlogs found</h3>
          <p className="text-xs text-zinc-500">Try adjusting your category filter or search keywords.</p>
          <button
            onClick={() => { setActiveCategory('all'); setSearchQ(''); setPage(1); }}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
          >
            Reset Filters
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
          >
            Previous
          </button>
          <span className="text-xs font-mono tabular-nums text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
}
