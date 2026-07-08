const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const SUPPORTED_PLATFORMS = ['instagram', 'tiktok', 'x', 'linkedin', 'facebook', 'youtube'];

router.get('/', (req, res) => {
  const accounts = db.prepare('SELECT * FROM social_accounts WHERE user_id = ?').all(req.userId);
  res.json({ accounts, supported_platforms: SUPPORTED_PLATFORMS });
});

// NOTE: This is a mock "connect" flow that just stores a handle.
// A real integration would redirect the user through that platform's OAuth
// consent screen (e.g. Meta Login, X OAuth 2.0, LinkedIn OAuth) and store
// the returned access/refresh tokens instead of just a handle.
router.post('/', (req, res) => {
  const { platform, handle } = req.body;

  if (!platform || !SUPPORTED_PLATFORMS.includes(platform)) {
    return res.status(400).json({ error: `Platform must be one of: ${SUPPORTED_PLATFORMS.join(', ')}` });
  }
  if (!handle) {
    return res.status(400).json({ error: 'Handle is required' });
  }

  const id = uuidv4();
  db.prepare('INSERT INTO social_accounts (id, user_id, platform, handle) VALUES (?, ?, ?, ?)')
    .run(id, req.userId, platform, handle);

  const account = db.prepare('SELECT * FROM social_accounts WHERE id = ?').get(id);
  res.status(201).json({ account });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM social_accounts WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.userId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Account not found' });
  }
  res.json({ success: true });
});

module.exports = router;
