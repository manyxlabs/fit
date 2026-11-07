import { useEffect, useState } from 'react';
import { alternatives, EXERCISES, MUSCLES, type ExerciseId, type Muscle } from '../data/exercises';
import { ACTIVITIES } from '../data/activities';
import { weeklySets } from '../data/programs';
import { metKcal } from '../lib/calc';
import { deloadDue, nextTarget, readiness, type SetLog } from '../lib/coach';
import { addDays, db, getSetting, setSetting, today, type Profile, type Settings, type Workout } from './db';
import { latestWeight, useAsync, useBump } from './hooks';
import { Card, fmt } from './ui';

type Program = NonNullable<Settings['program']>;

/** The day after the last one trained, so a missed day shifts the plan rather than skipping it. */
export async function nextDay(program: Program) {
  const cursor = await (await db).transaction('workouts').store.index('date').openCursor(null, 'prev');
  const last = program.days.findIndex((d) => d.name === cursor?.value.day);
  return program.days[(last + 1) % program.days.length];
}

async function history() {
  const map = new Map<ExerciseId, SetLog[][]>();
  for (const w of await (await db).getAllFromIndex('workouts', 'date'))
    for (const e of w.exercises) if (e.sets.length) map.set(e.exercise, [...(map.get(e.exercise) ?? []), e.sets]);
  return map;
}

export function Train({ profile }: { profile: Profile }) {
  const bump = useBump();
  const data = useAsync(async () => {
    const d = await db;
    const program = (await getSetting('program'))!;
    const [next, hist, day, deloadedOn, recent, firstWorkout] = await Promise.all([
      nextDay(program),
      history(),
      d.get('days', today()),
      getSetting('deloadedOn'),
      d.getAllFromIndex('workouts', 'date', IDBKeyRange.lowerBound(addDays(today(), -60))),
      d.transaction('workouts').store.index('date').openCursor(),
    ]);
    const since = deloadedOn ?? firstWorkout?.value.date;
    const weeks = since ? Math.floor((Date.parse(today()) - Date.parse(since)) / 604_800_000) : 0;
    return { program, next, hist, ready: readiness(day), deloading: !!deloadedOn && addDays(deloadedOn, 7) > today(), due: deloadDue(weeks, hist), recent: recent.toReversed() };
  }, []);
  const [session, setSession] = useState<Workout>();
  useEffect(() => {
    getSetting('draft').then((d) => d && setSession(d));
  }, []);
  if (!data) return null;
  const { program, next, hist, ready, deloading, due } = data;

  async function start(dayName: string) {
    const day = program.days.find((d) => d.name === dayName)!;
    const factor = ready.volume * (deloading ? 0.6 : 1);
    const w: Workout = {
      date: today(),
      day: day.name,
      exercises: day.slots.map(([exercise, sets, lo, hi]) => ({ exercise, range: [lo, hi], sets: [], planned: Math.max(1, Math.round(sets * factor)) })),
    };
    await setSetting('draft', w);
    setSession(w);
  }

  if (session)
    return (
      <Session
        session={session}
        hist={hist}
        extraRir={ready.extraRir}
        onChange={async (w) => {
          setSession(w);
          await setSetting('draft', w);
        }}
        onEnd={async (save) => {
          const d = await db;
          if (save) await d.add('workouts', { ...session, exercises: session.exercises.filter((e) => e.sets.length) });
          await setSetting('draft', undefined);
          setSession(undefined);
          bump();
        }}
      />
    );

  return (
    <>
      <h1 className="page-title">Training</h1>
      {due && !deloading && (
        <Card title="Time for an easy week">
          <p>{due} Do the same exercises and loads with about 40% fewer sets for one week, then progress again.</p>
          <button
            type="button"
            className="btn primary"
            onClick={async () => {
              await setSetting('deloadedOn', today());
              bump();
            }}
          >
            Start an easy week
          </button>
        </Card>
      )}
      <Card title={`Next: ${next.name}`}>
        {deloading && <p className="hint">Easy week: about 40% fewer sets, same loads.</p>}
        {ready.advice.length > 0 && (
          <ul className={`advice ${ready.level}`}>
            {ready.advice.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}
        <ul className="plan">
          {next.slots.map(([id, sets, lo, hi]) => (
            <li key={id}>
              <span>{EXERCISES[id].name}</span>
              <span className="muted num">
                {sets} × {lo}-{hi}
              </span>
            </li>
          ))}
        </ul>
        {ready.level !== 'rest' && (
          <div className="row">
            <button type="button" className="btn primary" onClick={() => start(next.name)}>
              Start {ready.level === 'light' ? 'anyway' : 'workout'}
            </button>
            <select aria-label="Train a different day" value="" onChange={(e) => e.target.value && start(e.target.value)}>
              <option value="">Another day…</option>
              {program.days.map((d, i) => (
                <option key={i} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </Card>
      <ProgramCard program={program} setup={profile.setup} />
      <Cardio />
      <Card title="Recent workouts">
        {data.recent.length ? (
          <ul className="plan">
            {data.recent.slice(0, 10).map((w) => (
              <li key={w.id}>
                <span>
                  {w.day} <span className="muted">· {new Date(`${w.date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </span>
                <span className="muted num">{w.exercises.reduce((s, e) => s + e.sets.length, 0)} sets</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">Your finished workouts show here.</p>
        )}
      </Card>
    </>
  );
}

function Session(props: { session: Workout; hist: Map<ExerciseId, SetLog[][]>; extraRir: number; onChange: (w: Workout) => void; onEnd: (save: boolean) => void }) {
  const [rest, setRest] = useState<number>();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (rest === undefined) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [rest]);
  const left = rest === undefined ? 0 : Math.max(0, Math.ceil((rest - now) / 1000));
  const w = props.session;
  const update = (i: number, sets: SetLog[]) => props.onChange({ ...w, exercises: w.exercises.map((e, j) => (j === i ? { ...e, sets } : e)) });

  return (
    <>
      <h1 className="page-title">{w.day}</h1>
      {rest !== undefined && left > 0 && (
        <div className="rest glass" role="timer" aria-live="polite">
          Rest <strong className="num">{`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`}</strong>
          <button type="button" className="btn" onClick={() => setRest(undefined)}>
            Skip
          </button>
        </div>
      )}
      {w.exercises.map((e, i) => {
        const ex = EXERCISES[e.exercise];
        const last = props.hist.get(e.exercise)?.at(-1) ?? [];
        const target = nextTarget(e.exercise, e.range, last);
        const rir = (ex.compound ? 2 : 1) + props.extraRir;
        return (
          <Card key={i} title={ex.name}>
            <p className="hint">{ex.cue}</p>
            <p>
              Target: {target.kg !== undefined && `${fmt(target.kg, 1)} kg × `}
              {target.reps} reps, {e.planned} sets, {rir} reps in reserve. <span className="muted">{target.note}</span>
            </p>
            <SetLogger
              key={e.exercise}
              sets={e.sets}
              planned={e.planned}
              defaults={{ kg: target.kg ?? 0, reps: target.reps, rir }}
              onLog={(sets) => {
                update(i, sets);
                setRest(Date.now() + (ex.compound ? 150 : 75) * 1000);
                setNow(Date.now());
              }}
            />
          </Card>
        );
      })}
      <div className="row sticky-actions">
        <button type="button" className="btn primary" onClick={() => props.onEnd(true)} disabled={!w.exercises.some((e) => e.sets.length)}>
          Finish workout
        </button>
        <button type="button" className="btn" onClick={() => confirm('Discard this workout?') && props.onEnd(false)}>
          Discard
        </button>
      </div>
    </>
  );
}

function SetLogger(props: { sets: SetLog[]; planned: number; defaults: SetLog; onLog: (sets: SetLog[]) => void }) {
  const [draft, setDraft] = useState<SetLog>(props.sets.at(-1) ?? props.defaults);
  const rows = Math.max(props.planned, props.sets.length + 1);
  return (
    <ol className="sets">
      {Array.from({ length: rows }, (_, n) => {
        const done = props.sets[n];
        if (done)
          return (
            <li key={n} className="done">
              <span className="num">
                {n + 1}. {fmt(done.kg, 1)} kg × {done.reps}, {done.rir} in reserve
              </span>
              <button type="button" className="icon-btn" aria-label={`Remove set ${n + 1}`} onClick={() => props.onLog(props.sets.filter((_, j) => j !== n))}>
                ×
              </button>
            </li>
          );
        if (n !== props.sets.length) return <li key={n} className="todo muted">{n + 1}.</li>;
        return (
          <li key={n}>
            <form
              className="set-form"
              onSubmit={(e) => {
                e.preventDefault();
                props.onLog([...props.sets, draft]);
              }}
            >
              <span className="num">{n + 1}.</span>
              <input aria-label="kg" type="number" inputMode="decimal" min={0} max={500} step="0.25" value={draft.kg} onChange={(e) => setDraft({ ...draft, kg: e.target.valueAsNumber || 0 })} />
              <span>kg ×</span>
              <input aria-label="Reps" type="number" inputMode="numeric" min={1} max={100} value={draft.reps} onChange={(e) => setDraft({ ...draft, reps: e.target.valueAsNumber || 0 })} required />
              <select aria-label="Reps in reserve" value={draft.rir} onChange={(e) => setDraft({ ...draft, rir: Number(e.target.value) })}>
                {[0, 1, 2, 3, 4].map((r) => (
                  <option key={r} value={r}>
                    {r} RIR
                  </option>
                ))}
              </select>
              <button type="submit" className="btn primary" disabled={!(draft.reps > 0)}>
                Log
              </button>
            </form>
          </li>
        );
      })}
    </ol>
  );
}

function ProgramCard({ program, setup }: { program: Program; setup: Profile['setup'] }) {
  const bump = useBump();
  const sets = weeklySets(program.days.map((d) => ({ slots: d.slots.map(([exercise, n]) => ({ exercise, sets: n })) })));
  async function swap(dayIdx: number, slotIdx: number, to: ExerciseId) {
    const days = program.days.map((d, i) => (i !== dayIdx ? d : { ...d, slots: d.slots.map((s, j) => (j === slotIdx ? ([to, s[1], s[2], s[3]] as typeof s) : s)) }));
    await setSetting('program', { ...program, days });
    bump();
  }
  return (
    <Card title={`Your program: ${program.name}`}>
      <details>
        <summary>Days and exercises</summary>
        {program.days.map((d, i) => (
          <div key={i} className="prog-day">
            <h3>{d.name}</h3>
            <ul className="plan">
              {d.slots.map(([id, n, lo, hi], j) => {
                const alts = alternatives(id, setup);
                return (
                  <li key={j}>
                    {alts.length ? (
                      <select aria-label={`Swap ${EXERCISES[id].name}`} value={id} onChange={(e) => swap(i, j, e.target.value as ExerciseId)}>
                        {[id, ...alts].map((a) => (
                          <option key={a} value={a}>
                            {EXERCISES[a].name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{EXERCISES[id].name}</span>
                    )}
                    <span className="muted num">
                      {n} × {lo}-{hi}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </details>
      <details>
        <summary>Hard sets a week per muscle</summary>
        <p className="hint">
          Beginners grow on about 6-10 a muscle, intermediates on 10-16. Assisting muscles count half.
        </p>
        <ul className="plan">
          {(Object.keys(MUSCLES) as Muscle[]).map((m) => (
            <li key={m}>
              <span>{MUSCLES[m]}</span>
              <span className="num">{fmt(sets[m] ?? 0, 1)}</span>
            </li>
          ))}
        </ul>
      </details>
    </Card>
  );
}

function Cardio() {
  const bump = useBump();
  const data = useAsync(async () => ({ list: await (await db).getAllFromIndex('activities', 'date', today()), w: await latestWeight() }), []);
  const [pick, setPick] = useState(1);
  const [mins, setMins] = useState(30);
  if (!data) return null;
  const kg = data.w?.kg ?? 70;
  return (
    <Card title="Cardio and sport today">
      <p className="hint">2-3 easy sessions of 20-40 minutes a week help the heart and recovery. Keep them away from heavy leg days.</p>
      {data.list.length > 0 && (
        <ul className="plan">
          {data.list.map((a) => (
            <li key={a.id}>
              <span>
                {a.name}, {a.minutes} min
              </span>
              <span className="num muted">{fmt(metKcal(a.met, kg, a.minutes))} kcal</span>
            </li>
          ))}
        </ul>
      )}
      <form
        className="row"
        onSubmit={async (e) => {
          e.preventDefault();
          const [name, met] = ACTIVITIES[pick];
          await (await db).add('activities', { date: today(), name, met, minutes: mins });
          bump();
        }}
      >
        <select aria-label="Activity" value={pick} onChange={(e) => setPick(Number(e.target.value))}>
          {ACTIVITIES.map(([n], i) => (
            <option key={n} value={i}>
              {n}
            </option>
          ))}
        </select>
        <input aria-label="Minutes" type="number" inputMode="numeric" min={1} max={600} value={mins || ''} onChange={(e) => setMins(e.target.valueAsNumber)} required className="mins" />
        <span>min</span>
        <button type="submit" className="btn">
          Add
        </button>
      </form>
      <p className="hint">Calories here are estimates for reference; your target already counts your usual activity, so do not eat them back by default.</p>
    </Card>
  );
}

