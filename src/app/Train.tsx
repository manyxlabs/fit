import { useEffect, useState } from 'react';
import { alternatives, EXERCISES, exerciseSlug, MUSCLES, type Exercise, type ExerciseId, type Muscle } from '../data/exercises';
import { ACTIVITIES } from '../data/activities';
import { POSES } from '../data/poses';
import { weeklySets, type Day, type Hold, type HoldDay, type LiftDay, type Plan, type RunDay } from '../data/programs';
import { metKcal } from '../lib/calc';
import { deloadDue, nextTarget, readiness, strengthTarget, type SetLog } from '../lib/coach';
import { addDays, db, getSetting, setSetting, today, type Activity_, type Profile, type Settings, type Workout } from './db';
import { latestWeight, useAsync, useBump } from './hooks';
import { saveProfile } from './Onboarding';
import { ProgramPicker } from './ProfileForm';
import { elapsedMs, holdLabel, holdSteps, IntervalTimer, runSteps, runSummary, totalSeconds, type Step, type TimerState } from './Timer';
import { Card, clock, fmt } from './ui';

const isLift = (d: Day): d is LiftDay => 'slots' in d;
const isRun = (d: Day): d is RunDay => 'set' in d;
const guide = (id: ExerciseId) => `/exercises/${exerciseSlug(id)}/`;
const shortDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const YOGA_MET = ACTIVITIES.find(([n]) => n === 'Yoga')![1];

/**
 * The day after the last one trained, so a missed day shifts the plan rather than skipping it.
 * Plans that build to an end repeat their last week instead of starting over.
 */
export async function nextDay(plan: Plan) {
  const tx = (await db).transaction(isLift(plan.days[0]) ? 'workouts' : 'activities');
  let cursor = await tx.store.index('date').openCursor(null, 'prev');
  while (cursor && !cursor.value.day) cursor = await cursor.continue();
  const i = plan.days.findIndex((d) => d.name === cursor?.value.day) + 1;
  return plan.days[i < plan.days.length ? i : (plan.repeatFrom ?? 0)];
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
    const since60 = IDBKeyRange.lowerBound(addDays(today(), -60));
    const [next, hist, day, deloadedOn, workouts, activities, firstWorkout] = await Promise.all([
      nextDay(program),
      history(),
      d.get('days', today()),
      getSetting('deloadedOn'),
      d.getAllFromIndex('workouts', 'date', since60),
      d.getAllFromIndex('activities', 'date', since60),
      d.transaction('workouts').store.index('date').openCursor(),
    ]);
    const since = deloadedOn ?? firstWorkout?.value.date;
    const weeks = since ? Math.floor((Date.parse(today()) - Date.parse(since)) / 604_800_000) : 0;
    const recent: (Workout | Activity_)[] = [...workouts, ...activities.filter((a) => a.day)].toReversed().sort((a, b) => b.date.localeCompare(a.date));
    return { program, next, hist, ready: readiness(day), deloading: !!deloadedOn && addDays(deloadedOn, 7) > today(), due: deloadDue(weeks, hist), recent };
  }, []);
  const [session, setSession] = useState<Workout>();
  const [timer, setTimer] = useState<Settings['timer']>();
  useEffect(() => {
    getSetting('draft').then((d) => d && setSession(d));
    getSetting('timer').then((t) => t && setTimer(t));
  }, []);
  if (!data) return null;
  const { program, next, hist, ready, deloading, due } = data;
  const lifting = isLift(program.days[0]);

  async function start(dayName: string) {
    const day = program.days.find((d) => d.name === dayName)!;
    if (!isLift(day)) {
      const t = { day: day.name, started: Date.now(), paused: 0 };
      await setSetting('timer', t);
      setTimer(t);
      return;
    }
    const factor = ready.volume * (deloading ? 0.6 : 1);
    const w: Workout = {
      date: today(),
      day: day.name,
      exercises: day.slots.map(([exercise, sets, lo, hi, rir]) => ({ exercise, range: [lo, hi], sets: [], planned: Math.max(1, Math.round(sets * factor)), ...(rir !== undefined && { rir }) })),
    };
    await setSetting('draft', w);
    setSession(w);
  }

  const timedDay = timer && program.days.find((d) => d.name === timer.day);
  if (timer && timedDay && !isLift(timedDay))
    return (
      <TimedSession
        day={timedDay}
        timer={timer}
        onTimer={async (t) => {
          const next = { ...t, day: timer.day };
          await setSetting('timer', next);
          setTimer(next);
        }}
        onEnd={async () => {
          await setSetting('timer', undefined);
          setTimer(undefined);
          bump();
        }}
      />
    );

  if (session)
    return (
      <Session
        session={session}
        cooldown={(program.days.find((d) => d.name === session.day) as LiftDay | undefined)?.cooldown}
        hist={hist}
        extraRir={ready.extraRir}
        onChange={async (w) => {
          // Saved first, so a set shows as logged only once a reload would keep it.
          await setSetting('draft', w);
          setSession(w);
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
      {lifting && due && !deloading && (
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
        <DayPlan day={next} />
        {ready.level !== 'rest' && (
          <div className="row">
            <button type="button" className="btn primary" onClick={() => start(next.name)}>
              Start {ready.level === 'light' ? 'anyway' : isLift(next) ? 'workout' : isRun(next) ? 'run' : 'routine'}
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
      <ProgramCard program={program} profile={profile} />
      <Cardio />
      <Card title="Recent workouts">
        {data.recent.length ? (
          <ul className="plan">
            {data.recent.slice(0, 10).map((w) => (
              <li key={`${'exercises' in w ? 'w' : 'a'}${w.id}`}>
                <span>
                  {w.day} <span className="muted">· {shortDate(w.date)}</span>
                </span>
                <span className="muted num">{'exercises' in w ? `${w.exercises.reduce((s, e) => s + e.sets.length, 0)} sets` : `${fmt(w.minutes)} min`}</span>
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

function Session(props: { session: Workout; cooldown?: LiftDay['cooldown']; hist: Map<ExerciseId, SetLog[][]>; extraRir: number; onChange: (w: Workout) => void; onEnd: (save: boolean) => void }) {
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
          Rest <strong className="num">{clock(left)}</strong>
          <button type="button" className="btn" onClick={() => setRest(undefined)}>
            Skip
          </button>
        </div>
      )}
      {w.exercises.map((e, i) => {
        const ex: Exercise = EXERCISES[e.exercise];
        const sessions = props.hist.get(e.exercise) ?? [];
        const rir = (e.rir ?? (ex.compound ? 2 : 1)) + props.extraRir;
        const target = e.rir === undefined ? nextTarget(e.exercise, e.range, sessions.at(-1) ?? []) : strengthTarget(e.exercise, e.range[0], rir, sessions);
        const hold = ex.kind === 'hold';
        return (
          <Card key={i} title={ex.name} action={<a href={guide(e.exercise)}>How to</a>}>
            <p className="hint">{ex.cue}</p>
            <p>
              Target: {target.kg !== undefined && `${fmt(target.kg, 1)} kg × `}
              {target.reps} {hold ? 'seconds' : 'reps'}, {e.planned} sets{!hold && `, ${rir} ${rir === 1 ? 'rep' : 'reps'} in reserve`}. <span className="muted">{target.note}</span>
            </p>
            <SetLogger
              key={e.exercise}
              hold={hold}
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
      {props.cooldown && <Cooldown holds={props.cooldown} />}
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

function SetLogger(props: { hold: boolean; sets: SetLog[]; planned: number; defaults: SetLog; onLog: (sets: SetLog[]) => void }) {
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
                {n + 1}. {fmt(done.kg, 1)} kg × {done.reps}
                {props.hold ? ' s' : ''}, {done.rir} in reserve
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
              <input aria-label={props.hold ? 'Seconds' : 'Reps'} type="number" inputMode="numeric" min={1} max={props.hold ? 600 : 100} value={draft.reps} onChange={(e) => setDraft({ ...draft, reps: e.target.valueAsNumber || 0 })} required />
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

/** What a day asks for: exercises with sets and reps, a run's intervals, or the poses and holds. */
function DayPlan({ day }: { day: Day }) {
  if (isRun(day)) return <p>{runSummary(day)}</p>;
  return (
    <ul className="plan">
      {isLift(day)
        ? day.slots.map(([id, sets, lo, hi], j) => (
            <li key={j}>
              <a href={guide(id)}>{EXERCISES[id].name}</a>
              <span className="muted num">
                {sets} × {lo === hi ? lo : `${lo}-${hi}`}
              </span>
            </li>
          ))
        : day.holds.map((h, j) => (
            <li key={j}>
              <span>{POSES[h[0]].name}</span>
              <span className="muted num">{holdLabel(h)}</span>
            </li>
          ))}
    </ul>
  );
}

function ProgramCard({ program, profile }: { program: Plan; profile: Profile }) {
  const bump = useBump();
  const days = program.days.filter(isLift);
  const sets = weeklySets(days.map((d) => ({ slots: d.slots.map(([exercise, n]) => ({ exercise, sets: n })) })));
  async function swap(dayIdx: number, slotIdx: number, to: ExerciseId) {
    const next = program.days.map((d, i) => (i !== dayIdx || !isLift(d) ? d : { ...d, slots: d.slots.map((s, j) => (j === slotIdx ? ([to, ...s.slice(1)] as typeof s) : s)) }));
    await setSetting('program', { ...program, days: next });
    bump();
  }
  return (
    <Card title={`Your program: ${program.name}`}>
      <ProgramPicker setup={profile.setup} days={profile.days} value={profile.program} onChange={(id) => saveProfile({ ...profile, program: id }).then(bump)} />
      <details>
        <summary>{days.length ? 'Days and exercises' : 'Weeks and sessions'}</summary>
        {program.days.map((d, i) => (
          <div key={i} className="prog-day">
            <h3>{d.name}</h3>
            {isLift(d) ? (
              <ul className="plan">
                {d.slots.map(([id, n, lo, hi], j) => {
                  const alts = alternatives(id, profile.setup);
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
                        <a href={guide(id)}>{EXERCISES[id].name}</a>
                      )}
                      <span className="muted num">
                        {n} × {lo === hi ? lo : `${lo}-${hi}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <DayPlan day={d} />
            )}
          </div>
        ))}
      </details>
      {days.length > 0 && (
        <details>
          <summary>Hard sets a week per muscle</summary>
          <p className="hint">Beginners grow on about 6-10 a muscle, intermediates on 10-16. Assisting muscles count half.</p>
          <ul className="plan">
            {(Object.keys(MUSCLES) as Muscle[]).map((m) => (
              <li key={m}>
                <span>{MUSCLES[m]}</span>
                <span className="num">{fmt(sets[m] ?? 0, 1)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

/** A lift day's closing stretches, on the same hold timer as a yoga routine but not logged. */
function Cooldown({ holds }: { holds: Hold[] }) {
  const steps = holdSteps(holds);
  const [timer, setTimer] = useState<TimerState>();
  return (
    <Card title="Mobility cool-down">
      {timer ? (
        <IntervalTimer steps={steps} timer={timer} onTimer={setTimer} />
      ) : (
        <>
          <DayPlan day={{ name: '', holds }} />
          <button type="button" className="btn" onClick={() => setTimer({ started: Date.now(), paused: 0 })}>
            Start the cool-down, {Math.round(totalSeconds(steps) / 60)} min
          </button>
        </>
      )}
    </Card>
  );
}

/** A run or yoga session on the interval timer, logged as an activity at the end. */
function TimedSession(props: { day: RunDay | HoldDay; timer: TimerState; onTimer: (t: TimerState) => void; onEnd: () => void }) {
  const { day, timer } = props;
  const steps: Step[] = isRun(day) ? runSteps(day) : holdSteps(day.holds);
  const total = totalSeconds(steps);
  const [ending, setEnding] = useState(false);
  const done = ending || elapsedMs(timer, Date.now()) >= total * 1000;
  return (
    <>
      <h1 className="page-title">{day.name}</h1>
      <Card title={isRun(day) ? 'Run' : 'Routine'}>
        <IntervalTimer steps={steps} timer={timer} onTimer={props.onTimer} onDone={() => setEnding(true)} />
      </Card>
      {done ? (
        <LogSession run={isRun(day)} day={day.name} steps={steps} seconds={Math.min(total, Math.round(elapsedMs(timer, Date.now()) / 1000))} onEnd={props.onEnd} />
      ) : (
        <div className="row sticky-actions">
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              if (timer.pausedAt === undefined) props.onTimer({ ...timer, pausedAt: Date.now() });
              setEnding(true);
            }}
          >
            Finish early
          </button>
          <button type="button" className="btn" onClick={() => confirm('Discard this session?') && props.onEnd()}>
            Discard
          </button>
        </div>
      )}
    </>
  );
}

function LogSession(props: { run: boolean; day: string; steps: Step[]; seconds: number; onEnd: () => void }) {
  const [km, setKm] = useState<number>();
  const [mins, setMins] = useState(Math.floor(props.seconds / 60));
  const [secs, setSecs] = useState(props.seconds % 60);
  const time = (mins || 0) * 60 + (secs || 0);
  // A run's calories weigh each step's effort by its share of the planned time.
  const met = props.run ? props.steps.reduce((s, x) => s + x.met! * x.seconds, 0) / totalSeconds(props.steps) : YOGA_MET;
  return (
    <Card title="Log it">
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          await (await db).add('activities', { date: today(), name: props.day, met, minutes: time / 60, day: props.day, ...(km ? { km } : {}) });
          props.onEnd();
        }}
      >
        <div className="grid three">
          {props.run && (
            <label className="field">
              Distance (km)
              <input type="number" inputMode="decimal" min={0.1} max={100} step="0.01" value={km ?? ''} onChange={(e) => setKm(e.target.valueAsNumber || undefined)} />
            </label>
          )}
          <label className="field">
            Minutes
            <input type="number" inputMode="numeric" min={0} max={600} value={Number.isNaN(mins) ? '' : mins} onChange={(e) => setMins(e.target.valueAsNumber)} required />
          </label>
          <label className="field">
            Seconds
            <input type="number" inputMode="numeric" min={0} max={59} value={Number.isNaN(secs) ? '' : secs} onChange={(e) => setSecs(e.target.valueAsNumber)} required />
          </label>
        </div>
        {km && time > 0 && <p>Pace {clock(Math.round(time / km))} per km</p>}
        <button type="submit" className="btn primary" disabled={time <= 0}>
          Save {props.run ? 'run' : 'session'}
        </button>
      </form>
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
                {a.name}, {fmt(a.minutes)} min{a.km && `, ${fmt(a.km, 2)} km at ${clock(Math.round((a.minutes * 60) / a.km))} per km`}
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

