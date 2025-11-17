from flask import Blueprint, jsonify, request, session, make_response
from flask_mysqldb import MySQL
from utils.helpers import login_required, role_required, log_action
import csv
from io import StringIO

admin_bp = Blueprint('admin', __name__)
mysql = MySQL()

@admin_bp.route('/stats', methods=['GET'])
@role_required('admin')
def get_stats():
    try:
        cur = mysql.connection.cursor()
        
        cur.execute("SELECT COUNT(*) as count FROM users WHERE role = 'voter'")
        total_voters = cur.fetchone()['count']
        
        cur.execute("SELECT COUNT(*) as count FROM parties")
        total_parties = cur.fetchone()['count']
        
        cur.execute("SELECT COUNT(*) as count FROM votes")
        total_votes = cur.fetchone()['count']
        
        cur.execute("SELECT COUNT(*) as count FROM users")
        total_users = cur.fetchone()['count']
        
        cur.close()
        
        return jsonify({
            'totalVoters': total_voters,
            'totalParties': total_parties,
            'totalVotes': total_votes,
            'totalUsers': total_users
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users', methods=['GET'])
@role_required('admin')
def get_users():
    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            SELECT id, name, email, role, has_voted, created_at
            FROM users
            ORDER BY created_at DESC
        """)
        users = cur.fetchall()
        cur.close()
        
        return jsonify({'users': users}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/user/<int:user_id>', methods=['DELETE'])
@role_required('admin')
def delete_user(user_id):
    admin_id = session['user_id']
    
    if user_id == admin_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    try:
        cur = mysql.connection.cursor()
        
        cur.execute("SELECT name, email FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        
        if not user:
            cur.close()
            return jsonify({'error': 'User not found'}), 404
        
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
        mysql.connection.commit()
        cur.close()
        
        log_action(f'User deleted: {user["name"]} ({user["email"]})', admin_id)
        
        return jsonify({
            'success': True,
            'message': 'User deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Deletion failed: {str(e)}'}), 500

@admin_bp.route('/parties', methods=['GET'])
@role_required('admin')
def get_parties():
    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            SELECT p.id, p.name, p.description, p.logo_url, p.created_at,
                   u.name as creator_name, u.email as creator_email,
                   COUNT(v.id) as vote_count
            FROM parties p
            JOIN users u ON p.created_by = u.id
            LEFT JOIN votes v ON p.id = v.party_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        """)
        parties = cur.fetchall()
        cur.close()
        
        return jsonify({'parties': parties}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/party/<int:party_id>', methods=['DELETE'])
@role_required('admin')
def delete_party(party_id):
    admin_id = session['user_id']
    
    try:
        cur = mysql.connection.cursor()
        
        cur.execute("SELECT name FROM parties WHERE id = %s", (party_id,))
        party = cur.fetchone()
        
        if not party:
            cur.close()
            return jsonify({'error': 'Party not found'}), 404
        
        cur.execute("DELETE FROM parties WHERE id = %s", (party_id,))
        mysql.connection.commit()
        cur.close()
        
        log_action(f'Party deleted: {party["name"]}', admin_id)
        
        return jsonify({
            'success': True,
            'message': 'Party deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Deletion failed: {str(e)}'}), 500

@admin_bp.route('/logs', methods=['GET'])
@role_required('admin')
def get_logs():
    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            SELECT l.id, l.action, l.details, l.created_at,
                   u.name as user_name, u.email as user_email
            FROM logs l
            LEFT JOIN users u ON l.user_id = u.id
            ORDER BY l.created_at DESC
            LIMIT 100
        """)
        logs = cur.fetchall()
        cur.close()
        
        return jsonify({'logs': logs}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/reset', methods=['POST'])
@role_required('admin')
def reset_election():
    admin_id = session['user_id']
    
    try:
        cur = mysql.connection.cursor()
        
        cur.execute("DELETE FROM votes")
        cur.execute("UPDATE users SET has_voted = FALSE")
        
        mysql.connection.commit()
        cur.close()
        
        session['has_voted'] = False
        
        log_action('Election reset - all votes cleared', admin_id)
        
        return jsonify({
            'success': True,
            'message': 'Election reset successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Reset failed: {str(e)}'}), 500

@admin_bp.route('/export/users', methods=['GET'])
@role_required('admin')
def export_users():
    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            SELECT id, name, email, role, has_voted, created_at
            FROM users
            ORDER BY id
        """)
        users = cur.fetchall()
        cur.close()
        
        si = StringIO()
        writer = csv.writer(si)
        writer.writerow(['ID', 'Name', 'Email', 'Role', 'Has Voted', 'Created At'])
        
        for user in users:
            writer.writerow([
                user['id'],
                user['name'],
                user['email'],
                user['role'],
                user['has_voted'],
                user['created_at']
            ])
        
        output = make_response(si.getvalue())
        output.headers["Content-Disposition"] = "attachment; filename=users.csv"
        output.headers["Content-type"] = "text/csv"
        
        log_action('Users data exported', session['user_id'])
        
        return output
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/export/parties', methods=['GET'])
@role_required('admin')
def export_parties():
    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            SELECT p.id, p.name, p.description, p.created_at,
                   u.name as creator_name,
                   COUNT(v.id) as vote_count
            FROM parties p
            JOIN users u ON p.created_by = u.id
            LEFT JOIN votes v ON p.id = v.party_id
            GROUP BY p.id
            ORDER BY p.id
        """)
        parties = cur.fetchall()
        cur.close()
        
        si = StringIO()
        writer = csv.writer(si)
        writer.writerow(['ID', 'Party Name', 'Description', 'Creator', 'Vote Count', 'Created At'])
        
        for party in parties:
            writer.writerow([
                party['id'],
                party['name'],
                party['description'],
                party['creator_name'],
                party['vote_count'],
                party['created_at']
            ])
        
        output = make_response(si.getvalue())
        output.headers["Content-Disposition"] = "attachment; filename=parties.csv"
        output.headers["Content-type"] = "text/csv"
        
        log_action('Parties data exported', session['user_id'])
        
        return output
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/export/votes', methods=['GET'])
@role_required('admin')
def export_votes():
    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            SELECT v.id, v.voter_id, v.party_id, v.voted_at,
                   u.name as voter_name, u.email as voter_email,
                   p.name as party_name
            FROM votes v
            JOIN users u ON v.voter_id = u.id
            JOIN parties p ON v.party_id = p.id
            ORDER BY v.voted_at DESC
        """)
        votes = cur.fetchall()
        cur.close()
        
        si = StringIO()
        writer = csv.writer(si)
        writer.writerow(['ID', 'Voter ID', 'Voter Name', 'Voter Email', 'Party ID', 'Party Name', 'Voted At'])
        
        for vote in votes:
            writer.writerow([
                vote['id'],
                vote['voter_id'],
                vote['voter_name'],
                vote['voter_email'],
                vote['party_id'],
                vote['party_name'],
                vote['voted_at']
            ])
        
        output = make_response(si.getvalue())
        output.headers["Content-Disposition"] = "attachment; filename=votes.csv"
        output.headers["Content-type"] = "text/csv"
        
        log_action('Votes data exported', session['user_id'])
        
        return output
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/export/logs', methods=['GET'])
@role_required('admin')
def export_logs():
    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            SELECT l.id, l.action, l.details, l.created_at,
                   u.name as user_name, u.email as user_email
            FROM logs l
            LEFT JOIN users u ON l.user_id = u.id
            ORDER BY l.created_at DESC
        """)
        logs = cur.fetchall()
        cur.close()
        
        si = StringIO()
        writer = csv.writer(si)
        writer.writerow(['ID', 'Action', 'User Name', 'User Email', 'Details', 'Created At'])
        
        for log in logs:
            writer.writerow([
                log['id'],
                log['action'],
                log['user_name'] or 'N/A',
                log['user_email'] or 'N/A',
                log['details'] or '',
                log['created_at']
            ])
        
        output = make_response(si.getvalue())
        output.headers["Content-Disposition"] = "attachment; filename=logs.csv"
        output.headers["Content-type"] = "text/csv"
        
        log_action('Logs data exported', session['user_id'])
        
        return output
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500