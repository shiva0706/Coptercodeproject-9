import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { PLATFORM_LABELS, PLATFORM_HEX } from '../platformStyles';
import { useToast } from '../components/Toast';
import ConfirmButton from '../components/ConfirmButton';

const STATUS_RING = { draft: 'border-ink/30', scheduled: 'border-tape', published: 'border-moss', failed: 'border-clay' };
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function postDateObj(post) {
  const raw = post.status === 'published' ? post.published_at : post.scheduled_at;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d) ? null : d;
}

function formatTime(d) {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function Calendar({ refreshKey }) {
  const [posts, setPosts] = useState([]);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);
  const [rescheduleValue, setRescheduleValue] = useState('');
  const showToast = useToast();

  function refresh() {
    api.getPosts().then((d) => setPosts(d.posts));
  }

  useEffect(refresh, [refreshKey]);

  const postsByDate = useMemo(() => {
    const map = {};
    for (const p of posts) {
      const d = postDateObj(p);
      if (!d) continue;
      const key = dateKey(d);
      (map[key] = map[key] || []).push({ ...p, _time: d });
    }
    for (const key in map) map[key].sort((a, b) => a._time - b._time);
    return map;
  }, [posts]);

  const undated = posts.filter((p) => !postDateObj(p));

  const cells = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [monthCursor]);

  const todayKey = dateKey(new Date());
  const monthLabel = monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  function changeMonth(delta) {
    setMonthCursor((cur) => new Date(cur.getFullYear(), cur.getMonth() + delta, 1));
    setSelectedDate(null);
  }

  function startReschedule(post) {
    setRescheduling(post.id);
    setRescheduleValue(post.scheduled_at ? post.scheduled_at.slice(0, 16) : '');
  }

  async function saveReschedule(post) {
    if (!rescheduleValue) return;
    await api.updatePost(post.id, {
      content: post.content,
      platform: post.platform,
      scheduled_at: new Date(rescheduleValue).toISOString(),
    });
    setRescheduling(null);
    showToast('Rescheduled', 'success');
    refresh();
  }

  async function remove(id) {
    await api.deletePost(id);
    if (rescheduling === id) setRescheduling(null);
    showToast('Torn out', 'info');
    refresh();
  }

  const selectedPosts = selectedDate ? (postsByDate[selectedDate] || []) : [];

  return (
    <div className="font-body">
      <h1 className="font-display text-4xl text-ink mb-1">Calendar page</h1>
      <p className="font-label text-ink/50 text-base mb-6">a month at a glance — each color is a platform, click any day for exact times</p>

      <div className="journal-page torn-edge-top rounded-b-lg px-5 pt-8 pb-5 relative rotate-[-0.3deg] mb-8">
        <div className="washi-tape washi-pine" />

        <div className="flex items-center justify-between mb-4">
          <button onClick={() => changeMonth(-1)} className="px-3 py-1 rounded-full border-2 border-line text-ink/60 hover:text-ink font-label text-sm">‹ prev</button>
          <h2 className="font-display text-3xl text-ink">{monthLabel}</h2>
          <button onClick={() => changeMonth(1)} className="px-3 py-1 rounded-full border-2 border-line text-ink/60 hover:text-ink font-label text-sm">next ›</button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((w) => <div key={w} className="text-center text-xs font-label text-ink/50 py-1">{w}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d) => {
            const key = dateKey(d);
            const inMonth = d.getMonth() === monthCursor.getMonth();
            const dayPosts = postsByDate[key] || [];
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(key === selectedDate ? null : key)}
                className={`text-left rounded border-2 p-1.5 min-h-[70px] transition ${
                  inMonth ? 'bg-white/60' : 'bg-white/20 opacity-50'
                } ${isSelected ? 'border-scripta' : isToday ? 'border-tape' : 'border-line'}`}
              >
                <div className={`text-xs font-mono flex items-center gap-1 ${isToday ? 'text-tape font-bold' : 'text-ink/60'}`}>
                  {d.getDate()}{isToday && <span>📍</span>}
                </div>
                <div className="flex flex-col gap-0.5 mt-1">
                  {dayPosts.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      title={`${PLATFORM_LABELS[p.platform] || p.platform} · ${p.status} · ${formatTime(p._time)}`}
                      className={`flex items-center gap-1 rounded-sm px-1 py-px border ${STATUS_RING[p.status]}`}
                      style={{ backgroundColor: `${PLATFORM_HEX[p.platform]}22` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: PLATFORM_HEX[p.platform] }} />
                      {dayPosts.length <= 2 && (
                        <span className="text-[9px] font-mono text-ink/60 truncate">{formatTime(p._time)}</span>
                      )}
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-[10px] font-label text-ink/50">+{dayPosts.length - 3} more</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs font-label text-ink/60">
          {Object.keys(PLATFORM_LABELS).map((p) => (
            <span key={p} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PLATFORM_HEX[p] }} /> {PLATFORM_LABELS[p]}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-ink/40 font-label mt-2">border style shows status: solid ring = published, mustard = scheduled, faint = draft, red = failed</p>
      </div>

      {selectedDate && (
        <div className="mb-8">
          <h3 className="font-display text-2xl text-ink mb-3">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          {selectedPosts.length === 0 && <p className="text-ink/40 text-sm font-label">Nothing pinned to this day.</p>}
          <div className="space-y-3">
            {selectedPosts.map((p) => (
              <div key={p.id} className="journal-page torn-edge-top rounded-b-lg px-4 pt-6 pb-4 relative rotate-[0.5deg]">
                <div className="washi-tape" style={{ width: '60px', height: '20px' }} />
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="ink-stamp px-2 py-0.5 text-xs font-label uppercase tracking-wide -rotate-2"
                    style={{ color: PLATFORM_HEX[p.platform] }}
                  >
                    {PLATFORM_LABELS[p.platform] || p.platform}
                  </span>
                  <span className="font-mono text-sm font-bold text-ink">{formatTime(p._time)}</span>
                </div>
                <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed mb-2">{p.content}</p>
                <p className="text-xs text-ink/40 font-label mb-2">{p.status}</p>

                {rescheduling === p.id ? (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-dashed border-line">
                    <input
                      type="datetime-local"
                      value={rescheduleValue}
                      onChange={(e) => setRescheduleValue(e.target.value)}
                      className="px-2 py-1 rounded border-2 border-line bg-white/80 text-xs font-mono"
                    />
                    <button onClick={() => saveReschedule(p)} className="text-scripta hover:underline text-xs font-label">save</button>
                    <button onClick={() => setRescheduling(null)} className="text-ink/50 hover:underline text-xs font-label">cancel</button>
                  </div>
                ) : (
                  <div className="flex gap-3 text-xs font-label pt-2 border-t border-dashed border-line">
                    {p.status !== 'published' && (
                      <button onClick={() => startReschedule(p)} className="text-scripta hover:underline">reschedule</button>
                    )}
                    <ConfirmButton onConfirm={() => remove(p.id)} className="text-clay hover:underline" confirmLabel="tear out for real?">
                      tear out
                    </ConfirmButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {undated.length > 0 && (
        <div>
          <h3 className="font-display text-2xl text-ink mb-1">Not yet dated</h3>
          <p className="font-label text-ink/50 text-sm mb-3">drafts waiting for a day on the calendar</p>
          <div className="space-y-3">
            {undated.map((p) => (
              <div key={p.id} className="journal-page torn-edge-top rounded-b-lg px-4 pt-6 pb-4 relative -rotate-1">
                <div className="washi-tape washi-pine" style={{ width: '60px', height: '20px' }} />
                <div className="flex items-center justify-between mb-2">
                  <span className="ink-stamp px-2 py-0.5 text-xs font-label uppercase tracking-wide -rotate-2" style={{ color: PLATFORM_HEX[p.platform] }}>
                    {PLATFORM_LABELS[p.platform] || p.platform}
                  </span>
                  <span className="font-label text-sm text-ink/50">draft</span>
                </div>
                <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed mb-2">{p.content}</p>

                {rescheduling === p.id ? (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-dashed border-line">
                    <input
                      type="datetime-local"
                      value={rescheduleValue}
                      onChange={(e) => setRescheduleValue(e.target.value)}
                      className="px-2 py-1 rounded border-2 border-line bg-white/80 text-xs font-mono"
                    />
                    <button onClick={() => saveReschedule(p)} className="text-scripta hover:underline text-xs font-label">save</button>
                    <button onClick={() => setRescheduling(null)} className="text-ink/50 hover:underline text-xs font-label">cancel</button>
                  </div>
                ) : (
                  <div className="flex gap-3 text-xs font-label pt-2 border-t border-dashed border-line">
                    <button onClick={() => startReschedule(p)} className="text-scripta hover:underline">give it a date</button>
                    <ConfirmButton onConfirm={() => remove(p.id)} className="text-clay hover:underline" confirmLabel="tear out for real?">
                      tear out
                    </ConfirmButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
