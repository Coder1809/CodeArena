# Code Arena

A real-time competitive programming platform where users compete in 1v1 coding duels using Codeforces problems.

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
- **Light & Dark themes** with instant toggle and system preference detection
- Neutral charcoal dark theme with warm accent gradients
- Clean white light theme with subtle surfaces
- Theme preference persisted via localStorage
- Fully responsive across all devices (320px–1536px)
- Mobile-first design with hamburger navigation
- CSS custom properties design system with 70+ design tokens
- Smooth micro-animations (fade-in, slide-up, shimmer skeletons)
- Consistent component library (buttons, inputs, cards, alerts, badges)
- WCAG AA accessible — focus-visible rings, ARIA labels, semantic HTML, `prefers-reduced-motion` support

---

## Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | React 18, Vite, React Router, Lucide Icons |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL |
| Real-Time | Socket.IO |
| Authentication | JWT + PBKDF2 |
| External API | Codeforces API |

---

## Design System

The frontend uses a comprehensive CSS custom properties design system:

| Token Category | Examples |
|---------------|----------|
| Spacing | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px |
| Typography | xs (0.75rem) → 4xl (2.25rem) with Outfit headings + Inter body + JetBrains Mono code |
| Border Radius | 8px (small) · 12px (buttons/inputs) · 16px (cards) · 9999px (pills) |
| Shadows | sm · md · lg · xl · glow |
| Animations | fadeIn · fadeInUp · scaleIn · shimmer · spin |

### Theme Colors

| Token | Dark Theme | Light Theme |
|-------|-----------|-------------|
| `--bg-primary` | `#0c0c0f` (charcoal) | `#f8fafc` (off-white) |
| `--bg-secondary` | `#161618` | `#ffffff` |
| `--accent` | `#818cf8` (indigo) | `#6366f1` (indigo) |
| `--success` | `#34d399` | `#059669` |
| `--danger` | `#f87171` | `#dc2626` |
| `--warning` | `#fbbf24` | `#d97706` |

---

## Project Structure

```text
CodeArena/
├── backend/
│   ├── auth.js          # JWT authentication & user routes
│   ├── db.js            # PostgreSQL connection pool
│   ├── matchManager.js  # Duel/match lifecycle management
│   ├── server.js        # Express server, REST API & Socket.IO
│   └── services/
│       └── codeforces.js  # Codeforces API integration
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateDuel.jsx
│   │   │   ├── JoinDuel.jsx
│   │   │   ├── SoloPrep.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   └── DuelRoom.jsx
│   │   ├── App.jsx      # App shell, routing, theme toggle, navbar
│   │   ├── config.js    # API base URL config
│   │   └── index.css    # Design system (themes, tokens, components)
│   ├── index.html       # Entry HTML with theme initialization
│   └── vite.config.js
│
├── init.sql             # Database schema
├── docker-compose.yml
├── .env.example         # Backend environment variables template
└── README.md
```

---

## Database Schema

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

## API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Health check (returns version & status) |
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Current user profile (requires auth) |
| POST | `/auth/update-cf` | Update Codeforces handle (requires auth) |
| POST | `/create-room` | Create a duel room |
| POST | `/join-room` | Join a duel room |
| GET | `/room/:id` | Retrieve room state |
| GET | `/leaderboard` | Global leaderboard (top 50) |
| GET | `/problem` | Random Codeforces problem by rating range |
| GET | `/winner` | Retrieve winner status for a room |

> Legacy top-level routes (`/login`, `/register`, `/me`, `/update-cf`) are proxied to `/auth/*` for backward compatibility.

---

## Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `{ roomId, userId }` | Join a duel room |
| `start-match` | `{ roomId }` | Start the match |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room-updated` | Room object | Room state changed |
| `problem-selected` | Problem object | Problem assigned |
| `submission-found` | `{ player, cfHandle }` | A player solved the problem |
| `match-ended` | `{ winner, winnerId }` | Match finished |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Git

### Clone the Repository

```bash
git clone https://github.com/Coder1809/CodeArena.git
cd CodeArena
```

### Environment Variables

#### Backend (`backend/.env` or root `.env`)

```env
PORT=3000
JWT_SECRET=your_jwt_secret_key
DATABASE_URL=postgresql://username:password@localhost:5432/cp_duel
CLIENT_URL=http://localhost:5173
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `3000` |
| `JWT_SECRET` | Secret key for JWT signing | — (required) |
| `DATABASE_URL` | PostgreSQL connection string | — (required) |
| `CLIENT_URL` | Allowed CORS origin for frontend | `http://localhost:5173` |

#### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
```

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000` |

### Database Setup

Create a PostgreSQL database named `cp_duel` and import the schema:

```bash
psql -d cp_duel -f init.sql
```

Or use Docker:

```bash
docker compose up -d db
```

---

### Backend

```bash
cd backend
npm install
npm start
```

Backend runs at `http://localhost:3000`. Verify with:

```bash
curl http://localhost:3000/
# → { "success": true, "message": "CodeArena Backend is running 🚀", "version": "1.0.0" }
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## Usage

1. Register or log in.
2. Link your Codeforces handle in the Dashboard.
3. Toggle between light and dark themes using the Sun/Moon button in the navbar.
4. Create or join a duel room.
5. Solve the assigned Codeforces problem before your opponent.
6. The server automatically verifies submissions via the Codeforces API and determines the winner.

---

## Future Improvements

- Elo rating system
- Match history
- Tournament mode
- Friend system
- Public profiles
- Spectator mode
- Chat support

---

## License

This project is licensed under the MIT License.