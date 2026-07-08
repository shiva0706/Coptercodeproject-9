const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const { fitMediaForPlatform, generateImage, PLATFORM_SPECS, ORIGINALS_DIR, isVideo } = require('../services/mediaService');

const router = express.Router();
router.use(requireAuth);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ORIGINALS_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 60 * 1024 * 1024 }, // 60MB - generous enough for short video clips
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
    cb(ok ? null : new Error('Only image or video files are supported'), ok);
  },
});

// Upload a raw photo/video. Returns the original file's reference - use
// this reference with POST /:filename/fit to get a platform-fitted crop.
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.status(201).json({
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    mediaType: isVideo(req.file.mimetype) ? 'video' : 'image',
    originalUrl: `/uploads/originals/${req.file.filename}`,
  });
});

// Returns a version of the uploaded media auto-cropped/resized to fit
// the given platform's recommended aspect ratio.
router.post('/:filename/fit', async (req, res) => {
  const { platform } = req.body;
  if (!PLATFORM_SPECS[platform]) {
    return res.status(400).json({ error: `platform must be one of: ${Object.keys(PLATFORM_SPECS).join(', ')}` });
  }
  try {
    const mimetype = req.body.mimetype || 'image/jpeg';
    const result = await fitMediaForPlatform({ originalFilename: req.params.filename, mimetype, platform });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Generates an image from a text prompt. Uses the real Grok (xAI) image
// model if XAI_API_KEY is set; otherwise falls back to a free, no-key
// image generator (Pollinations) so this works with zero extra setup.
router.post('/generate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'prompt is required' });
  try {
    const result = await generateImage({ prompt: prompt.trim() });
    res.status(201).json(result);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/platform-specs', (req, res) => res.json({ specs: PLATFORM_SPECS }));

module.exports = router;
