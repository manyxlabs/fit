import { programFor } from '../data/programs';
import { db, getSetting, setSetting, today, type Profile } from './db';
import { useBump } from './hooks';
import { ProfileForm } from './ProfileForm';

/** Saves a profile, and starts the matching program when where or how often they train changed. */
export async function saveProfile(p: Profile, kg?: number) {
  const old = await getSetting('profile');
  if (kg !== undefined) await (await db).put('weights', { date: today(), kg });
  if (!old || old.setup !== p.setup || old.days !== p.days) {
    const t = programFor(p.setup, p.days);
    await setSetting('program', { name: t.name, days: t.days.map((d) => ({ name: d.name, slots: d.slots.map((s) => [...s]) })) });
  }
  await setSetting('profile', p);
}

export function Onboarding() {
  const bump = useBump();
  return (
    <main className="wrap onboard">
      <h1>Set up your plan</h1>
      <p className="hint">Everything stays in this browser. Nothing is sent anywhere, and there is no account.</p>
      <div className="card glass">
        <ProfileForm askWeight submit="Build my plan" onSave={(p, kg) => saveProfile(p, kg).then(bump)} />
      </div>
    </main>
  );
}
