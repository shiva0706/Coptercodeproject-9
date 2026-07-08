import { useEffect, useState } from 'react';
import { api } from '../api';
import ConfirmButton from '../components/ConfirmButton';
import { useToast } from '../components/Toast';
import { Paperclip } from '../components/Doodles';

const PLATFORM_LABELS = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  x: 'X',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  youtube: 'YouTube',
};

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [platform, setPlatform] = useState('instagram');
  const [handle, setHandle] = useState('');
  const [error, setError] = useState('');
  const showToast = useToast();

  function refresh() {
    api.getAccounts().then((d) => {
      setAccounts(d.accounts);
      setPlatforms(d.supported_platforms);
    });
  }

  useEffect(refresh, []);

  async function connect(e) {
    e.preventDefault();
    setError('');
    if (!handle.trim()) return;
    try {
      await api.connectAccount(platform, handle.trim());
      setHandle('');
      showToast('Contact pinned in', 'success');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function disconnect(id) {
    await api.disconnectAccount(id);
    showToast('Unpinned', 'info');
    refresh();
  }

  return (
    <div className="max-w-xl font-body">
      <h1 className="font-display text-4xl text-ink mb-1">Contacts page</h1>
      <p className="text-ink/60 font-label text-base mb-6">
        this pastes in a handle only — a real integration would send you through each
        platform's own login screen. See <code className="text-xs bg-white/60 px-1 rounded font-mono">backend/routes/accounts.js</code> for where that goes.
      </p>

      <form onSubmit={connect} className="journal-page torn-edge-top rounded-b-lg px-5 pt-7 pb-5 relative rotate-[-0.3deg] flex gap-2 mb-8">
        <div className="washi-tape washi-pine" />
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="px-3 py-2 rounded border-2 border-line bg-white/70 text-sm"
        >
          {platforms.map((p) => (
            <option key={p} value={p}>{PLATFORM_LABELS[p] || p}</option>
          ))}
        </select>
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="@yourhandle"
          className="flex-1 px-3 py-2 rounded border-2 border-line bg-white/70 focus:bg-white transition text-sm"
        />
        <button type="submit" className="px-4 py-2 rounded bg-scripta text-paper text-sm font-label tracking-wide hover:bg-scriptaDeep transition">
          pin it in
        </button>
      </form>
      {error && <p className="text-clay text-sm mb-4 font-label">{error}</p>}

      <div className="space-y-3">
        {accounts.length === 0 && (
          <div className="journal-page torn-edge-top rounded-b-lg px-8 py-10 text-center relative rotate-[-0.4deg]">
            <div className="washi-tape washi-pine" />
            <Paperclip className="w-5 h-10 mx-auto mb-3 opacity-60" />
            <p className="text-ink/40 text-sm font-label">No contacts pinned in yet.</p>
          </div>
        )}
        {accounts.map((a, i) => (
          <div
            key={a.id}
            className={`flex items-center justify-between px-4 py-3 journal-page torn-edge-top rounded-b-lg relative ${i % 2 === 0 ? '-rotate-1' : 'rotate-1'}`}
          >
            <div>
              <span className="ink-stamp inline-block px-2 py-0.5 text-xs font-label uppercase tracking-wide text-scripta -rotate-2 mr-2">
                {PLATFORM_LABELS[a.platform] || a.platform}
              </span>
              <span className="text-sm text-ink/70 font-mono">@{a.handle}</span>
            </div>
            <ConfirmButton onConfirm={() => disconnect(a.id)} className="text-xs text-clay hover:underline font-label" confirmLabel="unpin for real?">
              unpin
            </ConfirmButton>
          </div>
        ))}
      </div>
    </div>
  );
}
