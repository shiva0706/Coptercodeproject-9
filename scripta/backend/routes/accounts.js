const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const SUPPORTED_PLATFORMS = [
  'instagram', 'tiktok', 'x', 'linkedin', 'facebook', 'youtube',
  'discord', 'reddit', 'pinterest', 'bluesky', 'tumblr', 'threads', 'snapchat',
];

router.get('/', (req, res) => {
  const accounts = db.prepare('SELECT * FROM social_accounts WHERE user_id = ?').all(req.userId);
  res.json({ accounts, supported_platforms: SUPPORTED_PLATFORMS });
});

// Upsert: one handle per platform per user. This used to always INSERT
// (fine when it only ran from a dedicated "connect" form on the old
// Contacts page), but now that the handle field lives inline in Compose and
// can be edited repeatedly, saving it again for a platform that already has
// one should update that row instead of creating a duplicate.
router.post('/', (req, res) => {
  const { platform, handle } = req.body;

  if (!platform || !SUPPORTED_PLATFORMS.includes(platform)) {
    return res.status(400).json({ error: `Platform must be one of: ${SUPPORTED_PLATFORMS.join(', ')}` });
  }
  if (!handle) {
    return res.status(400).json({ error: 'Handle is required' });
  }

  const existing = db.prepare('SELECT * FROM social_accounts WHERE user_id = ? AND platform = ?')
    .get(req.userId, platform);

  if (existing) {
    db.prepare('UPDATE social_accounts SET handle = ? WHERE id = ?').run(handle, existing.id);
    const account = db.prepare('SELECT * FROM social_accounts WHERE id = ?').get(existing.id);
    return res.json({ account });
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