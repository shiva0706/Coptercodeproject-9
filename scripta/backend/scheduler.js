const cron = require('node-cron');
const db = require('./db');
const { publish } = require('./services/publishService');

// Runs every minute: finds scheduled posts whose time has passed and
// publishes them, using whatever connected account matches the platform.
function startScheduler() {
  cron.schedule('* * * * *', async () => {
    const duePosts = db.prepare(`
      SELECT * FROM posts
      WHERE status = 'scheduled' AND scheduled_at <= datetime('now')
    `).all();

    for (const post of duePosts) {
      const account = db.prepare('SELECT * FROM social_accounts WHERE user_id = ? AND platform = ?')
        .get(post.user_id, post.platform);

      if (!account) {
        db.prepare(`UPDATE posts SET status = 'failed', publish_result = ? WHERE id = ?`)
          .run(`No connected ${post.platform} account`, post.id);
        continue;
      }

      const result = await publish(post, account);
      db.prepare(`
        UPDATE posts SET status = ?, published_at = datetime('now'), publish_result = ?
        WHERE id = ?
      `).run(result.success ? 'published' : 'failed', result.message, post.id);
    }
  });

  console.log('Scheduler started: checking for due posts every minute.');
}

module.exports = { startScheduler };
