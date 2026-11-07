import { useState } from 'react';
import { db, type Day, type Measurement } from './db';
import { KINDS, type Kind, type Result } from './health/parse';
import type { Reply, Request } from './health/worker';
import { useBump } from './hooks';
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

const short = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const ALL = Object.keys(KINDS) as Kind[];

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
      if ('error' in data) return setState({ error: data.error });
      if (!Object.values(data.result.series).some((s) => s.length)) return setState({ error: 'These files have no weight, steps, sleep, body fat or resting heart rate to import.' });
      setState({ result: data.result, rows: await current() });
    };
    worker.onerror = () => (worker.terminate(), setState({ error: 'This browser could not read the files.' }));
    worker.postMessage(files satisfies Request);
  }

  /** One transaction, so a failure part-way leaves everything as it was. */
  async function save(result: Result) {
    const tx = (await db).transaction(['weights', 'measurements', 'days'], 'readwrite');
    const rows = await current(tx);
    const writes: Promise<unknown>[] = [];
    let n = 0;
    for (const kind of ALL) {
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

  const found = state && 'result' in state ? ALL.filter((k) => state.result.series[k].length) : [];
  return (
    <Card title="Import from a health app">
      <p className="hint">Bring in weight, steps, sleep, body fat and resting heart rate. The files are read here in the browser and never uploaded.</p>
      <details>
        <summary>How to export your data</summary>
        <ul className="howto">
          <li>
            <strong>iPhone (Apple Health)</strong>: open Health, tap your picture, then Export All Health Data. Save export.zip to Files and choose it here.
          </li>
          <li>
            <strong>Samsung Health</strong>: open Settings in Samsung Health, then Download personal data. Choose all the CSV files from the folder it saves in Download/Samsung Health, or a zip of that folder.
          </li>
          <li>
            <strong>Google Fit</strong>: at takeout.google.com, select only Fit, and choose the zip it gives you.
          </li>
          <li>
            <strong>Health Connect</strong>: its own export is a database this page cannot read yet, so export from the app that writes to it, such as Samsung Health or Google Fit.
          </li>
        </ul>
      </details>
      {state && 'progress' in state ? (
        <div className="bar-track" role="progressbar" aria-label="Reading the export" aria-valuenow={Math.round(state.progress * 100)}>
          <div style={{ width: `${state.progress * 100}%` }} />
        </div>
      ) : state && 'result' in state ? (
        <form
          className="stack"
          aria-label="Import preview"
          onSubmit={(e) => {
            e.preventDefault();
            save(state.result);
          }}
        >
          <p>From {state.result.sources.join(' and ')}:</p>
          <ul className="checks">
            {found.map((kind) => {
              const s = state.result.series[kind];
              const here = s.filter(([d]) => has(state.rows, kind, d)).length;
              return (
                <li key={kind}>
                  <label className="check">
                    <input type="checkbox" checked={!skip.includes(kind)} onChange={(e) => setSkip(e.target.checked ? skip.filter((k) => k !== kind) : [...skip, kind])} />
                    <span>
                      <strong>{KINDS[kind]}</strong>: {fmt(s.length)} {s.length === 1 ? 'day' : 'days'}, {short(s[0][0])}
                      {s.length > 1 && ` to ${short(s.at(-1)![0])}`}
                      {here > 0 && <span className="muted"> ({fmt(here)} already logged)</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <fieldset className="seg">
            <legend>Days you already logged</legend>
            <label>
              <input type="radio" name="replace" checked={!replace} onChange={() => setReplace(false)} />
              Keep mine
            </label>
            <label>
              <input type="radio" name="replace" checked={replace} onChange={() => setReplace(true)} />
              Use imported
            </label>
          </fieldset>
          <div className="row">
            <button type="submit" className="btn primary" disabled={found.every((k) => skip.includes(k))}>
              Import
            </button>
            <button type="button" className="btn" onClick={() => setState(undefined)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          {state && 'done' in state && (
            <p role="status">
              Imported {fmt(state.done)} {state.done === 1 ? 'entry' : 'entries'} from {state.sources.join(' and ')}.
            </p>
          )}
          {state && 'error' in state && <p className="error">{state.error}</p>}
          <label className="drop">
            <strong>Choose export files</strong>
            <span>export.zip, Takeout zip or Samsung Health CSVs</span>
            <input type="file" multiple accept=".zip,.xml,.csv,application/zip,text/xml,text/csv" onChange={(e) => (read([...(e.target.files ?? [])]), (e.target.value = ''))} />
          </label>
        </>
      )}
    </Card>
  );
}
