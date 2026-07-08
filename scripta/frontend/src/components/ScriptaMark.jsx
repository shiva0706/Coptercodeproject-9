// The signature visual: a hand-inked, slightly wobbly line strung between
// small torn-paper tabs representing each platform — one idea, threaded
// across a scrapbook page to every platform.
export default function ScriptaMark({ animated = true, className = '' }) {
  return (
    <svg viewBox="0 0 260 40" className={className} aria-hidden="true">
      <path
        d="M5,21 C25,10 35,32 55,20 C70,11 78,30 95,19 C112,9 120,31 135,20 C152,9 160,31 175,19 C192,9 200,31 215,20 C228,12 238,28 255,19"
        className={`scripta-line ${animated ? 'scripta-animate' : ''}`}
      />
      {[5, 55, 95, 135, 175, 215, 255].map((cx, i) => (
        <rect
          key={i}
          x={cx - 5}
          y={16 + (i % 2 === 0 ? -3 : 3)}
          width="10"
          height="8"
          rx="1.5"
          fill="#D6A756"
          opacity={0.9}
          transform={`rotate(${i % 2 === 0 ? -8 : 8} ${cx} ${16 + (i % 2 === 0 ? -3 : 3) + 4})`}
        />
      ))}
    </svg>
  );
}
