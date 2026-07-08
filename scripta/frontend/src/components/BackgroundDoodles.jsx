// A handful of quiet, slowly-drifting scrapbook scraps behind every page -
// a stray washi tape strip, a loose thread loop, a couple of paper-scrap
// dots. Low opacity, slow motion, and fully still if the person has
// prefers-reduced-motion set (handled in index.css).
export default function BackgroundDoodles() {
  return (
    <div className="bg-doodle-layer" aria-hidden="true">
      <svg
        className="absolute top-[8%] left-[6%] w-16 h-6 opacity-20 doodle-drift-1"
        viewBox="0 0 80 26"
      >
        <rect width="80" height="26" rx="3" fill="#D6A756" />
      </svg>

      <svg
        className="absolute top-[65%] left-[88%] w-20 h-20 opacity-15 doodle-spin-slow"
        viewBox="0 0 100 100"
      >
        <circle cx="50" cy="50" r="42" fill="none" stroke="#3F6659" strokeWidth="2" strokeDasharray="3 9" />
      </svg>

      <svg
        className="absolute top-[20%] left-[92%] w-10 h-10 opacity-20 doodle-bob"
        viewBox="0 0 40 40"
      >
        <circle cx="20" cy="20" r="16" fill="#8C3A3A" opacity="0.5" />
      </svg>

      <svg
        className="absolute top-[85%] left-[10%] w-14 h-14 opacity-15 doodle-drift-2"
        viewBox="0 0 60 60"
      >
        <rect x="10" y="10" width="40" height="40" rx="4" fill="none" stroke="#2A2118" strokeWidth="2" strokeDasharray="2 6" />
      </svg>

      <svg
        className="absolute top-[42%] left-[3%] w-8 h-8 opacity-20 doodle-drift-3"
        viewBox="0 0 40 40"
      >
        <circle cx="20" cy="20" r="14" fill="#5C7A52" opacity="0.5" />
      </svg>

      <svg
        className="absolute top-[5%] left-[45%] w-24 h-8 opacity-10 doodle-drift-1"
        viewBox="0 0 100 30"
      >
        <path d="M2,15 C25,2 40,28 60,15 S90,2 98,15" stroke="#3F6659" strokeWidth="2" fill="none" strokeDasharray="3 6" />
      </svg>
    </div>
  );
}
