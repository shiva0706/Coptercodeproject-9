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
