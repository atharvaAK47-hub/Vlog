import React, { useState, useEffect } from 'react';
import { Vlog, BlogPost, DashboardStats } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Eye, 
  Heart, 
  MessageSquare, 
  Film, 
  Upload, 
  Trash2, 
  Edit3, 
  ExternalLink,
  Plus
} from 'lucide-react';

interface DashboardPageProps {
  onSelectVlog: (id: number) => void;
  onNavigate: (view: string, param?: any) => void;
}

export function DashboardPage({ onSelectVlog, onNavigate }: DashboardPageProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vlogs, setVlogs] = useState<Vlog[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit vlog state
  const [editingVlog, setEditingVlog] = useState<Vlog | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'published' | 'draft'>('published');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setStats(res.stats);
      setVlogs(res.vlogs);
      setPosts(res.posts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      onNavigate('signin');
      return;
    }
    loadDashboard();
  }, [user]);

  const handleDeleteVlog = async (vlogId: number) => {
    if (!confirm('Are you sure you want to delete this vlog? This action cannot be undone.')) return;
    try {
      await api.deleteVlog(vlogId);
      setVlogs(prev => prev.filter(v => v.id !== vlogId));
      if (stats) {
        setStats({ ...stats, vlogs_count: stats.vlogs_count - 1 });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete vlog');
    }
  };

  const handleStartEdit = (v: Vlog) => {
    setEditingVlog(v);
    setEditTitle(v.title);
    setEditDesc(v.description);
    setEditStatus(v.status);
  };

  const handleSaveVlogEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVlog || !editTitle.trim()) return;

    try {
      setIsUpdating(true);
      const res = await api.updateVlog(editingVlog.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        status: editStatus
      });
      setVlogs(prev => prev.map(v => v.id === editingVlog.id ? res.vlog : v));
      setEditingVlog(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update vlog');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-500">Loading creator studio analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
            Creator Studio Dashboard
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your channel metrics, drafts, published films, and audience engagement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('upload')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition shadow"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload New Vlog
          </button>
          <button
            onClick={() => onNavigate('write')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Write Story
          </button>
        </div>
      </div>

      {/* Stats KPI Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium">Lifetime Views</span>
              <Eye className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
              {stats.total_views.toLocaleString()}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium">Likes Received</span>
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
              {stats.total_likes.toLocaleString()}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium">Comments</span>
              <MessageSquare className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
              {stats.total_comments.toLocaleString()}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium">Vlogs / Drafts</span>
              <Film className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
              {stats.published_count} <span className="text-xs font-normal text-zinc-400">({stats.drafts_count} drafts)</span>
            </p>
          </div>
        </div>
      )}

      {/* Vlogs Management Table */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-bold text-zinc-900 dark:text-white">
          My Vlogs ({vlogs.length})
        </h2>

        {vlogs.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
            <Film className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-xs text-zinc-500">You haven't uploaded any vlogs yet.</p>
            <button
              onClick={() => onNavigate('upload')}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
            >
              Upload Your First Vlog
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Video</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Views</th>
                    <th className="py-3 px-4 font-semibold">Likes</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {vlogs.map((vlog) => (
                    <tr key={vlog.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={vlog.thumbnail_path || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=150&q=80'}
                            alt=""
                            className="w-16 h-10 object-cover rounded-lg bg-zinc-900 shrink-0"
                          />
                          <div className="min-w-0">
                            <p 
                              onClick={() => onSelectVlog(vlog.id)}
                              className="font-semibold text-zinc-900 dark:text-white hover:underline cursor-pointer line-clamp-1"
                            >
                              {vlog.title}
                            </p>
                            <p className="text-[11px] text-zinc-400 line-clamp-1">
                              {vlog.description || 'No description'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${vlog.status === 'published' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'}`}>
                          {vlog.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">
                        {new Date(vlog.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                        {vlog.views_count.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                        {vlog.likes_count}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectVlog(vlog.id)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
                            title="Watch Vlog"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(vlog)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
                            title="Edit metadata"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVlog(vlog.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-600 transition"
                            title="Delete Vlog"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Vlog Modal */}
      {editingVlog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white">
              Edit Vlog
            </h3>

            <form onSubmit={handleSaveVlogEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVlog(null)}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
