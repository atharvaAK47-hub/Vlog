import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Category } from '../types';
import { useAuth } from '../context/AuthContext';
import { Upload, Film, Image as ImageIcon, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface UploadPageProps {
  onSuccess: (vlogId: number) => void;
  onNavigate: (view: string) => void;
}

export function UploadPage({ onSuccess, onNavigate }: UploadPageProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [customVideoPath, setCustomVideoPath] = useState<string>('');
  const [customThumbPath, setCustomThumbPath] = useState<string>('');
  
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!user) {
      onNavigate('signin');
      return;
    }
    api.getCategories().then(res => {
      setCategories(res.categories);
      if (res.categories.length > 0) {
        setCategoryId(res.categories[0].id);
      }
    }).catch(console.error);
  }, [user]);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|m4v)$/i)) {
        setErrorMsg('Please select a valid video file (MP4, WebM, MOV)');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setErrorMsg('Video file exceeds maximum size limit (100MB)');
        return;
      }
      setErrorMsg('');
      setVideoFile(file);
    }
  };

  const handleThumbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please select a valid image for thumbnail');
        return;
      }
      setErrorMsg('');
      setThumbnailFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Please enter a vlog title');
      return;
    }

    if (!videoFile && !customVideoPath) {
      setErrorMsg('Please provide a video file or video URL');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(20);

      let finalVideoPath = customVideoPath;
      let finalThumbPath = customThumbPath;

      // Handle upload if file selected
      if (videoFile || thumbnailFile) {
        setUploadProgress(40);
        const formData = new FormData();
        if (videoFile) formData.append('video', videoFile);
        if (thumbnailFile) formData.append('thumbnail', thumbnailFile);

        const uploadRes = await api.uploadMedia(formData);
        if (uploadRes.video_path) finalVideoPath = uploadRes.video_path;
        if (uploadRes.thumbnail_path) finalThumbPath = uploadRes.thumbnail_path;
      }

      setUploadProgress(75);

      // Default thumbnail if none provided
      if (!finalThumbPath) {
        finalThumbPath = '/src/assets/images/vlog_tokyo_night_1792079137646.jpg';
      }

      const tagsArray = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const vlogRes = await api.createVlog({
        title: title.trim(),
        description: description.trim(),
        video_path: finalVideoPath || '/media/uploads/videos/tokyo_night_vlog.mp4',
        thumbnail_path: finalThumbPath,
        category_id: categoryId ? Number(categoryId) : null,
        status,
        tags: tagsArray
      });

      setUploadProgress(100);
      onSuccess(vlogRes.vlog.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish vlog');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 pb-20 space-y-8">
      
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
          Upload Vlog
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Share high quality video narratives with the VlogVerse community.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Video Upload Dropzone */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
            Video Source <span className="text-rose-500">*</span>
          </label>

          <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition bg-zinc-50/50 dark:bg-zinc-900/30">
            <Film className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            
            {videoFile ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{videoFile.name}</p>
                <p className="text-[11px] text-zinc-500">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                <label className="inline-block mt-2 text-xs text-zinc-600 dark:text-zinc-400 underline cursor-pointer">
                  Change file
                  <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoSelect} className="hidden" />
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Drag and drop your video file here, or browse
                </p>
                <p className="text-[11px] text-zinc-400">
                  Supported formats: MP4, WebM, MOV (Max 100MB)
                </p>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 cursor-pointer hover:bg-zinc-800 transition">
                  <Upload className="w-3.5 h-3.5" />
                  Select Video File
                  <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoSelect} className="hidden" />
                </label>
              </div>
            )}
          </div>

          <div className="text-[11px] text-zinc-500 flex items-center justify-between pt-1">
            <span>Or provide an existing media path:</span>
            <input
              type="text"
              placeholder="/media/uploads/videos/tokyo_night_vlog.mp4"
              value={customVideoPath}
              onChange={(e) => setCustomVideoPath(e.target.value)}
              className="w-1/2 px-2.5 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>
        </div>

        {/* Thumbnail Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
            Video Thumbnail
          </label>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition">
              <ImageIcon className="w-3.5 h-3.5" />
              {thumbnailFile ? thumbnailFile.name : 'Choose Cover Image'}
              <input type="file" accept="image/*" onChange={handleThumbSelect} className="hidden" />
            </label>
            <span className="text-xs text-zinc-400">Or use URL:</span>
            <input
              type="text"
              placeholder="/src/assets/images/hero_vlog_filmmaker_1792079137057.jpg"
              value={customThumbPath}
              onChange={(e) => setCustomThumbPath(e.target.value)}
              className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
            Vlog Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Kyoto at Twilight: Capturing 35mm Film in Gion"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
            Description & Context
          </label>
          <textarea
            rows={4}
            placeholder="Tell viewers about your camera gear, locations, sound design, and the story behind the shoot..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        {/* Category & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
              Category
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
              Publish Status
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus('published')}
                className={`flex-1 py-2 text-xs font-medium rounded-xl border transition ${status === 'published' ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold' : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={`flex-1 py-2 text-xs font-medium rounded-xl border transition ${status === 'draft' ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold' : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
            Tags (comma separated)
          </label>
          <input
            type="text"
            placeholder="cinematography, 4k, travel, tokyo, color-grading"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none"
          />
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-zinc-500">
              <span>Uploading & Processing media...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-900 dark:bg-white transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="pt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="px-4 py-2 text-xs font-medium rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 transition shadow"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? 'Publishing...' : status === 'draft' ? 'Save Draft' : 'Publish Vlog'}
          </button>
        </div>

      </form>
    </div>
  );
}
