# CodeArena

> **A Real-Time 1v1 Competitive Programming Duel Platform** where developers and competitive programmers compete head-to-head on official Codeforces problems with automated submission verification, live matchmaking, and global rankings.

🔗 **Live Client:** [https://code-arena-ochre.vercel.app](https://code-arena-ochre.vercel.app)  
📡 **Live Backend API:** [https://codearena-backend-z759.onrender.com](https://codearena-backend-z759.onrender.com)

---

## 1. Project Overview & System Architecture

CodeArena transforms solitary algorithm practice into an interactive, high-stakes competitive duel. Players can create custom rooms and share a 6-character room code, configure problem rating difficulties, and race against the clock. The backend engine continuously polls the official Codeforces REST API to automatically detect accepted verdicts (`OK`) in real-time.

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    React 18 Single Page App                 │
│            (Vite + Custom CSS Design System + Lucide Icons) │
└───────────────┬─────────────────────────────▲───────────────┘
                │ REST API / WebSockets       │ JSON / Socket Events
                ▼                             │
┌─────────────────────────────────────────────┴───────────────┐
│                   Node.js & Express Server                  │
│    ├── JWT Authentication & bcrypt Password Hashing         │
│    ├── Socket.IO Auth Middleware (JWT Handshake)             │
│    ├── Real-Time Duel Engine & Room State Machine            │
│    ├── Background Codeforces API Poller (every 5s)          │
│    ├── Rate-Limited Auth Routes (express-rate-limit)         │
│    └── PostgreSQL Database Layer (Neon Serverless)           │
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
  2. **Live Duel (`ACTIVE`):** Codeforces problem unveiled with synchronized countdown timer.
  3. **Automated Verification:** The server polls Codeforces every 5 seconds for accepted submissions (`verdict: OK`).
  4. **Resolution (`FINISHED`):** Winner declared instantly upon solve; if timer expires without a solution, the match resolves as a **Draw** (winner is `null`).

### B. Leaderboard & Stats Engine
- **Rankings Table:** Global top 50 rankings featuring **Rank, Player, Codeforces Handle, Wins, Losses, Draws, and Matches Played**.
- **Profile Dashboard:** Track your personal match history and competitive record.

### C. Solo Practice Mode
- Customizable timed solo practice sessions with automatic Codeforces submission verification.

### D. Codeforces Handle Verification
- Real-time handle verification via the Codeforces `user.info` API during registration and profile updates, with debounced inline feedback (rating, rank, and validity).

---

## 3. Database Schema & Data Models

CodeArena utilizes a relational PostgreSQL schema with atomic transactions for match resolution:

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
│ room_code         │ VARCHAR(6)                  │ UNIQUE      │
│ player1           │ UUID (FK -> users.id)       │ NULLABLE    │
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
| `POST` | `/auth/update-cf` | Link Codeforces handle to account | Yes (JWT) |

### Duel Rooms & Matchmaking
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/create-room` | Create new duel room with custom rating/timer | Yes (JWT) |
| `POST` | `/join-room` | Join an existing duel room via 6-character room code | Yes (JWT) |
| `GET` | `/room/:id` | Get room configuration and participants by room code | Yes (JWT) |
| `GET` | `/winner` | Get winner details for a room by room code | No |
| `GET` | `/leaderboard` | Get global rankings (Wins, Losses, Draws) | No |
| `GET` | `/problem` | Fetch random Codeforces problem by rating range | No |
| `GET` | `/verify-cf` | Verify a Codeforces handle exists via CF API | No |

---

## 5. Real-Time Socket.IO Protocol

All Socket.IO connections are authenticated via JWT middleware — the client must provide a valid token in the handshake `auth` object.

| Event Name | Direction | Payload / Description |
|---|---|---|
| `join-room` | Client → Server | `{ roomId, userId }` — Join duel room via room code |
| `room-updated` | Server → Room | `{ room }` — Notify room of updated state (player joined) |
| `start-match` | Client → Server | `{ roomId }` — Host triggers match start |
| `start-match` | Server → Room | `{ room }` — Synchronized match start with problem |
| `problem-selected` | Server → Room | `{ contestId, index, name, rating }` — Problem details |
| `submission-found` | Server → Room | `{ player, cfHandle, problem }` — Accepted submission detected |
| `match-ended` | Server → Room | `{ roomId, winner, winnerId }` — Match finished (win or draw) |

---

## 6. Technology Stack

- **Frontend:**
  - React 18 (Hooks, Functional Components)
  - Vite (Build & Development Server)
  - React Router v6 (Client-side routing)
  - Custom CSS Design System (1,500+ lines — dual-theme dark/light mode, design tokens, responsive)
  - Socket.IO Client (Authenticated WebSocket connection)
  - Lucide React (Icons)
- **Backend:**
  - Node.js & Express.js (REST API & WebSocket gateway)
  - Socket.IO (JWT-authenticated connections, room isolation, broadcast channels, match timers)
  - PostgreSQL & `pg` (Relational persistence with transactions)
  - Neon Database (Serverless PostgreSQL with connection pooling)
  - `bcryptjs` & `jsonwebtoken` (Password hashing & stateless JWT authentication)
  - `express-rate-limit` (Rate limiting on authentication endpoints)
  - Codeforces REST API (Problem fetching, live submission verification, handle verification)

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
JWT_SECRET=your_jwt_secret_here
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
CLIENT_URL=http://localhost:5173
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:3000
```

---

### 2. Database Initialization

Run the initialization script to create required tables, indexes, and extensions:
```bash
# Run schema initialization against your database (Neon or local PostgreSQL):
psql "$DATABASE_URL" -f init.sql
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