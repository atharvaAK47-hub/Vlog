import { User, Vlog, BlogPost, Comment, Category, DashboardStats } from './types';

// Token storage key
const TOKEN_KEY = 'vlogverse_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed (${response.status})`);
  }

  return data as T;
}

export const api = {
  // Auth
  async register(body: { username: string; email: string; password: string; confirm_password?: string; bio?: string }) {
    const res = await request<{ message: string; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(body: { email: string; password: string }) {
    const res = await request<{ message: string; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setStoredToken(res.token);
    return res;
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken(null);
    }
  },

  async getCurrentUser() {
    return request<{ user: User | null }>('/api/auth/me');
  },

  // Categories
  async getCategories() {
    return request<{ categories: Category[] }>('/api/categories');
  },

  // Vlogs
  async getVlogs(params: { category?: string; sort?: string; q?: string; page?: number; per_page?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.set('category', params.category);
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.q) searchParams.set('q', params.q);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.per_page) searchParams.set('per_page', String(params.per_page));

    return request<{
      vlogs: Vlog[];
      total: number;
      page: number;
      pages: number;
      has_next: boolean;
      has_prev: boolean;
    }>(`/api/vlogs?${searchParams.toString()}`);
  },

  async getVlog(id: number) {
    return request<{ vlog: Vlog }>(`/api/vlogs/${id}`);
  },

  async createVlog(body: {
    title: string;
    description: string;
    video_path: string;
    thumbnail_path?: string;
    category_id?: number | null;
    status?: 'published' | 'draft';
    tags?: string[];
  }) {
    return request<{ message: string; vlog: Vlog }>('/api/vlogs', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updateVlog(id: number, body: Partial<Vlog>) {
    return request<{ message: string; vlog: Vlog }>(`/api/vlogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async deleteVlog(id: number) {
    return request<{ message: string }>(`/api/vlogs/${id}`, {
      method: 'DELETE',
    });
  },

  // Upload file
  async uploadMedia(formData: FormData) {
    return request<{ video_path?: string; thumbnail_path?: string }>('/api/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // Likes
  async likeVlog(vlogId: number) {
    return request<{ message: string; has_liked: boolean; likes_count: number }>(`/api/vlogs/${vlogId}/like`, {
      method: 'POST',
    });
  },

  async unlikeVlog(vlogId: number) {
    return request<{ message: string; has_liked: boolean; likes_count: number }>(`/api/vlogs/${vlogId}/like`, {
      method: 'DELETE',
    });
  },

  async getLikedVlogs() {
    return request<{ vlogs: Vlog[] }>('/api/users/me/likes');
  },

  // Comments
  async getComments(vlogId: number) {
    return request<{ comments: Comment[]; total: number }>(`/api/vlogs/${vlogId}/comments`);
  },

  async addComment(vlogId: number, content: string) {
    return request<{ message: string; comment: Comment }>(`/api/vlogs/${vlogId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async editComment(commentId: number, content: string) {
    return request<{ message: string; content: string }>(`/api/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  async deleteComment(commentId: number) {
    return request<{ message: string }>(`/api/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  // Blog Posts
  async getPosts(params: { page?: number; per_page?: number } = {}) {
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.per_page) sp.set('per_page', String(params.per_page));
    return request<{ posts: BlogPost[]; total: number; page: number; pages: number }>(`/api/posts?${sp.toString()}`);
  },

  async getPost(id: number) {
    return request<{ post: BlogPost }>(`/api/posts/${id}`);
  },

  async createPost(body: { title: string; content: string; cover_image?: string; category_id?: number | null; status?: string }) {
    return request<{ message: string; id: number }>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updatePost(id: number, body: Partial<BlogPost>) {
    return request<{ message: string }>(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async deletePost(id: number) {
    return request<{ message: string }>(`/api/posts/${id}`, {
      method: 'DELETE',
    });
  },

  // User Profile & Dashboard
  async getUserProfile(username: string) {
    return request<{
      user: User;
      stats: { vlogs_count: number; posts_count: number; total_likes: number; total_views: number };
      vlogs: Vlog[];
      posts: BlogPost[];
    }>(`/api/users/${username}`);
  },

  async updateMyProfile(body: { bio?: string; profile_image?: string }) {
    return request<{ message: string; user: User }>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async getDashboard() {
    return request<{ stats: DashboardStats; vlogs: Vlog[]; posts: BlogPost[] }>('/api/users/me/dashboard');
  },

  // Search
  async search(query: string) {
    return request<{
      query: string;
      vlogs: Vlog[];
      posts: BlogPost[];
      creators: User[];
    }>(`/api/search?q=${encodeURIComponent(query)}`);
  },
};
