from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.models import BlogPost, Category, Tag
from backend.routes.auth import login_required

posts_bp = Blueprint('posts', __name__, url_prefix='/api/posts')

@posts_bp.route('', methods=['GET'])
def list_posts():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    category_slug = request.args.get('category')
    
    query = BlogPost.query.filter_by(status='published')
    if category_slug:
        cat = Category.query.filter_by(slug=category_slug).first()
        if cat:
            query = query.filter_by(category_id=cat.id)
            
    query = query.order_by(BlogPost.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'posts': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages
    }), 200

@posts_bp.route('/<int:post_id>', methods=['GET'])
def get_post(post_id):
    post = BlogPost.query.get_or_404(post_id)
    return jsonify({'post': post.to_dict()}), 200

@posts_bp.route('', methods=['POST'])
@login_required
def create_post(current_user):
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    content = data.get('content', '').strip()
    cover_image = data.get('cover_image', '').strip()
    category_id = data.get('category_id')
    status = data.get('status', 'published')
    tags = data.get('tags', [])
    
    if not title:
        return jsonify({'error': 'Title is required'}), 400
    if not content:
        return jsonify({'error': 'Content is required'}), 400
        
    post = BlogPost(
        user_id=current_user.id,
        title=title,
        content=content,
        cover_image=cover_image,
        category_id=category_id,
        status=status if status in ('published', 'draft') else 'published'
    )
    
    for tag_name in tags:
        slug = tag_name.lower().replace(' ', '-')
        tag = Tag.query.filter_by(slug=slug).first()
        if not tag:
            tag = Tag(name=tag_name, slug=slug)
            db.session.add(tag)
        post.tags.append(tag)
        
    db.session.add(post)
    db.session.commit()
    
    return jsonify({'message': 'Blog post created successfully', 'post': post.to_dict()}), 201

@posts_bp.route('/<int:post_id>', methods=['PUT'])
@login_required
def update_post(current_user, post_id):
    post = BlogPost.query.get_or_404(post_id)
    if post.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized: You can only edit your own posts'}), 403
        
    data = request.get_json() or {}
    if 'title' in data:
        t = data['title'].strip()
        if not t:
            return jsonify({'error': 'Title cannot be empty'}), 400
        post.title = t
    if 'content' in data:
        c = data['content'].strip()
        if not c:
            return jsonify({'error': 'Content cannot be empty'}), 400
        post.content = c
    if 'cover_image' in data:
        post.cover_image = data['cover_image'].strip()
    if 'category_id' in data:
        post.category_id = data['category_id']
    if 'status' in data and data['status'] in ('published', 'draft'):
        post.status = data['status']
        
    db.session.commit()
    return jsonify({'message': 'Post updated', 'post': post.to_dict()}), 200

@posts_bp.route('/<int:post_id>', methods=['DELETE'])
@login_required
def delete_post(current_user, post_id):
    post = BlogPost.query.get_or_404(post_id)
    if post.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized: You can only delete your own posts'}), 403
        
    db.session.delete(post)
    db.session.commit()
    return jsonify({'message': 'Post deleted successfully'}), 200
