const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('./db');

const bcrypt = require('bcryptjs');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_duel_key_99';

// Helper for hashing passwords securely with bcrypt (auto-generates unique salt per user)
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Helper to verify passwords with bcrypt (with backward-compatibility fallback)
async function comparePassword(password, hash) {
  if (!hash) return false;
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    return await bcrypt.compare(password, hash);
  }
  // Fallback for legacy PBKDF2 hashes
  const legacyHash = crypto.pbkdf2Sync(password, 'cp_duel_salt_2026', 10000, 64, 'sha512').toString('hex');
  return legacyHash === hash;
}

// Reusable JWT authentication middleware
// Verifies the token and attaches decoded user data to req.user
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, username }
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, cfHandle, cf_handle } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const handleToSave = (cfHandle || cf_handle || '').trim() || null;
    const passwordHash = await hashPassword(password);
    const insertRes = await db.query(
      `INSERT INTO users (username, email, password_hash, cf_handle)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, cf_handle, wins, losses, COALESCE(draws, 0) AS draws`,
      [username.trim(), email.toLowerCase().trim(), passwordHash, handleToSave]
    );

    const user = insertRes.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await db.query(
      `SELECT id, username, email, password_hash, cf_handle, wins, losses, COALESCE(draws, 0) AS draws
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Don't leak password_hash in response
    delete user.password_hash;

    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /auth/me — uses authenticate middleware
router.get('/me', authenticate, async (req, res) => {
  try {
    const userRes = await db.query(
      `SELECT id, username, email, cf_handle, wins, losses, COALESCE(draws, 0) AS draws FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(userRes.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /auth/update-cf — uses authenticate middleware
router.post('/update-cf', authenticate, async (req, res) => {
  const { cfHandle } = req.body;
  if (!cfHandle) return res.status(400).json({ error: 'Codeforces handle is required' });

  try {
    const updated = await db.query(
      `UPDATE users SET cf_handle = $1 WHERE id = $2 RETURNING id, username, email, cf_handle, wins, losses, COALESCE(draws, 0) AS draws`,
      [cfHandle.trim(), req.user.id]
    );
    res.json({ success: true, user: updated.rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = { router, authenticate, JWT_SECRET };
