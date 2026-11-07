import { useState, type SubmitEvent } from 'react';
import { EXERCISES, type ExerciseId } from '../data/exercises';
import { bmi, bmiBand, ffmi, healthyWeight, navyBodyFat, trend } from '../lib/calc';
import { bestE1rm } from '../lib/coach';
import { addDays, db, today, type Measurement, type Profile } from './db';
import { kcalOf, targets, useAsync, useBump } from './hooks';
import { Card, fmt } from './ui';

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
    return { t, weights, m: measurements.at(-1), workouts, food, days, week, planned };
  }, [profile]);
  if (!data?.t) return null;
  const { t, weights, m, workouts, food, days, week, planned } = data;
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

  const body = bmi(t.kg, profile.cm);
  const [lo, hi] = healthyWeight(profile.cm, profile.asian);
  const fat = m?.neck && m.waist ? navyBodyFat({ sex: profile.sex, cm: profile.cm, neck: m.neck, waist: m.waist, hip: m.hip }) : undefined;

  return (
    <>
      <h1 className="page-title">Progress</h1>
      <Card title="Weight">
        {weights.length >= 2 ? <WeightChart points={tr} /> : <p className="hint">Log your weight on the Today tab each morning. The chart and the trend appear after two weigh-ins.</p>}
        {change !== undefined && (
          <p>
            Trend this week: <strong className="num">{change >= 0 ? '+' : '−'}{fmt(Math.abs(change), 2)} kg</strong>
            <span className="muted"> (goal {profile.rate === 0 ? 'steady' : `${profile.rate > 0 ? '+' : '−'}${fmt(Math.abs(profile.rate * t.kg), 2)} kg`})</span>
          </p>
        )}
      </Card>

      <Card title="Maintenance calories">
        <p>
          From the formula: <strong className="num">{fmt(t.formula)} kcal</strong>
        </p>
        {t.measured !== undefined ? (
          <p>
            Measured from your logs: <strong className="num">{fmt(t.measured)} kcal</strong>. Your targets use this one.
          </p>
        ) : (
          <p className="hint">Log food and weight for 2-4 weeks and the app measures your real maintenance, which formulas miss by 5-10% for most people.</p>
        )}
      </Card>

      <Card title="This week">
        <ul className="plan">
          <Row label="Average calories" value={review.kcal} unit="kcal" target={t.kcal} />
          <Row label="Average protein" value={review.protein} unit="g" target={t.protein} />
          <Row label="Workouts" value={review.sessions} unit="" target={profile.days} />
          <Row label="Average sleep" value={review.sleep} unit="h" digits={1} />
          <Row label="Average steps" value={review.steps} unit="" />
        </ul>
        <p className="advice-one">{suggest(review, t, profile, change)}</p>
      </Card>

      <Card title="Body composition">
        <ul className="plan">
          <li>
            <span>BMI</span>
            <span className="num">
              {fmt(body, 1)}, {bmiBand(body, profile.asian)}
            </span>
          </li>
          <li>
            <span>Healthy weight for your height</span>
            <span className="num">
              {fmt(lo, 1)}-{fmt(hi, 1)} kg
            </span>
          </li>
          {m?.waist && (
            <li>
              <span>Waist to height (aim under 0.5)</span>
              <span className="num">{fmt(m.waist / profile.cm, 2)}</span>
            </li>
          )}
          {fat !== undefined && (
            <>
              <li>
                <span>Body fat (tape estimate)</span>
                <span className="num">{fmt(fat, 1)}%</span>
              </li>
              <li>
                <span>Fat-free mass index</span>
                <span className="num">{fmt(ffmi(t.kg, profile.cm, fat), 1)}</span>
              </li>
            </>
          )}
        </ul>
        <p className="hint">BMI cannot tell muscle from fat; a lean lifter can read as overweight. Waist and body fat say more.</p>
        <Measurements sex={profile.sex} last={m} />
      </Card>

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
  if (r.kcal === undefined) return 'Log your food for a week to get a review here.';
  if (r.protein !== undefined && r.protein < t.protein * 0.85) return `Protein averaged ${fmt(r.protein)} g against ${fmt(t.protein)} g. Add a protein source to two meals: curd, paneer, eggs, chicken, soya chunks or a whey shake.`;
  if (r.sleep !== undefined && r.sleep < 7) return `Sleep averaged ${fmt(r.sleep, 1)} hours. Getting to 7-9 does more for recovery than any supplement.`;
  if (r.sessions < Math.min(p.days, 3) - 1) return 'Fewer workouts than planned this week. If the plan is too much, set fewer days in More; consistency beats ambition.';
  if (change !== undefined && p.goal === 'gain' && change <= 0) return 'Weight did not go up this week. If that holds for a second week, add 150-250 kcal a day.';
  if (change !== undefined && p.goal === 'lose' && change >= 0) return 'Weight did not go down this week. If that holds for a second week, cut 150-250 kcal or add 2,000 daily steps.';
  return 'On track. Keep everything the same next week.';
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
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Weight from ${fmt(points[0].kg, 1)} to ${fmt(points.at(-1)!.kg, 1)} kg`}>
        {points.map((p, i) => (
          <circle key={p.date} cx={x(xs[i])} cy={y(p.kg)} r="3" className="dot" />
        ))}
        <polyline className="line" points={points.map((p, i) => `${x(xs[i])},${y(p.trend)}`).join(' ')} />
      </svg>
      <figcaption className="hint">
        Dots are weigh-ins, the line is the trend. {fmt(y1 - 0.5, 1)} kg top, {fmt(y0 + 0.5, 1)} kg bottom.
      </figcaption>
    </figure>
  );
}

function Measurements({ sex, last }: { sex: Profile['sex']; last?: Measurement }) {
  const bump = useBump();
  const [open, setOpen] = useState(false);
  async function save(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const m: Measurement = { date: today() };
    for (const k of ['waist', 'neck', 'hip', 'chest', 'arm', 'thigh'] as const) {
      const v = Number(f.get(k));
      if (v > 0) m[k] = v;
    }
    await (await db).put('measurements', m);
    setOpen(false);
    bump();
  }
  if (!open)
    return (
      <button type="button" className="btn" onClick={() => setOpen(true)}>
        Add measurements
      </button>
    );
  type Field = [keyof Omit<Measurement, 'date'>, string];
  const fields: Field[] = [
    ['waist', sex === 'male' ? 'Waist at the navel' : 'Waist at the narrowest'],
    ['neck', 'Neck, below the Adam’s apple'],
    ...(sex === 'female' ? [['hip', 'Hips at the widest'] as Field] : []),
    ['chest', 'Chest'],
    ['arm', 'Upper arm, flexed'],
    ['thigh', 'Thigh'],
  ];
  return (
    <form className="stack" onSubmit={save}>
      <div className="grid two">
        {fields.map(([k, label]) => (
          <label key={k} className="field">
            {label} (cm)
            <input name={k} type="number" inputMode="decimal" min={10} max={250} step="0.1" defaultValue={last?.[k]} />
          </label>
        ))}
      </div>
      <p className="hint">Measure in the morning, relaxed, with the tape snug but not pressing. Every 2-4 weeks is enough.</p>
      <div className="row">
        <button type="submit" className="btn primary">
          Save
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>
          Cancel
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
  return (
    <Card title="Strength">
      {lifts.size ? (
        <>
          <ul className="plan">
            {[...lifts].map(([id, l]) => (
              <li key={id}>
                <span>{EXERCISES[id].name}</span>
                <span className="num">
                  {fmt(l.last, 1)} kg <span className="muted">(best {fmt(l.best, 1)}, from {fmt(l.first, 1)})</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="hint">Estimated one-rep max from your sets, counting reps in reserve.</p>
        </>
      ) : (
        <p className="hint">Finish a workout with loaded lifts to see your estimated one-rep maxes here.</p>
      )}
    </Card>
  );
}
