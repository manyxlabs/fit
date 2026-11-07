import { useEffect, useRef, useState } from 'react';
import { POSES, type Pose } from '../data/poses';
import { RUN, type Hold, type RunDay, type RunStep } from '../data/programs';
import type { Settings } from './db';
import { Bar, clock } from './ui';

export type Step = { label: string; seconds: number; hint: string; met?: number };
export type TimerState = Omit<NonNullable<Settings['timer']>, 'day'>;

const GET_READY = 5;

const runStep = ([kind, seconds]: RunStep): Step => ({ label: RUN[kind].label, seconds, hint: RUN[kind].effort, met: RUN[kind].met });

export const runSteps = (d: RunDay): Step[] => [runStep(d.warm), ...Array.from({ length: d.reps }, () => d.set.map(runStep)).flat(), runStep(d.cool)];

export const holdSteps = (holds: Hold[]): Step[] =>
  holds.flatMap(([id, seconds]) => {
    const p: Pose = POSES[id];
    const sides = p.sides ? [`${p.name}, left`, `${p.name}, right`] : [p.name];
    return sides.flatMap((label) => [
      { label: `Get ready: ${label}`, seconds: GET_READY, hint: p.cue },
      { label, seconds, hint: p.cue },
    ]);
  });

export const totalSeconds = (steps: Step[]) => steps.reduce((s, x) => s + x.seconds, 0);

const part = ([kind, seconds]: RunStep) => `${clock(seconds)} ${RUN[kind].label.toLowerCase()}`;

/** For example "5:00 walk, 8 × (1:00 run, 1:30 walk), 5:00 walk, 25 min". */
export function runSummary(d: RunDay) {
  const set = d.set.map(part).join(', ');
  const main = d.reps > 1 ? `${d.reps} × ${d.set.length > 1 ? `(${set})` : set}` : set;
  return `${part(d.warm)}, ${main}, ${part(d.cool)}, ${Math.round(totalSeconds(runSteps(d)) / 60)} min`;
}

export const holdLabel = ([id, seconds]: Hold) => `${seconds} s${(POSES[id] as Pose).sides ? ' each side' : ''}`;

export const elapsedMs = (t: TimerState, now: number) => (t.pausedAt ?? now) - t.started - t.paused;

/** Short beep and buzz at each change of step, so the phone can stay in a pocket. */
function signal() {
  try {
    const a = new AudioContext();
    const o = a.createOscillator();
    const g = a.createGain();
    g.gain.value = 0.2;
    o.frequency.value = 880;
    o.connect(g).connect(a.destination);
    o.start();
    o.stop(a.currentTime + 0.25);
    o.onended = () => a.close();
  } catch {}
  try {
    navigator.vibrate?.(200);
  } catch {}
}

/** Keeps the screen on while a session runs; the browser drops the lock when the page is hidden. */
function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on) return;
    let lock: WakeLockSentinel | undefined;
    const take = () => {
      if (document.visibilityState === 'visible') navigator.wakeLock?.request('screen').then((l) => (lock = l), () => {});
    };
    take();
    document.addEventListener('visibilitychange', take);
    return () => {
      document.removeEventListener('visibilitychange', take);
      lock?.release().catch(() => {});
    };
  }, [on]);
}

/** Everything is computed from timestamps, so it stays right through reloads and a sleeping phone. */
export function IntervalTimer(props: { steps: Step[]; timer: TimerState; onTimer: (t: TimerState) => void; onDone?: () => void }) {
  const { steps, timer } = props;
  const [now, setNow] = useState(Date.now());
  const total = totalSeconds(steps);
  const elapsed = Math.min(total, Math.max(0, elapsedMs(timer, now) / 1000));
  const done = elapsed >= total;
  const running = timer.pausedAt === undefined && !done;
  let i = 0;
  let end = steps[0].seconds;
  while (i < steps.length - 1 && elapsed >= end) end += steps[++i].seconds;
  const step = steps[i];
  const at = done ? -1 : i;
  const shown = useRef(at);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    if (shown.current === at) return;
    shown.current = at;
    signal();
    if (done) props.onDone?.();
  }, [at]);
  useWakeLock(running);

  const move = (t: TimerState) => {
    setNow(Date.now());
    props.onTimer(t);
  };
  return (
    <div className="interval">
      <p className="interval-step">{done ? 'Done' : step.label}</p>
      <p className="interval-clock num" role="timer" aria-label={done ? 'Done' : `${step.label}, time left`}>
        {clock(Math.ceil(done ? 0 : end - elapsed))}
      </p>
      {!done && <p className="hint">{step.hint}</p>}
      {!done && steps[i + 1] && <p className="muted">Next: {steps[i + 1].label}</p>}
      <Bar label="Session" value={elapsed / 60} target={total / 60} unit="min" />
      {!done && (
        <div className="row">
          {running ? (
            <button type="button" className="btn" onClick={() => move({ ...timer, pausedAt: Date.now() })}>
              Pause
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={() => move({ started: timer.started, paused: timer.paused + Date.now() - timer.pausedAt! })}>
              Resume
            </button>
          )}
          <button type="button" className="btn" onClick={() => move({ ...timer, started: timer.started - (end - elapsed) * 1000 })}>
            Skip
          </button>
        </div>
      )}
    </div>
  );
}
