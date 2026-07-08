require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const brandRoutes = require('./routes/brand');
const accountsRoutes = require('./routes/accounts');
const postsRoutes = require('./routes/posts');
const mediaRoutes = require('./routes/media');
const campaignsRoutes = require('./routes/campaigns');
const { startScheduler } = require('./scheduler');

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET in .env - copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/brand', brandRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/campaigns', campaignsRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Scripta backend running on http://localhost:${PORT}`);
  startScheduler();
});
