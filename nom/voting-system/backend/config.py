import os
from datetime import timedelta

class Config:
    # Secret Key for Sessions
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production-2024'
    
    # XAMPP MySQL Configuration
    MYSQL_HOST = 'localhost'
    MYSQL_USER = 'root'
    MYSQL_PASSWORD = ''  # Default XAMPP has no password
    MYSQL_DB = 'voting_system'
    MYSQL_CURSORCLASS = 'DictCursor'
    
    # Session Configuration
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # CORS Configuration
    CORS_ORIGINS = ['http://localhost:3000']
    CORS_SUPPORTS_CREDENTIALS = True
    
    # Application Configuration
    JSON_SORT_KEYS = False