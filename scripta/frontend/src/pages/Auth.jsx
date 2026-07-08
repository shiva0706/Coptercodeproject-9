import { useState } from 'react';
import { api, setToken } from '../api';
import ScriptaMark from '../components/ScriptaMark';

export default function Auth({ onAuthed, onBack }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = mode === 'login'
        ? await api.login(email, password)
        : await api.register(email, password, name);
      setToken(data.token);
      onAuthed(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative z-10">
      {onBack && (
        <button onClick={onBack} className="mb-4 text-sm font-label text-ink/50 hover:text-ink underline decoration-dotted">
          ← back to Scripta
        </button>
      )}
      <div className="w-full max-w-sm journal-page torn-edge-top rounded-b-lg px-7 pt-8 pb-7 rotate-[-0.7deg]">
        <div className="washi-tape washi-pine" />
        <div className="mb-7 text-center">
          <ScriptaMark className="w-full h-8 mb-3" />
          <h1 className="font-display text-5xl text-ink leading-none">Scripta</h1>
          <p className="text-ink/60 font-label text-lg mt-1">one idea, scrapbooked to every platform</p>
        </div>

        <div className="flex gap-1 mb-6 font-label text-base justify-center">
          <button
            className={`px-3 py-1 rounded-full transition ${mode === 'login' ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'}`}
            onClick={() => setMode('login')}
          >
            sign in
          </button>
          <button
            className={`px-3 py-1 rounded-full transition ${mode === 'register' ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'}`}
            onClick={() => setMode('register')}
          >
            new page
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3 font-body">
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded border-2 border-line bg-white/70 focus:bg-white transition text-sm"
            />
          )}
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded border-2 border-line bg-white/70 focus:bg-white transition text-sm"
          />
          <input
            type="password"
            required
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded border-2 border-line bg-white/70 focus:bg-white transition text-sm"
          />

          {error && <p className="text-clay text-sm font-label">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded bg-scripta text-paper font-label text-lg tracking-wide hover:bg-scriptaDeep transition disabled:opacity-50"
          >
            {busy ? 'working…' : mode === 'login' ? 'sign in' : 'start my scrapbook'}
          </button>
        </form>
      </div>
    </div>
  );
}
