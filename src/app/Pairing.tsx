import { useState } from 'react';
import { encode } from 'uqr';
import { pair, removeDevice, syncNow, turnOff, turnOn, useSyncState, type SyncState } from './sync';
import { Card } from './ui';

/** A link as a QR code, dark on light whatever the theme, as scanners expect. */
function Qr({ text }: { text: string }) {
  const { size, data } = encode(text, { ecc: 'M', border: 2 });
  const path = data.flatMap((row, y) => row.flatMap((dark, x) => (dark ? [`M${x} ${y}h1v1h-1z`] : []))).join('');
  return (
    <svg className="qr" viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" role="img" aria-label="QR code of the sync link">
      <rect width={size} height={size} fill="#fff" />
      <path d={path} fill="#111" />
    </svg>
  );
}

const time = (at: number) => new Date(at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
function status(s: SyncState) {
  if (s.status === 'syncing') return 'Syncing...';
  if (s.status === 'offline') return 'Offline. Changes made here will sync when you are back online.';
  if (s.status === 'error') return s.problem;
  return s.last ? `Synced at ${time(s.last)}` : 'Not synced yet';
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
      <Card title="Sync">
        <p className="hint">
          Keep your phone, laptop and other devices in step. Everything is encrypted on this device before it leaves, with a key only your devices hold, so the server stores
          scrambled data it cannot read.
        </p>
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
            Turn on sync
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </Card>
    );

  return (
    <Card title="Sync">
      <p className={s.status === 'error' ? 'error' : 'hint'} role="status">
        {status(s)}
      </p>
      <details open={fresh}>
        <summary>Add another device</summary>
        <div className="pair">
          <Qr text={s.link!} />
          <div className="stack">
            <p className="hint">Scan the code with your other device's camera, or open the link there. Anyone with the link can read your data, so keep it to your own devices.</p>
            <div className="row">
              <input className="link" readOnly value={s.link} aria-label="Sync link" onFocus={(e) => e.currentTarget.select()} />
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  await navigator.clipboard.writeText(s.link!);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </div>
        </div>
      </details>
      <div className="row">
        <button type="button" className="btn" disabled={busy || s.status === 'syncing'} onClick={act(syncNow)}>
          Sync now
        </button>
        <button type="button" className="btn" disabled={busy} onClick={act(async () => confirm('Stop syncing on this device? Your other devices carry on.') && removeDevice())}>
          Remove this device
        </button>
        <button
          type="button"
          className="btn danger"
          disabled={busy}
          onClick={act(async () => confirm('Turn off sync on every device, and delete the encrypted copy from the server? Each device keeps its own data.') && turnOff())}
        >
          Turn off sync
        </button>
      </div>
      <p className="hint">Each device keeps its data either way. To delete the copy on the server, turn off sync from any device that is still paired.</p>
      {error && <p className="error">{error}</p>}
    </Card>
  );
}

/** Shown in place of the app when it is opened from another device's sync link. */
export function Join({ secret, done }: { secret: string; done: () => void }) {
  const { busy, error, act } = useAction();
  return (
    <main className="wrap onboard">
      <h1>Sync with your other device</h1>
      <div className="card glass">
        <p>This device will keep in step with the one that showed you this link. What is on each is combined, and changes on either appear on both.</p>
        <p className="hint">Only continue if the link came from one of your own devices: anyone with it can read your data.</p>
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
            {busy ? 'Syncing...' : 'Start syncing'}
          </button>
          <button type="button" className="btn" disabled={busy} onClick={done}>
            Not now
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>
    </main>
  );
}
