import { useState } from 'react';
import { db, type Day, type Measurement } from './db';
import { KINDS, type Kind, type Result } from './health/parse';
import type { Reply, Request } from './health/worker';
import { useBump } from './hooks';
import { rich } from '../i18n/rich';
import { date, fill, plural, t } from './i18n';
import { Card, fmt } from './ui';

/** Where each kind lands: the store and the field within its row for the day. */
const TARGET = {
  weight: ['weights', 'kg'],
  bodyFat: ['measurements', 'bodyFat'],
  steps: ['days', 'steps'],
  sleep: ['days', 'sleep'],
  restingHr: ['days', 'restingHr'],
} as const;
type Store = (typeof TARGET)[Kind][0];
type Row = Partial<Day & Measurement & { kg: number }> & { date: string };

/** The rows already here, by date, in each store an import can write to. */
async function current(tx?: { objectStore(s: Store): { getAll(): Promise<unknown[]> } }) {
  tx ??= (await db).transaction(['weights', 'measurements', 'days']);
  const byDate = async (s: Store) => new Map(((await tx.objectStore(s).getAll()) as Row[]).map((r) => [r.date, r]));
  return { weights: await byDate('weights'), measurements: await byDate('measurements'), days: await byDate('days') };
}
const has = (rows: Awaited<ReturnType<typeof current>>, kind: Kind, date: string) => rows[TARGET[kind][0]].get(date)?.[TARGET[kind][1]] !== undefined;

// Unbroken, so a narrow phone never strands the year on its own line.
const nowrap = (s: string) => <span style={{ whiteSpace: 'nowrap' }}>{s}</span>;
const short = (d: string) => date(d, { day: 'numeric', month: 'short', year: 'numeric' });
const b = (s: string) => <strong>{s}</strong>;

const c = t.progress.import;
const list = (sources: string[]) => sources.reduce((a, b2) => fill(c.and, { a, b: b2 }));

type State = { progress: number } | { result: Result; rows: Awaited<ReturnType<typeof current>> } | { done: number; sources: string[] } | { error: string };

export function HealthImport() {
  const bump = useBump();
  const [state, setState] = useState<State>();
  const [skip, setSkip] = useState<Kind[]>([]);
  const [replace, setReplace] = useState(false);

  function read(files: File[]) {
    if (!files.length) return;
    setState({ progress: 0 });
    setSkip([]);
    const worker = new Worker(new URL('./health/worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = async ({ data }: MessageEvent<Reply>) => {
      if ('progress' in data) return setState({ progress: data.progress });
      worker.terminate();
      if ('error' in data) return setState({ error: fill(c.errors[data.error], { file: data.file }) });
      if (!Object.values(data.result.series).some((s) => s.length)) return setState({ error: c.errors.empty });
      setState({ result: data.result, rows: await current() });
    };
    worker.onerror = () => (worker.terminate(), setState({ error: c.errors.unreadable }));
    worker.postMessage(files satisfies Request);
  }

  /** One transaction, so a failure part-way leaves everything as it was. */
  async function save(result: Result) {
    const tx = (await db).transaction(['weights', 'measurements', 'days'], 'readwrite');
    const rows = await current(tx);
    const writes: Promise<unknown>[] = [];
    let n = 0;
    for (const kind of KINDS) {
      if (skip.includes(kind)) continue;
      const [store, field] = TARGET[kind];
      for (const [date, value] of result.series[kind]) {
        if (!replace && has(rows, kind, date)) continue;
        const row = { ...rows[store].get(date), date, [field]: value };
        rows[store].set(date, row);
        writes.push(tx.objectStore(store).put(row as never));
        n++;
      }
    }
    await Promise.all([...writes, tx.done]);
    setState({ done: n, sources: result.sources });
    bump();
  }

  const found = state && 'result' in state ? KINDS.filter((k) => state.result.series[k].length) : [];
  return (
    <Card title={c.title}>
      <p className="hint">{c.about}</p>
      <details>
        <summary>{c.howTo}</summary>
        <ul className="howto">
          {[c.apple, c.samsung, c.googleFit, c.healthConnect].map((s) => (
            <li key={s}>{rich(s, { b })}</li>
          ))}
        </ul>
      </details>
      {state && 'progress' in state ? (
        <div className="bar-track" role="progressbar" aria-label={c.reading} aria-valuenow={Math.round(state.progress * 100)}>
          <div style={{ width: `${state.progress * 100}%` }} />
        </div>
      ) : state && 'result' in state ? (
        <form
          className="stack"
          aria-label={c.preview}
          onSubmit={(e) => {
            e.preventDefault();
            save(state.result);
          }}
        >
          <p>{fill(c.from, { sources: list(state.result.sources) })}</p>
          <ul className="checks">
            {found.map((kind) => {
              const s = state.result.series[kind];
              const here = s.filter(([d]) => has(state.rows, kind, d)).length;
              return (
                <li key={kind}>
                  <label className="check">
                    <input type="checkbox" checked={!skip.includes(kind)} onChange={(e) => setSkip(e.target.checked ? skip.filter((k) => k !== kind) : [...skip, kind])} />
                    <span>
                      {rich(fill(s.length > 1 ? c.range : c.oneDay, { kind: c.kinds[kind], days: plural(s.length, c.days), from: short(s[0][0]), to: short(s.at(-1)![0]) }), { b, d: nowrap })}
                      {here > 0 && <span className="muted"> {fill(c.alreadyLogged, { n: fmt(here) })}</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <fieldset className="seg">
            <legend>{c.existing}</legend>
            <label>
              <input type="radio" name="replace" checked={!replace} onChange={() => setReplace(false)} />
              {c.keepMine}
            </label>
            <label>
              <input type="radio" name="replace" checked={replace} onChange={() => setReplace(true)} />
              {c.useImported}
            </label>
          </fieldset>
          <div className="row">
            <button type="submit" className="btn primary" disabled={found.every((k) => skip.includes(k))}>
              {c.import}
            </button>
            <button type="button" className="btn" onClick={() => setState(undefined)}>
              {t.progress.cancel}
            </button>
          </div>
        </form>
      ) : (
        <>
          {state && 'done' in state && (
            <p role="status">{fill(plural(state.done, c.done), { sources: list(state.sources) })}</p>
          )}
          {state && 'error' in state && <p className="error">{state.error}</p>}
          <label className="drop">
            <strong>{c.choose}</strong>
            <span>{c.accepts}</span>
            <input type="file" multiple accept=".zip,.xml,.csv,application/zip,text/xml,text/csv" onChange={(e) => (read([...(e.target.files ?? [])]), (e.target.value = ''))} />
          </label>
        </>
      )}
    </Card>
  );
}
