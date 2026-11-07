import { useState, type ReactNode } from 'react';
import { ACTIVITIES } from '../data/activities';
import {
  ACTIVITY,
  activityFactor,
  bmi,
  bmiBand,
  bmr,
  calorieTarget,
  ffmi,
  healthyWeight,
  heartRateZones,
  macros,
  maxHeartRate,
  metKcal,
  navyBodyFat,
  oneRepMax,
  RATES,
  waterMl,
  type Activity,
  type Goal,
  type Sex,
} from '../lib/calc';

const fmt = (n: number, d = 0) => n.toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d });

/** A number field that keeps what is typed and reports NaN while it is empty or partial. */
function Num(p: { label: string; value: number; set: (n: number) => void; min: number; max: number; step?: number }) {
  return (
    <label className="field">
      {p.label}
      <input type="number" inputMode="decimal" min={p.min} max={p.max} step={p.step ?? 'any'} defaultValue={p.value} onChange={(e) => p.set(e.target.valueAsNumber)} />
    </label>
  );
}

function SexPick({ sex, set }: { sex: Sex; set: (s: Sex) => void }) {
  return (
    <label className="field">
      Sex
      <select value={sex} onChange={(e) => set(e.target.value as Sex)}>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
    </label>
  );
}

function ActivityPick({ a, set }: { a: Activity; set: (a: Activity) => void }) {
  return (
    <label className="field wide">
      Activity, counting your whole day
      <select value={a} onChange={(e) => set(e.target.value as Activity)}>
        {ACTIVITY.map((x) => (
          <option key={x.id} value={x.id}>
            {x.label}: {x.detail}
          </option>
        ))}
      </select>
    </label>
  );
}

const ok = (...xs: number[]) => xs.every((x) => Number.isFinite(x) && x > 0);

function Out({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <output className="calc-out" aria-live="polite">
      {show ? children : <p className="hint">Fill in every field to see the result.</p>}
    </output>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="stat">
      <span className="hint">{label}</span>
      <strong>{value}</strong>
      {note && <span className="hint">{note}</span>}
    </div>
  );
}

function useBody() {
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState(25);
  const [kg, setKg] = useState(70);
  const [cm, setCm] = useState(172);
  const [act, setAct] = useState<Activity>('moderate');
  const fields = (
    <>
      <SexPick sex={sex} set={setSex} />
      <Num label="Age" value={age} set={setAge} min={15} max={90} step={1} />
      <Num label="Weight (kg)" value={kg} set={setKg} min={30} max={250} />
      <Num label="Height (cm)" value={cm} set={setCm} min={120} max={230} />
      <ActivityPick a={act} set={setAct} />
    </>
  );
  const valid = ok(age, kg, cm) && age >= 15 && age <= 90;
  const tdee = valid ? bmr({ sex, kg, cm, age }) * activityFactor(act) : 0;
  return { sex, age, kg, cm, fields, valid, tdee };
}

export function BmiCalc() {
  const [kg, setKg] = useState(70);
  const [cm, setCm] = useState(172);
  const [asian, setAsian] = useState(true);
  const v = ok(kg, cm) ? bmi(kg, cm) : 0;
  const [lo, hi] = ok(cm) ? healthyWeight(cm, asian) : [0, 0];
  return (
    <div className="calc glass">
      <div className="grid two">
        <Num label="Weight (kg)" value={kg} set={setKg} min={20} max={300} />
        <Num label="Height (cm)" value={cm} set={setCm} min={100} max={230} />
      </div>
      <label className="check">
        <input type="checkbox" checked={asian} onChange={(e) => setAsian(e.target.checked)} />
        Asian cut-offs (WHO Asia-Pacific), for people of South Asian descent
      </label>
      <Out show={ok(kg, cm)}>
        <Stat label="BMI" value={fmt(v, 1)} note={bmiBand(v, asian)} />
        <Stat label="Healthy weight for your height" value={`${fmt(lo, 1)}-${fmt(hi, 1)} kg`} />
      </Out>
    </div>
  );
}

export function TdeeCalc() {
  const b = useBody();
  return (
    <div className="calc glass">
      <div className="grid">{b.fields}</div>
      <Out show={b.valid}>
        <Stat label="BMR, at complete rest" value={`${fmt(bmr(b))} kcal`} />
        <Stat label="Maintenance (TDEE)" value={`${fmt(b.tdee)} kcal`} />
        <Stat label="Fat loss, 0.5% a week" value={`${fmt(calorieTarget(b.tdee, b.kg, RATES.lose.default, b.sex).kcal)} kcal`} />
        <Stat label="Lean gain, 0.25% a week" value={`${fmt(calorieTarget(b.tdee, b.kg, RATES.gain.default, b.sex).kcal)} kcal`} />
      </Out>
    </div>
  );
}

const GOALS: Record<Goal, string> = { lose: 'Lose fat', maintain: 'Maintain', recomp: 'Recomp', gain: 'Build muscle' };

export function MacroCalc() {
  const b = useBody();
  const [goal, setGoal] = useState<Goal>('gain');
  const { kcal, floored } = calorieTarget(b.tdee, b.kg, RATES[goal].default, b.sex);
  const m = macros({ kcal, kg: b.kg, cm: b.cm, goal });
  return (
    <div className="calc glass">
      <div className="grid">
        {b.fields}
        <label className="field">
          Goal
          <select value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
            {(Object.keys(GOALS) as Goal[]).map((g) => (
              <option key={g} value={g}>
                {GOALS[g]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Out show={b.valid}>
        <Stat label="Calories" value={`${fmt(kcal)} kcal`} note={floored ? 'Held at the safe minimum' : undefined} />
        <Stat label="Protein" value={`${fmt(m.protein)} g`} note={`${fmt(m.protein * 4)} kcal`} />
        <Stat label="Fat" value={`${fmt(m.fat)} g`} note={`${fmt(m.fat * 9)} kcal`} />
        <Stat label="Carbs" value={`${fmt(m.carbs)} g`} note={`${fmt(m.carbs * 4)} kcal`} />
        <Stat label="Fibre" value={`${fmt(m.fibre)} g`} />
      </Out>
    </div>
  );
}

export function ProteinCalc() {
  const [kg, setKg] = useState(70);
  const [cm, setCm] = useState(172);
  const [goal, setGoal] = useState<Goal>('gain');
  const p = ok(kg, cm) ? macros({ kcal: 2000, kg, cm, goal }).protein : 0;
  return (
    <div className="calc glass">
      <div className="grid">
        <Num label="Weight (kg)" value={kg} set={setKg} min={30} max={250} />
        <Num label="Height (cm)" value={cm} set={setCm} min={120} max={230} />
        <label className="field">
          Goal
          <select value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
            {(Object.keys(GOALS) as Goal[]).map((g) => (
              <option key={g} value={g}>
                {GOALS[g]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Out show={ok(kg, cm)}>
        <Stat label="Protein a day" value={`${fmt(p)} g`} />
        <Stat label="Over 4 meals" value={`${fmt(p / 4)} g each`} />
      </Out>
    </div>
  );
}

export function BodyFatCalc() {
  const [sex, setSex] = useState<Sex>('male');
  const [kg, setKg] = useState(70);
  const [cm, setCm] = useState(172);
  const [neck, setNeck] = useState(38);
  const [waist, setWaist] = useState(84);
  const [hip, setHip] = useState(96);
  const bf = ok(cm, neck, waist) ? navyBodyFat({ sex, cm, neck, waist, hip: sex === 'female' ? hip : undefined }) : undefined;
  const valid = bf !== undefined && bf > 2 && bf < 70;
  return (
    <div className="calc glass">
      <div className="grid">
        <SexPick sex={sex} set={setSex} />
        <Num label="Weight (kg)" value={kg} set={setKg} min={30} max={250} />
        <Num label="Height (cm)" value={cm} set={setCm} min={120} max={230} />
        <Num label="Neck (cm)" value={neck} set={setNeck} min={20} max={70} />
        <Num label={sex === 'male' ? 'Waist at the navel (cm)' : 'Waist at the narrowest (cm)'} value={waist} set={setWaist} min={40} max={200} />
        {sex === 'female' && <Num label="Hips at the widest (cm)" value={hip} set={setHip} min={50} max={200} />}
      </div>
      <Out show={valid}>
        <Stat label="Body fat" value={`${fmt(bf ?? 0, 1)}%`} />
        <Stat label="Fat mass" value={`${fmt((kg * (bf ?? 0)) / 100, 1)} kg`} />
        <Stat label="Lean mass" value={`${fmt(kg * (1 - (bf ?? 0) / 100), 1)} kg`} />
        <Stat label="Fat-free mass index" value={fmt(ok(kg) ? ffmi(kg, cm, bf ?? 0) : 0, 1)} />
        <Stat label="Waist to height" value={fmt(waist / cm, 2)} note="Aim under 0.5" />
      </Out>
    </div>
  );
}

export function OneRepMaxCalc() {
  const [kg, setKg] = useState(60);
  const [reps, setReps] = useState(8);
  const [rir, setRir] = useState(0);
  const max = ok(kg, reps) ? oneRepMax(kg, reps, rir) : 0;
  return (
    <div className="calc glass">
      <div className="grid">
        <Num label="Weight lifted (kg)" value={kg} set={setKg} min={1} max={500} />
        <Num label="Reps done" value={reps} set={setReps} min={1} max={20} step={1} />
        <label className="field">
          Reps left in reserve
          <select value={rir} onChange={(e) => setRir(Number(e.target.value))}>
            {[0, 1, 2, 3, 4].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>
      <Out show={ok(kg, reps) && reps <= 20}>
        <Stat label="Estimated one-rep max" value={`${fmt(max, 1)} kg`} />
        <table className="calc-table">
          <thead>
            <tr>
              <th>Reps</th>
              <th>Load</th>
            </tr>
          </thead>
          <tbody>
            {[1, 3, 5, 8, 10, 12, 15].map((r) => (
              <tr key={r}>
                <td>{r}</td>
                <td>{fmt(r === 1 ? max : max / (1 + r / 30), 1)} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Out>
    </div>
  );
}

export function HeartRateCalc() {
  const [age, setAge] = useState(30);
  const [rest, setRest] = useState(NaN);
  const valid = ok(age) && age >= 10 && age <= 100;
  return (
    <div className="calc glass">
      <div className="grid two">
        <Num label="Age" value={age} set={setAge} min={10} max={100} step={1} />
        <Num label="Resting heart rate (optional)" value={rest} set={setRest} min={30} max={110} step={1} />
      </div>
      <Out show={valid}>
        <Stat label="Estimated maximum heart rate" value={`${fmt(maxHeartRate(age))} bpm`} />
        <table className="calc-table">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Heart rate</th>
            </tr>
          </thead>
          <tbody>
            {heartRateZones(age, ok(rest) ? rest : undefined).map((z) => (
              <tr key={z.zone}>
                <td>
                  {z.zone}. {z.name}
                </td>
                <td>
                  {z.from}-{z.to} bpm
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Out>
    </div>
  );
}

export function WaterCalc() {
  const [kg, setKg] = useState(70);
  const [mins, setMins] = useState(60);
  // About 0.5-1 litre of sweat an hour of training; the midpoint, in 250 ml steps.
  const extra = Math.round(((Number.isFinite(mins) ? mins : 0) / 60) * 750 / 250) * 250;
  return (
    <div className="calc glass">
      <div className="grid two">
        <Num label="Weight (kg)" value={kg} set={setKg} min={20} max={250} />
        <Num label="Exercise today (minutes)" value={mins} set={setMins} min={0} max={600} step={5} />
      </div>
      <Out show={ok(kg)}>
        <Stat label="Baseline" value={`${fmt(waterMl(kg) / 1000, 1)} litres`} />
        <Stat label="With exercise" value={`${fmt((waterMl(kg) + extra) / 1000, 1)} litres`} note="More in heat; pale-yellow urine is the check" />
      </Out>
    </div>
  );
}

export function BurnCalc() {
  const [i, setI] = useState(1);
  const [kg, setKg] = useState(70);
  const [mins, setMins] = useState(30);
  return (
    <div className="calc glass">
      <div className="grid">
        <label className="field">
          Activity
          <select value={i} onChange={(e) => setI(Number(e.target.value))}>
            {ACTIVITIES.map(([n], j) => (
              <option key={n} value={j}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <Num label="Weight (kg)" value={kg} set={setKg} min={20} max={250} />
        <Num label="Minutes" value={mins} set={setMins} min={1} max={600} step={1} />
      </div>
      <Out show={ok(kg, mins)}>
        <Stat label="Calories burned" value={`${fmt(metKcal(ACTIVITIES[i][1], kg, mins))} kcal`} note={`${ACTIVITIES[i][1]} MET`} />
      </Out>
    </div>
  );
}

const ALL = { BmiCalc, TdeeCalc, MacroCalc, ProteinCalc, BodyFatCalc, OneRepMaxCalc, HeartRateCalc, WaterCalc, BurnCalc };

/** One hydratable entry point, so a page can pick its calculator by name. */
export default function Calc({ name }: { name: keyof typeof ALL }) {
  const C = ALL[name];
  return <C />;
}
