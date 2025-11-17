from flask import Flask
from flask_cors import CORS
from flask_mysqldb import MySQL
from config import Config

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Initialize CORS
CORS(app, 
     origins=Config.CORS_ORIGINS,
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Initialize MySQL
mysql = MySQL(app)

# Import and initialize helpers
from utils import helpers
helpers.mysql = mysql

# Register Blueprints
from blueprints.auth import auth_bp
from blueprints.voter import voter_bp
from blueprints.party import party_bp
from blueprints.admin import admin_bp

auth_bp.mysql = mysql
voter_bp.mysql = mysql
party_bp.mysql = mysql
admin_bp.mysql = mysql

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(voter_bp, url_prefix='/api/voter')
app.register_blueprint(party_bp, url_prefix='/api/party')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

@app.route('/')
def index():
    return {
        'message': 'Online Voting System API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'auth': '/api/auth',
            'voter': '/api/voter',
            'party': '/api/party',
            'admin': '/api/admin'
        }
    }

@app.route('/health')
def health():
    return {'status': 'healthy'}, 200

if __name__ == '__main__':
    print("=" * 70)
    print("ONLINE VOTING SYSTEM - Backend Server")
    print("=" * 70)
    print("Server running on: http://localhost:5000")
    print("Database: XAMPP MySQL (voting_system)")
    print("=" * 70)
    app.run(debug=True, host='0.0.0.0', port=5000)