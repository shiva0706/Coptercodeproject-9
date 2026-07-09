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

// Speaker with sound waves - used for voice input. A stubby speaker cone
// plus two curved arcs, drawn the same hand-inked way as the rest of the set.
export function Speaker({ className = '', color = '#2A2118' }) {
  return (
    <svg viewBox="0 0 44 40" className={className} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4,15 h6 l10,-9 v28 l-10,-9 h-6 Z" fill={color} opacity="0.15" />
      <path d="M4,15 h6 l10,-9 v28 l-10,-9 h-6 Z" />
      <path d="M27,13 C31,16.5 31,23.5 27,27" strokeWidth="1.6" />
      <path d="M32,8 C39,15 39,25 32,32" strokeWidth="1.6" />
    </svg>
  );
}

// Paper plane with a short dashed trail - kept deliberately simple so it
// still reads clearly at small icon sizes (no tight loops that turn into a
// scribble once scaled down).
export function PaperPlane({ className = '', color = '#2A2118' }) {
  return (
    <svg viewBox="0 0 44 32" className={className} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2,26 C10,27 16,25 20,21" strokeDasharray="1 4.5" opacity="0.55" />
      <path d="M15,20 L42,4 L28,13 L24,27 L19,17 L15,20 Z" fill={color} opacity="0.14" />
      <path d="M15,20 L42,4 L28,13 L24,27 L19,17 L15,20 Z" />
      <path d="M19,17 L28,13" strokeWidth="1.3" />
    </svg>
  );
}

// Simple boxy camera with a lens and a little flash - used for uploading
// your own photo/clip.
export function Camera({ className = '', color = '#2A2118' }) {
  return (
    <svg viewBox="0 0 44 36" className={className} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="9" width="40" height="24" rx="3" fill={color} opacity="0.1" />
      <rect x="2" y="9" width="40" height="24" rx="3" />
      <rect x="15" y="3" width="12" height="6" rx="1.5" />
      <circle cx="22" cy="21" r="8" fill="none" />
      <circle cx="22" cy="21" r="3.4" />
      <line x1="35" y1="14" x2="37" y2="14" strokeWidth="2" />
    </svg>
  );
}

// Magnifying glass - used for searching/filtering lists.
export function MagnifyingGlass({ className = '', color = '#2A2118' }) {
  return (
    <svg viewBox="0 0 34 34" className={className} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round">
      <circle cx="14" cy="14" r="10" />
      <line x1="21.5" y1="21.5" x2="31" y2="31" />
    </svg>
  );
}

// Light bulb - yellow glass bulb with a silver screw base. Kept deliberately
// simple (no rays) so it stays clean and legible at small icon sizes.
export function LightBulb({ className = '', outline = '#2A2118', bulbColor = '#F3CB4C', baseColor = '#B9B4AA' }) {
  return (
    <svg viewBox="0 0 60 70" className={className} fill="none" stroke={outline} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {/* glass bulb */}
      <path
        d="M30,8 C20,8 13,16 13,26 C13,34 17,38 21,44 C23,47 24,49 24,52 L36,52 C36,49 37,47 39,44 C43,38 47,34 47,26 C47,16 40,8 30,8 Z"
        fill={bulbColor}
      />
      {/* shine highlight */}
      <path d="M21,20 C21,16 24,13 28,13" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.85" fill="none" />
      <circle cx="20" cy="24" r="1.6" fill="#FFFFFF" stroke="none" opacity="0.85" />
      {/* screw base */}
      <path d="M24,52 h12 v11 a3,3 0 0 1 -3,3 h-6 a3,3 0 0 1 -3,-3 Z" fill={baseColor} />
      <line x1="24.5" y1="56" x2="35.5" y2="56" strokeWidth="1.6" />
      <line x1="24.5" y1="60" x2="35.5" y2="60" strokeWidth="1.6" />
      <line x1="26" y1="66" x2="34" y2="66" strokeWidth="1.8" />
    </svg>
  );
}

// A simple open, empty folder - used as a placeholder before any file is
// chosen in a custom file-upload control.
export function EmptyFolder({ className = '', color = '#8A8477' }) {
  return (
    <svg viewBox="0 0 40 32" className={className} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2,10 L2,6 a2,2 0 0 1 2,-2 h9 l3,3 h18 a2,2 0 0 1 2,2 v3" />
      <path d="M2,10 h34 l-3,18 a2,2 0 0 1 -2,1.6 H7 a2,2 0 0 1 -2,-1.6 Z" />
    </svg>
  );
}

// Three overlapping cards, fanned out - used to represent posting the same
// idea out to several platforms at once.
export function Stack({ className = '', color = '#2A2118' }) {
  return (
    <svg viewBox="0 0 40 34" className={className} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="12" width="20" height="16" rx="2.5" transform="rotate(-8 12 20)" fill="#F7F0DE" opacity="0.9" />
      <rect x="2" y="12" width="20" height="16" rx="2.5" transform="rotate(-8 12 20)" />
      <rect x="11" y="8" width="20" height="16" rx="2.5" transform="rotate(3 21 16)" fill="#F7F0DE" opacity="0.95" />
      <rect x="11" y="8" width="20" height="16" rx="2.5" transform="rotate(3 21 16)" />
      <rect x="18" y="4" width="20" height="16" rx="2.5" fill={color} opacity="0.1" />
      <rect x="18" y="4" width="20" height="16" rx="2.5" />
    </svg>
  );
}