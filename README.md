# CodeArena

A real-time competitive programming duel platform where developers compete 1v1 on Codeforces problems with automated submission verification.

🔗 **Live Application:** [https://code-arena-ochre.vercel.app](https://code-arena-ochre.vercel.app)  
📡 **Backend API:** [https://codearena-backend-z759.onrender.com](https://codearena-backend-z759.onrender.com)

---

## Features

- **Real-Time 1v1 Duels**: Create private duel rooms or join open lobbies with synchronized countdown timers and match state using Socket.IO.
- **Automated Verification**: Background service polls the Codeforces REST API every 5 seconds to evaluate problem verdicts (`OK`) and declare winners automatically.
- **Curated Problem Engine**: Over 11,000+ official Codeforces problems, customizable by duel duration (1–300 mins) and difficulty rating (800–3500).
- **Leaderboard & Records**: Relational PostgreSQL database with atomic win/loss record updates and top 50 player rankings.
- **Solo Practice Mode**: Timed practice arena with customizable problem ratings.

---

## Tech Stack

- **Frontend:** React 18, Vite, React Router, Tailwind CSS, Socket.IO Client, Axios, Lucide Icons
- **Backend:** Node.js, Express 5, PostgreSQL (`pg`), Socket.IO, JWT, Codeforces REST API
- **Database & Hosting:** Neon PostgreSQL, Vercel (Frontend), Render (Backend)

---

## Getting Started

### Prerequisites
- Node.js (v18 or v20+)
- PostgreSQL database
- Git

### 1. Environment Variables

**Backend (`backend/.env`):**
```env
PORT=3000
JWT_SECRET=your_jwt_secret_key
DATABASE_URL=postgresql://user:password@localhost:5432/cp_duel
CLIENT_URL=http://localhost:5173
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:3000
```

### 2. Database Setup

```bash
psql -U postgres -d cp_duel -f init.sql
```

### 3. Run Locally

```bash
# Backend
cd backend
npm install
npm start

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

---

## API Summary

- `POST /auth/register` — Create user account
- `POST /auth/login` — Login user & return JWT token
- `GET /auth/me` — Get current user profile
- `POST /auth/update-cf` — Link Codeforces handle
- `POST /create-room` — Create new duel room
- `POST /join-room` — Join room by ID
- `GET /room/:id` — Get room state
- `GET /leaderboard` — Global top 50 rankings
- `GET /problem` — Fetch random problem by rating

---

## License

MIT License