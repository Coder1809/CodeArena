CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    cf_handle VARCHAR(255),
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    draws INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(6) UNIQUE NOT NULL,
    player1 UUID REFERENCES users(id) ON DELETE SET NULL,
    player2 UUID REFERENCES users(id) ON DELETE SET NULL,
    problem_id VARCHAR(255),
    winner UUID REFERENCES users(id) ON DELETE SET NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'WAITING'
);

-- Indexes for frequently queried columns
CREATE INDEX idx_matches_room_code ON matches(room_code);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_users_email ON users(email);
