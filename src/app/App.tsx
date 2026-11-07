import { useCallback, useEffect, useState } from 'react';
import { getSetting } from './db';
import { useAsync, Version } from './hooks';
import { Onboarding } from './Onboarding';
import { Today } from './Today';
import { Food } from './Food';
import { Train } from './Train';
import { Progress } from './Progress';
import { More } from './More';
import { refreshReminders } from './Reminders';
import { Join } from './Pairing';
import { scheduleSync, secretIn, startSync } from './sync';
import './app.css';

const TABS = { today: 'Today', food: 'Food', train: 'Train', progress: 'Progress', more: 'More' } as const;
type Tab = keyof typeof TABS;
const tabOf = (hash: string): Tab => (hash.slice(1) in TABS ? (hash.slice(1) as Tab) : 'today');

export default function App() {
  const [v, setV] = useState(0);
  // Every write bumps, so every write is sent to the other devices; what they send only refreshes.
  const bump = useCallback(() => {
    setV((x) => x + 1);
    scheduleSync();
  }, []);
  useEffect(() => {
    startSync(() => setV((x) => x + 1));
    void refreshReminders().catch(() => {});
  }, []);
  return (
    <Version.Provider value={{ v, bump }}>
      <Shell />
    </Version.Provider>
  );
}

function Shell() {
  const profile = useAsync(() => getSetting('profile').then((p) => p ?? null), []);
  const [tab, setTab] = useState<Tab>(() => tabOf(location.hash));
  const [joining, setJoining] = useState(() => secretIn(location.hash));
  useEffect(() => {
    const on = () => {
      setTab(tabOf(location.hash));
      setJoining(secretIn(location.hash));
    };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    scrollTo(0, 0);
  }, [tab]);

  if (joining)
    return (
      <Join
        secret={joining}
        done={() => {
          // Replaced rather than followed, so Back never offers to pair again, and the secret leaves the address bar.
          history.replaceState(null, '', '#more');
          setJoining(undefined);
          setTab('more');
        }}
      />
    );
  if (profile === undefined) return null;
  if (profile === null) return <Onboarding />;
  return (
    <div className="app">
      <main className="wrap view">
        {tab === 'today' && <Today profile={profile} />}
        {tab === 'food' && <Food profile={profile} />}
        {tab === 'train' && <Train profile={profile} />}
        {tab === 'progress' && <Progress profile={profile} />}
        {tab === 'more' && <More profile={profile} />}
      </main>
      <nav className="tabs glass" aria-label="App">
        {(Object.keys(TABS) as Tab[]).map((t) => (
          <a key={t} href={`#${t}`} aria-current={t === tab ? 'page' : undefined}>
            <Icon tab={t} />
            {TABS[t]}
          </a>
        ))}
      </nav>
    </div>
  );
}

const PATHS: Record<Tab, string> = {
  today: 'M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  food: 'M7 3v8a2 2 0 0 0 2 2v8M11 3v8M7 7h4M17 21V3c-2 1-3 4-3 7s1 4 3 4',
  train: 'M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11',
  progress: 'M3 20h18M6 16l4-5 4 3 5-7',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
};

function Icon({ tab }: { tab: Tab }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d={PATHS[tab]} />
    </svg>
  );
}
