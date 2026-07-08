import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import ConfirmButton from '../components/ConfirmButton';
import { PLATFORM_LABELS as LABELS } from '../platformStyles';
import { FlowerSprig, Paperclip } from '../components/Doodles';

const STATUS_STYLE = {
  draft: 'text-ink/50',
  scheduled: 'text-tape',
  published: 'text-moss',
  failed: 'text-clay',
};

const ROTATIONS = ['-rotate-1.5', 'rotate-1', '-rotate-1', 'rotate-2.5', '-rotate-2.5', 'rotate-1.5'];

export default function Dashboard({ refreshKey }) {
  const [posts, setPosts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [filter, setFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState(null);
  const showToast = useToast();

  function refresh() {
    const params = {};
    if (filter) params.status = filter;
    if (campaignFilter) params.campaign_id = campaignFilter;
    api.getPosts(params).then((d) => setPosts(d.posts));
    api.getCampaigns().then((d) => setCampaigns(d.campaigns));
  }

  useEffect(refresh, [filter, campaignFilter, refreshKey]);

  const campaignName = (id) => campaigns.find((c) => c.id === id)?.name;

  const stats = useMemo(() => {
    const tally = { draft: 0, scheduled: 0, published: 0, failed: 0 };
    for (const p of posts) tally[p.status] = (tally[p.status] || 0) + 1;
    return tally;
  }, [posts]);

  const visiblePosts = useMemo(() => {
    if (!query.trim()) return posts;
    const q = query.trim().toLowerCase();
    return posts.filter((p) => p.content.toLowerCase().includes(q));
  }, [posts, query]);

  async function publishNow(id) {
    setBusyId(id);
    try {
      await api.publishNow(id);
      showToast('Published', 'success');
      refresh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id) {
    await api.deletePost(id);
    showToast('Torn out', 'info');
    refresh();
  }

  return (
    <div className="font-body">
      <h1 className="font-display text-4xl text-ink mb-1">Your entries</h1>
      <p className="font-label text-ink/50 text-base mb-4">every idea you've pasted in, sorted by how far along it is</p>

      {posts.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { label: 'drafts', value: stats.draft, color: 'text-ink/60' },
            { label: 'scheduled', value: stats.scheduled, color: 'text-tape' },
            { label: 'published', value: stats.published, color: 'text-moss' },
            { label: 'failed', value: stats.failed, color: 'text-clay' },
          ].map((s) => (
            <div key={s.label} className="px-3 py-1.5 rounded border-2 border-line bg-paper/70 text-center">
              <div className={`font-display text-2xl leading-none ${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-label text-ink/40 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4 font-label text-base items-center">
        {[
          { id: '', label: 'all pages' },
          { id: 'draft', label: 'drafts' },
          { id: 'scheduled', label: 'scheduled' },
          { id: 'published', label: 'published' },
          { id: 'failed', label: 'failed' },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className={`px-3 py-1 rounded-full transition border-2 ${
              filter === s.id ? 'bg-ink text-paper border-ink' : 'text-ink/60 hover:text-ink bg-paper/60 border-line'
            }`}
          >
            {s.label}
          </button>
        ))}
        {campaigns.length > 0 && (
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="px-3 py-1 rounded-full border-2 border-line bg-paper/60 text-ink/70 text-sm ml-1"
          >
            <option value="">all campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-2 mb-8">
        <Paperclip className="w-3 h-6 opacity-40 hidden sm:block" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search your entries…"
          className="w-full max-w-xs px-3 py-1.5 rounded-full border-2 border-line bg-paper/60 focus:bg-white transition text-sm font-body"
        />
      </div>

      {visiblePosts.length === 0 && (
        <div className="journal-page torn-edge-top rounded-b-lg px-8 py-10 text-center relative rotate-[-0.5deg] max-w-md">
          <div className="washi-tape washi-pine" />
          <FlowerSprig className="w-8 h-16 mx-auto mb-3 opacity-60" />
          <p className="text-ink/50 text-sm font-label">
            {posts.length === 0 ? "This page is blank — head to Write to paste your first idea in." : "Nothing matches that search."}
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-10">
        {visiblePosts.map((p, i) => (
          <div
            key={p.id}
            className={`journal-page torn-edge-top rounded-b-lg px-5 pt-7 pb-5 relative ${ROTATIONS[i % ROTATIONS.length]}`}
          >
            <div className={`washi-tape ${i % 2 === 0 ? '' : 'washi-pine'}`} />
            <div className="flex items-center justify-between mb-3">
              <span className="ink-stamp px-2 py-0.5 text-xs font-label uppercase tracking-wide text-scripta -rotate-2">
                {LABELS[p.platform] || p.platform}
              </span>
              <span className={`font-label text-sm ${STATUS_STYLE[p.status]}`}>{p.status}</span>
            </div>

            {p.media_path && (
              <div className={`polaroid mb-3 mx-auto max-w-[85%] ${i % 2 === 0 ? '-rotate-1' : 'rotate-1'}`}>
                {p.media_type === 'video' ? (
                  <video src={p.media_path} controls className="max-h-48" />
                ) : (
                  <img src={p.media_path} alt="" className="max-h-48" />
                )}
              </div>
            )}

            <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{p.content}</p>
            {p.campaign_id && campaignName(p.campaign_id) && (
              <p className="text-xs text-scripta mt-2 font-label">📌 {campaignName(p.campaign_id)}</p>
            )}
            {p.scheduled_at && p.status === 'scheduled' && (
              <p className="text-xs text-ink/50 mt-3 font-mono">→ {new Date(p.scheduled_at).toLocaleString()}</p>
            )}
            {p.publish_result && (
              <p className="text-xs text-ink/50 mt-2 font-mono">{p.publish_result}</p>
            )}
            <div className="flex gap-3 text-xs font-label mt-4 pt-3 border-t border-dashed border-line">
              {p.status !== 'published' && (
                <button
                  onClick={() => publishNow(p.id)}
                  disabled={busyId === p.id}
                  className="text-scripta hover:underline disabled:opacity-40"
                >
                  {busyId === p.id ? 'publishing…' : 'publish now'}
                </button>
              )}
              <ConfirmButton
                onConfirm={() => remove(p.id)}
                className="text-clay hover:underline"
                confirmClassName="text-clay font-semibold underline"
                confirmLabel="tear out for real?"
              >
                tear out
              </ConfirmButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
