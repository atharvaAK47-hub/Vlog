import os
import mimetypes
from flask import Flask, jsonify, request, send_file, Response
from backend.config import Config
from backend.extensions import db
from backend.models import User, Category, Tag, Vlog, BlogPost

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    
    # Ensure media directories exist
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'videos'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'thumbnails'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'covers'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'avatars'), exist_ok=True)
    
    # Register blueprints
    from backend.routes.auth import auth_bp
    from backend.routes.vlogs import vlogs_bp
    from backend.routes.posts import posts_bp
    from backend.routes.comments import comments_bp
    from backend.routes.likes import likes_bp
    from backend.routes.profiles import profiles_bp
    from backend.routes.search import search_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(vlogs_bp)
    app.register_blueprint(posts_bp)
    app.register_blueprint(comments_bp)
    app.register_blueprint(likes_bp)
    app.register_blueprint(profiles_bp)
    app.register_blueprint(search_bp)
    
    # Media Range Request streaming endpoint for high-performance video playback
    @app.route('/media/uploads/<path:filename>')
    def serve_media(filename):
        safe_path = os.path.normpath(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        if not safe_path.startswith(os.path.abspath(app.config['UPLOAD_FOLDER'])):
            return jsonify({'error': 'Access denied'}), 403
            
        if not os.path.exists(safe_path):
            return jsonify({'error': 'File not found'}), 404
            
        file_size = os.path.getsize(safe_path)
        content_type, _ = mimetypes.guess_type(safe_path)
        content_type = content_type or 'application/octet-stream'
        
        range_header = request.headers.get('Range', None)
        if not range_header or not content_type.startswith('video/'):
            return send_file(safe_path, mimetype=content_type)
            
        # Parse byte range header
        try:
            byte_range = range_header.replace('bytes=', '').split('-')
            start = int(byte_range[0])
            end = int(byte_range[1]) if byte_range[1] else file_size - 1
            if end >= file_size:
                end = file_size - 1
            length = end - start + 1
            
            with open(safe_path, 'rb') as f:
                f.seek(start)
                data = f.read(length)
                
            rv = Response(data, 206, mimetype=content_type, direct_passthrough=True)
            rv.headers.add('Content-Range', f'bytes {start}-{end}/{file_size}')
            rv.headers.add('Accept-Ranges', 'bytes')
            rv.headers.add('Content-Length', str(length))
            return rv
        except Exception:
            return send_file(safe_path, mimetype=content_type)
            
    # Centralized error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad Request', 'message': str(error)}), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized', 'message': 'Authentication required'}), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'error': 'Forbidden', 'message': 'You do not have permission'}), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not Found', 'message': 'Requested resource was not found'}), 404

    @app.errorhandler(500)
    def server_error(error):
        return jsonify({'error': 'Internal Server Error', 'message': 'An unexpected error occurred'}), 500

    return app

def init_db(app):
    with app.app_context():
        db.create_all()
        # Seed categories if empty
        if Category.query.count() == 0:
            default_categories = [
                ('Travel & Exploration', 'travel'),
                ('Cinematography & Film', 'filmmaking'),
                ('Tech & Creative Setup', 'tech'),
                ('Daily Life & Routines', 'daily-life'),
                ('Artisanal Food & Coffee', 'food-cooking'),
                ('Alpine & Adventure', 'adventure'),
                ('Creative Education', 'education')
            ]
            for name, slug in default_categories:
                db.session.add(Category(name=name, slug=slug))
            db.session.commit()

if __name__ == '__main__':
    app = create_app()
    init_db(app)
    app.run(host='0.0.0.0', port=5000, debug=False)
