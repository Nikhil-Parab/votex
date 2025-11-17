from flask import Blueprint, jsonify, request, session
from flask_mysqldb import MySQL
from utils.helpers import login_required, role_required, log_action

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
    image_url = data.get('image_url', '📢')
    
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
        
        # Create campaign
        cur.execute(
            "INSERT INTO campaigns (party_id, title, description, image_url) VALUES (%s, %s, %s, %s)",
            (party['id'], title, description, image_url)
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