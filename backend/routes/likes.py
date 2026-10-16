from flask import Blueprint, jsonify
from sqlalchemy.exc import IntegrityError
from backend.extensions import db
from backend.models import Vlog, Like
from backend.routes.auth import login_required

likes_bp = Blueprint('likes', __name__, url_prefix='/api')

@likes_bp.route('/vlogs/<int:vlog_id>/like', methods=['POST'])
@login_required
def like_vlog(current_user, vlog_id):
    vlog = Vlog.query.get_or_404(vlog_id)
    
    # Check if already liked
    existing_like = Like.query.filter_by(user_id=current_user.id, vlog_id=vlog.id).first()
    if existing_like:
        return jsonify({
            'message': 'Already liked',
            'has_liked': True,
            'likes_count': vlog.likes.count()
        }), 200
        
    try:
        new_like = Like(user_id=current_user.id, vlog_id=vlog.id)
        db.session.add(new_like)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        
    return jsonify({
        'message': 'Vlog liked',
        'has_liked': True,
        'likes_count': vlog.likes.count()
    }), 201

@likes_bp.route('/vlogs/<int:vlog_id>/like', methods=['DELETE'])
@login_required
def unlike_vlog(current_user, vlog_id):
    vlog = Vlog.query.get_or_404(vlog_id)
    like = Like.query.filter_by(user_id=current_user.id, vlog_id=vlog.id).first()
    
    if not like:
        return jsonify({
            'message': 'Like not found',
            'has_liked': False,
            'likes_count': vlog.likes.count()
        }), 200
        
    db.session.delete(like)
    db.session.commit()
    
    return jsonify({
        'message': 'Like removed',
        'has_liked': False,
        'likes_count': vlog.likes.count()
    }), 200

@likes_bp.route('/users/me/likes', methods=['GET'])
@login_required
def get_user_likes(current_user):
    likes = Like.query.filter_by(user_id=current_user.id).order_by(Like.created_at.desc()).all()
    liked_vlogs = [l.vlog.to_dict(current_user_id=current_user.id) for l in likes if l.vlog and l.vlog.status == 'published']
    return jsonify({'vlogs': liked_vlogs}), 200
