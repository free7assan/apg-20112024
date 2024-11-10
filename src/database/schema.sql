-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Playbooks table
CREATE TABLE IF NOT EXISTS playbooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  complexity TEXT NOT NULL CHECK (complexity IN ('basic', 'intermediate', 'advanced')),
  structure TEXT NOT NULL CHECK (structure IN ('single', 'multi')),
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Insert default admin and user
INSERT OR IGNORE INTO users (email, password_hash, role) VALUES 
  ('free7assan@gmail.com', '$2b$10$YourHashedAdminPassword123', 'admin'),
  ('user@gmail.com', '$2b$10$YourHashedUserPassword123', 'user');