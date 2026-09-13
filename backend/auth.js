const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const dns = require('dns').promises;
const db = require('./db');
const mailer = require('./mailer');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_duel_key_99';

// Auto-initialize pending_verifications table for persistent OTP tracking
db.query(`
  CREATE TABLE IF NOT EXISTS pending_verifications (
    email VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    cf_handle VARCHAR(255),
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).catch(err => {
  console.log('Notice: pending_verifications DB table notice (in-memory fallback active):', err.message);
});

// Resilient in-memory map fallback in case DB is offline/unavailable
const memoryPendingVerifications = new Map();

async function savePendingVerification(email, username, passwordHash, cfHandle, otp, expiresAt) {
  memoryPendingVerifications.set(email, {
    username,
    password_hash: passwordHash,
    cf_handle: cfHandle,
    otp,
    expires_at: expiresAt
  });

  try {
    await db.query(
      `INSERT INTO pending_verifications (email, username, password_hash, cf_handle, otp, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET
         username = EXCLUDED.username,
         password_hash = EXCLUDED.password_hash,
         cf_handle = EXCLUDED.cf_handle,
         otp = EXCLUDED.otp,
         expires_at = EXCLUDED.expires_at,
         created_at = CURRENT_TIMESTAMP`,
      [email, username, passwordHash, cfHandle, otp, expiresAt]
    );
  } catch (err) {
    console.log('Fallback: saved pending verification in memory only:', err.message);
  }
}

async function getPendingVerification(email) {
  try {
    const res = await db.query('SELECT * FROM pending_verifications WHERE email = $1', [email]);
    if (res.rows.length > 0) return res.rows[0];
  } catch {
    // ignore db error and check memory map
  }
  return memoryPendingVerifications.get(email) || null;
}

async function deletePendingVerification(email) {
  memoryPendingVerifications.delete(email);
  try {
    await db.query('DELETE FROM pending_verifications WHERE email = $1', [email]);
  } catch {
    // ignore
  }
}

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
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, username }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// POST /auth/register
// Validates inputs, confirms passwords match, checks for existing accounts,
// and issues a 6-digit OTP sent to the provided email.
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword, cfHandle, cf_handle } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.trim();

    // Verify email domain has active mail exchange (MX) servers
    const emailDomain = cleanEmail.split('@')[1];
    if (!emailDomain) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    try {
      const mxRecords = await dns.resolveMx(emailDomain);
      if (!mxRecords || mxRecords.length === 0) {
        return res.status(400).json({ error: 'The email domain does not have active mail servers.' });
      }
    } catch {
      return res.status(400).json({ error: 'Invalid or unreachable email domain. Please enter a valid email.' });
    }

    // Check if email already registered in active users
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    // Check if username already taken
    const existingUsername = await db.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [cleanUsername]);
    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }

    const handleToSave = (cfHandle || cf_handle || '').trim() || null;
    const passwordHash = await hashPassword(password);

    // Generate 6-digit OTP code (10-minute expiry)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save pending registration
    await savePendingVerification(cleanEmail, cleanUsername, passwordHash, handleToSave, otp, expiresAt);

    // Dispatch verification email (or log to terminal in dev mode)
    const mailResult = await mailer.sendVerificationOtp(cleanEmail, cleanUsername, otp);

    res.json({
      success: true,
      requireOtp: true,
      email: cleanEmail,
      message: 'A 6-digit verification code has been sent to your email.',
      previewOtp: otp,
      notice: mailResult.notice || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /auth/verify-otp
// Verifies the 6-digit code and permanently creates the user account
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const pending = await getPendingVerification(cleanEmail);
    if (!pending) {
      return res.status(400).json({
        error: 'No pending registration found or the code has expired. Please register again.'
      });
    }

    // Check expiry
    const expiryTime = new Date(pending.expires_at).getTime();
    if (Date.now() > expiryTime) {
      await deletePendingVerification(cleanEmail);
      return res.status(400).json({
        error: 'Verification code has expired. Please request a new one.'
      });
    }

    // Check code match
    if (pending.otp !== cleanOtp) {
      return res.status(400).json({
        error: 'Invalid verification code. Please check your email and try again.'
      });
    }

    // Insert new verified user into users table
    const insertRes = await db.query(
      `INSERT INTO users (username, email, password_hash, cf_handle)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, cf_handle, wins, losses, COALESCE(draws, 0) AS draws`,
      [pending.username, cleanEmail, pending.password_hash, pending.cf_handle]
    );

    // Cleanup pending registration
    await deletePendingVerification(cleanEmail);

    const user = insertRes.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Account verified successfully!',
      token,
      user
    });
  } catch (error) {
    // If concurrent registration happened for same email
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email is already registered.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /auth/resend-otp
// Resends a fresh 6-digit OTP code to the user's pending email
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const pending = await getPendingVerification(cleanEmail);
    if (!pending) {
      return res.status(400).json({
        error: 'No pending registration found for this email. Please register again.'
      });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await savePendingVerification(
      cleanEmail,
      pending.username,
      pending.password_hash,
      pending.cf_handle,
      newOtp,
      newExpiry
    );

    const mailResult = await mailer.sendVerificationOtp(cleanEmail, pending.username, newOtp);

    res.json({
      success: true,
      message: 'A new 6-digit verification code has been sent to your email.',
      previewOtp: newOtp,
      notice: mailResult.notice || null
    });
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
