import { useEffect, useState } from 'react';
import { api } from '../api';

// Multiple sample-post boxes get joined into the single sample_posts string
// the backend actually stores, separated by this marker, and split back
// apart on load. Keeps the backend/db shape untouched.
const SAMPLE_SEPARATOR = '\n\n---\n\n';
const MAX_SAMPLES = 5;
const TONE_LIMIT = 100;
const RULES_LIMIT = 300;

function splitSamples(raw) {
  const parts = (raw || '').split(SAMPLE_SEPARATOR).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : [''];
}

export default function BrandVoice() {
  const [profile, setProfile] = useState({ tone: '', audience: '', rules: '', sample_posts: '' });
  const [samples, setSamples] = useState(['']);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    api.getBrand().then((d) => {
      const loaded = d.profile || profile;
      setProfile(loaded);
      setSamples(splitSamples(loaded.sample_posts));
      setLoading(false);
    });
  }, []);

  function updateSample(i, value) {
    setSamples((cur) => cur.map((s, idx) => (idx === i ? value : s)));
  }

  function addSample() {
    setSamples((cur) => (cur.length < MAX_SAMPLES ? [...cur, ''] : cur));
  }

  function removeSample(i) {
    setSamples((cur) => (cur.length > 1 ? cur.filter((_, idx) => idx !== i) : cur));
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    const sample_posts = samples.map((s) => s.trim()).filter(Boolean).join(SAMPLE_SEPARATOR);
    try {
      const d = await api.updateBrand({ ...profile, sample_posts });
      setProfile(d.profile);
      setSamples(splitSamples(d.profile.sample_posts));
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setBusy(false);
    }
  }

  async function analyzeVoice() {
    const text = samples.map((s) => s.trim()).filter(Boolean).join('\n\n');
    if (!text) return;
    setAnalyzing(true);
    setAnalyzeError('');
    setSuggestion(null);
    try {
      const d = await api.analyzeVoice(text);
      setSuggestion(d.suggestion);
    } catch (err) {
      setAnalyzeError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  function applySuggestion() {
    if (!suggestion) return;
    setProfile((cur) => ({
      ...cur,
      tone: suggestion.tone || cur.tone,
      rules: suggestion.rules || cur.rules,
    }));
    setSuggestion(null);
  }

  if (loading) return <p className="text-ink/50 font-label text-base">turning the page…</p>;

  const hasAnySample = samples.some((s) => s.trim());
  // Warm, thin-bordered look shared by every input/textarea on this page,
  // so they blend into the paper instead of sitting on it as stark white
  // boxes.
  const fieldClass =
    'w-full px-3 py-2 rounded border border-line/60 bg-[#FBF6E8] focus:bg-white focus:border-scripta/50 transition text-sm placeholder:text-ink/30';

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-4xl text-ink mb-1">About my voice</h1>
      <p className="font-label text-ink/50 text-base mb-6">the notes we keep in the margin so every post still sounds like you</p>

      <form onSubmit={save} className="journal-page torn-edge-top rounded-b-lg px-6 pt-8 pb-6 relative rotate-[0.4deg] space-y-4 font-body">
        <div className="washi-tape" />

        <div>
          <label className="block text-sm font-label text-ink/70 mb-1">tone</label>
          <input
            value={profile.tone}
            onChange={(e) => setProfile({ ...profile, tone: e.target.value })}
            placeholder="e.g. witty and warm, never corporate"
            className={fieldClass}
          />
          <div className="flex justify-end mt-0.5">
            <span className={`text-[11px] font-mono ${profile.tone.length > TONE_LIMIT ? 'text-clay' : 'text-ink/30'}`}>
              {profile.tone.length}/{TONE_LIMIT}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-label text-ink/70 mb-1">audience</label>
          <input
            value={profile.audience}
            onChange={(e) => setProfile({ ...profile, audience: e.target.value })}
            placeholder="e.g. small business owners just starting out"
            className={fieldClass}
          />
        </div>

        <div>
          <label className="block text-sm font-label text-ink/70 mb-1">rules — likes and dislikes</label>
          <textarea
            value={profile.rules}
            onChange={(e) => setProfile({ ...profile, rules: e.target.value })}
            placeholder="e.g. no corporate jargon, always end with a question, never use the word 'synergy'"
            rows={3}
            className={fieldClass}
          />
          <div className="flex justify-end mt-0.5">
            <span className={`text-[11px] font-mono ${profile.rules.length > RULES_LIMIT ? 'text-clay' : 'text-ink/30'}`}>
              {profile.rules.length}/{RULES_LIMIT}
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-label text-ink/70">sample posts that sound like you</label>
            <button
              type="button"
              onClick={analyzeVoice}
              disabled={!hasAnySample || analyzing}
              className="text-xs font-label text-scripta hover:underline disabled:opacity-40 disabled:hover:no-underline"
            >
              {analyzing ? 'reading your samples…' : '✨ analyze my voice'}
            </button>
          </div>

          <div className="space-y-2">
            {samples.map((s, i) => (
              <div key={i} className="relative">
                <textarea
                  value={s}
                  onChange={(e) => updateSample(i, e.target.value)}
                  placeholder={`Paste a post you've written that captures your voice${samples.length > 1 ? ` (${i + 1})` : ''}`}
                  rows={3}
                  className={fieldClass}
                />
                {samples.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSample(i)}
                    aria-label="remove this sample"
                    className="absolute -right-1.5 -top-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-paper border border-line/70 text-ink/40 hover:text-clay hover:border-clay/50 text-xs leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {samples.length < MAX_SAMPLES && (
            <button
              type="button"
              onClick={addSample}
              className="mt-2 text-xs font-label text-ink/50 hover:text-scripta underline decoration-dotted"
            >
              + add another sample
            </button>
          )}

          {analyzeError && <p className="text-clay text-xs font-label mt-2">{analyzeError}</p>}

          {suggestion && (
            <div className="mt-3 px-3 py-3 rounded border border-dashed border-scripta/50 bg-scripta/5 space-y-2">
              <p className="text-xs font-label text-scripta uppercase tracking-wide">suggested from your samples</p>
              {suggestion.tone && (
                <p className="text-sm text-ink/80"><span className="font-label text-ink/50">tone:</span> {suggestion.tone}</p>
              )}
              {suggestion.rules && (
                <p className="text-sm text-ink/80"><span className="font-label text-ink/50">rules:</span> {suggestion.rules}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={applySuggestion} className="text-xs font-label text-scripta hover:underline font-bold">
                  apply to fields above
                </button>
                <button type="button" onClick={() => setSuggestion(null)} className="text-xs font-label text-ink/40 hover:underline">
                  dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={busy}
          className={`w-full px-4 py-3 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-2 text-base font-label tracking-wide transition-all duration-300 disabled:opacity-50 ${
            saved ? 'bg-moss border-moss text-paper' : 'bg-scripta border-scriptaDeep/40 text-paper hover:bg-scriptaDeep'
          }`}
        >
          {busy ? 'saving…' : saved ? '✓ saved!' : 'save these notes'}
        </button>
      </form>
    </div>
  );
}