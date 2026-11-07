import { useState } from 'react';
import { MEALS, type Meal } from '../data/meals';
import { WATER_EVERY, type Kind, type Schedule, type Time } from '../lib/reminders';
import { unb64 } from '../../worker/b64';
import { Card } from './ui';

// Kept per browser in localStorage, not in the synced database: a push subscription belongs to one browser.
type Times = { weighIn: Time; meals: Record<Meal, Time>; water: NonNullable<Schedule['water']>; workout: NonNullable<Schedule['workout']>; bedtime: Time };
type Saved = { times: Times; picked: Kind[]; active: boolean; endpoint?: string; tz?: string };

const KEY = 'fit:reminders';
const DEFAULTS: Saved = {
  times: {
    weighIn: '07:00',
    meals: { breakfast: '08:30', lunch: '13:00', snacks: '17:00', dinner: '20:30' },
    water: { every: 120, from: '09:00', to: '21:00' },
    workout: { days: [1, 3, 5], time: '18:00' },
    bedtime: '22:30',
  },
  picked: ['weighIn', 'breakfast', 'lunch', 'dinner', 'workout'],
  active: false,
};
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function load(): Saved {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return DEFAULTS;
  }
}
function keep(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Blocked storage: the reminders still run, but the form forgets its choices.
  }
}

/** Only what is picked; this is all the server is told, besides where to send and the timezone. */
function schedule({ times, picked }: Saved): Schedule {
  const on = (k: Kind) => picked.includes(k);
  const meals = Object.fromEntries((Object.keys(MEALS) as Meal[]).filter(on).map((m) => [m, times.meals[m]]));
  return {
    ...(on('weighIn') && { weighIn: times.weighIn }),
    ...(Object.keys(meals).length && { meals }),
    ...(on('water') && { water: times.water }),
    ...(on('workout') && times.workout.days.length && { workout: times.workout }),
    ...(on('bedtime') && { bedtime: times.bedtime }),
  };
}

const supported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const zone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

async function subscribe(s: Saved): Promise<Saved> {
  if ((await Notification.requestPermission()) !== 'granted') throw new Error("Notifications are blocked for this site. Allow them in your browser's site settings, then try again.");
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const key = await fetch('/api/push').then((r) => (r.ok ? (r.json() as Promise<{ publicKey: string }>) : null));
    if (!key) throw new Error('Reminders are not available right now. Try again later.');
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: unb64(key.publicKey) });
  }
  const tz = zone();
  const res = await fetch('/api/push', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON(), tz, schedule: schedule(s) }) });
  if (!res.ok) throw new Error('Could not save your reminders. Try again.');
  return { ...s, active: true, endpoint: sub.endpoint, tz };
}

/** On startup: a browser can replace its subscription, and a person can travel, so the server is told of either. */
export async function refreshReminders() {
  const s = load();
  if (!s.active || !supported() || Notification.permission !== 'granted') return;
  const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
  if (sub?.endpoint !== s.endpoint || s.tz !== zone()) keep(await subscribe(s));
}

export function RemindersCard() {
  const [s, setS] = useState(load);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ error?: boolean; text: string }>();
  const set = (change: Partial<Saved>) => setS({ ...s, ...change });
  const times = (change: Partial<Times>) => set({ times: { ...s.times, ...change } });
  const pick = (k: Kind, on: boolean) => set({ picked: on ? [...s.picked, k] : s.picked.filter((x) => x !== k) });

  async function act(fn: () => Promise<Saved>, done: string) {
    setBusy(true);
    try {
      const next = await fn();
      keep(next);
      setS(next);
      setNote({ text: done });
    } catch (e) {
      setNote({ error: true, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function stop(): Promise<Saved> {
    const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
    if (sub) {
      const res = await fetch('/api/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
      if (!res.ok) throw new Error('Could not turn off reminders. Try again.');
      await sub.unsubscribe();
    }
    return { ...s, active: false, endpoint: undefined };
  }

  const check = (k: Kind, label: string) => (
    <label className="check">
      <input type="checkbox" checked={s.picked.includes(k)} onChange={(e) => pick(k, e.target.checked)} />
      {label}
    </label>
  );
  const clock = (label: string, value: Time, onChange: (t: Time) => void, disabled: boolean) => (
    <input type="time" aria-label={label} value={value} required disabled={disabled} onChange={(e) => e.target.value && onChange(e.target.value)} />
  );
  const off = (k: Kind) => !s.picked.includes(k);
  const nothing = !Object.keys(schedule(s)).length;

  return (
    <Card title="Reminders">
      <p className="hint">
        Notifications at the times you choose. The server keeps only this browser's push address, your timezone and these times, never anything you log, and the reminders say no
        more than "Time to log lunch".
      </p>
      <p className="hint">On iPhone and iPad, reminders need iOS 16.4 or later and Fit on your Home Screen: tap Share, then Add to Home Screen, and open Fit from there.</p>
      {supported() ? (
        <>
          <ul className="plan reminders">
            <li>
              {check('weighIn', 'Morning weigh-in')}
              <span className="row">{clock('Weigh-in time', s.times.weighIn, (weighIn) => times({ weighIn }), off('weighIn'))}</span>
            </li>
            {(Object.keys(MEALS) as Meal[]).map((m) => (
              <li key={m}>
                {check(m, `Log ${MEALS[m].toLowerCase()}`)}
                <span className="row">{clock(`${MEALS[m]} time`, s.times.meals[m], (t) => times({ meals: { ...s.times.meals, [m]: t } }), off(m))}</span>
              </li>
            ))}
            <li>
              {check('water', 'Water')}
              <span className="row">
                <select aria-label="Water every" value={s.times.water.every} disabled={off('water')} onChange={(e) => times({ water: { ...s.times.water, every: Number(e.target.value) } })}>
                  {WATER_EVERY.map((m) => (
                    <option key={m} value={m}>
                      every {m / 60} h
                    </option>
                  ))}
                </select>
              </span>
              <span className="row hours">
                {clock('Water from', s.times.water.from, (from) => times({ water: { ...s.times.water, from } }), off('water'))}
                <span className="muted">to</span>
                {clock('Water until', s.times.water.to, (to) => times({ water: { ...s.times.water, to } }), off('water'))}
              </span>
            </li>
            <li>
              {check('workout', 'Workout days')}
              <span className="row">{clock('Workout time', s.times.workout.time, (time) => times({ workout: { ...s.times.workout, time } }), off('workout'))}</span>
              <fieldset className="seg days" aria-label="Workout days" disabled={off('workout')}>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <label key={d}>
                    <input
                      type="checkbox"
                      checked={s.times.workout.days.includes(d)}
                      onChange={(e) =>
                        times({ workout: { ...s.times.workout, days: e.target.checked ? [...s.times.workout.days, d] : s.times.workout.days.filter((x) => x !== d) } })
                      }
                    />
                    {DAYS[d]}
                  </label>
                ))}
              </fieldset>
            </li>
            <li>
              {check('bedtime', 'Bedtime')}
              <span className="row">{clock('Bedtime', s.times.bedtime, (bedtime) => times({ bedtime }), off('bedtime'))}</span>
            </li>
          </ul>
          {s.picked.includes('water') && s.times.water.from > s.times.water.to && <p className="error">Water reminders must start before they end.</p>}
          <div className="row">
            <button
              type="button"
              className="btn primary"
              disabled={busy || nothing || s.times.water.from > s.times.water.to}
              onClick={() => act(() => subscribe(s), 'Reminders are on.')}
            >
              {s.active ? 'Save reminders' : 'Turn on reminders'}
            </button>
            {s.active && (
              <button type="button" className="btn" disabled={busy} onClick={() => act(stop, 'Reminders are off.')}>
                Turn off reminders
              </button>
            )}
          </div>
          {note && (
            <p className={note.error ? 'error' : 'hint'} role="status">
              {note.text}
            </p>
          )}
        </>
      ) : (
        <p className="hint">This browser cannot show reminders.</p>
      )}
    </Card>
  );
}
