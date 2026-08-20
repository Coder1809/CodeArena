const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('./db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_duel_key_99';

// Helper for hashing passwords securely with Node.js crypto
function hashPassword(password) {
  const salt = 'cp_duel_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
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
    const passwordHash = hashPassword(password);
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

    const passwordHash = hashPassword(password);
    const result = await db.query(
      `SELECT id, username, email, cf_handle, wins, losses, COALESCE(draws, 0) AS draws
       FROM users WHERE email = $1 AND password_hash = $2`,
      [email.toLowerCase().trim(), passwordHash]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userRes = await db.query(
      `SELECT id, username, email, cf_handle, wins, losses, COALESCE(draws, 0) AS draws FROM users WHERE id = $1`,
      [decoded.id]
    );
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(userRes.rows[0]);
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// POST /auth/update-cf
router.post('/update-cf', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { cfHandle } = req.body;
  if (!cfHandle) return res.status(400).json({ error: 'Codeforces handle is required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const updated = await db.query(
      `UPDATE users SET cf_handle = $1 WHERE id = $2 RETURNING id, username, email, cf_handle, wins, losses, COALESCE(draws, 0) AS draws`,
      [cfHandle.trim(), decoded.id]
    );
    res.json({ success: true, user: updated.rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = { router, JWT_SECRET };
