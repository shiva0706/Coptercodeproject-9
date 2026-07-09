import { useState } from 'react';
import { api } from '../api';
import { PLATFORM_LABELS, ALL_PLATFORMS } from '../platformStyles';

export default function Onboarding({ onDone }) {
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  function toggle(p) {
    setSelected((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  }

  async function finish() {
    setBusy(true);
    try {
      await api.savePlatforms(selected);
      onDone(selected);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative z-10">
      <div className="w-full max-w-md journal-page torn-edge-top rounded-b-lg px-7 pt-8 pb-7 rotate-[-0.5deg]">
        <div className="washi-tape washi-pine" />
        <h1 className="font-display text-4xl text-ink mb-1">Which platforms are you on?</h1>
        <p className="font-label text-ink/50 text-base mb-6">
          pick as many as you like — we'll pre-select these every time you write a post, you can still adjust it per post later
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          {ALL_PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              className={`px-3 py-1.5 rounded-full text-sm font-label transition border-2 ${
                selected.includes(p)
                  ? 'bg-scripta text-paper border-scripta'
                  : 'bg-white/60 text-ink/60 border-line hover:border-scripta/50'
              }`}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>

        <button
          onClick={finish}
          disabled={busy || selected.length === 0}
          className="w-full py-2.5 rounded bg-scripta text-paper font-label text-lg tracking-wide hover:bg-scriptaDeep transition disabled:opacity-50"
        >
          {busy ? 'saving…' : 'start writing'}
        </button>
        {selected.length === 0 && (
          <p className="text-xs text-ink/40 font-label mt-2 text-center">pick at least one to continue</p>
        )}
      </div>
    </div>
  );
}
