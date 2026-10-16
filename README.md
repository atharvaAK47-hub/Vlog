# VlogVerse – Full-Stack Vlog Sharing Platform

VlogVerse is a modern, responsive, and production-grade video sharing and blogging platform built for creators, indie filmmakers, and visual storytellers.

The platform includes:
- **Full-Stack Reactive UI**: High-definition video player with custom scrubbers, theater mode, speed controls, zero-pill metadata, light/dark themes, and instant mobile responsiveness.
- **Python Flask REST API**: Modular blueprints, Werkzeug secure password hashing, CSRF & session protection, centralized error handlers, and HTTP 206 Partial Content video range streaming.
- **Relational Database**: SQLAlchemy ORM models configured for SQLite (development) and PostgreSQL (production).
- **Interactive Features**: Real-time likes, threaded comments with edit/delete controls and XSS prevention, blog post publishing, tag filtering, channel analytics, and global search.
- **Automated Test Suite**: 17 unit tests verifying authentication, vlog uploads, authorization, like constraints, comments, and search.

---

## 1. Prerequisites

- **Python**: 3.10+
- **Node.js**: 20+ (for Vite frontend dev server and full-stack runtime)
- **SQLite3** or **PostgreSQL** (production)
- **FFmpeg** (optional, for local video transcoding and thumbnail extraction)

---

## 2. Project File Structure

```text
vlogverse/
├── backend/
│   ├── app.py                   # Application factory, HTTP 206 video range streaming & errors
│   ├── config.py                # SQLite & PostgreSQL database configurations, upload limits
│   ├── extensions.py            # SQLAlchemy database instance
│   ├── models.py                # User, Vlog, BlogPost, Comment, Like, Category, Tag models
│   ├── requirements.txt         # Python package dependencies
│   ├── .env.example             # Environment template
│   ├── routes/
│   │   ├── auth.py              # Register, login, logout, me, login_required decorator
│   │   ├── vlogs.py             # CRUD operations, category/tag filtering, pagination
│   │   ├── posts.py             # Creator stories & field notes CRUD
│   │   ├── comments.py          # Comments add, edit, delete with XSS sanitization
│   │   ├── likes.py             # Database-backed likes & duplicate prevention
│   │   ├── profiles.py          # Public channel pages, creator studio dashboard
│   │   └── search.py            # Search across vlogs, articles, and creators
│   ├── services/
│   │   └── upload_service.py    # Secure filename generation, MIME & extension checks
│   └── tests/
│       ├── test_auth.py         # Registration, duplicate rejection, login/logout
│       ├── test_vlogs.py        # Upload, edit/delete authorization checks
│       ├── test_likes.py        # Like/unlike, duplicate prevention
│       ├── test_comments.py     # Adding, editing, deleting, ownership checks
│       └── test_search.py       # Query matching, category filter, pagination
├── frontend/
│   ├── css/
│   │   ├── style.css            # Clean, zero-pill typography and layout
│   │   └── responsive.css       # Mobile & tablet viewports
│   └── js/
│       └── api.js               # Fetch API REST client
├── media/
│   └── uploads/
│       ├── videos/              # Video files (MP4, WebM)
│       ├── thumbnails/          # Video preview thumbnails
│       └── covers/              # Blog story cover images
├── src/                         # Full-Stack React + Vite application
│   ├── components/              # VideoPlayer, Navbar, Footer, VlogCard
│   ├── context/                 # AuthContext & ThemeProvider
│   └── pages/                   # Home, Explore, Watch, Upload, Write, Profile, Dashboard, Search, Liked
├── server.ts                    # Full-Stack Express + SQLite server mounted with Vite middleware
├── package.json
└── README.md
```

---

## 3. Installation & Setup

### A. Python Flask Backend

1. Navigate to the project root and create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate    # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. Configure environment variables:
   ```bash
   cp backend/.env.example .env
   ```

4. Initialize the database and seed default categories:
   ```bash
   python3 -c "from backend.app import create_app, init_db; app = create_app(); init_db(app); print('Database initialized!')"
   ```

5. Run the Flask development server:
   ```bash
   python3 -m backend.app
   # Backend starts on http://localhost:5000
   ```

---

### B. Full-Stack Dev Server (Vite + Express)

The project includes an integrated full-stack server (`server.ts`) that runs on port 3000, mounts all REST API routes and media streaming on `/api` and `/media`, and hot-serves the React frontend.

1. Install Node dependencies:
   ```bash
   npm install
   ```

2. Start the dev server:
   ```bash
   npm run dev
   # Server runs on http://localhost:3000
   ```

3. Build for production:
   ```bash
   npm run build
   npm start
   ```

---

## 4. Running the Automated Test Suite

VlogVerse comes with a test suite covering all critical authentication, authorization, like, comment, and search workflows:

Run tests with Python's built-in `unittest` runner:
```bash
python3 -m unittest discover -s backend/tests -p "test_*.py" -v
```

### Verified Test Cases:
- `test_registration_success`: Validates user creation with password hashing.
- `test_duplicate_email_rejection`: Prevents duplicate email registrations (409 Conflict).
- `test_duplicate_username_rejection`: Enforces unique usernames across the platform.
- `test_login_valid_and_invalid`: Confirms session creation and rejects invalid credentials.
- `test_unauthorized_upload_attempt`: Blocks anonymous upload attempts (401 Unauthorized).
- `test_successful_vlog_upload_and_read`: Uploads a vlog and verifies view incrementation.
- `test_author_can_edit_and_delete_vlog`: Confirms creator's ability to update their films.
- `test_user_cannot_edit_or_delete_others_vlog`: Enforces 403 Forbidden for unauthorized tampering.
- `test_like_and_duplicate_prevention`: Ensures database uniqueness on likes per user/vlog.
- `test_unlike_functionality`: Decrements counts accurately on like withdrawal.
- `test_add_edit_and_delete_comment`: Tests comment lifecycle with HTML sanitization.
- `test_comment_ownership_protection`: Blocks users from deleting other users' comments.
- `test_search_by_title_and_description`: Tests text matching across titles and logs.
- `test_pagination_and_category_filtering`: Tests limit, offset, and category filtering.

---

## 5. API Reference Summary

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new account | No |
| `POST` | `/api/auth/login` | Authenticate credentials & start session | No |
| `POST` | `/api/auth/logout` | Terminate active session | Yes |
| `GET` | `/api/auth/me` | Fetch authenticated user data | Optional |
| `GET` | `/api/vlogs` | List vlogs (supports `?category=`, `?sort=`, `?q=`, `?page=`) | No |
| `GET` | `/api/vlogs/<id>` | Stream vlog metadata & increment views | No |
| `POST` | `/api/vlogs` | Create vlog (multipart or JSON) | Yes |
| `PUT` | `/api/vlogs/<id>` | Edit vlog details (owner only) | Yes |
| `DELETE` | `/api/vlogs/<id>` | Delete vlog (owner only) | Yes |
| `POST` | `/api/vlogs/<id>/like` | Like a vlog (duplicate prevention) | Yes |
| `DELETE`| `/api/vlogs/<id>/like` | Remove like from vlog | Yes |
| `GET` | `/api/vlogs/<id>/comments` | List comments for vlog | No |
| `POST` | `/api/vlogs/<id>/comments` | Add comment (HTML sanitized) | Yes |
| `PUT` | `/api/comments/<id>` | Edit own comment | Yes |
| `DELETE`| `/api/comments/<id>` | Delete own comment | Yes |
| `GET` | `/api/posts` | List creator blog posts | No |
| `POST` | `/api/posts` | Publish creator story / field note | Yes |
| `GET` | `/api/users/<username>` | Public channel profile & vlogs | No |
| `PUT` | `/api/users/me` | Update bio and profile avatar | Yes |
| `GET` | `/api/users/me/dashboard`| Creator Studio metrics & drafts | Yes |
| `GET` | `/api/search?q=<query>` | Global search across vlogs, stories, creators | No |
| `GET` | `/media/uploads/*` | HTTP 206 Partial Content video range stream | No |

---

## 6. Production Deployment

### PostgreSQL Configuration
In production environments, switch from SQLite to PostgreSQL by defining `DATABASE_URL`:
```bash
export DATABASE_URL="postgresql://username:password@db-host.com:5432/vlogverse"
```
SQLAlchemy handles the abstraction automatically without requiring any codebase modifications.

### Cloud Media Storage (S3 / GCS)
To route uploads to AWS S3 or Google Cloud Storage in production:
1. Set `MEDIA_FOLDER` or configure a pre-signed URL upload service in `backend/services/upload_service.py`.
2. Update the video player source to point to your CDN distribution domain.

---

## 7. Demo Accounts

For fast testing in development, the platform is seeded with 3 creator profiles:
- **Alex** (`alex@vlogverse.io` / `password123`) – Cinematographer in Tokyo
- **Sophia** (`sophia@vlogverse.io` / `password123`) – Indie Director on Pacific Coast
- **Marco** (`marco@vlogverse.io` / `password123`) – Alpine Hiker & Coffee Craftsman

Click the **Instant Demo Creator Login** buttons on the Sign In page to immediately test authenticated features (uploading vlogs, liking videos, leaving comments, editing profiles, and viewing dashboard analytics).
