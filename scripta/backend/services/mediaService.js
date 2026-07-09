// Auto-fits uploaded photos/videos to each platform's recommended aspect
// ratio. Images are handled with sharp (fast, no external binary). Video
// is handled with ffmpeg via ffmpeg-static - if that binary is missing or
// fails for any reason, we fall back to just returning the original
// video untouched, rather than blocking the whole post.
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

let ffmpeg = null;
try {
  ffmpeg = require('fluent-ffmpeg');
  ffmpeg.setFfmpegPath(require('ffmpeg-static'));
} catch {
  // ffmpeg-static failed to download its binary (e.g. offline install).
  // Video auto-fit will be skipped gracefully - see fitVideo() below.
}

// One target size per platform. Real platforms support several aspect
// ratios each (e.g. Instagram feed vs Stories) - this picks the single
// most broadly-recommended one per platform to keep the feature simple.
const PLATFORM_SPECS = {
  instagram: { width: 1080, height: 1350, ratioLabel: '4:5' },
  tiktok:    { width: 1080, height: 1920, ratioLabel: '9:16' },
  x:         { width: 1200, height: 675,  ratioLabel: '16:9' },
  linkedin:  { width: 1200, height: 627,  ratioLabel: '1.91:1' },
  facebook:  { width: 1200, height: 630,  ratioLabel: '1.91:1' },
  youtube:   { width: 1280, height: 720,  ratioLabel: '16:9' },
  discord:   { width: 1280, height: 720,  ratioLabel: '16:9' },   // embeds render best at 16:9
  reddit:    { width: 1080, height: 1350, ratioLabel: '4:5' },     // feed crops close to Instagram's
  pinterest: { width: 1000, height: 1500, ratioLabel: '2:3' },     // Pins are tall
  bluesky:   { width: 1200, height: 675,  ratioLabel: '16:9' },    // timeline card, like X
  tumblr:    { width: 1080, height: 1350, ratioLabel: '4:5' },
  threads:   { width: 1080, height: 1350, ratioLabel: '4:5' },     // shares Instagram's crop rules
  snapchat:  { width: 1080, height: 1920, ratioLabel: '9:16' },    // full-screen vertical
};

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const ORIGINALS_DIR = path.join(UPLOAD_ROOT, 'originals');
const FITTED_DIR = path.join(UPLOAD_ROOT, 'fitted');

for (const dir of [UPLOAD_ROOT, ORIGINALS_DIR, FITTED_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

function isVideo(mimetype) {
  return mimetype.startsWith('video/');
}

async function fitImage(inputPath, outputPath, spec) {
  await sharp(inputPath)
    .resize(spec.width, spec.height, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 88 })
    .toFile(outputPath);
}

function fitVideo(inputPath, outputPath, spec) {
  if (!ffmpeg) {
    fs.copyFileSync(inputPath, outputPath);
    return Promise.resolve({ skipped: true });
  }
  return new Promise((resolve) => {
    ffmpeg(inputPath)
      .videoFilters([
        `scale=${spec.width}:${spec.height}:force_original_aspect_ratio=increase`,
        `crop=${spec.width}:${spec.height}`,
      ])
      .outputOptions(['-movflags +faststart'])
      .on('end', () => resolve({ skipped: false }))
      .on('error', () => {
        // Fall back to the original file untouched rather than failing
        // the whole request - the person still gets their video attached.
        fs.copyFileSync(inputPath, outputPath);
        resolve({ skipped: true });
      })
      .save(outputPath);
  });
}

// Produces (or reuses a cached) platform-fitted version of an uploaded
// media file. Returns a URL path servable from /uploads.
async function fitMediaForPlatform({ originalFilename, mimetype, platform }) {
  const spec = PLATFORM_SPECS[platform];
  if (!spec) throw new Error(`Unknown platform: ${platform}`);

  const inputPath = path.join(ORIGINALS_DIR, originalFilename);
  if (!fs.existsSync(inputPath)) throw new Error('Original media not found');

  const video = isVideo(mimetype);
  const ext = video ? path.extname(originalFilename) || '.mp4' : '.jpg';
  const outputFilename = `${path.parse(originalFilename).name}-${platform}${ext}`;
  const outputPath = path.join(FITTED_DIR, outputFilename);

  if (!fs.existsSync(outputPath)) {
    if (video) {
      await fitVideo(inputPath, outputPath, spec);
    } else {
      await fitImage(inputPath, outputPath, spec);
    }
  }

  return {
    url: `/uploads/fitted/${outputFilename}`,
    mediaType: video ? 'video' : 'image',
    spec,
  };
}

// Generates an image from a text prompt and saves it as a new "original",
// so it can flow through the exact same per-platform fit pipeline as an
// uploaded photo.
//
// Two paths:
//  - If XAI_API_KEY is set, uses xAI's real Grok image model (grok-2-image).
//    This is a paid API - see https://x.ai/api for a key.
//  - Otherwise, falls back to Pollinations (https://pollinations.ai), a
//    genuinely free, no-signup, no-API-key image generation service. Quality
//    is more variable than Grok's, but it costs nothing and needs no setup.
async function generateImage({ prompt }) {
  if (!prompt || !prompt.trim()) throw new Error('A prompt is required');

  const filename = `${uuidv4()}.jpg`;
  const outputPath = path.join(ORIGINALS_DIR, filename);

  if (process.env.XAI_API_KEY) {
    const res = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({ model: 'grok-2-image', prompt }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Grok image generation failed (${res.status}): ${errText}`);
    }
    const data = await res.json();
    const imageUrl = data?.data?.[0]?.url;
    if (!imageUrl) throw new Error('Grok returned no image URL');

    const imgRes = await fetch(imageUrl);
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    return { filename, mimetype: 'image/jpeg', mediaType: 'image', originalUrl: `/uploads/originals/${filename}`, provider: 'grok' };
  }

  // Free fallback - no key, no signup. See https://pollinations.ai
  const encoded = encodeURIComponent(prompt);
  const res = await fetch(`https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true`);
  if (!res.ok) {
    throw new Error(`Free image generation failed (${res.status}). Try again, or add XAI_API_KEY for the paid Grok model.`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  return { filename, mimetype: 'image/jpeg', mediaType: 'image', originalUrl: `/uploads/originals/${filename}`, provider: 'pollinations' };
}

module.exports = { PLATFORM_SPECS, fitMediaForPlatform, generateImage, ORIGINALS_DIR, isVideo };