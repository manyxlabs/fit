import { useState } from 'react';
import { NOT_WORTH_IT, recommend, SUPPLEMENTS, type SupplementId } from '../data/supplements';
import { backup, db, restore, STORES, today, type Profile } from './db';
import { targets, totals, useAsync, useBump } from './hooks';
import { saveProfile } from './Onboarding';
import { HealthImport } from './HealthImport';
import { ProfileForm } from './ProfileForm';
import { mb } from './Photos';
import { Card } from './ui';

export function More({ profile }: { profile: Profile }) {
  const bump = useBump();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();
  const [withPhotos, setWithPhotos] = useState(true);
  const photoBytes = useAsync(async () => (await (await db).getAll('photos')).reduce((s, p) => s + p.blob.size, 0), []);
  const gap = useAsync(async () => {
    const t = await targets(profile);
    const eaten = totals(await (await db).getAllFromIndex('food', 'date', today()));
    return t && eaten.kcal > 0 ? t.protein - eaten.protein : 0;
  }, [profile]);
  const recs = recommend({ diet: profile.diet, sex: profile.sex, goal: profile.goal, proteinGap: gap ?? 0, trainsHard: profile.days >= 2 });
  const others = (Object.keys(SUPPLEMENTS) as SupplementId[]).filter((id) => !recs.some((r) => r.id === id));

  async function download() {
    const blob = new Blob([JSON.stringify(await backup(withPhotos))], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `fit-backup-${today()}.json` });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <h1 className="page-title">More</h1>
      <Card title="Supplements for you">
        <ul className="supps">
          {recs.map(({ id, reason }) => (
            <Supp key={id} id={id} reason={reason} />
          ))}
        </ul>
        <details>
          <summary>Others, and when they help</summary>
          <ul className="supps">
            {others.map((id) => (
              <Supp key={id} id={id} />
            ))}
          </ul>
        </details>
        <details>
          <summary>Usually a waste of money</summary>
          <ul className="supps">
            {NOT_WORTH_IT.map((s) => (
              <li key={s.name}>
                <strong>{s.name}</strong>
                <p>{s.why}</p>
              </li>
            ))}
          </ul>
        </details>
        <p className="hint">Buy third-party tested products and avoid proprietary blends. Check with a doctor if you have a medical condition, take medication or are pregnant.</p>
      </Card>

      <Card title="Your details">
        <ProfileForm
          initial={profile}
          askWeight={false}
          submit={saved ? 'Saved' : 'Save changes'}
          onSave={async (p) => {
            await saveProfile(p);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            bump();
          }}
        />
      </Card>

      <Card title="Your data">
        <p className="hint">Everything lives only in this browser. Download a backup now and then, and restore it on a new phone or after clearing the browser.</p>
        {!!photoBytes && (
          <label className="check">
            <input type="checkbox" checked={withPhotos} onChange={(e) => setWithPhotos(e.target.checked)} />
            Include progress photos (about {mb((photoBytes * 4) / 3)}, as base64)
          </label>
        )}
        <div className="row">
          <button type="button" className="btn primary" onClick={download}>
            Download backup
          </button>
          <label className="btn">
            Restore a backup
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file || !confirm('Replace everything here with this backup?')) return;
                try {
                  await restore(JSON.parse(await file.text()));
                  setError(undefined);
                  bump();
                } catch (err) {
                  setError(err instanceof SyntaxError ? 'That file is not a backup.' : (err as Error).message);
                }
              }}
            />
          </label>
          <button
            type="button"
            className="btn danger"
            onClick={async () => {
              if (!confirm('Delete all your data from this browser? This cannot be undone.')) return;
              const d = await db;
              await Promise.all(STORES.map((s) => d.clear(s)));
              bump();
            }}
          >
            Delete everything
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </Card>

      <HealthImport />

      <Card title="Learn">
        <ul className="plan">
          <li>
            <a href="/guides/">Guides: training, nutrition, supplements, sleep, special cases</a>
          </li>
          <li>
            <a href="/calculators/">Calculators: BMI, TDEE, macros, body fat, one-rep max, heart-rate zones</a>
          </li>
        </ul>
      </Card>
    </>
  );
}

function Supp({ id, reason }: { id: SupplementId; reason?: string }) {
  const s = SUPPLEMENTS[id];
  return (
    <li>
      <strong>{s.name}</strong> <span className={`tag ${s.evidence}`}>{s.evidence} evidence</span>
      {reason && <p>{reason}</p>}
      <p className="muted">
        {s.dose} {s.why}
      </p>
      {'caution' in s && <p className="muted">{s.caution}</p>}
    </li>
  );
}
