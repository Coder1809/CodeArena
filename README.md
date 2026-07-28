# CodeArena — Real-Time 1v1 Competitive Coding Platform

A real-time competitive programming platform where developers compete in live 1v1 coding duels using Codeforces problems with automated submission verification.

---

## 🌟 Key Features

- **Real-Time 1v1 Duels** — Create or join private duel rooms with live Socket.IO room sync, countdown timers, and live match events.
- **Automated Winner Verification** — 5-second polling service querying the Codeforces REST API to evaluate submission timestamps and verdicts (`OK`), declaring winners automatically.
- **Customizable Duel Rules** — Configure duel duration (1–300 minutes) and problem rating range (800–3500).
- **PostgreSQL Database** — Relational database with UUID indexing, PBKDF2 password security, atomic win/loss record updates, and global leaderboards.
- **Solo Practice Mode** — Timed solo practice mode with customizable problem difficulty and countdown timers.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, React Router, Lucide Icons, Tailwind CSS
- **Backend:** Node.js, Express 5, PostgreSQL (`pg`), Socket.IO, JWT, Codeforces API

---

## 🚀 Setup & Detailed Execution Guide

### 1. Prerequisites
- **Node.js**: Version `18+` or `20+`
- **PostgreSQL**: Running locally on port `5432` or via Docker
- **Git**: Installed on your system

---

### 2. Environment Variables Setup

#### Backend Environment Variables (`backend/.env`)
Create a `.env` file inside the `backend` directory:
```env
PORT=3000
JWT_SECRET=codearena_jwt_secret_key_2026
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cp_duel
CLIENT_URL=http://localhost:5173
```

#### Frontend Environment Variables (`frontend/.env`)
Create a `.env` file inside the `frontend` directory:
```env
VITE_API_URL=http://localhost:3000
```

---

### 3. Database Setup

Create a PostgreSQL database named `cp_duel` and import the schema:

```bash
# Create database and import init.sql
psql -U postgres -d cp_duel -f init.sql
```
*(Or run `docker compose up -d db` if using Docker).*

---

### 4. Step-by-Step Installation & Execution

#### Step A: Run the Backend Server
Open Terminal 1 and run:
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Start the backend server (Runs on http://localhost:3000)
npm start
```

---

#### Step B: Run the Frontend Client
Open Terminal 2 and run:
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server (Runs on http://localhost:5173)
npm run dev
```

---

### 5. Accessing the Application
Once both servers are running:
- Open your browser and navigate to **`http://localhost:5173`**
- Register a new account and link your **Codeforces handle** in the Dashboard
- Create a room, set rating range (800–3500), and start your 1v1 duel!

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check (returns API status and version) |
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login user and retrieve JWT token |
| GET | `/auth/me` | Current user profile |
| POST | `/auth/update-cf` | Link or update Codeforces handle |
| POST | `/create-room` | Create a new 1v1 duel room |
| POST | `/join-room` | Join an existing duel room |
| GET | `/room/:id` | Retrieve room state |
| GET | `/leaderboard` | Retrieve global leaderboards (top 50) |
| GET | `/problem` | Fetch random Codeforces problem by rating range |

---

## 📄 License
MIT License