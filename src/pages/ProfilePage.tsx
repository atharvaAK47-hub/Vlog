import React, { useState, useEffect } from 'react';
import { User, Vlog, BlogPost } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { VlogCard } from '../components/VlogCard';
import { 
  Heart, 
  Eye, 
  Video, 
  BookOpen, 
  Calendar, 
  Edit, 
  Share2, 
  Check, 
  Sparkles,
  ArrowRight 
} from 'lucide-react';

interface ProfilePageProps {
  username: string;
  onSelectVlog: (id: number) => void;
  onNavigate: (view: string, param?: any) => void;
}

export function ProfilePage({ username, onSelectVlog, onNavigate }: ProfilePageProps) {
  const { user: currentUser, refreshUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ vlogs_count: 0, posts_count: 0, total_likes: 0, total_views: 0 });
  const [vlogs, setVlogs] = useState<Vlog[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeTab, setActiveTab] = useState<'vlogs' | 'posts'>('vlogs');
  const [loading, setLoading] = useState<boolean>(true);
  
  // Edit profile modal state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editBio, setEditBio] = useState<string>('');
  const [editImage, setEditImage] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const isOwnProfile = currentUser && currentUser.username === username;

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await api.getUserProfile(username);
        setProfileUser(res.user);
        setStats(res.stats);
        setVlogs(res.vlogs);
        setPosts(res.posts);
        setEditBio(res.user.bio || '');
        setEditImage(res.user.profile_image || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [username]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.updateMyProfile({ bio: editBio, profile_image: editImage });
      await refreshUser();
      setProfileUser(prev => prev ? { ...prev, bio: editBio, profile_image: editImage } : null);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-500">Loading creator channel...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="py-20 text-center space-y-3">
        <h2 className="text-xl font-bold">Creator Not Found</h2>
        <p className="text-xs text-zinc-500">The user @{username} does not exist or has been removed.</p>
        <button
          onClick={() => onNavigate('home')}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      
      {/* Header Banner & Channel Lockup */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          
          <div className="flex items-center gap-5">
            <img
              src={profileUser.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${profileUser.username}`}
              alt={profileUser.username}
              referrerPolicy="no-referrer"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover bg-zinc-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-800 shadow-md"
            />
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
                @{profileUser.username}
              </h1>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md leading-relaxed">
                {profileUser.bio || 'VlogVerse content creator sharing cinematic perspectives.'}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {new Date(profileUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            {isOwnProfile ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 transition"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleShareProfile}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Share Channel'}
              </button>
            )}
          </div>

        </div>

        {/* Channel KPI Row */}
        <div className="mt-8 pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Vlogs</p>
            <p className="text-lg font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
              {stats.vlogs_count}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Creator Stories</p>
            <p className="text-lg font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
              {stats.posts_count}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Likes</p>
            <p className="text-lg font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
              {stats.total_likes.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Audience Views</p>
            <p className="text-lg font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
              {stats.total_views.toLocaleString()}
            </p>
          </div>
        </div>

      </div>

      {/* Profile Content Tabs */}
      <div className="space-y-6">
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('vlogs')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${activeTab === 'vlogs' ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
          >
            <Video className="w-4 h-4" />
            Published Vlogs ({vlogs.length})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${activeTab === 'posts' ? 'border-zinc-900 dark:border-white text-zinc-950 dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
          >
            <BookOpen className="w-4 h-4" />
            Field Notes & Stories ({posts.length})
          </button>
        </div>

        {activeTab === 'vlogs' ? (
          vlogs.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <p className="text-xs text-zinc-500">No vlogs published yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {vlogs.map((vlog) => (
                <VlogCard
                  key={vlog.id}
                  vlog={vlog}
                  onSelect={onSelectVlog}
                />
              ))}
            </div>
          )
        ) : (
          posts.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <p className="text-xs text-zinc-500">No stories written yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => onNavigate('story_detail', post.id)}
                  className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                >
                  {post.cover_image && (
                    <div className="aspect-video w-full mb-3 rounded-lg overflow-hidden bg-zinc-900">
                      <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-white line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-3 leading-relaxed">
                    {post.content}
                  </p>
                  <p className="mt-3 text-[11px] text-zinc-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </article>
              ))}
            </div>
          )
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white">
              Edit Creator Profile
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Profile Picture URL
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Biography
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell your audience about your style, camera gear, and travel destinations..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
