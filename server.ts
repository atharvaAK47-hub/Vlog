import express, { Request, Response, NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const BASE_DIR = process.cwd();

// Ensure instance and media folders
fs.mkdirSync(path.join(BASE_DIR, 'instance'), { recursive: true });
fs.mkdirSync(path.join(BASE_DIR, 'media', 'uploads', 'videos'), { recursive: true });
fs.mkdirSync(path.join(BASE_DIR, 'media', 'uploads', 'thumbnails'), { recursive: true });
fs.mkdirSync(path.join(BASE_DIR, 'media', 'uploads', 'covers'), { recursive: true });
fs.mkdirSync(path.join(BASE_DIR, 'media', 'uploads', 'avatars'), { recursive: true });

// Initialize SQLite database
const dbPath = path.join(BASE_DIR, 'instance', 'vlogverse.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Create tables
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  bio TEXT DEFAULT '',
  profile_image TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS vlogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  video_path TEXT NOT NULL,
  thumbnail_path TEXT DEFAULT '',
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'published',
  views_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image TEXT DEFAULT '',
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'published',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vlog_id INTEGER NOT NULL REFERENCES vlogs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vlog_id INTEGER NOT NULL REFERENCES vlogs(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, vlog_id)
);

CREATE TABLE IF NOT EXISTS vlog_tags (
  vlog_id INTEGER NOT NULL REFERENCES vlogs(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (vlog_id, tag_id)
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
`);

// Password hashing utility
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, combined: string): boolean {
  const [salt, key] = combined.split(':');
  if (!salt || !key) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === key;
}

// In-memory session store (simple token based session mapped to user id)
const sessions = new Map<string, number>();

function getUserIdFromReq(req: Request): number | null {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers['x-session-id']) {
    token = String(req.headers['x-session-id']);
  } else if (req.headers.cookie) {
    const match = req.headers.cookie.match(/session_id=([^;]+)/);
    if (match) token = match[1];
  }
  if (!token) return null;
  return sessions.get(token) || null;
}

// Multer storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'videos';
    if (file.mimetype.startsWith('image/')) {
      subfolder = 'thumbnails';
    }
    const dest = path.join(BASE_DIR, 'media', 'uploads', subfolder);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${crypto.randomUUID()}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB limit
});

// Seed Initial Data if empty
function seedDatabase() {
  const userCount = (db.prepare('SELECT count(*) as count FROM users').get() as { count: number }).count;
  if (userCount > 0) return;

  const now = new Date().toISOString();

  // Categories
  const categories = [
    { name: 'Cinematography & Film', slug: 'cinematography' },
    { name: 'Travel & Exploration', slug: 'travel' },
    { name: 'Tech & Creator Gear', slug: 'tech' },
    { name: 'Artisanal Coffee & Food', slug: 'coffee-food' },
    { name: 'Alpine & Outdoors', slug: 'adventure' },
    { name: 'Daily Life & Routines', slug: 'daily-life' }
  ];

  const insertCat = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)');
  for (const c of categories) {
    insertCat.run(c.name, c.slug);
  }

  // Users
  const defaultPassword = hashPassword('password123');
  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password_hash, bio, profile_image, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'alex_creates',
    'alex@vlogverse.io',
    defaultPassword,
    'Cinematographer & visual storyteller documenting atmospheric cities and rainy nights.',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
    now
  );
  insertUser.run(
    'sophia_cinema',
    'sophia@vlogverse.io',
    defaultPassword,
    'Indie director exploring golden hour coasts, color science, and analog film lenses.',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80',
    now
  );
  insertUser.run(
    'marco_voyages',
    'marco@vlogverse.io',
    defaultPassword,
    'Alpine hiker, morning coffee lover, and minimalist studio workstation enthusiast.',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    now
  );

  // Tags
  const insertTag = db.prepare('INSERT INTO tags (name, slug) VALUES (?, ?)');
  insertTag.run('tokyo', 'tokyo');
  insertTag.run('cinematography', 'cinematography');
  insertTag.run('coffee', 'coffee');
  insertTag.run('alps', 'alps');
  insertTag.run('filmmaking', 'filmmaking');
  insertTag.run('workspace', 'workspace');

  // Seed Initial Vlogs
  const insertVlog = db.prepare(`
    INSERT INTO vlogs (user_id, title, description, video_path, thumbnail_path, category_id, status, views_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'published', ?, ?, ?)
  `);

  // Vlog 1: Tokyo Neon Nights
  insertVlog.run(
    1,
    'Tokyo Neon Nights: Rainy Shinjuku Alleys in 4K',
    'A cinematic walk through the neon-drenched side streets of Shinjuku and Omoide Yokocho in Tokyo after an autumn midnight shower.',
    '/media/uploads/videos/tokyo_night_vlog.mp4',
    '/media/uploads/thumbnails/vlog_tokyo_night_1792079137646.jpg',
    1,
    1420,
    new Date(Date.now() - 86400000 * 3).toISOString(),
    now
  );

  // Vlog 2: Golden Hour Coastal Filmmaking
  insertVlog.run(
    2,
    'Solo Filmmaking on the Pacific Coast: My Camera Rig Breakdown',
    'Taking the handheld cinema rig to Big Sur at sunset to test vintage primes and handheld stabilization against ocean cliffs.',
    '/media/uploads/videos/filmmaker_vlog.mp4',
    '/media/uploads/thumbnails/hero_vlog_filmmaker_1792079137057.jpg',
    1,
    3890,
    new Date(Date.now() - 86400000 * 5).toISOString(),
    now
  );

  // Vlog 3: Morning Coffee Ritual & Slow Living
  insertVlog.run(
    3,
    'The 6:00 AM Coffee Ritual: Slow Morning Routine & Editing Flow',
    'A calm study in morning routines, manual V60 pour-over coffee craft, and setting up the creative mind before stepping into the edit suite.',
    '/media/uploads/videos/coffee_craft_vlog.mp4',
    '/media/uploads/thumbnails/vlog_coffee_craft_1792079138486.jpg',
    4,
    2150,
    new Date(Date.now() - 86400000 * 2).toISOString(),
    now
  );

  // Vlog 4: Alpine Sunrise Trek
  insertVlog.run(
    3,
    'Alpine Ridge Sunrise: High Altitude Solo Trek & Drone Film',
    'Waking up before twilight at 2,400 meters to film the golden cloud inversion flowing between Swiss peaks.',
    '/media/uploads/videos/alpine_hike_vlog.mp4',
    '/media/uploads/thumbnails/vlog_alpine_hike_1792079138538.jpg',
    5,
    5120,
    new Date(Date.now() - 86400000 * 1).toISOString(),
    now
  );

  // Seed Blog Posts
  const insertPost = db.prepare(`
    INSERT INTO blog_posts (user_id, title, content, cover_image, category_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'published', ?, ?)
  `);

  insertPost.run(
    2,
    'The 3 Lighting Principles That Changed How I Shoot Vlogs',
    `When I began shooting vlogs four years ago, I believed camera resolution was everything. I upgraded from 1080p to 4K, bought anamorphic adapters, and chased sharper glass. Yet my frames felt clinical rather than cinematic.

The breakthrough came when I stopped obsessing over the camera sensor and started shaping ambient contrast.

1. Large Soft Sources Over Small Hard Lights: A 120cm octabox with grid creates smooth roll-off across facial planes while preventing light from spilling onto the back wall.
2. Practical Separation: Always position a warm tungsten source (a desk lamp, fairy lights, or an amber rim) just out of primary sight to delineate your subject from dark backgrounds.
3. Negative Fill: Don't just add light—use black duvetyne or foam core on the opposite side of your key light to deepen shadows and create true depth.

Try these on your next video and watch your image transform immediately.`,
    '/media/uploads/thumbnails/vlog_studio_desk_1792079139273.jpg',
    1,
    new Date(Date.now() - 86400000 * 4).toISOString(),
    now
  );

  insertPost.run(
    1,
    'Audio Is 70% of Video: Why Bad Sound Ruins Great Cinematography',
    `Viewers will tolerate grainy low-light 1080p footage if the audio is crisp, balanced, and free of room echo. Conversely, breathtaking 8K ProRes footage is instantly unwatchable if the audio sounds like an echo chamber.

In this guide, I share my compact run-and-gun wireless shotgun setup and 3 basic EQ moves in post-production that eliminate muddiness.`,
    '/media/uploads/thumbnails/vlog_tokyo_night_1792079137646.jpg',
    3,
    new Date(Date.now() - 86400000 * 6).toISOString(),
    now
  );

  // Seed Comments
  const insertComment = db.prepare(`
    INSERT INTO comments (user_id, vlog_id, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertComment.run(2, 1, 'The color grading on that rainy puddle reflection is breathtaking! What LUT did you use?', now, now);
  insertComment.run(3, 1, 'Incredible atmosphere. Shinjuku at 2 AM is pure cinema magic.', now, now);
  insertComment.run(1, 2, 'That Big Sur golden hour light is unbeatable. Love the rig balance.', now, now);

  // Seed Likes
  const insertLike = db.prepare(`INSERT INTO likes (user_id, vlog_id, created_at) VALUES (?, ?, ?)`);
  insertLike.run(1, 1, now);
  insertLike.run(2, 1, now);
  insertLike.run(3, 1, now);
  insertLike.run(1, 2, now);
  insertLike.run(3, 2, now);
  insertLike.run(2, 3, now);
  insertLike.run(1, 4, now);
  insertLike.run(2, 4, now);
}

seedDatabase();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper to format Vlog response
function formatVlog(row: any, currentUserId: number | null) {
  const author = db.prepare('SELECT id, username, bio, profile_image, created_at FROM users WHERE id = ?').get(row.user_id);
  const category = row.category_id ? db.prepare('SELECT id, name, slug FROM categories WHERE id = ?').get(row.category_id) : null;
  const likesCount = (db.prepare('SELECT count(*) as count FROM likes WHERE vlog_id = ?').get(row.id) as { count: number }).count;
  const commentsCount = (db.prepare('SELECT count(*) as count FROM comments WHERE vlog_id = ?').get(row.id) as { count: number }).count;
  
  let hasLiked = false;
  if (currentUserId) {
    const likeRow = db.prepare('SELECT id FROM likes WHERE user_id = ? AND vlog_id = ?').get(currentUserId, row.id);
    hasLiked = !!likeRow;
  }

  const tags = db.prepare(`
    SELECT t.id, t.name, t.slug 
    FROM tags t 
    JOIN vlog_tags vt ON vt.tag_id = t.id 
    WHERE vt.vlog_id = ?
  `).all(row.id);

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    video_path: row.video_path,
    thumbnail_path: row.thumbnail_path || '',
    status: row.status,
    views_count: row.views_count,
    likes_count: likesCount,
    comments_count: commentsCount,
    has_liked: hasLiked,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author,
    category,
    tags
  };
}

// -------------------------------------------------------------
// HTTP 206 Partial Content Video & Media Streaming Route
// -------------------------------------------------------------
app.get('/media/uploads/*', (req: Request, res: Response) => {
  const relPath = req.params[0];
  const safePath = path.normalize(path.join(BASE_DIR, 'media', 'uploads', relPath));
  
  if (!safePath.startsWith(path.join(BASE_DIR, 'media', 'uploads'))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!fs.existsSync(safePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const stat = fs.statSync(safePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  let contentType = 'application/octet-stream';
  if (safePath.endsWith('.mp4')) contentType = 'video/mp4';
  else if (safePath.endsWith('.webm')) contentType = 'video/webm';
  else if (safePath.endsWith('.jpg') || safePath.endsWith('.jpeg')) contentType = 'image/jpeg';
  else if (safePath.endsWith('.png')) contentType = 'image/png';
  else if (safePath.endsWith('.webp')) contentType = 'image/webp';

  if (range && contentType.startsWith('video/')) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(safePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes'
    };
    res.writeHead(200, head);
    fs.createReadStream(safePath).pipe(res);
  }
});

// Also serve assets from src/assets if requested
app.use('/src/assets', express.static(path.join(BASE_DIR, 'src', 'assets')));

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, email, password, confirm_password, bio, profile_image } = req.body;
  if (!username || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (confirm_password && password !== confirm_password) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const cleanUser = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  const existingName = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUser);
  if (existingName) {
    return res.status(409).json({ error: 'Username already taken' });
  }
  const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existingEmail) {
    return res.status(409).json({ error: 'Email address already registered' });
  }

  const hash = hashPassword(password);
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO users (username, email, password_hash, bio, profile_image, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(cleanUser, cleanEmail, hash, bio || '', profile_image || '', now);
  const newUserId = Number(result.lastInsertRowid);

  const token = crypto.randomUUID();
  sessions.set(token, newUserId);

  res.setHeader('Set-Cookie', `session_id=${token}; Path=/; HttpOnly; SameSite=Lax`);
  return res.status(201).json({
    message: 'Registration successful',
    token,
    user: {
      id: newUserId,
      username: cleanUser,
      email: cleanEmail,
      bio: bio || '',
      profile_image: profile_image || '',
      created_at: now
    }
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = crypto.randomUUID();
  sessions.set(token, user.id);

  res.setHeader('Set-Cookie', `session_id=${token}; Path=/; HttpOnly; SameSite=Lax`);
  return res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      profile_image: user.profile_image,
      created_at: user.created_at
    }
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers.cookie) {
    const match = req.headers.cookie.match(/session_id=([^;]+)/);
    if (match) token = match[1];
  }
  if (token) sessions.delete(token);

  res.setHeader('Set-Cookie', 'session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  return res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req);
  if (!userId) {
    return res.json({ user: null });
  }
  const user = db.prepare('SELECT id, username, email, bio, profile_image, created_at FROM users WHERE id = ?').get(userId);
  return res.json({ user: user || null });
});

// -------------------------------------------------------------
// Vlogs Endpoints
// -------------------------------------------------------------
app.get('/api/vlogs', (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const perPage = Math.max(1, Math.min(50, parseInt(String(req.query.per_page || '12'), 10)));
  const categorySlug = req.query.category ? String(req.query.category) : '';
  const searchQ = req.query.q ? String(req.query.q).trim() : '';
  const sortBy = req.query.sort ? String(req.query.sort) : 'latest';
  const currentUserId = getUserIdFromReq(req);

  let whereClauses: string[] = ["v.status = 'published'"];
  let params: any[] = [];

  if (categorySlug && categorySlug !== 'all') {
    const cat = db.prepare('SELECT id FROM categories WHERE slug = ?').get(categorySlug) as { id: number } | undefined;
    if (cat) {
      whereClauses.push('v.category_id = ?');
      params.push(cat.id);
    }
  }

  if (searchQ) {
    whereClauses.push('(v.title LIKE ? OR v.description LIKE ? OR u.username LIKE ?)');
    const term = `%${searchQ}%`;
    params.push(term, term, term);
  }

  let orderBy = 'v.created_at DESC';
  if (sortBy === 'views') {
    orderBy = 'v.views_count DESC';
  } else if (sortBy === 'popular') {
    orderBy = '(SELECT count(*) FROM likes l WHERE l.vlog_id = v.id) DESC';
  }

  const whereSql = whereClauses.join(' AND ');

  const totalCount = (db.prepare(`
    SELECT count(*) as count 
    FROM vlogs v 
    JOIN users u ON u.id = v.user_id 
    WHERE ${whereSql}
  `).get(...params) as { count: number }).count;

  const offset = (page - 1) * perPage;
  const rows = db.prepare(`
    SELECT v.* 
    FROM vlogs v 
    JOIN users u ON u.id = v.user_id 
    WHERE ${whereSql} 
    ORDER BY ${orderBy} 
    LIMIT ? OFFSET ?
  `).all(...params, perPage, offset);

  const vlogs = rows.map((r: any) => formatVlog(r, currentUserId));
  const pages = Math.ceil(totalCount / perPage) || 1;

  return res.json({
    vlogs,
    total: totalCount,
    page,
    pages,
    has_next: page < pages,
    has_prev: page > 1
  });
});

app.get('/api/vlogs/:id', (req: Request, res: Response) => {
  const vlogId = parseInt(req.params.id, 10);
  const row = db.prepare('SELECT * FROM vlogs WHERE id = ?').get(vlogId) as any;
  if (!row) {
    return res.status(404).json({ error: 'Vlog not found' });
  }

  // Increment view count
  db.prepare('UPDATE vlogs SET views_count = views_count + 1 WHERE id = ?').run(vlogId);
  row.views_count = (row.views_count || 0) + 1;

  const currentUserId = getUserIdFromReq(req);
  return res.json({ vlog: formatVlog(row, currentUserId) });
});

// File upload endpoint
app.post('/api/upload', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  let videoPath = '';
  let thumbnailPath = '';

  if (files?.video?.[0]) {
    videoPath = `/media/uploads/videos/${files.video[0].filename}`;
  }
  if (files?.thumbnail?.[0]) {
    thumbnailPath = `/media/uploads/thumbnails/${files.thumbnail[0].filename}`;
  }

  return res.json({ video_path: videoPath, thumbnail_path: thumbnailPath });
});

app.post('/api/vlogs', (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { title, description, video_path, thumbnail_path, category_id, status, tags } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  if (!video_path || !video_path.trim()) {
    return res.status(400).json({ error: 'Video file or video path is required' });
  }

  const now = new Date().toISOString();
  const vlogStatus = status === 'draft' ? 'draft' : 'published';

  const stmt = db.prepare(`
    INSERT INTO vlogs (user_id, title, description, video_path, thumbnail_path, category_id, status, views_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);

  const result = stmt.run(
    userId,
    title.trim(),
    description || '',
    video_path.trim(),
    thumbnail_path || '',
    category_id || null,
    vlogStatus,
    now,
    now
  );

  const vlogId = Number(result.lastInsertRowid);

  // Handle tags
  if (Array.isArray(tags)) {
    for (const tagStr of tags) {
      if (!tagStr) continue;
      const cleanTagName = String(tagStr).trim();
      const slug = cleanTagName.toLowerCase().replace(/\s+/g, '-');
      let tag = db.prepare('SELECT id FROM tags WHERE slug = ?').get(slug) as { id: number } | undefined;
      if (!tag) {
        const tagRes = db.prepare('INSERT INTO tags (name, slug) VALUES (?, ?)').run(cleanTagName, slug);
        tag = { id: Number(tagRes.lastInsertRowid) };
      }
      db.prepare('INSERT OR IGNORE INTO vlog_tags (vlog_id, tag_id) VALUES (?, ?)').run(vlogId, tag.id);
    }
  }

  const createdRow = db.prepare('SELECT * FROM vlogs WHERE id = ?').get(vlogId);
  return res.status(201).json({
    message: 'Vlog created successfully',
    vlog: formatVlog(createdRow, userId)
  });
});

app.put('/api/vlogs/:id', (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const vlogId = parseInt(req.params.id, 10);
  const vlog = db.prepare('SELECT * FROM vlogs WHERE id = ?').get(vlogId) as any;
  if (!vlog) {
    return res.status(404).json({ error: 'Vlog not found' });
  }
  if (vlog.user_id !== userId) {
    return res.status(403).json({ error: 'Unauthorized: You can only edit your own vlogs' });
  }

  const { title, description, category_id, status, thumbnail_path } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE vlogs 
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        category_id = COALESCE(?, category_id),
        status = COALESCE(?, status),
        thumbnail_path = COALESCE(?, thumbnail_path),
        updated_at = ?
    WHERE id = ?
  `).run(
    title ? title.trim() : null,
    description !== undefined ? description : null,
    category_id !== undefined ? category_id : null,
    status || null,
    thumbnail_path || null,
    now,
    vlogId
  );

  const updatedRow = db.prepare('SELECT * FROM vlogs WHERE id = ?').get(vlogId);
  return res.json({
    message: 'Vlog updated successfully',
    vlog: formatVlog(updatedRow, userId)
  });
});

app.delete('/api/vlogs/:id', (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const vlogId = parseInt(req.params.id, 10);
  const vlog = db.prepare('SELECT * FROM vlogs WHERE id = ?').get(vlogId) as any;
  if (!vlog) {
    return res.status(404).json({ error: 'Vlog not found' });
  }
  if (vlog.user_id !== userId) {
    return res.status(403).json({ error: 'Unauthorized: You can only delete your own vlogs' });
  }

  db.prepare('DELETE FROM vlogs WHERE id = ?').run(vlogId);
  return res.json({ message: 'Vlog deleted successfully' });
});

// -------------------------------------------------------------
// Like / Unlike Endpoints
// -------------------------------------------------------------
app.post('/api/vlogs/:id/like', (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const vlogId = parseInt(req.params.id, 10);
  const vlog = db.prepare('SELECT id FROM vlogs WHERE id = ?').get(vlogId);
  if (!vlog) return res.status(404).json({ error: 'Vlog not found' });

  const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND vlog_id = ?').get(userId, vlogId);
  if (!existing) {
    const now = new Date().toISOString();
    db.prepare('INSERT INTO likes (user_id, vlog_id, created_at) VALUES (?, ?, ?)').run(userId, vlogId, now);
  }

  const likesCount = (db.prepare('SELECT count(*) as count FROM likes WHERE vlog_id = ?').get(vlogId) as { count: number }).count;
  return res.status(existing ? 200 : 201).json({
    message: existing ? 'Already liked' : 'Vlog liked',
    has_liked: true,
    likes_count: likesCount
  });
});

app.delete('/api/vlogs/:id/like', (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const vlogId = parseInt(req.params.id, 10);
  db.prepare('DELETE FROM likes WHERE user_id = ? AND vlog_id = ?').run(userId, vlogId);

  const likesCount = (db.prepare('SELECT count(*) as count FROM likes WHERE vlog_id = ?').get(vlogId) as { count: number }).count;
  return res.json({
    message: 'Like removed',
    has_liked: false,
    likes_count: likesCount
  });
});

app.get('/api/users/me/likes', (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const rows = db.prepare(`
    SELECT v.* 
    FROM likes l 
    JOIN vlogs v ON v.id = l.vlog_id 
    WHERE l.user_id = ? AND v.status = 'published'
    ORDER BY l.created_at DESC
  `).all(userId);

  const vlogs = rows.map((r: any) => formatVlog(r, userId));
  return res.json({ vlogs });
});

// -------------------------------------------------------------
// Comments Endpoints
// -------------------------------------------------------------
app.get('/api/vlogs/:id/comments', (req: Request, res: Response) => {
  const vlogId = parseInt(req.params.id, 10);
  const rows = db.prepare(`
    SELECT c.*, u.username, u.profile_image 
    FROM comments c 
    JOIN users u ON u.id = c.user_id 
    WHERE c.vlog_id = ? 
    ORDER BY c.created_at DESC
  `).all(vlogId);

  const comments = rows.map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    vlog_id: r.vlog_id,
    content: r.content,
    created_at: r.created_at,
    updated_at: r.updated_at,
    author: {
      id: r.user_id,
      username: r.username,
      profile_image: r.profile_image
    }
  }));

  return res.json({ comments, total: comments.length });
});

app.post('/api/vlogs/:id/comments', (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const vlogId = parseInt(req.params.id, 10);
  const vlog = db.prepare('SELECT id FROM vlogs WHERE id = ?').get(vlogId);
  if (!vlog) return res.status(404).json({ error: 'Vlog not found' });

  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content cannot be empty' });
  }

  // HTML entity escape to prevent XSS
  const sanitized = content
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const now = new Date().toISOString();
  const stmt = db.prepare('INSERT INTO comments (user_id, vlog_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
  const resInsert = stmt.run(userId, vlogId, sanitized, now, now);
  const commentId = Number(resInsert.lastInsertRowid);

  const author = db.prepare('SELECT id, username, profile_image FROM users WHERE id = ?').get(userId);
  return res.status(201).json({
    message: 'Comment posted',
    comment: {
      id: commentId,
      user_id: userId,
      vlog_id: vlogId,
      content: sanitized,
      created_at: now,
      updated_at: now,
      author
    }
  });
});

app.put('/api/comments/:id', (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const commentId = parseInt(req.params.id, 10);
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId) as any;
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  if (comment.user_id !== userId) return res.status(403).json({ error: 'Unauthorized to edit this comment' });

  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content cannot be empty' });

  const sanitized = content.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const now = new Date().toISOString();
  db.prepare('UPDATE comments SET content = ?, updated_at = ? WHERE id = ?').run(sanitized, now, commentId);

  return res.json({ message: 'Comment updated', content: sanitized });
});

app.delete('/api/comments/:id', (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const commentId = parseInt(req.params.id, 10);
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId) as any;
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  if (comment.user_id !== userId) return res.status(403).json({ error: 'Unauthorized to delete this comment' });

  db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
  return res.json({ message: 'Comment deleted successfully' });
});

// -------------------------------------------------------------
// Blog Posts Endpoints
// -------------------------------------------------------------
app.get('/api/posts', (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const perPage = Math.max(1, Math.min(30, parseInt(String(req.query.per_page || '10'), 10)));
  const offset = (page - 1) * perPage;

  const total = (db.prepare("SELECT count(*) as count FROM blog_posts WHERE status = 'published'").get() as { count: number }).count;
  const rows = db.prepare(`
    SELECT p.*, u.username, u.profile_image, c.name as category_name, c.slug as category_slug
    FROM blog_posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.status = 'published'
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(perPage, offset);

  const posts = rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    cover_image: r.cover_image,
    status: r.status,
    created_at: r.created_at,
    updated_at: r.updated_at,
    author: {
      id: r.user_id,
      username: r.username,
      profile_image: r.profile_image
    },
    category: r.category_name ? { name: r.category_name, slug: r.category_slug } : null
  }));

  return res.json({
    posts,
    total,
    page,
    pages: Math.ceil(total / perPage) || 1
  });
});

app.get('/api/posts/:id', (req: Request, res: Response) => {
  const postId = parseInt(req.params.id, 10);
  const r = db.prepare(`
    SELECT p.*, u.username, u.profile_image, c.name as category_name, c.slug as category_slug
    FROM blog_posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id = ?
  `).get(postId) as any;

  if (!r) return res.status(404).json({ error: 'Post not found' });

  return res.json({
    post: {
      id: r.id,
      title: r.title,
      content: r.content,
      cover_image: r.cover_image,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      author: {
        id: r.user_id,
        username: r.username,
        profile_image: r.profile_image
      },
      category: r.category_name ? { name: r.category_name, slug: r.category_slug } : null
    }
  });
});

app.post('/api/posts', (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const { title, content, cover_image, category_id, status } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO blog_posts (user_id, title, content, cover_image, category_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    userId,
    title.trim(),
    content.trim(),
    cover_image || '',
    category_id || null,
    status === 'draft' ? 'draft' : 'published',
    now,
    now
  );

  return res.status(201).json({
    message: 'Blog post created successfully',
    id: Number(result.lastInsertRowid)
  });
});

app.put('/api/posts/:id', (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const postId = parseInt(req.params.id, 10);
  const post = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(postId) as any;
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.user_id !== userId) return res.status(403).json({ error: 'Unauthorized to edit this post' });

  const { title, content, cover_image, category_id, status } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE blog_posts 
    SET title = COALESCE(?, title),
        content = COALESCE(?, content),
        cover_image = COALESCE(?, cover_image),
        category_id = COALESCE(?, category_id),
        status = COALESCE(?, status),
        updated_at = ?
    WHERE id = ?
  `).run(
    title ? title.trim() : null,
    content ? content.trim() : null,
    cover_image !== undefined ? cover_image : null,
    category_id !== undefined ? category_id : null,
    status || null,
    now,
    postId
  );

  return res.json({ message: 'Post updated' });
});

app.delete('/api/posts/:id', (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const postId = parseInt(req.params.id, 10);
  const post = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(postId) as any;
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.user_id !== userId) return res.status(403).json({ error: 'Unauthorized to delete this post' });

  db.prepare('DELETE FROM blog_posts WHERE id = ?').run(postId);
  return res.json({ message: 'Post deleted successfully' });
});

// -------------------------------------------------------------
// User Profiles & Dashboard Endpoints
// -------------------------------------------------------------
app.get('/api/users/:username', (req: Request, res: Response) => {
  const username = req.params.username;
  const user = db.prepare('SELECT id, username, bio, profile_image, created_at FROM users WHERE username = ?').get(username) as any;
  if (!user) return res.status(404).json({ error: 'Creator not found' });

  const currentUserId = getUserIdFromReq(req);
  const vlogRows = db.prepare("SELECT * FROM vlogs WHERE user_id = ? AND status = 'published' ORDER BY created_at DESC").all(user.id);
  const vlogs = vlogRows.map((r: any) => formatVlog(r, currentUserId));

  const postRows = db.prepare("SELECT * FROM blog_posts WHERE user_id = ? AND status = 'published' ORDER BY created_at DESC").all(user.id);
  const posts = postRows.map((p: any) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    cover_image: p.cover_image,
    created_at: p.created_at,
    author: user
  }));

  const totalLikes = (db.prepare(`
    SELECT count(*) as count 
    FROM likes l 
    JOIN vlogs v ON v.id = l.vlog_id 
    WHERE v.user_id = ?
  `).get(user.id) as { count: number }).count;

  const totalViews = vlogRows.reduce((sum: number, v: any) => sum + (v.views_count || 0), 0);

  return res.json({
    user,
    stats: {
      vlogs_count: vlogs.length,
      posts_count: posts.length,
      total_likes: totalLikes,
      total_views: totalViews
    },
    vlogs,
    posts
  });
});

app.put('/api/users/me', (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const { bio, profile_image } = req.body;
  db.prepare('UPDATE users SET bio = COALESCE(?, bio), profile_image = COALESCE(?, profile_image) WHERE id = ?')
    .run(bio !== undefined ? String(bio).trim() : null, profile_image !== undefined ? String(profile_image).trim() : null, userId);

  const updated = db.prepare('SELECT id, username, email, bio, profile_image, created_at FROM users WHERE id = ?').get(userId);
  return res.json({ message: 'Profile updated', user: updated });
});

app.get('/api/users/me/dashboard', (req: Request, res: Response) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const allVlogsRows = db.prepare('SELECT * FROM vlogs WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  const vlogs = allVlogsRows.map((r: any) => formatVlog(r, userId));

  const allPosts = db.prepare('SELECT * FROM blog_posts WHERE user_id = ? ORDER BY created_at DESC').all(userId);

  const totalViews = allVlogsRows.reduce((sum: number, v: any) => sum + (v.views_count || 0), 0);
  const totalLikes = (db.prepare(`
    SELECT count(*) as count 
    FROM likes l 
    JOIN vlogs v ON v.id = l.vlog_id 
    WHERE v.user_id = ?
  `).get(userId) as { count: number }).count;

  const totalComments = (db.prepare(`
    SELECT count(*) as count 
    FROM comments c 
    JOIN vlogs v ON v.id = c.vlog_id 
    WHERE v.user_id = ?
  `).get(userId) as { count: number }).count;

  return res.json({
    stats: {
      vlogs_count: vlogs.length,
      published_count: vlogs.filter((v: any) => v.status === 'published').length,
      drafts_count: vlogs.filter((v: any) => v.status === 'draft').length,
      posts_count: allPosts.length,
      total_views: totalViews,
      total_likes: totalLikes,
      total_comments: totalComments
    },
    vlogs,
    posts: allPosts
  });
});

// -------------------------------------------------------------
// Search & Categories Endpoints
// -------------------------------------------------------------
app.get('/api/search', (req: Request, res: Response) => {
  const query = req.query.q ? String(req.query.q).trim() : '';
  const currentUserId = getUserIdFromReq(req);

  if (!query) {
    return res.json({ query: '', vlogs: [], posts: [], creators: [] });
  }

  const term = `%${query}%`;
  const vlogRows = db.prepare(`
    SELECT v.* 
    FROM vlogs v 
    JOIN users u ON u.id = v.user_id 
    WHERE v.status = 'published' AND (v.title LIKE ? OR v.description LIKE ? OR u.username LIKE ?) 
    ORDER BY v.created_at DESC 
    LIMIT 20
  `).all(term, term, term);

  const vlogs = vlogRows.map((r: any) => formatVlog(r, currentUserId));

  const postRows = db.prepare(`
    SELECT p.*, u.username, u.profile_image 
    FROM blog_posts p 
    JOIN users u ON u.id = p.user_id 
    WHERE p.status = 'published' AND (p.title LIKE ? OR p.content LIKE ?) 
    ORDER BY p.created_at DESC 
    LIMIT 10
  `).all(term, term);

  const creators = db.prepare(`
    SELECT id, username, bio, profile_image, created_at 
    FROM users 
    WHERE username LIKE ? OR bio LIKE ? 
    LIMIT 8
  `).all(term, term);

  return res.json({
    query,
    vlogs,
    posts: postRows,
    creators
  });
});

app.get('/api/categories', (req: Request, res: Response) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY id ASC').all();
  return res.json({ categories });
});

app.get('/api/download-zip', (req: Request, res: Response) => {
  const zipPath = path.join(BASE_DIR, 'vlogverse_complete_project.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="vlogverse_complete_project.zip"');
    return res.sendFile(zipPath);
  }
  return res.status(404).json({ error: 'Archive not found' });
});

app.get('/vlogverse_complete_project.zip', (req: Request, res: Response) => {
  const zipPath = path.join(BASE_DIR, 'vlogverse_complete_project.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="vlogverse_complete_project.zip"');
    return res.sendFile(zipPath);
  }
  return res.status(404).json({ error: 'Archive not found' });
});

// -------------------------------------------------------------
// Start Server & Mount Vite Middleware
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(BASE_DIR, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(BASE_DIR, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VlogVerse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
