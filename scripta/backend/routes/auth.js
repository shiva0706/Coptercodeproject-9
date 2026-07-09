const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function parsePlatforms(raw) {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists' });
  }

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);

  db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)')
    .run(id, email, passwordHash, name || '');

  db.prepare('INSERT INTO brand_profiles (user_id) VALUES (?)').run(id);

  const token = jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id, email, name, default_platforms: [] } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, default_platforms: parsePlatforms(user.default_platforms) },
  });
});

// Saves the platforms picked during onboarding (or later, if they change
// their mind from Settings/Voice) as this user's default platform set.
router.put('/platforms', requireAuth, (req, res) => {
  const { platforms } = req.body;
  if (!Array.isArray(platforms)) {
    return res.status(400).json({ error: 'platforms must be an array' });
  }
  db.prepare('UPDATE users SET default_platforms = ? WHERE id = ?')
    .run(JSON.stringify(platforms), req.userId);
  res.json({ default_platforms: platforms });
});

// Lets a restored session (token in sessionStorage, no user object) find
// out who it is and whether onboarding (platform picks) is already done.
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, default_platforms FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { ...user, default_platforms: parsePlatforms(user.default_platforms) } });
});

module.exports = router;

