# Code Arena

A real-time competitive programming platform where users compete in 1v1 coding duels using Codeforces problems.

## Live Demo

**Website:** https://your-domain.com

> Replace the above URL with your deployed application (Vercel/Render/Railway/etc.).

---

## Features

### ⚔️ Real-Time 1v1 Duels
- Create or join private duel rooms
- Random Codeforces problem selection
- Custom match duration (1–300 minutes)
- Rating filters (800–3500)
- Automatic winner verification using the Codeforces API

### 🎯 Solo Practice
- Timed solo practice mode
- Custom problem rating and timer

### 🏆 Leaderboard
- Global rankings based on:
  - Wins
  - Losses
  - Matches Played

### 🔐 Authentication
- JWT-based authentication
- Secure password hashing (PBKDF2)
- Link your Codeforces handle

### 🎨 User Interface
- Responsive dark theme
- Glassmorphism design
- Smooth animations

---

# Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | React 18, Vite, React Router |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL |
| Real-Time | Socket.IO |
| Authentication | JWT + PBKDF2 |
| External API | Codeforces API |

---

# Project Structure

```text
CodeArena/
├── backend/
│   ├── auth.js
│   ├── db.js
│   ├── matchManager.js
│   ├── server.js
│   └── services/
│       └── codeforces.js
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── config.js
│   │   └── index.css
│   └── vite.config.js
│
├── init.sql
├── docker-compose.yml
└── README.md
```

---

# Database Schema

### Users

| Column | Type |
|---------|------|
| id | UUID |
| username | VARCHAR |
| email | VARCHAR |
| password_hash | VARCHAR |
| cf_handle | VARCHAR |
| wins | INT |
| losses | INT |
| created_at | TIMESTAMP |

### Matches

| Column | Type |
|---------|------|
| id | UUID |
| player1 | UUID |
| player2 | UUID |
| problem_id | VARCHAR |
| winner | UUID |
| start_time | TIMESTAMP |
| end_time | TIMESTAMP |
| status | VARCHAR |

---

# API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login |
| GET | `/me` | Current user profile |
| POST | `/update-cf` | Update Codeforces handle |
| POST | `/create-room` | Create a duel room |
| POST | `/join-room` | Join a duel room |
| GET | `/room/:id` | Retrieve room state |
| GET | `/leaderboard` | Global leaderboard |
| GET | `/problem` | Random Codeforces problem |
| GET | `/winner` | Retrieve winner status |

---

# Socket.IO Events

### Client → Server

- `join-room`
- `start-match`

### Server → Client

- `room-updated`
- `problem-selected`
- `submission-found`
- `match-ended`

---

# Getting Started

## Prerequisites

- Node.js 18+
- PostgreSQL
- Git

## Clone the Repository

```bash
git clone https://github.com/Coder1809/CodeArena.git
cd CodeArena
```

## Database Setup

Create a PostgreSQL database named:

```text
cp_duel
```

Import the schema:

```bash
psql -d cp_duel -f init.sql
```

Alternatively, use Docker:

```bash
docker compose up -d db
```

---

## Backend

```bash
cd backend
npm install
npm start
```

Backend runs at:

```
http://localhost:3000
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

# Usage

1. Register or log in.
2. Link your Codeforces handle.
3. Create or join a duel room.
4. Solve the assigned problem.
5. The server automatically verifies submissions and determines the winner.

---

# Future Improvements

- Elo rating system
- Match history
- Tournament mode
- Friend system
- Public profiles
- Spectator mode
- Chat support

---

# License

This project is licensed under the MIT License.