const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { analyzeVoice } = require('../services/aiService');

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

// "Analyze My Voice" - reads pasted sample posts and suggests tone/rules
// text to seed the fields above. Doesn't save anything itself; the person
// still has to hit "apply" and then "save these notes".
router.post('/analyze', async (req, res) => {
  const { sample_posts } = req.body;
  if (!sample_posts || !sample_posts.trim()) {
    return res.status(400).json({ error: 'sample_posts (string) is required' });
  }

  try {
    const suggestion = await analyzeVoice({ samplePosts: sample_posts });
    res.json({ suggestion });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;