import { useState } from 'react';
import { encode } from 'uqr';
import { date, fill, t } from './i18n';
import { pair, removeDevice, syncNow, turnOff, turnOn, useSyncState, type SyncState } from './sync';
import { Card } from './ui';

/** A link as a QR code, dark on light whatever the theme, as scanners expect. */
function Qr({ text }: { text: string }) {
  const { size, data } = encode(text, { ecc: 'M', border: 2 });
  const path = data.flatMap((row, y) => row.flatMap((dark, x) => (dark ? [`M${x} ${y}h1v1h-1z`] : []))).join('');
  return (
    <svg className="qr" viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" role="img" aria-label={c.qr}>
      <rect width={size} height={size} fill="#fff" />
      <path d={path} fill="#111" />
    </svg>
  );
}

const c = t.more.sync;

function status(s: SyncState) {
  if (s.status === 'syncing') return c.syncing;
  if (s.status === 'offline') return c.offline;
  if (s.status === 'error') return s.problem;
  return s.last ? fill(c.synced, { time: date(s.last, { hour: 'numeric', minute: '2-digit' }) }) : c.never;
}

/** Runs an action, showing its error, and keeps its button disabled meanwhile. */
function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const act = (fn: () => Promise<unknown>) => async () => {
    setBusy(true);
    setError(undefined);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, act };
}

export function SyncCard() {
  const s = useSyncState();
  const { busy, error, act } = useAction();
  const [fresh, setFresh] = useState(false);
  const [copied, setCopied] = useState(false);
  if (s.on === undefined) return null;

  if (!s.on)
    return (
      <Card title={c.title}>
        <p className="hint">{c.about}</p>
        {s.problem && <p className="error">{s.problem}</p>}
        <div className="row">
          <button
            type="button"
            className="btn primary"
            disabled={busy}
            onClick={act(async () => {
              setFresh(true);
              await turnOn();
            })}
          >
            {c.turnOn}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </Card>
    );

  return (
    <Card title={c.title}>
      <p className={s.status === 'error' ? 'error' : 'hint'} role="status">
        {status(s)}
      </p>
      <details open={fresh}>
        <summary>{c.addDevice}</summary>
        <div className="pair">
          <Qr text={s.link!} />
          <div className="stack">
            <p className="hint">{c.scan}</p>
            <div className="row">
              <input className="link" readOnly value={s.link} aria-label={c.link} onFocus={(e) => e.currentTarget.select()} />
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  await navigator.clipboard.writeText(s.link!);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? c.copied : c.copy}
              </button>
            </div>
          </div>
        </div>
      </details>
      <div className="row">
        <button type="button" className="btn" disabled={busy || s.status === 'syncing'} onClick={act(syncNow)}>
          {c.syncNow}
        </button>
        <button type="button" className="btn" disabled={busy} onClick={act(async () => confirm(c.confirmRemove) && removeDevice())}>
          {c.remove}
        </button>
        <button
          type="button"
          className="btn danger"
          disabled={busy}
          onClick={act(async () => confirm(c.confirmTurnOff) && turnOff())}
        >
          {c.turnOff}
        </button>
      </div>
      <p className="hint">{c.keeps}</p>
      {error && <p className="error">{error}</p>}
    </Card>
  );
}

/** Shown in place of the app when it is opened from another device's sync link. */
export function Join({ secret, done }: { secret: string; done: () => void }) {
  const { busy, error, act } = useAction();
  return (
    <main className="wrap onboard">
      <h1>{c.join.title}</h1>
      <div className="card glass">
        <p>{c.join.about}</p>
        <p className="hint">{c.join.warning}</p>
        <div className="row">
          <button
            type="button"
            className="btn primary"
            disabled={busy}
            onClick={act(async () => {
              await pair(secret);
              done();
            })}
          >
            {busy ? c.syncing : c.join.start}
          </button>
          <button type="button" className="btn" disabled={busy} onClick={done}>
            {c.join.notNow}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>
    </main>
  );
}
