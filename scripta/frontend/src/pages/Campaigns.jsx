import { useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import ConfirmButton from '../components/ConfirmButton';
import { FlowerSprig } from '../components/Doodles';

const ROTATIONS = ['-rotate-1', 'rotate-1', '-rotate-1.5', 'rotate-1.5'];

function ProgressBar({ counts, total }) {
  if (total === 0) return <p className="text-xs text-ink/40 font-label">no posts pinned to this yet</p>;
  const pct = (n) => Math.round((n / total) * 100);
  return (
    <div>
      <div className="w-full h-3 rounded-full overflow-hidden border-2 border-line flex bg-white/60">
        <div style={{ width: `${pct(counts.published)}%` }} className="bg-moss h-full" />
        <div style={{ width: `${pct(counts.scheduled)}%` }} className="bg-tape h-full" />
        <div style={{ width: `${pct(counts.failed)}%` }} className="bg-clay h-full" />
      </div>
      <p className="text-xs text-ink/50 font-label mt-1">
        {counts.published} published · {counts.scheduled} scheduled · {counts.draft} draft{counts.failed ? ` · ${counts.failed} failed` : ''}
      </p>
    </div>
  );
}

export default function Campaigns({ onOpenCampaign }) {
  const [campaigns, setCampaigns] = useState([]);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');
  const showToast = useToast();

  function refresh() {
    api.getCampaigns().then((d) => setCampaigns(d.campaigns));
  }

  useEffect(refresh, []);

  async function create(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return;
    try {
      await api.createCampaign({ name: name.trim(), goal: goal.trim() });
      setName('');
      setGoal('');
      showToast('Campaign started', 'success');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    await api.deleteCampaign(id);
    showToast('Campaign wrapped up', 'info');
    refresh();
  }

  return (
    <div className="font-body">
      <h1 className="font-display text-4xl text-ink mb-1">Campaigns</h1>
      <p className="font-label text-ink/50 text-base mb-6">group posts around a goal, and watch the pile move instead of just posting into the void</p>

      <form onSubmit={create} className="journal-page torn-edge-top rounded-b-lg px-6 pt-8 pb-6 relative rotate-[-0.4deg] space-y-3 mb-10">
        <div className="washi-tape washi-pine" />
        <div>
          <label className="block text-sm font-label text-ink/70 mb-1">campaign name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Autumn product launch"
            className="w-full px-3 py-2 rounded border-2 border-line bg-white/70 focus:bg-white transition text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-label text-ink/70 mb-1">what's the goal?</label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. 200 waitlist signups by end of month"
            className="w-full px-3 py-2 rounded border-2 border-line bg-white/70 focus:bg-white transition text-sm"
          />
        </div>
        {error && <p className="text-clay text-sm font-label">{error}</p>}
        <button type="submit" className="px-4 py-2 rounded bg-scripta text-paper text-sm font-label tracking-wide hover:bg-scriptaDeep transition">
          start this campaign
        </button>
      </form>

      {campaigns.length === 0 && (
        <div className="journal-page torn-edge-top rounded-b-lg px-8 py-10 text-center relative rotate-[0.4deg] max-w-md">
          <div className="washi-tape" />
          <FlowerSprig className="w-8 h-16 mx-auto mb-3 opacity-60" />
          <p className="text-ink/40 text-sm font-label">No campaigns yet — start one above to group posts around a goal.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-8">
        {campaigns.map((c, i) => (
          <div key={c.id} className={`journal-page torn-edge-top rounded-b-lg px-5 pt-7 pb-5 relative ${ROTATIONS[i % ROTATIONS.length]}`}>
            <div className={`washi-tape ${i % 2 === 0 ? '' : 'washi-pine'}`} />
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-display text-2xl text-ink leading-tight">{c.name}</h3>
              <ConfirmButton
                onConfirm={() => remove(c.id)}
                className="text-xs text-clay hover:underline font-label shrink-0 ml-2"
                confirmLabel="wrap up for real?"
              >
                wrap up
              </ConfirmButton>
            </div>
            {c.goal && <p className="text-sm text-ink/70 mb-3 italic">goal: {c.goal}</p>}
            <ProgressBar counts={c.postCounts} total={c.totalPosts} />
            {onOpenCampaign && (
              <button
                onClick={() => onOpenCampaign(c.id)}
                className="mt-4 text-xs font-label text-scripta hover:underline"
              >
                view its posts →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
