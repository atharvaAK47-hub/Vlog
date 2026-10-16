import React, { useState, useEffect } from 'react';
import { Vlog, Category, BlogPost, User } from '../types';
import { api } from '../api';
import { VlogCard } from '../components/VlogCard';
import { Play, TrendingUp, Sparkles, ArrowRight, BookOpen, Compass, Film } from 'lucide-react';

interface HomePageProps {
  onSelectVlog: (id: number) => void;
  onNavigate: (view: string, param?: any) => void;
}

export function HomePage({ onSelectVlog, onNavigate }: HomePageProps) {
  const [vlogs, setVlogs] = useState<Vlog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [vlogsRes, catsRes, postsRes] = await Promise.all([
          api.getVlogs({ per_page: 8 }),
          api.getCategories(),
          api.getPosts({ per_page: 3 })
        ]);
        setVlogs(vlogsRes.vlogs);
        setCategories(catsRes.categories);
        setPosts(postsRes.posts);
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCategoryFilter = async (slug: string) => {
    setActiveCategory(slug);
    try {
      const res = await api.getVlogs({ category: slug === 'all' ? undefined : slug, per_page: 8 });
      setVlogs(res.vlogs);
    } catch (err) {
      console.error(err);
    }
  };

  const featuredVlog = vlogs[0];

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section: Media-first Split Presentation */}
      {featuredVlog && (
        <section className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[480px]">
            
            {/* Left Column: Typographic Hierarchy */}
            <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between z-10">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-4">
                  <span className="uppercase tracking-widest text-[11px] font-semibold text-zinc-300">Featured Spotlight</span>
                  {featuredVlog.category && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{featuredVlog.category.name}</span>
                    </>
                  )}
                </div>

                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight mb-4 text-balance">
                  {featuredVlog.title}
                </h1>

                <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed mb-6">
                  {featuredVlog.description}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-6">
                  {featuredVlog.author && (
                    <img
                      src={featuredVlog.author.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${featuredVlog.author.username}`}
                      alt={featuredVlog.author.username}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {featuredVlog.author?.username}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Creator & Visual Director
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onSelectVlog(featuredVlog.id)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-100 rounded-xl transition-transform hover:scale-[1.02] shadow-lg"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Watch Now
                  </button>
                  <button
                    onClick={() => onNavigate('explore')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-zinc-300 hover:text-white rounded-xl border border-zinc-700 hover:border-zinc-500 transition-colors"
                  >
                    Explore Library
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Asset */}
            <div 
              onClick={() => onSelectVlog(featuredVlog.id)}
              className="lg:col-span-7 relative min-h-[300px] lg:min-h-full cursor-pointer group"
            >
              <img
                src={featuredVlog.thumbnail_path || '/src/assets/images/hero_vlog_filmmaker_1792079137057.jpg'}
                alt={featuredVlog.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover lg:absolute lg:inset-0 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-zinc-900 via-zinc-900/40 to-transparent" />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/90 text-zinc-950 flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 ml-1 fill-current" />
                </div>
              </div>

              <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-xs font-mono text-zinc-300 tabular-nums">
                {featuredVlog.views_count.toLocaleString()} views
              </div>
            </div>

          </div>
        </section>
      )}

      {/* Interactive Category Filter Bar */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-white">
              Trending Vlogs
            </h2>
          </div>
          <button
            onClick={() => onNavigate('explore')}
            className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 group"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Functional segmented category filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => handleCategoryFilter('all')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${activeCategory === 'all' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
          >
            All Channels
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryFilter(cat.slug)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${activeCategory === cat.slug ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Vlog Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="animate-pulse space-y-3">
                <div className="aspect-video bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : vlogs.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <p className="text-sm text-zinc-500">No vlogs found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {vlogs.map((v) => (
              <VlogCard
                key={v.id}
                vlog={v}
                onSelect={onSelectVlog}
                onAuthorClick={(username) => onNavigate('profile', username)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Creator Stories & Behind-The-Scenes Section */}
      {posts.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-white">
                  Creator Essays & Field Notes
                </h2>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                In-depth reflections, cinematography breakdowns, and creative essays.
              </p>
            </div>
            <button
              onClick={() => onNavigate('stories')}
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 group"
            >
              All stories
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article 
                key={post.id}
                onClick={() => onNavigate('story_detail', post.id)}
                className="group cursor-pointer p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition flex flex-col justify-between"
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

                  <h3 className="font-display font-semibold text-base text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </h3>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {post.author && (
                      <span className="font-medium text-zinc-900 dark:text-zinc-200">
                        {post.author.username}
                      </span>
                    )}
                  </div>
                  <span className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white font-medium flex items-center gap-1 transition-colors">
                    Read note <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Creator Callout Strip */}
      <section className="p-8 sm:p-12 rounded-3xl bg-zinc-900 text-white relative overflow-hidden border border-zinc-800">
        <div className="max-w-xl space-y-4">
          <span className="uppercase text-[11px] font-mono tracking-widest text-zinc-400">
            Join The Community
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white text-balance">
            Share Your Vision With Millions of Creators Worldwide
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Upload your cinema reels, write field notes, receive comments, and build an audience of cinephiles and storytellers.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('upload')}
              className="px-5 py-2.5 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-100 rounded-xl transition shadow"
            >
              Upload Your First Vlog
            </button>
            <button
              onClick={() => onNavigate('write')}
              className="px-4 py-2.5 text-xs font-medium text-zinc-300 hover:text-white rounded-xl border border-zinc-700 hover:border-zinc-500 transition"
            >
              Write Creator Story
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
