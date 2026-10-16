from flask import Blueprint, request, jsonify, session
from backend.models import Vlog, BlogPost, User, Category, Tag

search_bp = Blueprint('search', __name__, url_prefix='/api')

@search_bp.route('/search', methods=['GET'])
def search_all():
    query_text = request.args.get('q', '').strip()
    if not query_text:
        return jsonify({
            'query': '',
            'vlogs': [],
            'posts': [],
            'creators': []
        }), 200
        
    search_filter = f"%{query_text}%"
    current_user_id = session.get('user_id')
    
    # Search vlogs by title, description, or creator username
    vlogs = Vlog.query.join(User).filter(
        Vlog.status == 'published',
        (Vlog.title.ilike(search_filter)) |
        (Vlog.description.ilike(search_filter)) |
        (User.username.ilike(search_filter))
    ).order_by(Vlog.created_at.desc()).limit(20).all()
    
    # Search blog posts
    posts = BlogPost.query.filter(
        BlogPost.status == 'published',
        (BlogPost.title.ilike(search_filter)) |
        (BlogPost.content.ilike(search_filter))
    ).order_by(BlogPost.created_at.desc()).limit(10).all()
    
    # Search creators
    creators = User.query.filter(
        (User.username.ilike(search_filter)) |
        (User.bio.ilike(search_filter))
    ).limit(8).all()
    
    return jsonify({
        'query': query_text,
        'vlogs': [v.to_dict(current_user_id=current_user_id) for v in vlogs],
        'posts': [p.to_dict() for p in posts],
        'creators': [c.to_dict() for c in creators]
    }), 200

@search_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.order_by(Category.name.asc()).all()
    return jsonify({
        'categories': [c.to_dict() for c in categories]
    }), 200
