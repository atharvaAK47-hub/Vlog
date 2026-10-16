from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from backend.extensions import db

# Association tables for Many-to-Many tags
vlog_tags = db.Table(
    'vlog_tags',
    db.Column('vlog_id', db.Integer, db.ForeignKey('vlogs.id', ondelete='CASCADE'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

post_tags = db.Table(
    'post_tags',
    db.Column('post_id', db.Integer, db.ForeignKey('blog_posts.id', ondelete='CASCADE'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    bio = db.Column(db.Text, default='')
    profile_image = db.Column(db.String(255), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    vlogs = db.relationship('Vlog', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    blog_posts = db.relationship('BlogPost', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    likes = db.relationship('Like', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)
        
    def to_dict(self, include_email: bool = False):
        data = {
            'id': self.id,
            'username': self.username,
            'bio': self.bio or '',
            'profile_image': self.profile_image or '',
            'created_at': self.created_at.isoformat()
        }
        if include_email:
            data['email'] = self.email
        return data


class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    slug = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    vlogs = db.relationship('Vlog', backref='category', lazy='dynamic')
    blog_posts = db.relationship('BlogPost', backref='category', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug
        }


class Tag(db.Model):
    __tablename__ = 'tags'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    slug = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug
        }


class Vlog(db.Model):
    __tablename__ = 'vlogs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False, index=True)
    description = db.Column(db.Text, default='')
    video_path = db.Column(db.String(255), nullable=False)
    thumbnail_path = db.Column(db.String(255), default='')
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='SET NULL'), nullable=True, index=True)
    status = db.Column(db.String(20), default='published', nullable=False)  # 'draft' or 'published'
    views_count = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    comments = db.relationship('Comment', backref='vlog', lazy='dynamic', cascade='all, delete-orphan')
    likes = db.relationship('Like', backref='vlog', lazy='dynamic', cascade='all, delete-orphan')
    tags = db.relationship('Tag', secondary=vlog_tags, backref=db.backref('vlogs', lazy='dynamic'))
    
    def to_dict(self, current_user_id: int = None):
        likes_count = self.likes.count()
        comments_count = self.comments.count()
        has_liked = False
        if current_user_id:
            has_liked = self.likes.filter_by(user_id=current_user_id).first() is not None
            
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description or '',
            'video_path': self.video_path,
            'thumbnail_path': self.thumbnail_path or '',
            'status': self.status,
            'views_count': self.views_count,
            'likes_count': likes_count,
            'comments_count': comments_count,
            'has_liked': has_liked,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'author': self.author.to_dict() if self.author else None,
            'category': self.category.to_dict() if self.category else None,
            'tags': [t.to_dict() for t in self.tags]
        }


class BlogPost(db.Model):
    __tablename__ = 'blog_posts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    cover_image = db.Column(db.String(255), default='')
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='SET NULL'), nullable=True, index=True)
    status = db.Column(db.String(20), default='published', nullable=False)  # 'draft' or 'published'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    tags = db.relationship('Tag', secondary=post_tags, backref=db.backref('blog_posts', lazy='dynamic'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'cover_image': self.cover_image or '',
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'author': self.author.to_dict() if self.author else None,
            'category': self.category.to_dict() if self.category else None,
            'tags': [t.to_dict() for t in self.tags]
        }


class Comment(db.Model):
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    vlog_id = db.Column(db.Integer, db.ForeignKey('vlogs.id', ondelete='CASCADE'), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'vlog_id': self.vlog_id,
            'content': self.content,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'author': self.author.to_dict() if self.author else None
        }


class Like(db.Model):
    __tablename__ = 'likes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    vlog_id = db.Column(db.Integer, db.ForeignKey('vlogs.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'vlog_id', name='uq_user_vlog_like'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'vlog_id': self.vlog_id,
            'created_at': self.created_at.isoformat()
        }
