from flask import Blueprint, jsonify, request, session
from flask_mysqldb import MySQL
from utils.helpers import login_required, role_required, log_action
from utils.file_handler import save_campaign_image, save_base64_image, delete_campaign_image

party_bp = Blueprint('party', __name__)
mysql = MySQL()

@party_bp.route('/profile', methods=['GET'])
@role_required('party')
def get_profile():
    user_id = session['user_id']
    
    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            SELECT p.id, p.name, p.description, p.logo_url, p.created_at,
                   COUNT(v.id) as vote_count
            FROM parties p
            LEFT JOIN votes v ON p.id = v.party_id
            WHERE p.created_by = %s
            GROUP BY p.id
        """, (user_id,))
        party = cur.fetchone()
        
        # Convert local file path to full URL for logo
        if party and party['logo_url'] and not party['logo_url'].startswith('http') and '/' in party['logo_url']:
            party['logo_url'] = f"http://localhost:5000/uploads/{party['logo_url']}"
        
        cur.close()
        
        return jsonify({'party': party}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@party_bp.route('/create', methods=['POST'])
@role_required('party')
def create_party():
    data = request.get_json()
    
    name = data.get('name')
    description = data.get('description', '')
    logo_url = data.get('logo_url', '🎯')
    
    if not name:
        return jsonify({'error': 'Party name required'}), 400
    
    user_id = session['user_id']
    
    try:
        cur = mysql.connection.cursor()
        
        # Check if user already has a party
        cur.execute("SELECT id FROM parties WHERE created_by = %s", (user_id,))
        if cur.fetchone():
            cur.close()
            return jsonify({'error': 'You already have a party'}), 400
        
        # Check if party name exists
        cur.execute("SELECT id FROM parties WHERE name = %s", (name,))
        if cur.fetchone():
            cur.close()
            return jsonify({'error': 'Party name already exists'}), 400
        
        # Create party
        cur.execute(
            "INSERT INTO parties (name, description, logo_url, created_by) VALUES (%s, %s, %s, %s)",
            (name, description, logo_url, user_id)
        )
        mysql.connection.commit()
        party_id = cur.lastrowid
        cur.close()
        
        log_action(f'Party created: {name}', user_id)
        
        return jsonify({
            'success': True,
            'party_id': party_id,
            'message': 'Party created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Party creation failed: {str(e)}'}), 500

@party_bp.route('/update', methods=['PUT'])
@role_required('party')
def update_party():
    data = request.get_json()
    
    description = data.get('description')
    logo_url = data.get('logo_url')
    
    user_id = session['user_id']
    
    try:
        cur = mysql.connection.cursor()
        
        # Get party
        cur.execute("SELECT id FROM parties WHERE created_by = %s", (user_id,))
        party = cur.fetchone()
        
        if not party:
            cur.close()
            return jsonify({'error': 'Party not found'}), 404
        
        # Update party
        updates = []
        params = []
        
        if description is not None:
            updates.append("description = %s")
            params.append(description)
        
        if logo_url is not None:
            updates.append("logo_url = %s")
            params.append(logo_url)
        
        if updates:
            params.append(party['id'])
            query = f"UPDATE parties SET {', '.join(updates)} WHERE id = %s"
            cur.execute(query, tuple(params))
            mysql.connection.commit()
        
        cur.close()
        
        log_action('Party profile updated', user_id)
        
        return jsonify({
            'success': True,
            'message': 'Party updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Update failed: {str(e)}'}), 500

@party_bp.route('/campaign', methods=['POST'])
@role_required('party')
def create_campaign():
    data = request.get_json()
    
    title = data.get('title')
    description = data.get('description', '')
    image_url = data.get('image_url', '')
    
    if not title:
        return jsonify({'error': 'Campaign title required'}), 400
    
    user_id = session['user_id']
    
    try:
        cur = mysql.connection.cursor()
        
        # Get party
        cur.execute("SELECT id FROM parties WHERE created_by = %s", (user_id,))
        party = cur.fetchone()
        
        if not party:
            cur.close()
            return jsonify({'error': 'Create a party first'}), 404
        
        # Handle image upload
        saved_image_path = None
        
        # Check if it's a base64 image
        if image_url and image_url.startswith('data:image'):
            try:
                saved_image_path = save_base64_image(image_url, f"campaign_{party['id']}")
            except ValueError as e:
                cur.close()
                return jsonify({'error': str(e)}), 400
        elif image_url and (image_url.startswith('http://') or image_url.startswith('https://')):
            # If it's a URL, store it directly
            saved_image_path = image_url
        else:
            # Use placeholder
            saved_image_path = 'https://via.placeholder.com/300x200?text=Campaign'
        
        # Create campaign
        cur.execute(
            "INSERT INTO campaigns (party_id, title, description, image_url) VALUES (%s, %s, %s, %s)",
            (party['id'], title, description, saved_image_path)
        )
        mysql.connection.commit()
        campaign_id = cur.lastrowid
        cur.close()
        
        log_action(f'Campaign created: {title}', user_id)
        
        return jsonify({
            'success': True,
            'campaign_id': campaign_id,
            'message': 'Campaign created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Campaign creation failed: {str(e)}'}), 500

@party_bp.route('/campaign/upload', methods=['POST'])
@role_required('party')
def upload_campaign_image():
    """Handle file upload for campaign images"""
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    user_id = session['user_id']
    
    try:
        # Get party to verify ownership
        cur = mysql.connection.cursor()
        cur.execute("SELECT id FROM parties WHERE created_by = %s", (user_id,))
        party = cur.fetchone()
        cur.close()
        
        if not party:
            return jsonify({'error': 'Create a party first'}), 404
        
        # Save image
        image_path = save_campaign_image(file)
        
        if not image_path:
            return jsonify({'error': 'Failed to save image'}), 500
        
        # Return the URL path for frontend to use
        image_url = f"http://localhost:5000/uploads/{image_path}"
        
        return jsonify({
            'success': True,
            'image_url': image_url,
            'image_path': image_path
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@party_bp.route('/logo/upload', methods=['POST'])
@role_required('party')
def upload_party_logo():
    """Handle file upload for party logos"""
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    user_id = session['user_id']
    
    try:
        # Get party to verify ownership
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, logo_url FROM parties WHERE created_by = %s", (user_id,))
        party = cur.fetchone()
        
        if not party:
            cur.close()
            return jsonify({'error': 'Party not found'}), 404
        
        # Delete old logo if it exists and is a file path
        old_logo = party['logo_url']
        if old_logo and not old_logo.startswith('http') and '/' in old_logo and len(old_logo) > 5:
            delete_campaign_image(old_logo)
        
        # Save new image
        image_path = save_campaign_image(file)
        
        if not image_path:
            return jsonify({'error': 'Failed to save image'}), 500
        
        # Update party logo in database
        cur = mysql.connection.cursor()
        cur.execute("UPDATE parties SET logo_url = %s WHERE id = %s", (image_path, party['id']))
        mysql.connection.commit()
        cur.close()
        
        # Return the URL path for frontend to use
        image_url = f"http://localhost:5000/uploads/{image_path}"
        
        log_action('Party logo updated', user_id)
        
        return jsonify({
            'success': True,
            'logo_url': image_url,
            'logo_path': image_path
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@party_bp.route('/campaigns', methods=['GET'])
@role_required('party')
def get_campaigns():
    user_id = session['user_id']
    
    try:
        cur = mysql.connection.cursor()
        
        # Get party
        cur.execute("SELECT id FROM parties WHERE created_by = %s", (user_id,))
        party = cur.fetchone()
        
        if not party:
            cur.close()
            return jsonify({'campaigns': []}), 200
        
        # Get campaigns
        cur.execute("""
            SELECT id, title, description, image_url, created_at
            FROM campaigns
            WHERE party_id = %s
            ORDER BY created_at DESC
        """, (party['id'],))
        campaigns = cur.fetchall()
        
        # Convert local file paths to full URLs
        for campaign in campaigns:
            if campaign['image_url'] and not campaign['image_url'].startswith('http'):
                campaign['image_url'] = f"http://localhost:5000/uploads/{campaign['image_url']}"
        
        cur.close()
        
        return jsonify({'campaigns': campaigns}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@party_bp.route('/votes', methods=['GET'])
@role_required('party')
def get_votes():
    user_id = session['user_id']
    
    try:
        cur = mysql.connection.cursor()
        
        # Get party
        cur.execute("SELECT id FROM parties WHERE created_by = %s", (user_id,))
        party = cur.fetchone()
        
        if not party:
            cur.close()
            return jsonify({'voteCount': 0}), 200
        
        # Get vote count
        cur.execute("SELECT COUNT(*) as count FROM votes WHERE party_id = %s", (party['id'],))
        result = cur.fetchone()
        cur.close()
        
        return jsonify({'voteCount': result['count']}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500