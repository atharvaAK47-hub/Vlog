import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

def allowed_file(filename: str, allowed_extensions: set) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def save_uploaded_media(file_storage, subfolder: str = 'videos') -> str:
    """
    Validates, generates safe unique filename, and saves media file to storage.
    Returns relative web path (e.g., '/media/uploads/videos/xyz.mp4').
    """
    if not file_storage or not file_storage.filename:
        raise ValueError("No file provided")
        
    orig_filename = secure_filename(file_storage.filename)
    if not orig_filename:
        orig_filename = "unnamed"
        
    ext = orig_filename.rsplit('.', 1)[1].lower() if '.' in orig_filename else ''
    
    if subfolder == 'videos':
        allowed = current_app.config.get('ALLOWED_VIDEO_EXTENSIONS', {'mp4', 'webm', 'mov', 'm4v'})
        if ext not in allowed:
            raise ValueError(f"Invalid video format .{ext}. Allowed: {', '.join(allowed)}")
    elif subfolder in ('thumbnails', 'covers', 'avatars'):
        allowed = current_app.config.get('ALLOWED_IMAGE_EXTENSIONS', {'jpg', 'jpeg', 'png', 'webp', 'gif'})
        if ext not in allowed:
            raise ValueError(f"Invalid image format .{ext}. Allowed: {', '.join(allowed)}")
    else:
        raise ValueError("Invalid upload category")
        
    unique_name = f"{uuid.uuid4().hex}_{orig_filename}"
    target_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], subfolder)
    os.makedirs(target_dir, exist_ok=True)
    
    target_path = os.path.join(target_dir, unique_name)
    file_storage.save(target_path)
    
    return f"/media/uploads/{subfolder}/{unique_name}"
