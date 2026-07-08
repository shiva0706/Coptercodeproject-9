const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// List campaigns with a simple rollup of how many posts in each status,
// so the UI can show progress without a second round trip per campaign.
router.get('/', (req, res) => {
  const campaigns = db.prepare('SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  const withCounts = campaigns.map((c) => {
    const counts = db.prepare(`
      SELECT status, COUNT(*) as count FROM posts WHERE campaign_id = ? GROUP BY status
    `).all(c.id);
    const tally = { draft: 0, scheduled: 0, published: 0, failed: 0 };
    for (const row of counts) tally[row.status] = row.count;
    return { ...c, postCounts: tally, totalPosts: Object.values(tally).reduce((a, b) => a + b, 0) };
  });
  res.json({ campaigns: withCounts });
});

router.post('/', (req, res) => {
  const { name, goal } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const id = uuidv4();
  db.prepare('INSERT INTO campaigns (id, user_id, name, goal) VALUES (?, ?, ?, ?)').run(id, req.userId, name, goal || '');
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
  res.status(201).json({ campaign });
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Campaign not found' });

  const { name, goal } = req.body;
  db.prepare('UPDATE campaigns SET name = ?, goal = ? WHERE id = ?')
    .run(name ?? existing.name, goal ?? existing.goal, req.params.id);
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  res.json({ campaign });
});

// Deleting a campaign un-links its posts rather than deleting them -
// nobody wants their written posts to vanish because a campaign wrapped up.
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Campaign not found' });

  db.prepare('UPDATE posts SET campaign_id = NULL WHERE campaign_id = ?').run(req.params.id);
  db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
