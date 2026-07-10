const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { generatePosts } = require('../services/aiService');
const { publish } = require('../services/publishService');

const router = express.Router();
router.use(requireAuth);

// List all posts for the current user, optionally filtered by status and/or campaign
router.get('/', (req, res) => {
  const { status, campaign_id } = req.query;
  let sql = 'SELECT * FROM posts WHERE user_id = ?';
  const params = [req.userId];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (campaign_id) { sql += ' AND campaign_id = ?'; params.push(campaign_id); }
  sql += ' ORDER BY created_at DESC';
  const posts = db.prepare(sql).all(...params);
  res.json({ posts });
});

// Use AI to turn a raw idea into one tailored post per requested platform.
// Does NOT save anything - returns drafts for the user to review/edit first.
router.post('/generate', async (req, res) => {
  const { idea, platforms } = req.body;

  if (!idea || !Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({ error: 'idea (string) and platforms (non-empty array) are required' });
  }

  const brandProfile = db.prepare('SELECT * FROM brand_profiles WHERE user_id = ?').get(req.userId)
    || { tone: '', audience: '', rules: '', sample_posts: '' };

  try {
    const posts = await generatePosts({ idea, platforms, brandProfile });
    res.json({ posts });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// Save a post (as draft, or scheduled if scheduled_at is provided)
router.post('/', (req, res) => {
  const { platform, content, scheduled_at, media_path, media_type, campaign_id } = req.body;
  if (!platform || !content) {
    return res.status(400).json({ error: 'platform and content are required' });
  }

  const id = uuidv4();
  const status = scheduled_at ? 'scheduled' : 'draft';

  db.prepare(`
    INSERT INTO posts (id, user_id, platform, content, status, scheduled_at, media_path, media_type, campaign_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, platform, content, status, scheduled_at || null, media_path || null, media_type || null, campaign_id || null);

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
  res.status(201).json({ post });
});

// Edit an existing post
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM posts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Post not found' });
  if (existing.status === 'published') {
    return res.status(400).json({ error: 'Cannot edit a post that has already been published' });
  }

  const { content, scheduled_at, platform, media_path, media_type, campaign_id } = req.body;
  const status = scheduled_at ? 'scheduled' : 'draft';

  db.prepare(`
    UPDATE posts SET content = ?, scheduled_at = ?, platform = ?, status = ?, media_path = ?, media_type = ?, campaign_id = ?
    WHERE id = ?
  `).run(
    content ?? existing.content,
    scheduled_at !== undefined ? scheduled_at : existing.scheduled_at,
    platform ?? existing.platform,
    status,
    media_path !== undefined ? media_path : existing.media_path,
    media_type !== undefined ? media_type : existing.media_type,
    campaign_id !== undefined ? campaign_id : existing.campaign_id,
    req.params.id
  );

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  res.json({ post });
});

// Publish immediately (manual "post now" button)
router.post('/:id/publish-now', async (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  // A connected account/handle is optional context now, not a requirement -
  // it's just set inline in Compose if the user wants "posting as @handle"
  // to show up in the result. Publishing works the same with or without one.
  const account = db.prepare('SELECT * FROM social_accounts WHERE user_id = ? AND platform = ?')
    .get(req.userId, post.platform);

  const result = await publish(post, account || null);

  db.prepare(`
    UPDATE posts SET status = ?, published_at = datetime('now'), publish_result = ?
    WHERE id = ?
  `).run(result.success ? 'published' : 'failed', result.message, post.id);

  const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(post.id);
  res.json({ post: updated, result });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM posts WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Post not found' });
  res.json({ success: true });
});

module.exports = router;