import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Compose from './pages/Compose';
import BrandVoice from './pages/BrandVoice';
import Accounts from './pages/Accounts';
import Calendar from './pages/Calendar';
import Campaigns from './pages/Campaigns';
import ScriptaMark from './components/ScriptaMark';
import BackgroundDoodles from './components/BackgroundDoodles';
import { ToastProvider } from './components/Toast';
import { setToken } from './api';

const TABS = [
  { id: 'dashboard', label: 'Entries' },
  { id: 'compose', label: 'Write' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'brand', label: 'Voice' },
  { id: 'accounts', label: 'Contacts' },
];

function AppInner() {
  const [user, setUser] = useState(null);
  const [checkedSession, setCheckedSession] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // We only keep the token, not the user, across reloads - if a token
    // exists we just consider the person "logged in" and let API calls
    // fail with 401 (bounced back to Auth) if it's expired.
    const hasToken = !!sessionStorage.getItem('scripta_token');
    if (hasToken) setUser({});
    setCheckedSession(true);
  }, []);

  function logout() {
    setToken(null);
    setUser(null);
    setShowAuth(false);
  }

  if (!checkedSession) return null;

  if (!user) {
    if (!showAuth) {
      return <Home onGetStarted={() => setShowAuth(true)} onSignIn={() => setShowAuth(true)} />;
    }
    return (
      <>
        <BackgroundDoodles />
        <Auth onAuthed={setUser} onBack={() => setShowAuth(false)} />
      </>
    );
  }

  return (
    <div className="min-h-screen relative">
      <BackgroundDoodles />
      <header className="sticky top-0 z-20 cover-band">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between relative">
          <div className="hidden sm:flex flex-col gap-1.5 absolute left-1.5 top-1/2 -translate-y-1/2">
            <span className="binder-ring" />
            <span className="binder-ring" />
            <span className="binder-ring" />
          </div>
          <div className="flex items-center gap-3 pl-4 sm:pl-6">
            <ScriptaMark animated={false} className="w-12 h-7" />
            <span className="font-script text-5xl leading-none text-paper">Scripta</span>
          </div>
          <nav className="flex gap-1 font-label text-base">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1 rounded-t-lg border-2 border-b-0 transition ${
                  tab === t.id
                    ? 'bg-paper text-ink border-paper -mb-px'
                    : 'bg-transparent text-paper/60 border-transparent hover:text-paper'
                }`}
                style={{ transform: `rotate(${i % 2 === 0 ? '-0.6deg' : '0.6deg'})` }}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <button onClick={logout} className="text-xs font-label text-paper/50 hover:text-paper underline decoration-dotted">
            sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 relative z-10">
        {tab === 'dashboard' && <Dashboard refreshKey={refreshKey} />}
        {tab === 'compose' && <Compose onSaved={() => { setRefreshKey((k) => k + 1); setTab('dashboard'); }} />}
        {tab === 'calendar' && <Calendar refreshKey={refreshKey} />}
        {tab === 'campaigns' && <Campaigns onOpenCampaign={() => setTab('dashboard')} />}
        {tab === 'brand' && <BrandVoice />}
        {tab === 'accounts' && <Accounts />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
