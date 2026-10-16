from flask import Blueprint, request, jsonify, session
from backend.extensions import db
from backend.models import User, Vlog, BlogPost, Like
from backend.routes.auth import login_required

profiles_bp = Blueprint('profiles', __name__, url_prefix='/api')

@profiles_bp.route('/users/<string:username>', methods=['GET'])
def get_profile(username):
    user = User.query.filter_by(username=username).first_or_404()
    
    # Calculate total likes received across all user's published vlogs
    vlogs = Vlog.query.filter_by(user_id=user.id, status='published').order_by(Vlog.created_at.desc()).all()
    posts = BlogPost.query.filter_by(user_id=user.id, status='published').order_by(BlogPost.created_at.desc()).all()
    
    total_likes = 0
    total_views = 0
    current_user_id = session.get('user_id')
    
    for v in vlogs:
        total_likes += v.likes.count()
        total_views += (v.views_count or 0)
        
    return jsonify({
        'user': user.to_dict(),
        'stats': {
            'vlogs_count': len(vlogs),
            'posts_count': len(posts),
            'total_likes': total_likes,
            'total_views': total_views
        },
        'vlogs': [v.to_dict(current_user_id=current_user_id) for v in vlogs],
        'posts': [p.to_dict() for p in posts]
    }), 200

@profiles_bp.route('/users/me', methods=['PUT'])
@login_required
def update_profile(current_user):
    data = request.get_json() or {}
    if 'bio' in data:
        current_user.bio = data['bio'].strip()
    if 'profile_image' in data:
        current_user.profile_image = data['profile_image'].strip()
        
    db.session.commit()
    return jsonify({
        'message': 'Profile updated successfully',
        'user': current_user.to_dict(include_email=True)
    }), 200

@profiles_bp.route('/users/me/dashboard', methods=['GET'])
@login_required
def get_dashboard(current_user):
    all_vlogs = Vlog.query.filter_by(user_id=current_user.id).order_by(Vlog.created_at.desc()).all()
    all_posts = BlogPost.query.filter_by(user_id=current_user.id).order_by(BlogPost.created_at.desc()).all()
    
    total_views = sum(v.views_count or 0 for v in all_vlogs)
    total_likes = sum(v.likes.count() for v in all_vlogs)
    total_comments = sum(v.comments.count() for v in all_vlogs)
    
    return jsonify({
        'stats': {
            'vlogs_count': len(all_vlogs),
            'published_count': sum(1 for v in all_vlogs if v.status == 'published'),
            'drafts_count': sum(1 for v in all_vlogs if v.status == 'draft'),
            'posts_count': len(all_posts),
            'total_views': total_views,
            'total_likes': total_likes,
            'total_comments': total_comments
        },
        'vlogs': [v.to_dict(current_user_id=current_user.id) for v in all_vlogs],
        'posts': [p.to_dict() for p in all_posts]
    }), 200
