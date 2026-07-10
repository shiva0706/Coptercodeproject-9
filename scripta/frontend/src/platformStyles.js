// Shared per-platform identity used across Compose, Dashboard, Calendar,
// and Onboarding so the same platform always reads the same color at a
// glance.
export const PLATFORM_LABELS = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  x: 'X',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  youtube: 'YouTube',
  discord: 'Discord',
  reddit: 'Reddit',
  pinterest: 'Pinterest',
  bluesky: 'Bluesky',
  tumblr: 'Tumblr',
  threads: 'Threads',
  snapchat: 'Snapchat',
};

export const PLATFORM_RATIOS = {
  instagram: '4:5',
  tiktok: '9:16',
  x: '16:9',
  linkedin: '1.91:1',
  facebook: '1.91:1',
  youtube: '16:9',
  discord: '16:9',
  reddit: '4:5',
  pinterest: '2:3',
  bluesky: '16:9',
  tumblr: '4:5',
  threads: '4:5',
  snapchat: '9:16',
};

// Hex colors used inline (e.g. SVG fills, inline styles) where a Tailwind
// utility class isn't practical. Roughly nodding to each platform's real
// brand color, muted to fit the scrapbook palette.
export const PLATFORM_HEX = {
  instagram: '#B23A6B',
  tiktok: '#20302C',
  x: '#22221F',
  linkedin: '#2A5C8A',
  facebook: '#3E5C97',
  youtube: '#CC5500',
  discord: '#5865A4',
  reddit: '#C1502E',
  pinterest: '#B23434',
  bluesky: '#3A87C7',
  tumblr: '#2E3440',
  threads: '#3A3A3A',
  snapchat: '#B8A400',
};

export const ALL_PLATFORMS = Object.keys(PLATFORM_LABELS);

// Character limits per platform. Where a platform actually enforces a hard
// ceiling (the post would get cut off or rejected past this point), it's
// listed here AND in PLATFORM_HARD_LIMIT below. Platforms with effectively
// no real-world limit (Facebook, Reddit, Tumblr) are simply omitted - the
// UI just shows a running count for those with no red-line warning.
export const PLATFORM_CHAR_LIMIT = {
  x: 280,
  bluesky: 300,
  threads: 500,
  snapchat: 250,
  pinterest: 500,
  instagram: 2200,
  tiktok: 2200,
  discord: 2000,
  linkedin: 3000,
  youtube: 5000,
};

// Platforms where PLATFORM_CHAR_LIMIT is a real hard limit (the platform
// itself will truncate or reject anything longer) rather than just a
// generous soft ceiling worth being aware of.
export const PLATFORM_HARD_LIMIT = new Set(['x', 'bluesky', 'threads', 'snapchat', 'pinterest']);

// Rough textarea row counts so a platform's box shape hints at its style
// before you even read the character count - short/punchy platforms get
// compact boxes, long-form platforms get taller ones.
export const PLATFORM_TEXTAREA_ROWS = {
  x: 2,
  bluesky: 2,
  snapchat: 2,
  threads: 3,
  pinterest: 3,
  instagram: 4,
  tiktok: 4,
  discord: 4,
  youtube: 4,
  linkedin: 6,
  facebook: 6,
  reddit: 6,
  tumblr: 6,
};

// Target pixel dimensions matching PLATFORM_RATIOS, shown next to the ratio
// label so the target size is obvious at a glance (e.g. "1080×1350") rather
// than just the abstract ratio.
export const PLATFORM_DIMENSIONS = {
  instagram: { width: 1080, height: 1350 },
  tiktok: { width: 1080, height: 1920 },
  x: { width: 1200, height: 675 },
  linkedin: { width: 1200, height: 627 },
  facebook: { width: 1200, height: 630 },
  youtube: { width: 1280, height: 720 },
  discord: { width: 1280, height: 720 },
  reddit: { width: 1080, height: 1350 },
  pinterest: { width: 1000, height: 1500 },
  bluesky: { width: 1200, height: 675 },
  tumblr: { width: 1080, height: 1350 },
  threads: { width: 1080, height: 1350 },
  snapchat: { width: 1080, height: 1920 },
};