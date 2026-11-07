import { useState, type SubmitEvent } from 'react';
import { EXERCISES, type ExerciseId } from '../data/exercises';
import { bmi, bmiBand, ffmi, healthyWeight, navyBodyFat, trend } from '../lib/calc';
import { bestE1rm } from '../lib/coach';
import { addDays, db, today, type Measurement, type Profile } from './db';
import { kcalOf, targets, useAsync, useBump } from './hooks';
import { rich } from '../i18n/rich';
import { adviceLang, d, date, fill, h, t } from './i18n';
import { Photos } from './Photos';
import { Card, fmt } from './ui';

const b = (s: string) => <strong className="num">{s}</strong>;
const muted = (s: string) => <span className="muted">{s}</span>;
const signed = (kg: number) => `${kg >= 0 ? '+' : '−'}${fmt(Math.abs(kg), 2)} kg`;

export function Progress({ profile }: { profile: Profile }) {
  const data = useAsync(async () => {
    const d = await db;
    const week = addDays(today(), -6);
    const [t, weights, measurements, workouts, food, days, sessions] = await Promise.all([
      targets(profile),
      d.getAll('weights', IDBKeyRange.lowerBound(addDays(today(), -120))),
      d.getAll('measurements'),
      d.getAllFromIndex('workouts', 'date'),
      d.getAllFromIndex('food', 'date', IDBKeyRange.lowerBound(week)),
      d.getAll('days', IDBKeyRange.lowerBound(week)),
      d.getAllFromIndex('activities', 'date', IDBKeyRange.lowerBound(week)),
    ]);
    // Runs and yoga from a program count as sessions; other cardio does not.
    const planned = sessions.filter((a) => a.day).length;
    // Health-app imports add body fat on its own, so the tape and the scale are looked up apart.
    return { t, weights, m: measurements.findLast((x) => x.waist), scale: measurements.findLast((x) => x.bodyFat), workouts, food, days, week, planned };
  }, [profile]);
  if (!data?.t) return null;
  const { t: target, weights, m, scale, workouts, food, days, week, planned } = data;
  const tr = trend(weights);
  const weekAgo = tr.findLast((p) => p.date <= addDays(today(), -7));
  const change = weekAgo ? tr.at(-1)!.trend - weekAgo.trend : undefined;

  const loggedDays = new Map<string, { kcal: number; protein: number }>();
  for (const e of food) {
    const x = loggedDays.get(e.date) ?? { kcal: 0, protein: 0 };
    loggedDays.set(e.date, { kcal: x.kcal + kcalOf(e), protein: x.protein + (e.food.protein * e.grams) / 100 });
  }
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined);
  const review = {
    kcal: avg([...loggedDays.values()].map((x) => x.kcal)),
    protein: avg([...loggedDays.values()].map((x) => x.protein)),
    sleep: avg(days.flatMap((x) => (x.sleep ? [x.sleep] : []))),
    steps: avg(days.flatMap((x) => (x.steps ? [x.steps] : []))),
    sessions: workouts.filter((w) => w.date >= week).length + planned,
  };

  const body = bmi(target.kg, profile.cm);
  const [lo, hi] = healthyWeight(profile.cm, profile.asian);
  const fat = m?.neck && m.waist ? navyBodyFat({ sex: profile.sex, cm: profile.cm, neck: m.neck, waist: m.waist, hip: m.hip }) : undefined;
  const c = t.progress;

  return (
    <>
      <h1 className="page-title">{c.title}</h1>
      <Card title={c.weight.title}>
        {weights.length >= 2 ? <WeightChart points={tr} /> : <p className="hint">{c.weight.empty}</p>}
        {change !== undefined && (
          <p>
            {rich(fill(c.weight.trend, { change: signed(change), goal: profile.rate === 0 ? c.weight.steady : signed(profile.rate * target.kg) }), { b, m: muted })}
          </p>
        )}
      </Card>

      <Card title={c.maintenance.title}>
        <p>{rich(fill(c.maintenance.formula, { kcal: fmt(target.formula) }), { b })}</p>
        {target.measured !== undefined ? (
          <p>{rich(fill(c.maintenance.measured, { kcal: fmt(target.measured) }), { b })}</p>
        ) : (
          <p className="hint">{c.maintenance.unmeasured}</p>
        )}
      </Card>

      <Card title={c.week.title}>
        <ul className="plan">
          <Row label={c.week.kcal} value={review.kcal} unit="kcal" target={target.kcal} />
          <Row label={c.week.protein} value={review.protein} unit="g" target={target.protein} />
          <Row label={c.week.workouts} value={review.sessions} unit="" target={profile.days} />
          <Row label={c.week.sleep} value={review.sleep} unit="h" digits={1} />
          <Row label={c.week.steps} value={review.steps} unit="" />
        </ul>
        <p className="advice-one" lang={adviceLang}>
          {suggest(review, target, profile, change)}
        </p>
      </Card>

      <Card title={c.body.title}>
        <ul className="plan">
          <li>
            <span>{c.body.bmi}</span>
            <span className="num">{fill(c.body.bmiValue, { bmi: fmt(body, 1), band: d.bmi[bmiBand(body, profile.asian)] })}</span>
          </li>
          <li>
            <span>{c.body.healthyWeight}</span>
            <span className="num">
              {fmt(lo, 1)}-{fmt(hi, 1)} kg
            </span>
          </li>
          {m?.waist && (
            <li>
              <span>{c.body.waistToHeight}</span>
              <span className="num">{fmt(m.waist / profile.cm, 2)}</span>
            </li>
          )}
          {fat !== undefined && (
            <li>
              <span>{c.body.tapeFat}</span>
              <span className="num">{fmt(fat, 1)}%</span>
            </li>
          )}
          {scale?.bodyFat !== undefined && (
            <li>
              <span>{fill(c.body.scaleFat, { date: date(scale.date, { day: 'numeric', month: 'short' }) })}</span>
              <span className="num">{fmt(scale.bodyFat, 1)}%</span>
            </li>
          )}
          {(fat ?? scale?.bodyFat) !== undefined && (
            <li>
              <span>{c.body.ffmi}</span>
              <span className="num">{fmt(ffmi(target.kg, profile.cm, (fat ?? scale?.bodyFat)!), 1)}</span>
            </li>
          )}
        </ul>
        <p className="hint">{c.body.bmiNote}</p>
        <Measurements sex={profile.sex} last={m} />
      </Card>

      <Photos />

      <Strength workouts={workouts} />
    </>
  );
}

function Row(p: { label: string; value?: number; unit: string; target?: number; digits?: number }) {
  return (
    <li>
      <span>{p.label}</span>
      <span className="num">
        {p.value === undefined ? '-' : `${fmt(p.value, p.digits)}${p.unit && ` ${p.unit}`}`}
        {p.target !== undefined && <span className="muted"> / {fmt(p.target)}</span>}
      </span>
    </li>
  );
}

/** One change at a time, the most important first, since each needs two weeks to judge. */
function suggest(r: { kcal?: number; protein?: number; sleep?: number; sessions: number }, t: { kcal: number; protein: number }, p: Profile, change?: number) {
  const a = h.progress.review;
  if (r.kcal === undefined) return a.noFood;
  if (r.protein !== undefined && r.protein < t.protein * 0.85) return fill(a.protein, { avg: fmt(r.protein), target: fmt(t.protein) });
  if (r.sleep !== undefined && r.sleep < 7) return fill(a.sleep, { hours: fmt(r.sleep, 1) });
  if (r.sessions < Math.min(p.days, 3) - 1) return a.workouts;
  if (change !== undefined && p.goal === 'gain' && change <= 0) return a.notGaining;
  if (change !== undefined && p.goal === 'lose' && change >= 0) return a.notLosing;
  return a.onTrack;
}

function WeightChart({ points }: { points: { date: string; kg: number; trend: number }[] }) {
  const W = 600;
  const H = 180;
  const xs = points.map((p) => Date.parse(p.date));
  const ys = points.flatMap((p) => [p.kg, p.trend]);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys) - 0.5, Math.max(...ys) + 0.5];
  const x = (t: number) => 8 + ((t - x0) / Math.max(1, x1 - x0)) * (W - 16);
  const y = (v: number) => 8 + (1 - (v - y0) / (y1 - y0)) * (H - 16);
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={fill(t.progress.weight.chart, { from: fmt(points[0].kg, 1), to: fmt(points.at(-1)!.kg, 1) })}>
        {points.map((p, i) => (
          <circle key={p.date} cx={x(xs[i])} cy={y(p.kg)} r="3" className="dot" />
        ))}
        <polyline className="line" points={points.map((p, i) => `${x(xs[i])},${y(p.trend)}`).join(' ')} />
      </svg>
      <figcaption className="hint">{fill(t.progress.weight.chartNote, { top: fmt(y1 - 0.5, 1), bottom: fmt(y0 + 0.5, 1) })}</figcaption>
    </figure>
  );
}

function Measurements({ sex, last }: { sex: Profile['sex']; last?: Measurement }) {
  const bump = useBump();
  const [open, setOpen] = useState(false);
  const c = t.progress;
  async function save(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const d = await db;
    // Keeps a scale reading imported for the same day.
    const m: Measurement = { date: today(), bodyFat: (await d.get('measurements', today()))?.bodyFat };
    for (const k of ['waist', 'neck', 'hip', 'chest', 'arm', 'thigh'] as const) {
      const v = Number(f.get(k));
      if (v > 0) m[k] = v;
    }
    await d.put('measurements', m);
    setOpen(false);
    bump();
  }
  if (!open)
    return (
      <button type="button" className="btn" onClick={() => setOpen(true)}>
        {c.measurements.add}
      </button>
    );
  type Field = [keyof Omit<Measurement, 'date'>, string];
  const l = c.measurements;
  const fields: Field[] = [
    ['waist', sex === 'male' ? l.waistMale : l.waistFemale],
    ['neck', l.neck],
    ...(sex === 'female' ? [['hip', l.hip] as Field] : []),
    ['chest', l.chest],
    ['arm', l.arm],
    ['thigh', l.thigh],
  ];
  return (
    <form className="stack" onSubmit={save}>
      <div className="grid two">
        {fields.map(([k, label]) => (
          <label key={k} className="field">
            {label}
            <input name={k} type="number" inputMode="decimal" min={10} max={250} step="0.1" defaultValue={last?.[k]} />
          </label>
        ))}
      </div>
      <p className="hint">{l.how}</p>
      <div className="row">
        <button type="submit" className="btn primary">
          {c.save}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>
          {c.cancel}
        </button>
      </div>
    </form>
  );
}

function Strength({ workouts }: { workouts: { date: string; exercises: { exercise: ExerciseId; sets: { kg: number; reps: number; rir: number }[] }[] }[] }) {
  const lifts = new Map<ExerciseId, { first: number; best: number; last: number }>();
  for (const w of workouts)
    for (const e of w.exercises) {
      if (!EXERCISES[e.exercise].step || !e.sets.length) continue;
      const v = bestE1rm(e.sets);
      const x = lifts.get(e.exercise);
      lifts.set(e.exercise, x ? { first: x.first, best: Math.max(x.best, v), last: v } : { first: v, best: v, last: v });
    }
  const c = t.progress.strength;
  return (
    <Card title={c.title}>
      {lifts.size ? (
        <>
          <ul className="plan">
            {[...lifts].map(([id, l]) => (
              <li key={id}>
                <span>{EXERCISES[id].name}</span>
                <span className="num">{rich(fill(c.lift, { last: fmt(l.last, 1), best: fmt(l.best, 1), first: fmt(l.first, 1) }), { m: muted })}</span>
              </li>
            ))}
          </ul>
          <p className="hint">{c.note}</p>
        </>
      ) : (
        <p className="hint">{c.empty}</p>
      )}
    </Card>
  );
}
