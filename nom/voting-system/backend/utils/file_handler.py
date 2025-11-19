import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def save_campaign_image(file):
    """Save campaign image and return the file path"""
    if not file or file.filename == '':
        return None
    
    if not allowed_file(file.filename):
        raise ValueError('Invalid file type. Allowed: png, jpg, jpeg, gif, webp')
    
    # Create uploads directory if it doesn't exist
    upload_folder = current_app.config['CAMPAIGN_UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    
    # Generate unique filename
    file_ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
    
    # Save file
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)
    
    # Return relative path for database storage
    return f"campaigns/{unique_filename}"

def delete_campaign_image(image_path):
    """Delete campaign image from filesystem"""
    if not image_path:
        return
    
    try:
        full_path = os.path.join(current_app.config['UPLOAD_FOLDER'], image_path)
        if os.path.exists(full_path):
            os.remove(full_path)
    except Exception as e:
        print(f"Error deleting file: {e}")

def save_base64_image(base64_data, filename_prefix="campaign"):
    """Save base64 encoded image and return the file path"""
    import base64
    import re
    
    if not base64_data or not base64_data.startswith('data:image'):
        return None
    
    # Extract image format and data
    match = re.match(r'data:image/(\w+);base64,(.+)', base64_data)
    if not match:
        raise ValueError('Invalid base64 image format')
    
    file_ext = match.group(1).lower()
    image_data = match.group(2)
    
    if file_ext not in current_app.config['ALLOWED_EXTENSIONS']:
        raise ValueError(f'Invalid image type: {file_ext}')
    
    # Create uploads directory if it doesn't exist
    upload_folder = current_app.config['CAMPAIGN_UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    
    # Generate unique filename
    unique_filename = f"{filename_prefix}_{uuid.uuid4().hex}.{file_ext}"
    file_path = os.path.join(upload_folder, unique_filename)
    
    # Decode and save
    with open(file_path, 'wb') as f:
        f.write(base64.b64decode(image_data))
    
    # Return relative path for database storage
    return f"campaigns/{unique_filename}"