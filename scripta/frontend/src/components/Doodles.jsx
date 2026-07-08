// A small library of original, hand-drawn-style line-art decorations used
// to fill empty space in a scrapbook-appropriate way - a butterfly, a
// flower sprig, a paperclip, and a dashed "flight path" - all drawn from
// scratch as simple SVG line art (no external images).

export function Butterfly({ className = '', color = '#4A3624' }) {
  return (
    <svg viewBox="0 0 60 50" className={className} fill="none" stroke={color} strokeWidth="1.2">
      <path d="M30,10 C22,-2 4,2 6,16 C7,26 18,24 30,14" />
      <path d="M30,10 C38,-2 56,2 54,16 C53,26 42,24 30,14" />
      <path d="M30,14 C24,22 20,34 24,42 C26,36 28,30 30,26" />
      <path d="M30,14 C36,22 40,34 36,42 C34,36 32,30 30,26" />
      <line x1="30" y1="10" x2="30" y2="30" strokeWidth="1.6" />
      <path d="M30,11 C28,8 25,7 23,8" strokeWidth="0.8" />
      <path d="M30,11 C32,8 35,7 37,8" strokeWidth="0.8" />
    </svg>
  );
}

export function FlowerSprig({ className = '', color = '#5C7A52' }) {
  return (
    <svg viewBox="0 0 40 70" className={className} fill="none" stroke={color} strokeWidth="1.2">
      <path d="M20,70 C18,50 22,30 20,12" />
      <ellipse cx="12" cy="40" rx="7" ry="3" transform="rotate(-30 12 40)" />
      <ellipse cx="28" cy="50" rx="7" ry="3" transform="rotate(30 28 50)" />
      <ellipse cx="14" cy="58" rx="6" ry="2.5" transform="rotate(-20 14 58)" />
      <circle cx="20" cy="10" r="5" fill={color} opacity="0.25" />
      <circle cx="20" cy="10" r="2" fill={color} />
    </svg>
  );
}

export function Paperclip({ className = '', color = '#8A8477' }) {
  return (
    <svg viewBox="0 0 30 60" className={className} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round">
      <path d="M10,10 v32 a7,7 0 0 0 14,0 v-28 a4,4 0 0 0 -8,0 v24" />
    </svg>
  );
}

export function FlightPath({ className = '', color = '#4A3624' }) {
  return (
    <svg viewBox="0 0 120 40" className={className} fill="none" stroke={color} strokeWidth="1.4" strokeDasharray="4 5">
      <path d="M4,30 C30,4 60,36 90,10" />
      <path d="M90,10 l7,-3 l-2,7 z" fill={color} stroke="none" />
    </svg>
  );
}

export function Heart({ className = '', color = '#C98A93' }) {
  return (
    <svg viewBox="0 0 30 26" className={className} fill={color}>
      <path d="M15,26 C4,18 0,11 0,6.5 C0,2 3,0 6.5,0 C10,0 13,2 15,6 C17,2 20,0 23.5,0 C27,0 30,2 30,6.5 C30,11 26,18 15,26 Z" opacity="0.7" />
    </svg>
  );
}
