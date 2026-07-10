import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Compose from './pages/Compose';
import BrandVoice from './pages/BrandVoice';
import Calendar from './pages/Calendar';
import Campaigns from './pages/Campaigns';
import BackgroundDoodles from './components/BackgroundDoodles';
import { ToastProvider } from './components/Toast';
import { api, setToken } from './api';

const TABS = [
  { id: 'dashboard', label: 'Entries' },
  { id: 'compose', label: 'Write' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'brand', label: 'Voice' },
];

function AppInner() {
  const [user, setUser] = useState(null);
  const [defaultPlatforms, setDefaultPlatforms] = useState([]);
  const [checkedSession, setCheckedSession] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // A restored session only has a token, not the user object - fetch
    // /auth/me to find out who it is and whether onboarding is done.
    const hasToken = !!sessionStorage.getItem('scripta_token');
    if (hasToken) {
      api.me()
        .then((d) => {
          setUser(d.user);
          setDefaultPlatforms(d.user.default_platforms || []);
        })
        .catch(() => setToken(null))
        .finally(() => setCheckedSession(true));
    } else {
      setCheckedSession(true);
    }
  }, []);

  function handleAuthed(authedUser) {
    setUser(authedUser);
    setDefaultPlatforms(authedUser.default_platforms || []);
  }

  function logout() {
    setToken(null);
    setUser(null);
    setDefaultPlatforms([]);
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
        <Auth onAuthed={handleAuthed} onBack={() => setShowAuth(false)} />
      </>
    );
  }

  if (defaultPlatforms.length === 0) {
    return (
      <>
        <BackgroundDoodles />
        <Onboarding onDone={(platforms) => setDefaultPlatforms(platforms)} />
      </>
    );
  }

  return (
    <div className="min-h-screen relative">
      <BackgroundDoodles />
      <header className="sticky top-0 z-20 cover-band">
        <div className="max-w-4xl mx-auto px-6 py-3 flex flex-wrap items-center gap-3 justify-between relative">
          <div className="hidden sm:flex flex-col gap-1.5 absolute left-1.5 top-1/2 -translate-y-1/2">
            <span className="binder-ring" />
            <span className="binder-ring" />
            <span className="binder-ring" />
          </div>
          <div className="flex flex-col pl-4 sm:pl-6">
            <div className="flex items-center gap-3">
              <span className="font-script text-5xl leading-none text-paper">Scripta</span>
            </div>
            {user?.name && (
              <span className="text-base font-label italic uppercase tracking-wide text-paper/70 mt-0.5 ml-1">{user.name}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-1.5 font-label text-base">
              {TABS.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3.5 py-1.5 rounded-full border-2 transition ${
                    tab === t.id
                      ? 'bg-paper text-ink border-paper'
                      : 'bg-transparent text-paper/60 border-paper/30 hover:text-paper hover:border-paper/60'
                  }`}
                  style={{ transform: `rotate(${i % 2 === 0 ? '-0.6deg' : '0.6deg'})` }}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            <button onClick={logout} className="px-3.5 py-1.5 rounded-full border-2 border-paper/30 text-xs font-label text-paper/60 hover:text-paper hover:border-paper/60 transition">
              sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 relative z-10">
        {tab === 'dashboard' && <Dashboard refreshKey={refreshKey} />}
        {tab === 'compose' && <Compose defaultPlatforms={defaultPlatforms} onSaved={() => { setRefreshKey((k) => k + 1); setTab('dashboard'); }} />}
        {tab === 'calendar' && <Calendar refreshKey={refreshKey} />}
        {tab === 'campaigns' && <Campaigns onOpenCampaign={() => setTab('dashboard')} />}
        {tab === 'brand' && <BrandVoice />}
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