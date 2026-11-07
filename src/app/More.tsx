import { useState } from 'react';
import { NOT_WORTH_IT, recommend, SUPPLEMENTS, type Recommendation, type SupplementId } from '../data/supplements';
import { localePath, NAMES, type Locale } from '../i18n/locales';
import { BadBackup, backup, db, restore, STORES, today, type Profile } from './db';
import { targets, totals, useAsync, useBump } from './hooks';
import { saveProfile } from './Onboarding';
import { HealthImport } from './HealthImport';
import { ProfileForm } from './ProfileForm';
import { mb } from './Photos';
import { RemindersCard } from './Reminders';
import { SyncCard } from './Pairing';
import { useSyncState } from './sync';
import { adviceLang, choose, d, fill, h, lang, LOCALES, t } from './i18n';
import { Card } from './ui';

export function More({ profile }: { profile: Profile }) {
  const bump = useBump();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();
  const [withPhotos, setWithPhotos] = useState(true);
  const photoBytes = useAsync(async () => (await (await db).getAll('photos')).reduce((s, p) => s + p.blob.size, 0), []);
  const synced = useSyncState().on;
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
      <h1 className="page-title">{t.more.title}</h1>
      <Card title={t.more.supplements.title}>
        <ul className="supps">
          {recs.map((r) => (
            <Supp key={r.id} id={r.id} reason={reason(r)} />
          ))}
        </ul>
        <details>
          <summary>{t.more.supplements.others}</summary>
          <ul className="supps">
            {others.map((id) => (
              <Supp key={id} id={id} />
            ))}
          </ul>
        </details>
        <details>
          <summary>{t.more.supplements.waste}</summary>
          <ul className="supps" lang={adviceLang}>
            {NOT_WORTH_IT.map((id) => (
              <li key={id}>
                <strong>{h.more.notWorthIt[id].name}</strong>
                <p>{h.more.notWorthIt[id].why}</p>
              </li>
            ))}
          </ul>
        </details>
        <p className="hint" lang={adviceLang}>
          {h.more.buySafely}
        </p>
      </Card>

      <Card title={t.more.details.title}>
        <label className="field">
          {t.more.language}
          <select value={lang} onChange={(e) => choose(e.target.value as Locale)}>
            {LOCALES.map((l) => (
              <option key={l} value={l} lang={l}>
                {NAMES[l]}
              </option>
            ))}
          </select>
        </label>
        <ProfileForm
          initial={profile}
          askWeight={false}
          submit={saved ? t.more.details.saved : t.more.details.save}
          onSave={async (p) => {
            await saveProfile(p);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            bump();
          }}
        />
      </Card>

      <SyncCard />
      <RemindersCard />

      <Card title={t.more.data.title}>
        <p className="hint">{synced ? t.more.data.synced : t.more.data.local}</p>
        {!!photoBytes && (
          <label className="check">
            <input type="checkbox" checked={withPhotos} onChange={(e) => setWithPhotos(e.target.checked)} />
            {fill(t.more.data.withPhotos, { size: mb((photoBytes * 4) / 3) })}
          </label>
        )}
        <div className="row">
          <button type="button" className="btn primary" onClick={download}>
            {t.more.data.download}
          </button>
          <label className="btn">
            {t.more.data.restore}
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file || !confirm(synced ? t.more.data.restoreConfirmSynced : t.more.data.restoreConfirm)) return;
                try {
                  await restore(JSON.parse(await file.text()));
                  setError(undefined);
                  bump();
                } catch (err) {
                  setError(err instanceof BadBackup ? t.more.data.badBackup[err.code] : err instanceof SyntaxError ? t.more.data.notBackup : (err as Error).message);
                }
              }}
            />
          </label>
          <button
            type="button"
            className="btn danger"
            onClick={async () => {
              if (!confirm(synced ? t.more.data.deleteConfirmSynced : t.more.data.deleteConfirm)) return;
              const d = await db;
              await Promise.all(STORES.map((s) => d.clear(s)));
              bump();
            }}
          >
            {t.more.data.deleteAll}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </Card>

      <HealthImport />

      <Card title={t.more.learn.title}>
        <ul className="plan">
          <li>
            <a href={localePath(adviceLang ?? lang, '/guides/')}>{t.more.learn.guides}</a>
          </li>
          <li>
            <a href={localePath(lang, '/calculators/')}>{t.more.learn.calculators}</a>
          </li>
        </ul>
      </Card>
    </>
  );
}

function Supp({ id, reason }: { id: SupplementId; reason?: string }) {
  const s = SUPPLEMENTS[id];
  const copy = h.more.supplements[id];
  return (
    <li>
      <strong>{d.supplements[id]}</strong>{' '}
      <span className={`tag ${s.evidence}`} lang={adviceLang}>
        {h.more.evidence[s.evidence]}
      </span>
      {reason && <p lang={adviceLang}>{reason}</p>}
      <p className="muted" lang={adviceLang}>
        {copy.dose} {copy.why}
      </p>
      {'caution' in copy && (
        <p className="muted" lang={adviceLang}>
          {copy.caution}
        </p>
      )}
    </li>
  );
}

function reason(r: Recommendation) {
  const why = h.more.reasons;
  if (r.id === 'protein') return fill(why.protein, { g: r.gapG });
  if (r.id === 'b12') return why.b12[r.diet];
  return why[r.id];
}
