const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Get the current user's brand voice profile
router.get('/', (req, res) => {
  const profile = db.prepare('SELECT * FROM brand_profiles WHERE user_id = ?').get(req.userId);
  res.json({ profile });
});

// Update brand voice: tone, audience, rules (likes/dislikes), sample posts
router.put('/', (req, res) => {
  const { tone, audience, rules, sample_posts } = req.body;

  db.prepare(`
    UPDATE brand_profiles
    SET tone = ?, audience = ?, rules = ?, sample_posts = ?, updated_at = datetime('now')
    WHERE user_id = ?
  `).run(tone || '', audience || '', rules || '', sample_posts || '', req.userId);

  const profile = db.prepare('SELECT * FROM brand_profiles WHERE user_id = ?').get(req.userId);
  res.json({ profile });
});

module.exports = router;
