import React, { useState, useEffect } from 'react';
import { Vlog, Comment } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { VideoPlayer } from '../components/VideoPlayer';
import { VlogCard } from '../components/VlogCard';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Check, 
  Edit3, 
  Trash2, 
  Send, 
  Sparkles,
  ArrowLeft 
} from 'lucide-react';

interface WatchPageProps {
  vlogId: number;
  onSelectVlog: (id: number) => void;
  onNavigate: (view: string, param?: any) => void;
}

export function WatchPage({ vlogId, onSelectVlog, onNavigate }: WatchPageProps) {
  const { user } = useAuth();
  const [vlog, setVlog] = useState<Vlog | null>(null);
  const [relatedVlogs, setRelatedVlogs] = useState<Vlog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [theaterMode, setTheaterMode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [likeLoading, setLikeLoading] = useState<boolean>(false);

  useEffect(() => {
    async function loadVlog() {
      try {
        setLoading(true);
        const [vlogRes, commentsRes, allVlogsRes] = await Promise.all([
          api.getVlog(vlogId),
          api.getComments(vlogId),
          api.getVlogs({ per_page: 8 })
        ]);
        setVlog(vlogRes.vlog);
        setComments(commentsRes.comments);
        setRelatedVlogs(allVlogsRes.vlogs.filter(v => v.id !== vlogId));
      } catch (err) {
        console.error('Error fetching vlog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadVlog();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [vlogId]);

  const handleLikeToggle = async () => {
    if (!user) {
      onNavigate('signin');
      return;
    }
    if (!vlog || likeLoading) return;

    try {
      setLikeLoading(true);
      if (vlog.has_liked) {
        const res = await api.unlikeVlog(vlog.id);
        setVlog(prev => prev ? { ...prev, has_liked: false, likes_count: res.likes_count } : null);
      } else {
        const res = await api.likeVlog(vlog.id);
        setVlog(prev => prev ? { ...prev, has_liked: true, likes_count: res.likes_count } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onNavigate('signin');
      return;
    }
    if (!newComment.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      const res = await api.addComment(vlogId, newComment.trim());
      setComments(prev => [res.comment, ...prev]);
      setNewComment('');
      if (vlog) {
        setVlog({ ...vlog, comments_count: vlog.comments_count + 1 });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStartEdit = (c: Comment) => {
    setEditingCommentId(c.id);
    setEditContent(c.content.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!editContent.trim()) return;
    try {
      await api.editComment(commentId, editContent.trim());
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editContent.trim() } : c));
      setEditingCommentId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to edit comment');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      if (vlog) {
        setVlog({ ...vlog, comments_count: Math.max(0, vlog.comments_count - 1) });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-zinc-500">Loading film presentation...</p>
      </div>
    );
  }

  if (!vlog) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Vlog Not Found</h2>
        <p className="text-sm text-zinc-500">The requested video may have been removed or made private.</p>
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
    <div className="space-y-8 pb-16">
      
      {/* Top Navigation Back Action */}
      <button
        onClick={() => onNavigate('explore')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Library
      </button>

      {/* Primary Video Container */}
      <div className="w-full">
        <VideoPlayer
          src={vlog.video_path}
          poster={vlog.thumbnail_path}
          title={vlog.title}
          theaterMode={theaterMode}
          onToggleTheater={() => setTheaterMode(!theaterMode)}
          autoPlay={true}
        />
      </div>

      {/* Video Info & Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Title, Author, Engagement, Comments */}
        <div className="lg:col-span-8 space-y-6">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white leading-snug">
              {vlog.title}
            </h1>

            {/* Unboxed metadata line */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="font-mono tabular-nums">{vlog.views_count.toLocaleString()} views</span>
                <span aria-hidden="true">·</span>
                <span>Published {new Date(vlog.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                {vlog.category && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{vlog.category.name}</span>
                  </>
                )}
              </div>

              {/* Action Buttons: Like, Share */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLikeToggle}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${vlog.has_liked ? 'border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'}`}
                >
                  <Heart className={`w-4 h-4 ${vlog.has_liked ? 'fill-current' : ''}`} />
                  <span className="font-mono tabular-nums">{vlog.likes_count}</span>
                  <span>{vlog.has_liked ? 'Liked' : 'Like'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Link Copied' : 'Share'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Author Card */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800">
            <div 
              onClick={() => onNavigate('profile', vlog.author?.username)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <img
                src={vlog.author?.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${vlog.author?.username}`}
                alt={vlog.author?.username}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-full object-cover bg-zinc-200 dark:bg-zinc-800"
              />
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition">
                  {vlog.author?.username}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                  {vlog.author?.bio || 'Creator on VlogVerse'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsSubscribed(!isSubscribed)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${isSubscribed ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200' : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100'}`}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>

          {/* Description Block */}
          <div className="p-4 rounded-xl bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 space-y-3">
            <p className="whitespace-pre-line">{vlog.description}</p>

            {/* Tags */}
            {vlog.tags && vlog.tags.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                {vlog.tags.map(t => (
                  <span key={t.id} className="hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer">
                    #{t.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <section className="space-y-6 pt-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
              <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white">
                {comments.length} Comments
              </h3>
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-3">
              <img
                src={user?.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || 'Guest'}`}
                alt="Avatar"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover shrink-0 bg-zinc-200 dark:bg-zinc-800"
              />
              <div className="flex-1 space-y-2">
                <textarea
                  rows={2}
                  placeholder={user ? "Add a constructive comment or feedback..." : "Sign in to leave a comment..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={!user || submittingComment}
                  className="w-full p-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 disabled:opacity-60 transition"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!user || !newComment.trim() || submittingComment}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 dark:bg-white dark:text-zinc-950 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-40 transition"
                  >
                    <Send className="w-3 h-3" />
                    Comment
                  </button>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4 pt-2">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/80">
                  <img
                    src={comment.author?.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.author?.username || 'user'}`}
                    alt={comment.author?.username}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover shrink-0 bg-zinc-200 dark:bg-zinc-800"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {comment.author?.username}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Edit/Delete Actions for comment author */}
                      {user && user.id === comment.user_id && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(comment)}
                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                            aria-label="Edit comment"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 transition"
                            aria-label="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="mt-2 space-y-2">
                        <input
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-2 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCommentId(null)}
                            className="px-2.5 py-1 text-[11px] text-zinc-500 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed break-words">
                        {comment.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Related Vlogs Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="font-display text-base font-bold text-zinc-900 dark:text-white">
            Related Vlogs
          </h3>
          <div className="space-y-4">
            {relatedVlogs.map(rel => (
              <div 
                key={rel.id}
                onClick={() => onSelectVlog(rel.id)}
                className="group flex gap-3 cursor-pointer p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
              >
                <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                  <img
                    src={rel.thumbnail_path || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=400&q=80'}
                    alt={rel.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[9px] font-mono text-zinc-200 tabular-nums">
                    {rel.views_count}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors line-clamp-2 leading-tight">
                    {rel.title}
                  </h4>
                  <p className="mt-1 text-[11px] text-zinc-500 truncate">
                    {rel.author?.username}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {new Date(rel.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
