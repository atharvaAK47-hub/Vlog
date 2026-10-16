export interface User {
  id: number;
  username: string;
  email?: string;
  bio?: string;
  profile_image?: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Vlog {
  id: number;
  title: string;
  description: string;
  video_path: string;
  thumbnail_path: string;
  status: 'published' | 'draft';
  views_count: number;
  likes_count: number;
  comments_count: number;
  has_liked?: boolean;
  created_at: string;
  updated_at: string;
  author: User;
  category?: Category | null;
  tags?: Tag[];
}

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  cover_image?: string;
  status: 'published' | 'draft';
  created_at: string;
  updated_at: string;
  author: User;
  category?: Category | null;
  tags?: Tag[];
}

export interface Comment {
  id: number;
  user_id: number;
  vlog_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  author: {
    id: number;
    username: string;
    profile_image?: string;
  };
}

export interface DashboardStats {
  vlogs_count: number;
  published_count: number;
  drafts_count: number;
  posts_count: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
}
