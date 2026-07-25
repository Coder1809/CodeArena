const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const cfService = require('./services/codeforces');
const MatchManager = require('./matchManager');
const auth = require('./auth');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const matchManager = new MatchManager(io);
cfService.initCodeforces();

// --- Auth Routes ---
app.use('/auth', auth.router);

// Direct top-level Auth proxies for specification compliance
app.post('/login', (req, res, next) => {
  req.url = '/login';
  auth.router(req, res, next);
});

app.post('/register', (req, res, next) => {
  req.url = '/register';
  auth.router(req, res, next);
});

app.get('/me', (req, res, next) => {
  req.url = '/me';
  auth.router(req, res, next);
});

app.post('/update-cf', (req, res, next) => {
  req.url = '/update-cf';
  auth.router(req, res, next);
});

// --- Arena API Endpoints ---

// POST /create-room
app.post('/create-room', async (req, res) => {
  try {
    const { userId, timeLimit, ratingMin, ratingMax, isSolo } = req.body;
    const room = await matchManager.createMatch(userId, timeLimit, ratingMin, ratingMax, isSolo);
    res.json({ roomId: room.roomId, room });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /join-room
app.post('/join-room', async (req, res) => {
  try {
    const { roomId, userId } = req.body;
    const room = await matchManager.joinMatch(roomId, userId);
    res.json({ success: true, room: matchManager.sanitizeRoom(room) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /room/:id
app.get('/room/:id', async (req, res) => {
  try {
    const roomId = req.params.id;
    let room = matchManager.activeMatches.get(roomId);
    if (!room) {
      room = await matchManager.joinMatch(roomId, null);
    }
    res.json(matchManager.sanitizeRoom(room));
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// GET /leaderboard
app.get('/leaderboard', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, cf_handle, wins, losses, (wins + losses) as matches_played
       FROM users
       ORDER BY wins DESC, losses ASC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /problem
app.get('/problem', (req, res) => {
  try {
    const ratingMin = parseInt(req.query.ratingMin) || 800;
    const ratingMax = parseInt(req.query.ratingMax) || 1200;
    const problem = cfService.getRandomProblem(ratingMin, ratingMax, new Set());
    if (!problem) return res.status(444).json({ error: 'No problem found in rating range' });
    res.json({
      id: `${problem.contestId}-${problem.index}`,
      contestId: problem.contestId,
      index: problem.index,
      name: problem.name,
      rating: problem.rating
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /winner
app.get('/winner', async (req, res) => {
  try {
    const { roomId } = req.query;
    const room = matchManager.activeMatches.get(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!room.winner) return res.json({ winner: null, status: room.status });
    const user = await matchManager.getUserData(room.winner);
    res.json({ winner: user, status: room.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Socket.IO Events ---
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // socket: join-room
  socket.on('join-room', async ({ roomId, userId }, callback) => {
    try {
      socket.join(roomId);
      const room = await matchManager.joinMatch(roomId, userId);
      const sanitized = matchManager.sanitizeRoom(room);
      io.to(roomId).emit('room-updated', sanitized);
      if (typeof callback === 'function') callback({ success: true, room: sanitized });
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // socket: start-match
  socket.on('start-match', async ({ roomId }, callback) => {
    try {
      const room = await matchManager.startMatch(roomId);
      if (typeof callback === 'function') callback({ success: true, room: matchManager.sanitizeRoom(room) });
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`CP Duel server running on port ${PORT}`);
});
