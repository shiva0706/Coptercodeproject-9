// Shared per-platform identity used across Compose, Dashboard, and
// Calendar so the same platform always reads the same color at a glance.
export const PLATFORM_LABELS = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  x: 'X',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  youtube: 'YouTube',
};

export const PLATFORM_RATIOS = {
  instagram: '4:5',
  tiktok: '9:16',
  x: '16:9',
  linkedin: '1.91:1',
  facebook: '1.91:1',
  youtube: '16:9',
};

// Hex colors used inline (e.g. SVG fills, inline styles) where a Tailwind
// utility class isn't practical.
export const PLATFORM_HEX = {
  instagram: '#B23A6B',
  tiktok: '#20302C',
  x: '#22221F',
  linkedin: '#2A5C8A',
  facebook: '#3E5C97',
  youtube: '#CC5500',
};
