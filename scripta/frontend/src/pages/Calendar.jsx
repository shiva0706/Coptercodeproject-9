import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { api } from '../api';
import { PLATFORM_LABELS, PLATFORM_HEX, ALL_PLATFORMS } from '../platformStyles';
import { useToast } from '../components/Toast';
import ConfirmButton from '../components/ConfirmButton';
import { FlowerSprig } from '../components/Doodles';

const STATUS_RING = { draft: 'border-ink/30', scheduled: 'border-tape', published: 'border-moss', failed: 'border-clay' };
const STATUS_LEGEND = [
  { key: 'draft', label: 'draft' },
  { key: 'scheduled', label: 'scheduled' },
  { key: 'published', label: 'published' },
  { key: 'failed', label: 'failed' },
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const STATUS_FILTERS = ['', 'draft', 'scheduled', 'published', 'failed'];
const CONFLICT_WINDOW_MS = 30 * 60000; // warn if same platform within 30 min

const BEST_TIMES = {
  instagram: 'Weekdays 11am–1pm or 7–9pm tend to do well',
  tiktok: 'Evenings 6–10pm, especially Tue–Thu',
  x: 'Weekday mornings 8–10am or lunchtime 12–1pm',
  linkedin: 'Tue–Thu, 8–10am',
  facebook: 'Weekday afternoons 1–3pm',
  youtube: 'Weekends, or weekday afternoons 2–4pm',
  discord: 'Evenings, when your community is most active',
  reddit: 'Early weekday mornings, 6–9am',
  pinterest: 'Evenings and weekends, 8–11pm',
  bluesky: 'Weekday mornings, similar to X',
  tumblr: 'Late evenings, 7pm–12am',
  threads: 'Similar to Instagram — 11am–1pm or 7–9pm',
  snapchat: 'Evenings, 6–9pm',
};

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
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
// Used in detail views where there's room - makes it explicit that times
// are shown in the browser's local timezone, since the server always
// stores scheduled_at/published_at as UTC ISO strings under the hood.
function formatTimeWithZone(d) {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
}
function snippet(content, len = 42) {
  const clean = content.replace(/\s+/g, ' ').trim();
  return clean.length > len ? clean.slice(0, len).trim() + '…' : clean;
}
function toICSDate(d) {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}
function escapeICS(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
function googleCalUrl(post, d) {
  const start = toICSDate(d);
  const end = toICSDate(new Date(d.getTime() + 30 * 60000));
  const text = encodeURIComponent(`${PLATFORM_LABELS[post.platform] || post.platform} post`);
  const details = encodeURIComponent(post.content);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}`;
}
function startOfWeek(d) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() - nd.getDay());
  nd.setHours(0, 0, 0, 0);
  return nd;
}
function sameContentSignature(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    if (x.id !== y.id || x.status !== y.status || x.scheduled_at !== y.scheduled_at || x.content !== y.content || x.published_at !== y.published_at) return false;
  }
  return true;
}

// A single reusable post detail card - used in the day-detail overlay,
// week view click-through, and undated tray. Lifted to module scope (not
// defined inside Calendar's render) so it isn't remounted on every render.
const PostCard = memo(function PostCard({ p, rescheduling, rescheduleValue, onRescheduleValueChange, onStartReschedule, onSaveReschedule, onCancelReschedule, onRetry, onRemove }) {
  return (
    <div className="journal-page torn-edge-top rounded-b-lg px-4 pt-6 pb-4 relative rotate-[0.5deg]">
      <div className="washi-tape" style={{ width: '60px', height: '20px' }} />
      <div className="flex items-center justify-between mb-2">
        <span className="ink-stamp px-2 py-0.5 text-xs font-label uppercase tracking-wide -rotate-2" style={{ color: PLATFORM_HEX[p.platform] }}>
          {PLATFORM_LABELS[p.platform] || p.platform}
        </span>
        {p._time && <span className="font-mono text-sm font-bold text-ink" title="shown in your local timezone">{formatTimeWithZone(p._time)}</span>}
      </div>
      <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed mb-2">{p.content}</p>
      <p className="text-xs text-ink/40 font-label mb-1">{p.status}</p>

      {p.status === 'failed' && p.publish_result && (
        <p className="text-xs text-clay font-mono mb-2 bg-clay/10 rounded px-2 py-1">{p.publish_result}</p>
      )}

      {rescheduling === p.id ? (
        <div className="pt-2 border-t border-dashed border-line space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="datetime-local"
              value={rescheduleValue}
              onChange={(e) => onRescheduleValueChange(e.target.value)}
              className="px-2 py-1 rounded border-2 border-line bg-white/80 text-xs font-mono"
            />
            <button onClick={() => onSaveReschedule(p)} className="text-scripta hover:underline text-xs font-label">save</button>
            <button onClick={onCancelReschedule} className="text-ink/50 hover:underline text-xs font-label">cancel</button>
          </div>
          <p className="text-[11px] text-ink/50 font-label">💡 {BEST_TIMES[p.platform] || 'pick a time your audience is usually online'}</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 text-xs font-label pt-2 border-t border-dashed border-line items-center">
          {p.status === 'failed' && (
            <button onClick={() => onRetry(p)} className="text-scripta hover:underline">retry</button>
          )}
          {p.status !== 'published' && (
            <button onClick={() => onStartReschedule(p)} className="text-scripta hover:underline">reschedule</button>
          )}
          {p._time && (
            <a href={googleCalUrl(p, p._time)} target="_blank" rel="noreferrer" className="text-ink/50 hover:underline">+ Google Cal</a>
          )}
          <ConfirmButton onConfirm={() => onRemove(p.id)} className="text-clay hover:underline" confirmLabel="tear out for real?">
            tear out
          </ConfirmButton>
        </div>
      )}
    </div>
  );
});

// One month-grid day cell. Memoized with a custom comparator so dragging
// over/dropping on ONE cell doesn't force every other cell to re-render -
// only cells whose actual props (posts, selection, focus, drag-over) changed
// repaint. This matters once someone has months of posts on screen.
const DayCell = memo(function DayCell({
  cellKey, dayNum, inMonth, dayPosts, isToday, isSelected, isFocused, isDragOver, maxDayCount,
  onFocusCell, onClickCell, onDragOverCell, onDragLeaveCell, onDropCell, onChipDragStart,
}) {
  const intensity = dayPosts.length / maxDayCount;
  return (
    <button
      id={`cal-cell-${cellKey}`}
      tabIndex={isFocused ? 0 : -1}
      onFocus={() => onFocusCell(cellKey)}
      onClick={() => onClickCell(cellKey)}
      onDragOver={(e) => { e.preventDefault(); onDragOverCell(cellKey); }}
      onDragLeave={() => onDragLeaveCell(cellKey)}
      onDrop={(e) => onDropCell(e, cellKey)}
      className={`group relative text-left rounded border-2 p-1.5 min-h-[70px] transition ${inMonth ? '' : 'opacity-40'} ${
        isSelected ? 'border-scripta' : isDragOver ? 'border-scripta border-dashed' : isToday ? 'border-tape' : 'border-line'
      }`}
      style={{ backgroundColor: dayPosts.length > 0 ? `rgba(63,102,89,${(0.05 + intensity * 0.25).toFixed(2)})` : inMonth ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}
    >
      {isToday && (
        <div
          className="washi-tape"
          style={{ width: '36px', height: '11px', top: '-5px', left: '50%', transform: 'translateX(-50%) rotate(-3deg)' }}
        />
      )}
      {dayPosts.length === 0 && inMonth && (
        <span className="absolute inset-0 flex items-center justify-center text-ink/0 group-hover:text-ink/20 text-xl font-light transition pointer-events-none">
          +
        </span>
      )}
      <div className={`text-xs font-mono relative ${isToday ? 'text-tape font-bold' : 'text-ink/60'}`}>
        {dayNum}
      </div>
      <div className="flex flex-col gap-0.5 mt-1 relative">
        {dayPosts.slice(0, 3).map((p) => (
          <div
            key={p.id}
            draggable={p.status !== 'published'}
            onDragStart={(e) => onChipDragStart(e, p.id)}
            title={`${PLATFORM_LABELS[p.platform] || p.platform} · ${p.status} · ${formatTime(p._time)} · ${p.content}`}
            className={`flex items-center gap-1 rounded-sm px-1 py-px border ${STATUS_RING[p.status]} ${p.status !== 'published' ? 'cursor-grab' : ''}`}
            style={{ backgroundColor: `${PLATFORM_HEX[p.platform]}22` }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: PLATFORM_HEX[p.platform] }} />
            {dayPosts.length === 1 ? (
              <span className="text-[9px] font-mono text-ink/70 truncate">{formatTime(p._time)} · {snippet(p.content, 16)}</span>
            ) : dayPosts.length <= 2 ? (
              <span className="text-[9px] font-mono text-ink/60 truncate">{formatTime(p._time)}</span>
            ) : null}
          </div>
        ))}
        {dayPosts.length > 3 && (
          <span className="text-[10px] font-label text-ink/50">+{dayPosts.length - 3} more — click to see all</span>
        )}
      </div>
    </button>
  );
}, (prev, next) =>
  prev.dayPosts === next.dayPosts &&
  prev.isToday === next.isToday &&
  prev.isSelected === next.isSelected &&
  prev.isFocused === next.isFocused &&
  prev.isDragOver === next.isDragOver &&
  prev.inMonth === next.inMonth &&
  prev.maxDayCount === next.maxDayCount
);

export default function Calendar({ refreshKey, defaultPlatforms }) {
  const myPlatforms = defaultPlatforms?.length ? defaultPlatforms : ALL_PLATFORMS;

  const [posts, setPosts] = useState([]);
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'agenda'
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [weekCursor, setWeekCursor] = useState(() => startOfWeek(new Date()));
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState(() => new Set(myPlatforms));
  // Same collapsible "folder tab" treatment as the platform picker on the
  // Write page - keeps the toolbar from opening with a wall of 13 pills.
  const [platformDrawerOpen, setPlatformDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [focusedKey, setFocusedKey] = useState(dateKey(new Date()));
  const [rescheduling, setRescheduling] = useState(null);
  const [rescheduleValue, setRescheduleValue] = useState('');
  const [dragOverKey, setDragOverKey] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkShiftDays, setBulkShiftDays] = useState(1);
  // Replaces window.confirm for the drag-and-drop conflict check - a native
  // browser dialog looked jarring dropped into the journal styling.
  // { message, resolve } while a confirmation is pending, otherwise null.
  const [confirmState, setConfirmState] = useState(null);
  const showToast = useToast();
  const postsByDateCacheRef = useRef({});

  function askConfirm(message) {
    return new Promise((resolve) => setConfirmState({ message, resolve }));
  }
  function resolveConfirm(answer) {
    confirmState?.resolve(answer);
    setConfirmState(null);
  }

  // --- fetching, scoped to what's actually visible (+ status filter) ---
  // Month/week views only ask the server for their visible range; agenda
  // asks for a wider window (-1 month to +4 months) rather than "everything",
  // so someone with months of history doesn't pull it all down at once.
  const cells = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d; });
  }, [monthCursor]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekCursor); d.setDate(d.getDate() + i); return d; }),
    [weekCursor]
  );

  useEffect(() => {
    let from, to;
    if (viewMode === 'week') {
      from = weekDays[0];
      to = new Date(weekDays[6].getFullYear(), weekDays[6].getMonth(), weekDays[6].getDate(), 23, 59, 59);
    } else if (viewMode === 'agenda') {
      const now = new Date();
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth() + 4, 0, 23, 59, 59);
    } else {
      from = cells[0];
      to = new Date(cells[41].getFullYear(), cells[41].getMonth(), cells[41].getDate(), 23, 59, 59);
    }
    const params = { from: from.toISOString(), to: to.toISOString() };
    if (statusFilter) params.status = statusFilter;
    api.getPosts(params).then((d) => setPosts(d.posts));
  }, [viewMode, monthCursor, weekCursor, statusFilter, refreshKey]);

  function refresh() {
    // Re-run the same range fetch as the effect above, for actions that
    // need a guaranteed-fresh server read (retry-publish, campaign changes).
    let from, to;
    if (viewMode === 'week') {
      from = weekDays[0];
      to = new Date(weekDays[6].getFullYear(), weekDays[6].getMonth(), weekDays[6].getDate(), 23, 59, 59);
    } else if (viewMode === 'agenda') {
      const now = new Date();
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth() + 4, 0, 23, 59, 59);
    } else {
      from = cells[0];
      to = new Date(cells[41].getFullYear(), cells[41].getMonth(), cells[41].getDate(), 23, 59, 59);
    }
    const params = { from: from.toISOString(), to: to.toISOString() };
    if (statusFilter) params.status = statusFilter;
    api.getPosts(params).then((d) => setPosts(d.posts));
  }

  // Platform filter is applied client-side (few distinct values, cheap).
  const filteredPosts = useMemo(
    () => posts.filter((p) => platformFilter.has(p.platform)),
    [posts, platformFilter]
  );

  // Build postsByDate, but reuse the previous array reference for any day
  // whose actual post content didn't change - this is what lets DayCell's
  // memo comparator skip re-rendering untouched days during a drag.
  const postsByDate = useMemo(() => {
    const fresh = {};
    for (const p of filteredPosts) {
      const d = postDateObj(p);
      if (!d) continue;
      const key = dateKey(d);
      (fresh[key] = fresh[key] || []).push({ ...p, _time: d });
    }
    for (const key in fresh) fresh[key].sort((a, b) => a._time - b._time);

    const prevCache = postsByDateCacheRef.current;
    const stabilized = {};
    for (const key in fresh) {
      const prevArr = prevCache[key];
      stabilized[key] = prevArr && sameContentSignature(prevArr, fresh[key]) ? prevArr : fresh[key];
    }
    postsByDateCacheRef.current = stabilized;
    return stabilized;
  }, [filteredPosts]);

  const undated = filteredPosts.filter((p) => !postDateObj(p));

  const maxDayCount = useMemo(
    () => Math.max(1, ...cells.map((d) => (postsByDate[dateKey(d)] || []).length)),
    [cells, postsByDate]
  );

  const monthHasPosts = useMemo(
    () => cells.some((d) => d.getMonth() === monthCursor.getMonth() && (postsByDate[dateKey(d)] || []).length > 0),
    [cells, monthCursor, postsByDate]
  );

  const todayKey = dateKey(new Date());
  const yearOptions = Array.from({ length: 9 }, (_, i) => new Date().getFullYear() - 4 + i);

  function goToday() {
    const now = new Date();
    setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setWeekCursor(startOfWeek(now));
    setFocusedKey(dateKey(now));
    setSelectedDate(null);
  }
  function changeMonth(delta) { setMonthCursor((cur) => new Date(cur.getFullYear(), cur.getMonth() + delta, 1)); setSelectedDate(null); }
  function changeWeek(delta) { setWeekCursor((cur) => { const nd = new Date(cur); nd.setDate(nd.getDate() + delta * 7); return nd; }); setSelectedDate(null); }
  function setMonth(m) { setMonthCursor((cur) => new Date(cur.getFullYear(), m, 1)); }
  function setYear(y) { setMonthCursor((cur) => new Date(y, cur.getMonth(), 1)); }
  function togglePlatformFilter(p) {
    setPlatformFilter((cur) => { const next = new Set(cur); next.has(p) ? next.delete(p) : next.add(p); return next; });
  }

  function startReschedule(post) {
    setRescheduling(post.id);
    setRescheduleValue(post.scheduled_at ? post.scheduled_at.slice(0, 16) : '');
  }

  async function saveReschedule(post) {
    if (!rescheduleValue) return;
    const previous = { scheduled_at: post.scheduled_at, status: post.status };
    const iso = new Date(rescheduleValue).toISOString();
    setPosts((cur) => cur.map((p) => (p.id === post.id ? { ...p, scheduled_at: iso, status: 'scheduled' } : p)));
    setRescheduling(null);
    try {
      await api.updatePost(post.id, { content: post.content, platform: post.platform, scheduled_at: iso });
      showToast('Rescheduled', 'success', {
        label: 'undo',
        onClick: async () => {
          setPosts((cur) => cur.map((p) => (p.id === post.id ? { ...p, ...previous } : p)));
          await api.updatePost(post.id, { content: post.content, platform: post.platform, scheduled_at: previous.scheduled_at });
        },
      });
    } catch (err) {
      setPosts((cur) => cur.map((p) => (p.id === post.id ? { ...p, ...previous } : p)));
      showToast(err.message, 'error');
    }
  }

  async function retryPublish(post) {
    try {
      await api.publishNow(post.id);
      showToast('Retried', 'info');
      refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function remove(id) {
    const removed = posts.find((p) => p.id === id);
    setPosts((cur) => cur.filter((p) => p.id !== id));
    if (rescheduling === id) setRescheduling(null);
    try {
      await api.deletePost(id);
      showToast('Torn out', 'info');
    } catch (err) {
      if (removed) setPosts((cur) => [...cur, removed]);
      showToast(err.message, 'error');
    }
  }

  // --- drag and drop ---
  const handleDragStart = useCallback((e, postId) => {
    e.dataTransfer.setData('text/plain', postId);
  }, []);

  const handleDrop = useCallback(async (e, targetKey) => {
    e.preventDefault();
    const holdingShift = e.shiftKey;
    setDragOverKey(null);
    const postId = e.dataTransfer.getData('text/plain');
    const post = posts.find((p) => p.id === postId);
    if (!post || post.status === 'published') return;

    const existing = postDateObj(post) || new Date();
    const target = keyToDate(targetKey);
    target.setHours(existing.getHours(), existing.getMinutes());

    const dayPosts = (postsByDate[targetKey] || []).filter((p) => p.id !== post.id);
    const conflict = dayPosts.find((p) => p.platform === post.platform && Math.abs(p._time - target) < CONFLICT_WINDOW_MS);
    if (conflict) {
      const proceed = await askConfirm(
        `You already have a ${PLATFORM_LABELS[post.platform] || post.platform} post around ${formatTime(conflict._time)} that day. Schedule this one too?`
      );
      if (!proceed) return;
    }

    const previous = { scheduled_at: post.scheduled_at, status: post.status };
    const iso = target.toISOString();
    setPosts((cur) => cur.map((p) => (p.id === post.id ? { ...p, scheduled_at: iso, status: 'scheduled' } : p)));

    try {
      await api.updatePost(post.id, { content: post.content, platform: post.platform, scheduled_at: iso });
      showToast(`Moved to ${target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`, 'success', {
        label: 'undo',
        onClick: async () => {
          setPosts((cur) => cur.map((p) => (p.id === post.id ? { ...p, ...previous } : p)));
          await api.updatePost(post.id, { content: post.content, platform: post.platform, scheduled_at: previous.scheduled_at });
        },
      });
      if (holdingShift) startReschedule({ ...post, scheduled_at: iso });
    } catch (err) {
      setPosts((cur) => cur.map((p) => (p.id === post.id ? { ...p, ...previous } : p)));
      showToast(err.message, 'error');
    }
  }, [posts, postsByDate, showToast]);

  // --- keyboard navigation across the month grid ---
  const moveFocus = useCallback((deltaDays) => {
    setFocusedKey((cur) => {
      const nd = keyToDate(cur);
      nd.setDate(nd.getDate() + deltaDays);
      const nk = dateKey(nd);
      setMonthCursor((mc) => (nd.getMonth() !== mc.getMonth() || nd.getFullYear() !== mc.getFullYear()) ? new Date(nd.getFullYear(), nd.getMonth(), 1) : mc);
      requestAnimationFrame(() => document.getElementById(`cal-cell-${nk}`)?.focus());
      return nk;
    });
  }, []);

  function handleGridKeyDown(e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); moveFocus(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); moveFocus(-1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus(7); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus(-7); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDate(focusedKey); }
  }

  const onFocusCell = useCallback((key) => setFocusedKey(key), []);
  const onClickCell = useCallback((key) => setSelectedDate((cur) => (cur === key ? null : key)), []);
  const onDragOverCell = useCallback((key) => setDragOverKey(key), []);
  const onDragLeaveCell = useCallback((key) => setDragOverKey((cur) => (cur === key ? null : cur)), []);

  function exportICS() {
    const dated = filteredPosts.filter((p) => postDateObj(p));
    if (dated.length === 0) { showToast('Nothing dated to export yet', 'info'); return; }
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Scripta//Calendar//EN'];
    for (const p of dated) {
      const d = postDateObj(p);
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${p.id}@scripta`);
      lines.push(`DTSTAMP:${toICSDate(new Date())}`);
      lines.push(`DTSTART:${toICSDate(d)}`);
      lines.push(`DTEND:${toICSDate(new Date(d.getTime() + 30 * 60000))}`);
      lines.push(`SUMMARY:${escapeICS(`${PLATFORM_LABELS[p.platform] || p.platform} post`)}`);
      lines.push(`DESCRIPTION:${escapeICS(p.content)}`);
      lines.push('END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scripta-calendar.ics';
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- bulk actions (agenda view) ---
  function toggleSelected(id) {
    setSelectedIds((cur) => { const next = new Set(cur); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function clearSelection() { setSelectedIds(new Set()); setBulkMode(false); }

  async function bulkShift() {
    const days = Number(bulkShiftDays) || 0;
    if (days === 0 || selectedIds.size === 0) return;
    const targets = posts.filter((p) => selectedIds.has(p.id) && p.status !== 'published' && postDateObj(p));
    for (const post of targets) {
      const d = postDateObj(post);
      d.setDate(d.getDate() + days);
      await api.updatePost(post.id, { content: post.content, platform: post.platform, scheduled_at: d.toISOString() });
    }
    showToast(`Shifted ${targets.length} post${targets.length === 1 ? '' : 's'} by ${days} day${Math.abs(days) === 1 ? '' : 's'}`, 'success');
    clearSelection();
    refresh();
  }

  async function bulkDelete() {
    const ids = Array.from(selectedIds);
    for (const id of ids) await api.deletePost(id);
    showToast(`Tore out ${ids.length} post${ids.length === 1 ? '' : 's'}`, 'info');
    clearSelection();
    refresh();
  }

  const selectedPosts = selectedDate ? (postsByDate[selectedDate] || []) : [];
  const sortedAgendaKeys = useMemo(() => Object.keys(postsByDate).sort(), [postsByDate]);
  const activeFilterPlatforms = myPlatforms.filter((p) => platformFilter.has(p));

  return (
    <div className="font-body">
      <h1 className="font-display text-4xl text-ink mb-1">Calendar page</h1>
      <p className="font-label text-ink/50 text-base mb-6">a month at a glance — each color is a platform, drag a post to a new day (hold Shift to also tweak the time), or click it for details</p>

      <div className="journal-page torn-edge-top rounded-b-lg px-5 pt-8 pb-5 relative rotate-[-0.3deg] mb-8">
        <div className="washi-tape washi-pine" />

        {/* Toolbar row 1: today / navigation / month+year picker / view toggle */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button onClick={goToday} className="px-3 py-1 rounded-full border-2 border-scripta text-scripta font-label text-sm hover:bg-scripta hover:text-paper transition">
            today
          </button>
          {viewMode === 'week' ? (
            <>
              <button onClick={() => changeWeek(-1)} className="px-3 py-1 rounded-full border-2 border-line text-ink/60 hover:text-ink font-label text-sm">‹</button>
              <span className="font-display text-2xl text-ink px-1">
                {weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <button onClick={() => changeWeek(1)} className="px-3 py-1 rounded-full border-2 border-line text-ink/60 hover:text-ink font-label text-sm">›</button>
            </>
          ) : viewMode === 'month' ? (
            <>
              <button onClick={() => changeMonth(-1)} className="px-3 py-1 rounded-full border-2 border-line text-ink/60 hover:text-ink font-label text-sm">‹</button>
              <select value={monthCursor.getMonth()} onChange={(e) => setMonth(Number(e.target.value))} className="font-display text-xl text-ink bg-transparent border-2 border-line rounded px-2 py-0.5">
                {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={monthCursor.getFullYear()} onChange={(e) => setYear(Number(e.target.value))} className="font-display text-xl text-ink bg-transparent border-2 border-line rounded px-2 py-0.5">
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <button onClick={() => changeMonth(1)} className="px-3 py-1 rounded-full border-2 border-line text-ink/60 hover:text-ink font-label text-sm">›</button>
            </>
          ) : (
            <span className="font-display text-2xl text-ink px-1">everything, in order</span>
          )}

          <div className="ml-auto flex gap-1">
            {['month', 'week', 'agenda'].map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1 rounded-full text-xs font-label border-2 transition capitalize ${
                  viewMode === v ? 'bg-ink text-paper border-ink' : 'border-line text-ink/60 hover:border-scripta/50'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar row 2: status filter + export */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-label border-2 transition capitalize ${
                statusFilter === s ? 'bg-scripta text-paper border-scripta' : 'border-line text-ink/60 hover:border-scripta/50'
              }`}
            >
              {s || 'all'}
            </button>
          ))}
          <button onClick={exportICS} className="ml-auto px-2.5 py-1 rounded-full text-xs font-label border-2 border-line text-ink/60 hover:border-scripta/50 transition">
            export .ics
          </button>
        </div>

        {/* Toolbar row 3: platform filter, tucked into a folder tab - same
            pattern as the destinations picker on the Write page, so 13
            colored pills don't sit open on the page by default. */}
        {myPlatforms.length > 1 && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setPlatformDrawerOpen((cur) => !cur)}
              aria-expanded={platformDrawerOpen}
              className={`group relative inline-flex items-center gap-2 pl-3.5 pr-3 pt-1.5 pb-2 -mb-px rotate-[-0.6deg] border-2 border-line font-label text-sm text-ink/70 transition ${
                platformDrawerOpen ? 'bg-white/80 border-b-white/80' : 'bg-tape/40 hover:bg-tape/60'
              }`}
              style={{
                clipPath: 'polygon(6% 0, 94% 0, 100% 35%, 100% 100%, 0 100%, 0 35%)',
                borderTopLeftRadius: '0.5rem',
                borderTopRightRadius: '0.5rem',
              }}
            >
              <span className="font-semibold">showing</span>
              <span className="text-xs font-mono text-ink/40">({platformFilter.size}/{myPlatforms.length})</span>
              <span
                className={`inline-block text-ink/50 text-xs transition-transform duration-200 ${platformDrawerOpen ? '-rotate-180' : ''}`}
                aria-hidden="true"
              >
                &#9662;
              </span>
            </button>

            <div
              className={`grid transition-all duration-300 ease-out ${
                platformDrawerOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="border-2 border-line rounded-b-lg rounded-tr-lg bg-white/70 px-3 py-2.5 flex flex-wrap gap-1.5">
                  {myPlatforms.map((p) => (
                    <button
                      key={p}
                      onClick={() => togglePlatformFilter(p)}
                      className={`px-2.5 py-1 rounded-full text-xs font-label border transition ${
                        platformFilter.has(p) ? 'text-paper' : 'text-ink/40 border-line bg-transparent'
                      }`}
                      style={platformFilter.has(p) ? { backgroundColor: PLATFORM_HEX[p], borderColor: PLATFORM_HEX[p] } : {}}
                    >
                      {PLATFORM_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {!platformDrawerOpen && (
              <div className="border-2 border-line rounded-b-lg rounded-tr-lg bg-white/40 px-3 py-1.5 flex flex-wrap gap-1.5">
                {activeFilterPlatforms.length === 0 ? (
                  <span className="text-xs font-label text-ink/35">nothing shown — open the tab to pick platforms</span>
                ) : (
                  activeFilterPlatforms.map((p) => (
                    <span
                      key={p}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-label"
                      style={{ backgroundColor: `${PLATFORM_HEX[p]}15`, color: PLATFORM_HEX[p] }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: PLATFORM_HEX[p] }} />
                      {PLATFORM_LABELS[p]}
                    </span>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* MONTH VIEW */}
        {viewMode === 'month' && (
          <>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((w) => <div key={w} className="text-center text-xs font-label text-ink/50 py-1">{w}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1" onKeyDown={handleGridKeyDown}>
              {cells.map((d) => {
                const key = dateKey(d);
                return (
                  <DayCell
                    key={key}
                    cellKey={key}
                    dayNum={d.getDate()}
                    inMonth={d.getMonth() === monthCursor.getMonth()}
                    dayPosts={postsByDate[key] || []}
                    isToday={key === todayKey}
                    isSelected={key === selectedDate}
                    isFocused={key === focusedKey}
                    isDragOver={key === dragOverKey}
                    maxDayCount={maxDayCount}
                    onFocusCell={onFocusCell}
                    onClickCell={onClickCell}
                    onDragOverCell={onDragOverCell}
                    onDragLeaveCell={onDragLeaveCell}
                    onDropCell={handleDrop}
                    onChipDragStart={handleDragStart}
                  />
                );
              })}
            </div>

            {!monthHasPosts && (
              <div className="text-center py-8">
                <FlowerSprig className="w-6 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-ink/40 text-sm font-label">Nothing on the calendar this month yet — head to Write to fill a page in.</p>
              </div>
            )}
          </>
        )}

        {/* WEEK VIEW */}
        {viewMode === 'week' && (
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((d) => {
              const key = dateKey(d);
              const dayPosts = postsByDate[key] || [];
              const isToday = key === todayKey;
              const isDragOver = key === dragOverKey;
              return (
                <div
                  key={key}
                  onDragOver={(e) => { e.preventDefault(); setDragOverKey(key); }}
                  onDragLeave={() => setDragOverKey((cur) => (cur === key ? null : cur))}
                  onDrop={(e) => handleDrop(e, key)}
                  className={`relative rounded border-2 p-2 min-h-[220px] ${isDragOver ? 'border-scripta border-dashed' : isToday ? 'border-tape' : 'border-line'} bg-white/60`}
                >
                  {isToday && (
                    <div
                      className="washi-tape"
                      style={{ width: '40px', height: '12px', top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(-3deg)' }}
                    />
                  )}
                  <div className={`text-xs font-mono mb-1 ${isToday ? 'text-tape font-bold' : 'text-ink/60'}`}>
                    {WEEKDAYS[d.getDay()]} {d.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayPosts.map((p) => (
                      <div
                        key={p.id}
                        draggable={p.status !== 'published'}
                        onDragStart={(e) => handleDragStart(e, p.id)}
                        onClick={() => setSelectedDate(key)}
                        className={`rounded px-1.5 py-1 border cursor-pointer ${STATUS_RING[p.status]}`}
                        style={{ backgroundColor: `${PLATFORM_HEX[p.platform]}18` }}
                      >
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: PLATFORM_HEX[p.platform] }} />
                          <span className="text-[10px] font-mono text-ink/70">{formatTime(p._time)}</span>
                        </div>
                        <p className="text-[11px] text-ink/80 leading-tight mt-0.5">{snippet(p.content, 34)}</p>
                      </div>
                    ))}
                    {dayPosts.length === 0 && <p className="text-[10px] text-ink/30 font-label">nothing here</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* AGENDA / LIST VIEW - everything visible without opening a modal, with bulk select */}
        {viewMode === 'agenda' && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setBulkMode((v) => !v)}
                className={`px-2.5 py-1 rounded-full text-xs font-label border-2 transition ${bulkMode ? 'bg-ink text-paper border-ink' : 'border-line text-ink/60'}`}
              >
                {bulkMode ? 'cancel select' : 'select multiple'}
              </button>
              {bulkMode && selectedIds.size > 0 && (
                <div className="flex items-center gap-2 text-xs font-label">
                  <span className="text-ink/50">{selectedIds.size} selected</span>
                  <input
                    type="number"
                    value={bulkShiftDays}
                    onChange={(e) => setBulkShiftDays(e.target.value)}
                    className="w-14 px-1.5 py-1 rounded border-2 border-line bg-white/80 font-mono text-xs"
                  />
                  <button onClick={bulkShift} className="text-scripta hover:underline">shift days</button>
                  <ConfirmButton onConfirm={bulkDelete} className="text-clay hover:underline" confirmLabel="delete all selected?">
                    delete selected
                  </ConfirmButton>
                  <button onClick={clearSelection} className="text-ink/40 hover:underline">clear</button>
                </div>
              )}
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {sortedAgendaKeys.length === 0 && (
                <div className="text-center py-8">
                  <FlowerSprig className="w-6 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-ink/40 text-sm font-label">Nothing dated yet — head to Write to fill a page in.</p>
                </div>
              )}
              {sortedAgendaKeys.map((key) => (
                <div key={key}>
                  <h4 className="font-label text-sm text-ink/60 mb-1 sticky top-0 bg-paper/90 py-0.5">
                    {keyToDate(key).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </h4>
                  <div className="space-y-1">
                    {postsByDate[key].map((p) => (
                      <div key={p.id} className={`flex items-center gap-2 rounded px-2 py-1.5 border ${STATUS_RING[p.status]} bg-white/60`}>
                        {bulkMode && (
                          <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelected(p.id)} className="shrink-0" />
                        )}
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PLATFORM_HEX[p.platform] }} />
                        <span className="text-xs font-mono text-ink/60 w-16 shrink-0">{formatTime(p._time)}</span>
                        <span className="text-xs font-label uppercase text-ink/50 w-20 shrink-0 truncate">{PLATFORM_LABELS[p.platform]}</span>
                        <span className="text-sm text-ink/80 flex-1 truncate">{snippet(p.content, 70)}</span>
                        {p.status === 'failed' && (
                          <button onClick={() => retryPublish(p)} className="text-xs text-scripta hover:underline shrink-0">retry</button>
                        )}
                        <button onClick={() => setSelectedDate(key)} className="text-xs text-ink/50 hover:underline shrink-0">details</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status legend - visual swatches instead of a run-on sentence */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-4 text-[11px] font-label text-ink/50">
          <span className="text-ink/40">status:</span>
          {STATUS_LEGEND.map((s) => (
            <span key={s.key} className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded-full border-2 bg-white/60 ${STATUS_RING[s.key]}`} />
              {s.label}
            </span>
          ))}
          <span className="text-ink/35">· darker tint = busier day · times shown are your local timezone</span>
        </div>
      </div>

      {/* Day detail as an overlay - no need to scroll the page to see it */}
      {selectedDate && (
        <div className="fixed inset-0 z-30 flex items-center justify-center px-4 bg-ink/40" onClick={() => setSelectedDate(null)}>
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-2xl text-paper drop-shadow">
                {keyToDate(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <button onClick={() => setSelectedDate(null)} className="text-paper/80 hover:text-paper text-2xl leading-none">×</button>
            </div>
            {selectedPosts.length === 0 && (
              <p className="text-paper/70 text-sm font-label bg-ink/20 rounded px-3 py-2">Nothing pinned to this day.</p>
            )}
            <div className="space-y-3">
              {selectedPosts.map((p) => (
                <PostCard
                  key={p.id}
                  p={p}
                  rescheduling={rescheduling}
                  rescheduleValue={rescheduleValue}
                  onRescheduleValueChange={setRescheduleValue}
                  onStartReschedule={startReschedule}
                  onSaveReschedule={saveReschedule}
                  onCancelReschedule={() => setRescheduling(null)}
                  onRetry={retryPublish}
                  onRemove={remove}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Drag-conflict confirmation - styled to match the journal, replacing
          the native window.confirm() dialog that used to break the theme. */}
      {confirmState && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 bg-ink/50" onClick={() => resolveConfirm(false)}>
          <div
            className="journal-page torn-edge-top rounded-b-lg px-6 pt-7 pb-5 max-w-sm w-full relative rotate-[-0.5deg]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="washi-tape washi-pine" />
            <p className="text-base text-ink font-body leading-relaxed mb-4">{confirmState.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => resolveConfirm(false)}
                className="px-3 py-1.5 rounded-full border-2 border-line text-ink/60 text-sm font-label hover:border-ink/40 transition"
              >
                cancel
              </button>
              <button
                onClick={() => resolveConfirm(true)}
                className="px-3 py-1.5 rounded-full bg-scripta text-paper text-sm font-label hover:bg-scriptaDeep transition"
              >
                schedule anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {undated.length > 0 && (
        <div>
          <h3 className="font-display text-2xl text-ink mb-1">Not yet dated</h3>
          <p className="font-label text-ink/50 text-sm mb-3">drafts waiting for a day on the calendar</p>
          <div className="space-y-3">
            {undated.map((p) => (
              <PostCard
                key={p.id}
                p={p}
                rescheduling={rescheduling}
                rescheduleValue={rescheduleValue}
                onRescheduleValueChange={setRescheduleValue}
                onStartReschedule={startReschedule}
                onSaveReschedule={saveReschedule}
                onCancelReschedule={() => setRescheduling(null)}
                onRetry={retryPublish}
                onRemove={remove}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}