import { useEffect, useState, type CSSProperties } from 'react';
import { db, POSES, today, type Photo, type Pose } from './db';
import { useAsync, useBump } from './hooks';
import { rich } from '../i18n/rich';
import { date as format, fill, plural, t } from './i18n';
import { Card, fmt } from './ui';

const LONG_EDGE = 1600;
const label = (date: string) => format(date, { day: 'numeric', month: 'short', year: 'numeric' });
const c = t.progress;
export const mb = (bytes: number) => `${fmt(bytes / 1e6, bytes < 1e7 ? 1 : 0)} MB`;

/** Re-encoding through a canvas drops EXIF, so no location or camera details are kept. */
async function toJpeg(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const k = Math.min(1, LONG_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(bitmap.width * k), height: Math.round(bitmap.height * k) });
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', 0.85));
}

function Img({ blob, alt }: { blob: Blob; alt: string }) {
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return src ? <img src={src} alt={alt} draggable={false} /> : null;
}

export function Photos() {
  const bump = useBump();
  const photos = useAsync(async () => (await db).getAll('photos'), []);
  const [date, setDate] = useState(today());
  const [error, setError] = useState<string>();
  // Shrinking a camera photo can take seconds on a slow phone; its slot says so meanwhile.
  const [working, setWorking] = useState<Pose[]>([]);
  if (!photos) return null;
  const dates = [...new Set(photos.map((p) => p.date))].sort();
  const bytes = photos.reduce((s, p) => s + p.blob.size, 0);

  async function add(pose: Pose, file?: File) {
    if (!file) return;
    setWorking((w) => [...w, pose]);
    try {
      await (await db).put('photos', { date, pose, blob: await toJpeg(file) });
      setError(undefined);
      bump();
    } catch {
      setError(c.photos.unreadable);
    } finally {
      setWorking((w) => w.filter((x) => x !== pose));
    }
  }
  async function remove(keys: [string, Pose][], ask: string) {
    if (!confirm(ask)) return;
    const tx = (await db).transaction('photos', 'readwrite');
    await Promise.all([...keys.map((k) => tx.store.delete(k)), tx.done]);
    bump();
  }
  const keysOf = (ps: Photo[]) => ps.map((p): [string, Pose] => [p.date, p.pose]);
  const onDate = photos.filter((p) => p.date === date);

  return (
    <>
      <Card title={c.photos.title}>
        <p className="hint">{c.photos.about}</p>
        <label className="field photo-date">
          {c.photos.date}
          <input type="date" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
        <div className="poses">
          {POSES.map((pose) => {
            const photo = onDate.find((p) => p.pose === pose);
            const vars = { pose: c.photos.posesInline[pose], date: label(date) };
            const input = (capture: boolean) => (
              <input type="file" accept="image/*" capture={capture} aria-label={fill(capture ? c.photos.take : c.photos.choose, vars)} onChange={(e) => (add(pose, e.target.files?.[0]), (e.target.value = ''))} />
            );
            return (
              <figure key={pose}>
                <label className="shot" aria-busy={working.includes(pose)}>
                  {photo ? <Img blob={photo.blob} alt={fill(c.photos.alt, vars)} /> : <span className={working.includes(pose) ? 'text-sheen' : undefined}>+</span>}
                  {input(false)}
                </label>
                {photo && (
                  <button type="button" className="icon-btn delete" aria-label={fill(c.photos.delete, vars)} onClick={() => remove([[date, pose]], fill(c.photos.confirmDelete, vars))}>
                    ×
                  </button>
                )}
                <figcaption>
                  <span>{c.photos.poses[pose]}</span>
                  <label className="icon-btn">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                      <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    </svg>
                    {input(true)}
                  </label>
                </figcaption>
              </figure>
            );
          })}
        </div>
        {error && <p className="error">{error}</p>}
        {dates.length > 0 && (
          <div className="row" role="group" aria-label={c.photos.dates}>
            {dates.map((d) => (
              <button key={d} type="button" className={`chip${d === date ? ' on' : ''}`} onClick={() => setDate(d)}>
                {label(d)}
              </button>
            ))}
          </div>
        )}
        {onDate.length > 0 && (
          <button type="button" className="btn danger" onClick={() => remove(keysOf(onDate), fill(plural(onDate.length, c.photos.confirmDeleteDate), { date: label(date) }))}>
            {c.photos.deleteDate}
          </button>
        )}
      </Card>
      {dates.length >= 2 && <Compare photos={photos} />}
      {photos.length > 0 && (
        <Card title={c.storage.title}>
          <p>{rich(fill(plural(photos.length, c.storage.used), { size: mb(bytes) }), { b: (s) => <strong className="num">{s}</strong> })}</p>
          <Persist />
          <button type="button" className="btn danger" onClick={() => remove(keysOf(photos), plural(photos.length, c.storage.confirmDeleteAll))}>
            {c.storage.deleteAll}
          </button>
        </Card>
      )}
    </>
  );
}

/** Browsers may clear a site's storage when space runs low, unless it has been made persistent. */
function Persist() {
  const [state, setState] = useState<boolean | 'refused'>();
  useEffect(() => {
    navigator.storage?.persisted?.().then(setState);
  }, []);
  if (state === undefined) return null;
  if (state === true) return <p className="hint">{c.storage.persisted}</p>;
  return (
    <>
      <p className="hint">{c.storage.persistAbout}</p>
      {state === 'refused' && <p className="warn">{c.storage.refused}</p>}
      <button type="button" className="btn" onClick={async () => setState((await navigator.storage.persist()) || 'refused')}>
        {c.storage.persist}
      </button>
    </>
  );
}

function Compare({ photos }: { photos: Photo[] }) {
  const [pose, setPose] = useState<Pose>(() => POSES.find((p) => photos.filter((x) => x.pose === p).length >= 2) ?? 'front');
  const [slider, setSlider] = useState(false);
  const [split, setSplit] = useState(50);
  const ofPose = photos.filter((p) => p.pose === pose);
  const [picked, setPicked] = useState<[string?, string?]>([]);
  const at = (i: 0 | 1) => ofPose.find((p) => p.date === picked[i]) ?? (i ? ofPose.at(-1) : ofPose[0]);
  const [a, b] = [at(0), at(1)];

  const pick = (i: 0 | 1) => (
    <label className="field">
      {i ? c.compare.after : c.compare.before}
      <select value={(i ? b : a)?.date ?? ''} onChange={(e) => setPicked(i ? [a?.date, e.target.value] : [e.target.value, b?.date])}>
        {ofPose.map((p) => (
          <option key={p.date} value={p.date}>
            {label(p.date)}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <Card title={c.compare.title}>
      <fieldset className="seg">
        {POSES.map((p) => (
          <label key={p}>
            <input type="radio" name="compare-pose" checked={pose === p} onChange={() => (setPose(p), setPicked([]))} />
            {c.photos.poses[p]}
          </label>
        ))}
      </fieldset>
      {ofPose.length < 2 ? (
        <p className="hint">{fill(c.compare.needTwo, { pose: c.photos.posesInline[pose] })}</p>
      ) : (
        <>
          <div className="grid two">
            {pick(0)}
            {pick(1)}
          </div>
          <fieldset className="seg">
            <label>
              <input type="radio" name="compare-mode" checked={!slider} onChange={() => setSlider(false)} />
              {c.compare.sideBySide}
            </label>
            <label>
              <input type="radio" name="compare-mode" checked={slider} onChange={() => setSlider(true)} />
              {c.compare.slider}
            </label>
          </fieldset>
          {a && b && slider ? (
            <>
              <div className="overlay" style={{ '--split': `${split}%` } as CSSProperties}>
                <Img blob={a.blob} alt={fill(c.compare.beforeAlt, { date: label(a.date) })} />
                <Img blob={b.blob} alt={fill(c.compare.afterAlt, { date: label(b.date) })} />
              </div>
              <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(e.target.valueAsNumber)} aria-label={c.compare.sliderLabel} />
              <p className="hint num">{fill(c.compare.sliderNote, { before: label(a.date), after: label(b.date) })}</p>
            </>
          ) : (
            a &&
            b && (
              <div className="compare">
                {[a, b].map((p, i) => (
                  <figure key={i}>
                    <Img blob={p.blob} alt={fill(i ? c.compare.afterAlt : c.compare.beforeAlt, { date: label(p.date) })} />
                    <figcaption className="hint">{label(p.date)}</figcaption>
                  </figure>
                ))}
              </div>
            )
          )}
        </>
      )}
    </Card>
  );
}
