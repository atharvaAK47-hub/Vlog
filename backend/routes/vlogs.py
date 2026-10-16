import os
from flask import Blueprint, request, jsonify, session
from sqlalchemy import desc
from backend.extensions import db
from backend.models import Vlog, User, Category, Tag, Like
from backend.routes.auth import login_required
from backend.services.upload_service import save_uploaded_media

vlogs_bp = Blueprint('vlogs', __name__, url_prefix='/api/vlogs')

@vlogs_bp.route('', methods=['GET'])
def list_vlogs():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    category_slug = request.args.get('category')
    tag_slug = request.args.get('tag')
    sort_by = request.args.get('sort', 'latest')  # 'latest', 'popular', 'views'
    search_query = request.args.get('q', '').strip()
    status_filter = request.args.get('status', 'published')
    
    current_user_id = session.get('user_id')
    
    query = Vlog.query
    if status_filter != 'all':
        query = query.filter_by(status='published')
        
    if category_slug:
        cat = Category.query.filter_by(slug=category_slug).first()
        if cat:
            query = query.filter_by(category_id=cat.id)
            
    if tag_slug:
        query = query.filter(Vlog.tags.any(slug=tag_slug))
        
    if search_query:
        search_filter = f"%{search_query}%"
        query = query.join(User).filter(
            (Vlog.title.ilike(search_filter)) |
            (Vlog.description.ilike(search_filter)) |
            (User.username.ilike(search_filter))
        )
        
    if sort_by == 'views':
        query = query.order_by(Vlog.views_count.desc())
    elif sort_by == 'popular':
        # Sort by like count subquery
        query = query.outerjoin(Like).group_by(Vlog.id).order_by(desc(db.func.count(Like.id)))
    else:
        query = query.order_by(Vlog.created_at.desc())
        
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'vlogs': [v.to_dict(current_user_id=current_user_id) for v in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev
    }), 200

@vlogs_bp.route('/<int:vlog_id>', methods=['GET'])
def get_vlog(vlog_id):
    vlog = Vlog.query.get_or_404(vlog_id)
    # Increment views
    vlog.views_count = (vlog.views_count or 0) + 1
    db.session.commit()
    
    current_user_id = session.get('user_id')
    return jsonify({'vlog': vlog.to_dict(current_user_id=current_user_id)}), 200

@vlogs_bp.route('', methods=['POST'])
@login_required
def create_vlog(current_user):
    title = ""
    description = ""
    category_id = None
    status = "published"
    video_path = ""
    thumbnail_path = ""
    tag_names = []
    
    if request.is_json:
        data = request.get_json() or {}
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        category_id = data.get('category_id')
        status = data.get('status', 'published')
        video_path = data.get('video_path', '').strip()
        thumbnail_path = data.get('thumbnail_path', '').strip()
        tag_names = data.get('tags', [])
    else:
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        category_id = request.form.get('category_id', type=int)
        status = request.form.get('status', 'published')
        video_path = request.form.get('video_path', '').strip()
        thumbnail_path = request.form.get('thumbnail_path', '').strip()
        
        # Handle file upload if present
        if 'video' in request.files:
            try:
                video_path = save_uploaded_media(request.files['video'], 'videos')
            except ValueError as e:
                return jsonify({'error': str(e)}), 400
                
        if 'thumbnail' in request.files:
            try:
                thumbnail_path = save_uploaded_media(request.files['thumbnail'], 'thumbnails')
            except ValueError as e:
                return jsonify({'error': str(e)}), 400
                
        raw_tags = request.form.get('tags', '')
        if raw_tags:
            tag_names = [t.strip() for t in raw_tags.split(',') if t.strip()]

    if not title:
        return jsonify({'error': 'Title is required'}), 400
    if not video_path:
        return jsonify({'error': 'Video file or video path is required'}), 400
        
    vlog = Vlog(
        user_id=current_user.id,
        title=title,
        description=description,
        video_path=video_path,
        thumbnail_path=thumbnail_path,
        category_id=category_id,
        status=status if status in ('published', 'draft') else 'published'
    )
    
    # Process tags
    for tag_name in tag_names:
        slug = tag_name.lower().replace(' ', '-')
        tag = Tag.query.filter_by(slug=slug).first()
        if not tag:
            tag = Tag(name=tag_name, slug=slug)
            db.session.add(tag)
        vlog.tags.append(tag)
        
    db.session.add(vlog)
    db.session.commit()
    
    return jsonify({
        'message': 'Vlog created successfully',
        'vlog': vlog.to_dict(current_user_id=current_user.id)
    }), 201

@vlogs_bp.route('/<int:vlog_id>', methods=['PUT'])
@login_required
def update_vlog(current_user, vlog_id):
    vlog = Vlog.query.get_or_404(vlog_id)
    if vlog.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized: You can only edit your own vlogs'}), 403
        
    data = request.get_json() or {}
    if 'title' in data:
        new_title = data.get('title', '').strip()
        if not new_title:
            return jsonify({'error': 'Title cannot be empty'}), 400
        vlog.title = new_title
        
    if 'description' in data:
        vlog.description = data.get('description', '').strip()
    if 'category_id' in data:
        vlog.category_id = data.get('category_id')
    if 'status' in data and data['status'] in ('published', 'draft'):
        vlog.status = data['status']
    if 'thumbnail_path' in data:
        vlog.thumbnail_path = data.get('thumbnail_path')
        
    db.session.commit()
    return jsonify({
        'message': 'Vlog updated successfully',
        'vlog': vlog.to_dict(current_user_id=current_user.id)
    }), 200

@vlogs_bp.route('/<int:vlog_id>', methods=['DELETE'])
@login_required
def delete_vlog(current_user, vlog_id):
    vlog = Vlog.query.get_or_404(vlog_id)
    if vlog.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized: You can only delete your own vlogs'}), 403
        
    db.session.delete(vlog)
    db.session.commit()
    return jsonify({'message': 'Vlog deleted successfully'}), 200
