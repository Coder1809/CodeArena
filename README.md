# CodeArena

> **A Real-Time 1v1 Competitive Programming Duel Platform** where developers and competitive programmers compete head-to-head on official Codeforces problems with automated submission verification, live matchmaking, and global rankings.

🔗 **Live Client:** [https://code-arena-ochre.vercel.app](https://code-arena-ochre.vercel.app)  
📡 **Live Backend API:** [https://codearena-backend-z759.onrender.com](https://codearena-backend-z759.onrender.com)

---

## 1. Project Overview & System Architecture

CodeArena transforms solitary algorithm practice into an interactive, high-stakes competitive duel. Players can create custom rooms or join open lobbies, configure problem rating difficulties, and race against the clock. The backend engine continuously polls the official Codeforces REST API to automatically detect accepted verdicts (`OK`) in real-time.

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    React 18 Single Page App                 │
│         (Vite + Tailwind CSS + Lucide Icons + Axios)        │
└───────────────┬─────────────────────────────▲───────────────┘
                │ REST API / WebSockets       │ JSON / Socket Events
                ▼                             │
┌─────────────────────────────────────────────┴───────────────┐
│                   Node.js & Express Server                  │
│    ├── JWT Authentication & Codeforces Handle Verification  │
│    ├── Real-Time Duel Engine & Room State Machine           │
│    ├── Background Codeforces API Poller (every 5s)          │
│    └── PostgreSQL Database Layer (Neon Serverless)          │
└───────────────┬─────────────────────────────▲───────────────┘
                │ Polling                     │ SQL Queries
                ▼                             ▼
┌───────────────────────────────┐ ┌───────────────────────────┐
│     Codeforces REST API       │ │    PostgreSQL (Neon)      │
│  (Submissions & Problemset)   │ │      (Users, Matches)     │
└───────────────────────────────┘ └───────────────────────────┘
```

---

## 2. Core Features & Duel Workflow

### A. 1v1 Real-Time Duel Arena
- **Custom Duel Settings:** Choose problem difficulty ratings (800–3500) and match durations (1–300 mins).
- **Synchronized Match Lifecycle:**
  1. **Lobby (`WAITING`):** Host creates room and shares 6-character room code; opponent joins.
  2. **Countdown (`STARTING`):** Synchronized 5-second countdown across both clients.
  3. **Live Duel (`IN_PROGRESS`):** Codeforces problem unveiled with synchronized countdown timer.
  4. **Automated Verification:** The server polls Codeforces every 5 seconds for accepted submissions (`verdict: OK`).
  5. **Resolution (`FINISHED` / `DRAW`):** Winner declared instantly upon solve; if timer expires without a solution, the match resolves as a **Draw**.
  6. **Forfeit Handling:** If a player leaves mid-match, the opponent receives the victory.

### B. Leaderboard & Stats Engine
- **Rankings Table:** Global top rankings featuring **Rank, Player, Codeforces Handle, Wins, Losses, Draws, Matches Played, and Win Rate %**.
- **Real-Time Profile Stats:** Track your personal match history, win streaks, and competitive record.

### C. Solo Practice Mode
- Customizable timed solo practice sessions with automatic Codeforces submission verification.

---

## 3. Database Schema & Data Models

CodeArena utilizes a relational PostgreSQL schema:

```
┌───────────────────────────────────────────────────────────────┐
│                             users                             │
├───────────────────┬─────────────────────────────┬─────────────┤
│ id                │ UUID (PK, uuid_generate_v4) │ PRIMARY KEY │
│ username          │ VARCHAR(255)                │ NOT NULL    │
│ email             │ VARCHAR(255)                │ UNIQUE      │
│ password_hash     │ VARCHAR(255)                │ NOT NULL    │
│ cf_handle         │ VARCHAR(255)                │ Codeforces  │
│ wins              │ INT                         │ DEFAULT 0   │
│ losses            │ INT                         │ DEFAULT 0   │
│ draws             │ INT                         │ DEFAULT 0   │
│ created_at        │ TIMESTAMP                   │ CURRENT_TIME│
└───────────────────┴─────────────────────────────┴─────────────┘
                                ▲
                                │ 1:N (Player1, Player2, Winner)
┌───────────────────────────────┴───────────────────────────────┐
│                            matches                            │
├───────────────────┬─────────────────────────────┬─────────────┤
│ id                │ UUID (PK, uuid_generate_v4) │ PRIMARY KEY │
│ player1           │ UUID (FK -> users.id)       │ NOT NULL    │
│ player2           │ UUID (FK -> users.id)       │ NULLABLE    │
│ problem_id        │ VARCHAR(255)                │ Problem Ref │
│ winner            │ UUID (FK -> users.id)       │ Winner User │
│ start_time        │ TIMESTAMP                   │ Start Date  │
│ end_time          │ TIMESTAMP                   │ End Date    │
│ status            │ VARCHAR(50)                 │ Duel Status │
└───────────────────┴─────────────────────────────┴─────────────┘
```

---

## 4. API Endpoints Specification

### Authentication & Profiles
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register new user account | No |
| `POST` | `/auth/login` | Authenticate user & return JWT | No |
| `GET` | `/auth/me` | Get authenticated player stats | Yes (JWT) |
| `POST` | `/auth/update-cf` | Link verified Codeforces handle | Yes (JWT) |

### Duel Rooms & Matchmaking
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/create-room` | Create new duel room with custom rating/timer | Yes (JWT) |
| `POST` | `/join-room` | Join an existing duel room via room code | Yes (JWT) |
| `GET` | `/room/:id` | Get room configuration and participants | Yes (JWT) |
| `GET` | `/leaderboard` | Get global rankings (Wins, Losses, Draws, Win Rate) | No |
| `GET` | `/problem` | Fetch random Codeforces problem by rating | No |

---

## 5. Real-Time Socket.IO Protocol

| Event Name | Direction | Payload / Description |
|---|---|---|
| `join-room` | Client → Server | `{ roomId, user }` - Join duel room |
| `player-joined` | Server → Room | `{ player }` - Notify room of opponent arrival |
| `start-match` | Client → Server | `{ roomId }` - Host triggers start |
| `match-started` | Server → Room | `{ problem, startTime, duration }` - Synchronized start |
| `match-won` | Server → Room | `{ winner, problemUrl }` - Problem solved verdict |
| `match-draw` | Server → Room | `{ message }` - Match ended in a draw on timeout |
| `match-ended` | Server → Room | `{ reason }` - Match termination/forfeit |
| `leave-room` | Client → Server | `{ roomId }` - Player leaves room |

---

## 6. Technology Stack

- **Frontend:**
  - React 18 (Hooks, Context, Dynamic Components)
  - Vite (Build & Development Server)
  - React Router v6 / v7 (Client-side routing)
  - Tailwind CSS (Dark theme gaming aesthetic)
  - Socket.IO Client (Low-latency bidirectional WebSocket connection)
  - Axios (HTTP client with JWT authorization interceptors)
  - Lucide React (Swords, trophies, timers, and game icons)
- **Backend:**
  - Node.js & Express.js (REST API & WebSocket gateway)
  - Socket.IO (Room isolation, broadcast channels, countdown timers)
  - PostgreSQL & `pg` (Relational persistence with atomic transaction updates)
  - Neon Database (Serverless PostgreSQL with connection pooling)
  - `bcrypt` & `jsonwebtoken` (Password hashing & stateless authentication)
  - Codeforces REST API (Live submission verification)

---

## 7. Getting Started & Local Development

### Prerequisites
- **Node.js**: `v18+` or `v20.20.2`
- **PostgreSQL Database**: Local PostgreSQL or a Neon Serverless PostgreSQL instance
- **Git**

### 1. Environment Configuration

**Backend (`backend/.env`):**
```env
PORT=3000
JWT_SECRET=supersecret_duel_key_99
DATABASE_URL=postgresql://user:password@localhost:5432/cp_duel
CLIENT_URL=http://localhost:5173
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:3000
```

---

### 2. Database Initialization

Run the initialization script to create required tables and extensions:
```bash
psql -U postgres -d cp_duel -f init.sql
```

---

### 3. Installation & Running

#### Terminal 1 (Backend)
```bash
cd backend
npm install
npm run dev      # Starts server on http://localhost:3000
```

#### Terminal 2 (Frontend)
```bash
cd frontend
npm install
npm run dev      # Starts client on http://localhost:5173
```

---

## 8. License

Distributed under the MIT License. Designed and developed by **Sasank Reddy**.