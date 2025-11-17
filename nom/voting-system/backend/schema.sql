CREATE DATABASE voting_system;
USE voting_system;

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('voter', 'party', 'admin') NOT NULL DEFAULT 'voter',
    has_voted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Parties Table
CREATE TABLE parties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(255) DEFAULT '🎯',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Campaigns Table
CREATE TABLE campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    party_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    image_url VARCHAR(255) DEFAULT '📢',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,
    INDEX idx_party_id (party_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Votes Table
CREATE TABLE votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voter_id INT NOT NULL,
    party_id INT NOT NULL,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (voter_id),
    INDEX idx_party_id (party_id),
    INDEX idx_voted_at (voted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Logs Table
CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    user_id INT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Admin User (Password: admin123)
INSERT INTO users (name, email, password_hash, role) VALUES 
('System Admin', 'admin@voting.com', 'scrypt:32768:8:1$vJ8xQZ5PqKXYzFHc$dc8e3b3f5c6e1f0a7d8f2e9c3b4a6d5e7f1c2b8a9e0d3c5f4b7a8e1d2c6f9b0a3e5c7d1f4b8a2e6c9d0f3b5a8e1c4d7', 'admin');

-- Insert Test Voter (Password: voter123)
INSERT INTO users (name, email, password_hash, role) VALUES 
('John Voter', 'voter@test.com', 'scrypt:32768:8:1$aB2cD3eF4gH5iJ6k$1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f', 'voter');

-- Insert Test Party (Password: party123)
INSERT INTO users (name, email, password_hash, role) VALUES 
('Demo Party', 'party@test.com', 'scrypt:32768:8:1$xY9zW8vU7tS6rQ5p$9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0g9f8e7d6c5b4a3z2y1x0w9v8u7t6s5r4q3p2o1n0m9l8k7j6i5h', 'party');

-- Insert Sample Parties
INSERT INTO parties (name, description, logo_url, created_by) VALUES 
('Progressive Alliance', 'Working for progressive change and social justice', '🟦', 3),
('Unity Party', 'Together we build a stronger nation', '🟩', 3);

-- Insert Sample Campaigns
INSERT INTO campaigns (party_id, title, description, image_url) VALUES 
(1, 'Universal Healthcare', 'Affordable healthcare for every citizen', '🏥'),
(1, 'Green Energy Initiative', 'Sustainable energy for a better tomorrow', '🌱'),
(2, 'Education Reform', 'Quality education accessible to all', '🎓'),
(2, 'Infrastructure Development', 'Modern infrastructure for economic growth', '🏗️');

-- Insert Initial Log
INSERT INTO logs (action, user_id, details) VALUES 
('System initialized', 1, 'Database created with default admin user');