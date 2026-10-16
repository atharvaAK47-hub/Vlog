import html
from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.models import Comment, Vlog
from backend.routes.auth import login_required

comments_bp = Blueprint('comments', __name__, url_prefix='/api')

@comments_bp.route('/vlogs/<int:vlog_id>/comments', methods=['GET'])
def get_vlog_comments(vlog_id):
    Vlog.query.get_or_404(vlog_id)
    comments = Comment.query.filter_by(vlog_id=vlog_id).order_by(Comment.created_at.desc()).all()
    return jsonify({
        'comments': [c.to_dict() for c in comments],
        'total': len(comments)
    }), 200

@comments_bp.route('/vlogs/<int:vlog_id>/comments', methods=['POST'])
@login_required
def add_comment(current_user, vlog_id):
    Vlog.query.get_or_404(vlog_id)
    data = request.get_json() or {}
    raw_content = data.get('content', '').strip()
    
    if not raw_content:
        return jsonify({'error': 'Comment content cannot be empty'}), 400
    if len(raw_content) > 1000:
        return jsonify({'error': 'Comment is too long (maximum 1,000 characters)'}), 400
        
    sanitized_content = html.escape(raw_content)
    
    comment = Comment(
        user_id=current_user.id,
        vlog_id=vlog_id,
        content=sanitized_content
    )
    db.session.add(comment)
    db.session.commit()
    
    return jsonify({
        'message': 'Comment posted successfully',
        'comment': comment.to_dict()
    }), 201

@comments_bp.route('/comments/<int:comment_id>', methods=['PUT'])
@login_required
def edit_comment(current_user, comment_id):
    comment = Comment.query.get_or_404(comment_id)
    if comment.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized: You can only edit your own comments'}), 403
        
    data = request.get_json() or {}
    raw_content = data.get('content', '').strip()
    if not raw_content:
        return jsonify({'error': 'Comment cannot be empty'}), 400
        
    comment.content = html.escape(raw_content)
    db.session.commit()
    
    return jsonify({
        'message': 'Comment updated',
        'comment': comment.to_dict()
    }), 200

@comments_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(current_user, comment_id):
    comment = Comment.query.get_or_404(comment_id)
    if comment.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized: You can only delete your own comments'}), 403
        
    db.session.delete(comment)
    db.session.commit()
    
    return jsonify({'message': 'Comment deleted successfully'}), 200
