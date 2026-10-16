import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'vlogverse-super-secret-key-change-in-production')
    
    # Database: SQLite for local / testing, PostgreSQL for production
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"sqlite:///{BASE_DIR / 'instance' / 'vlogverse.db'}"
    )
    # Fix for Heroku/Render postgres:// URLs
    if SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Upload and Media storage
    MEDIA_FOLDER = os.environ.get('MEDIA_FOLDER', str(BASE_DIR.parent / 'media'))
    UPLOAD_FOLDER = os.path.join(MEDIA_FOLDER, 'uploads')
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100 MB max file upload
    
    # Allowed extensions
    ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'webm', 'mov', 'm4v'}
    ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'gif'}
    
    # Session cookie security
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production'

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
