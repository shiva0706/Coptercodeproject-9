import { useEffect, useState } from 'react';
import { api } from '../api';

// Polls for anything scheduled within the next hour (or already due) and
// shows a small badge in the header, so people don't have to open
// Calendar just to know something's about to go out.
export default function PostingSoonBadge({ tab, onOpenCalendar }) {
  const [dueSoon, setDueSoon] = useState([]);

  useEffect(() => {
    let cancelled = false;

    function check() {
      const now = new Date();
      const soon = new Date(now.getTime() + 60 * 60000);
      api.getPosts({ status: 'scheduled', from: now.toISOString(), to: soon.toISOString() })
        .then((d) => { if (!cancelled) setDueSoon(d.posts); })
        .catch(() => {});
    }

    check();
    const interval = setInterval(check, 60000); // re-check every minute
    return () => { cancelled = true; clearInterval(interval); };
  }, [tab]);

  if (dueSoon.length === 0) return null;

  return (
    <button
      onClick={onOpenCalendar}
      className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tape/90 text-ink text-xs font-label border-2 border-tape hover:brightness-95 transition animate-pulse"
      title={dueSoon.map((p) => p.content).join(' · ')}
    >
      🔔 {dueSoon.length} posting soon
    </button>
  );
}