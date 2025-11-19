from flask import Blueprint, jsonify, request, session
from flask_mysqldb import MySQL
from utils.helpers import login_required, role_required, log_action

voter_bp = Blueprint('voter', __name__)
mysql = MySQL()

@voter_bp.route('/parties', methods=['GET'])
@login_required
def get_parties():
    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            SELECT p.id, p.name, p.description, p.logo_url, 
                   COUNT(v.id) as vote_count
            FROM parties p
            LEFT JOIN votes v ON p.id = v.party_id
            GROUP BY p.id
            ORDER BY p.name
        """)
        parties = cur.fetchall()
        
        # Convert local file paths to full URLs for logos
        for party in parties:
            if party['logo_url'] and not party['logo_url'].startswith('http') and '/' in party['logo_url']:
                party['logo_url'] = f"http://localhost:5000/uploads/{party['logo_url']}"
        
        cur.close()
        
        return jsonify({'parties': parties}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@voter_bp.route('/campaigns', methods=['GET'])
@login_required
def get_campaigns():
    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            SELECT c.id, c.party_id, c.title, c.description, c.image_url, c.created_at,
                   p.name as party_name
            FROM campaigns c
            JOIN parties p ON c.party_id = p.id
            ORDER BY c.created_at DESC
        """)
        campaigns = cur.fetchall()
        
        # Convert local file paths to full URLs
        for campaign in campaigns:
            if campaign['image_url'] and not campaign['image_url'].startswith('http'):
                campaign['image_url'] = f"http://localhost:5000/uploads/{campaign['image_url']}"
        
        cur.close()
        
        return jsonify({'campaigns': campaigns}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@voter_bp.route('/vote', methods=['POST'])
@role_required('voter')
def cast_vote():
    data = request.get_json()
    party_id = data.get('party_id')
    
    if not party_id:
        return jsonify({'error': 'Party ID required'}), 400
    
    user_id = session['user_id']
    
    try:
        cur = mysql.connection.cursor()
        
        # Check if already voted
        cur.execute("SELECT has_voted FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        
        if user['has_voted']:
            cur.close()
            return jsonify({'error': 'You have already voted'}), 400
        
        # Check if party exists
        cur.execute("SELECT id FROM parties WHERE id = %s", (party_id,))
        if not cur.fetchone():
            cur.close()
            return jsonify({'error': 'Party not found'}), 404
        
        # Cast vote
        cur.execute(
            "INSERT INTO votes (voter_id, party_id) VALUES (%s, %s)",
            (user_id, party_id)
        )
        
        # Update user voted status
        cur.execute("UPDATE users SET has_voted = TRUE WHERE id = %s", (user_id,))
        
        mysql.connection.commit()
        cur.close()
        
        # Update session
        session['has_voted'] = True
        
        log_action(f'Vote cast for party ID: {party_id}', user_id)
        
        return jsonify({
            'success': True,
            'message': 'Vote cast successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Vote failed: {str(e)}'}), 500

@voter_bp.route('/status', methods=['GET'])
@role_required('voter')
def get_status():
    user_id = session['user_id']
    
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT has_voted FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        
        voted_party = None
        if user['has_voted']:
            cur.execute("""
                SELECT p.id, p.name, v.voted_at
                FROM votes v
                JOIN parties p ON v.party_id = p.id
                WHERE v.voter_id = %s
            """, (user_id,))
            voted_party = cur.fetchone()
        
        cur.close()
        
        return jsonify({
            'hasVoted': user['has_voted'],
            'votedParty': voted_party
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500