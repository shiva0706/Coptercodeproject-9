import { useEffect, useState } from 'react';
import { api } from '../api';

export default function BrandVoice() {
  const [profile, setProfile] = useState({ tone: '', audience: '', rules: '', sample_posts: '' });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBrand().then((d) => {
      setProfile(d.profile || profile);
      setLoading(false);
    });
  }, []);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      const d = await api.updateBrand(profile);
      setProfile(d.profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-ink/50 font-label text-base">turning the page…</p>;

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
            className="w-full px-3 py-2 rounded border-2 border-line bg-white/70 focus:bg-white transition text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-label text-ink/70 mb-1">audience</label>
          <input
            value={profile.audience}
            onChange={(e) => setProfile({ ...profile, audience: e.target.value })}
            placeholder="e.g. small business owners just starting out"
            className="w-full px-3 py-2 rounded border-2 border-line bg-white/70 focus:bg-white transition text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-label text-ink/70 mb-1">rules — likes and dislikes</label>
          <textarea
            value={profile.rules}
            onChange={(e) => setProfile({ ...profile, rules: e.target.value })}
            placeholder="e.g. no corporate jargon, always end with a question, never use the word 'synergy'"
            rows={3}
            className="w-full px-3 py-2 rounded border-2 border-line bg-white/70 focus:bg-white transition text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-label text-ink/70 mb-1">sample posts that sound like you</label>
          <textarea
            value={profile.sample_posts}
            onChange={(e) => setProfile({ ...profile, sample_posts: e.target.value })}
            placeholder="Paste 1-3 posts you've written that capture your voice"
            rows={4}
            className="w-full px-3 py-2 rounded border-2 border-line bg-white/70 focus:bg-white transition text-sm"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded bg-scripta text-paper text-sm font-label tracking-wide hover:bg-scriptaDeep transition disabled:opacity-50"
          >
            {busy ? 'saving…' : 'save these notes'}
          </button>
          {saved && <span className="text-moss text-sm font-label">✓ pinned to the page</span>}
        </div>
      </form>
    </div>
  );
}
