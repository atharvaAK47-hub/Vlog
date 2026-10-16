import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Category } from '../types';
import { useAuth } from '../context/AuthContext';
import { PenTool, Image as ImageIcon, CheckCircle, ArrowLeft } from 'lucide-react';

interface WritePageProps {
  onSuccess: () => void;
  onNavigate: (view: string) => void;
}

export function WritePage({ onSuccess, onNavigate }: WritePageProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('/src/assets/images/vlog_studio_desk_1792079139273.jpg');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!user) {
      onNavigate('signin');
      return;
    }
    api.getCategories().then(res => {
      setCategories(res.categories);
      if (res.categories.length > 0) setCategoryId(res.categories[0].id);
    }).catch(console.error);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a title');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('Please write some content');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createPost({
        title: title.trim(),
        content: content.trim(),
        cover_image: coverImage.trim(),
        category_id: categoryId ? Number(categoryId) : null,
        status
      });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish story');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 pb-20 space-y-8">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
            Write Creator Story
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Publish essays, gear reviews, filmmaking workflows, or travel memoirs.
          </p>
        </div>
        <button
          onClick={() => onNavigate('stories')}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Stories
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
            Article Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Color Grading Log Footage: My 3-Step Node Tree"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 text-base font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        {/* Cover Image URL */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
            Cover Image Path or URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="/src/assets/images/vlog_studio_desk_1792079139273.jpg"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
            />
          </div>
          {coverImage && (
            <div className="mt-2 aspect-[21/9] max-h-48 overflow-hidden rounded-xl bg-zinc-900">
              <img
                src={coverImage}
                alt="Preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Category & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
              Topic Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
              Visibility
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus('published')}
                className={`flex-1 py-2 text-xs font-medium rounded-xl border transition ${status === 'published' ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold' : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
              >
                Publish Now
              </button>
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={`flex-1 py-2 text-xs font-medium rounded-xl border transition ${status === 'draft' ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold' : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
              >
                Save Draft
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
            Article Content <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={12}
            required
            placeholder="Write your story, technical notes, gear recommendations, or personal lessons learned in production..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 text-xs font-mono leading-relaxed rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('stories')}
            className="px-4 py-2 text-xs font-medium rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 transition shadow"
          >
            <PenTool className="w-4 h-4" />
            {isSubmitting ? 'Publishing...' : status === 'draft' ? 'Save Draft' : 'Publish Story'}
          </button>
        </div>

      </form>

    </div>
  );
}
