import { createContext, useContext, useState, type ReactNode } from 'react';
import { ACTIVITIES } from '../data/activities';
import { fmt } from '../lib/fmt';
import {
  ACTIVITY,
  activityFactor,
  bmi,
  bmiBand,
  bmr,
  calorieTarget,
  ffmi,
  healthyWeight,
  loadFor,
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
import type { Calc as CalcCopy } from '../i18n/en/calc';
import type { Data } from '../i18n/en/data';
import { fill } from '../i18n/intl';

/** What a calculator's page passes in: its language's copy, and the health notes in the language they are reviewed in. */
export type CalcT = {
  calc: CalcCopy;
  data: Pick<Data, 'sex' | 'activity' | 'bmi' | 'zones' | 'activities'> & { goals: Data['goalsShort'] };
  notes: { floored: string; waistAim: string; waterCheck: string; lang?: string };
};
// Pages in every language are drawn in one build, so the copy comes down the tree rather than from a module.
const T = createContext<CalcT>(null!);
const useT = () => useContext(T);


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
  const { calc, data } = useT();
  return (
    <label className="field">
      {calc.sex}
      <select value={sex} onChange={(e) => set(e.target.value as Sex)}>
        <option value="male">{data.sex.male}</option>
        <option value="female">{data.sex.female}</option>
      </select>
    </label>
  );
}

function ActivityPick({ a, set }: { a: Activity; set: (a: Activity) => void }) {
  const { calc, data } = useT();
  return (
    <label className="field wide">
      {calc.activity}
      <select value={a} onChange={(e) => set(e.target.value as Activity)}>
        {ACTIVITY.map((x) => (
          <option key={x.id} value={x.id}>
            {data.activity[x.id].label}: {data.activity[x.id].detail}
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
      {show ? children : <p className="hint">{useT().calc.fillIn}</p>}
    </output>
  );
}

function Stat({ label, value, note, advice }: { label: string; value: string; note?: string; advice?: boolean }) {
  const { notes } = useT();
  return (
    <div className="stat">
      <span className="hint">{label}</span>
      <strong>{value}</strong>
      {note && (
        <span className="hint" lang={advice ? notes.lang : undefined}>
          {note}
        </span>
      )}
    </div>
  );
}

function useBody() {
  const { calc } = useT();
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState(25);
  const [kg, setKg] = useState(70);
  const [cm, setCm] = useState(172);
  const [act, setAct] = useState<Activity>('moderate');
  const fields = (
    <>
      <SexPick sex={sex} set={setSex} />
      <Num label={calc.age} value={age} set={setAge} min={15} max={90} step={1} />
      <Num label={calc.weight} value={kg} set={setKg} min={30} max={250} />
      <Num label={calc.height} value={cm} set={setCm} min={120} max={230} />
      <ActivityPick a={act} set={setAct} />
    </>
  );
  const valid = ok(age, kg, cm) && age >= 15 && age <= 90;
  const tdee = valid ? bmr({ sex, kg, cm, age }) * activityFactor(act) : 0;
  return { sex, age, kg, cm, fields, valid, tdee };
}

export function BmiCalc() {
  const { calc, data } = useT();
  const [kg, setKg] = useState(70);
  const [cm, setCm] = useState(172);
  const [asian, setAsian] = useState(true);
  const v = ok(kg, cm) ? bmi(kg, cm) : 0;
  const [lo, hi] = ok(cm) ? healthyWeight(cm, asian) : [0, 0];
  return (
    <div className="calc glass">
      <div className="grid two">
        <Num label={calc.weight} value={kg} set={setKg} min={20} max={300} />
        <Num label={calc.height} value={cm} set={setCm} min={100} max={230} />
      </div>
      <label className="check">
        <input type="checkbox" checked={asian} onChange={(e) => setAsian(e.target.checked)} />
        {calc.bmi.asian}
      </label>
      <Out show={ok(kg, cm)}>
        <Stat label={calc.bmi.bmi} value={fmt(v, 1)} note={data.bmi[bmiBand(v, asian)]} />
        <Stat label={calc.bmi.healthy} value={`${fmt(lo, 1)}-${fmt(hi, 1)} kg`} />
      </Out>
    </div>
  );
}

export function TdeeCalc() {
  const { calc } = useT();
  const b = useBody();
  return (
    <div className="calc glass">
      <div className="grid">{b.fields}</div>
      <Out show={b.valid}>
        <Stat label={calc.tdee.bmr} value={`${fmt(bmr(b))} kcal`} />
        <Stat label={calc.tdee.maintenance} value={`${fmt(b.tdee)} kcal`} />
        <Stat label={calc.tdee.lose} value={`${fmt(calorieTarget(b.tdee, b.kg, RATES.lose.default, b.sex).kcal)} kcal`} />
        <Stat label={calc.tdee.gain} value={`${fmt(calorieTarget(b.tdee, b.kg, RATES.gain.default, b.sex).kcal)} kcal`} />
      </Out>
    </div>
  );
}

const GOALS: Goal[] = ['lose', 'maintain', 'recomp', 'gain'];

function GoalPick({ goal, set }: { goal: Goal; set: (g: Goal) => void }) {
  const { calc, data } = useT();
  return (
    <label className="field">
      {calc.goal}
      <select value={goal} onChange={(e) => set(e.target.value as Goal)}>
        {GOALS.map((g) => (
          <option key={g} value={g}>
            {data.goals[g]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MacroCalc() {
  const { calc, notes } = useT();
  const b = useBody();
  const [goal, setGoal] = useState<Goal>('gain');
  const { kcal, floored } = calorieTarget(b.tdee, b.kg, RATES[goal].default, b.sex);
  const m = macros({ kcal, kg: b.kg, cm: b.cm, goal });
  return (
    <div className="calc glass">
      <div className="grid">
        {b.fields}
        <GoalPick goal={goal} set={setGoal} />
      </div>
      <Out show={b.valid}>
        <Stat label={calc.macros.calories} value={`${fmt(kcal)} kcal`} note={floored ? notes.floored : undefined} advice />
        <Stat label={calc.macros.protein} value={`${fmt(m.protein)} g`} note={`${fmt(m.protein * 4)} kcal`} />
        <Stat label={calc.macros.fat} value={`${fmt(m.fat)} g`} note={`${fmt(m.fat * 9)} kcal`} />
        <Stat label={calc.macros.carbs} value={`${fmt(m.carbs)} g`} note={`${fmt(m.carbs * 4)} kcal`} />
        <Stat label={calc.macros.fibre} value={`${fmt(m.fibre)} g`} />
      </Out>
    </div>
  );
}

export function ProteinCalc() {
  const { calc } = useT();
  const [kg, setKg] = useState(70);
  const [cm, setCm] = useState(172);
  const [goal, setGoal] = useState<Goal>('gain');
  const p = ok(kg, cm) ? macros({ kcal: 2000, kg, cm, goal }).protein : 0;
  return (
    <div className="calc glass">
      <div className="grid">
        <Num label={calc.weight} value={kg} set={setKg} min={30} max={250} />
        <Num label={calc.height} value={cm} set={setCm} min={120} max={230} />
        <GoalPick goal={goal} set={setGoal} />
      </div>
      <Out show={ok(kg, cm)}>
        <Stat label={calc.protein.perDay} value={`${fmt(p)} g`} />
        <Stat label={calc.protein.perMeal} value={fill(calc.protein.each, { grams: fmt(p / 4) })} />
      </Out>
    </div>
  );
}

export function BodyFatCalc() {
  const { calc, notes } = useT();
  const f = calc.bodyFat;
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
        <Num label={calc.weight} value={kg} set={setKg} min={30} max={250} />
        <Num label={calc.height} value={cm} set={setCm} min={120} max={230} />
        <Num label={f.neck} value={neck} set={setNeck} min={20} max={70} />
        <Num label={sex === 'male' ? f.waistMale : f.waistFemale} value={waist} set={setWaist} min={40} max={200} />
        {sex === 'female' && <Num label={f.hips} value={hip} set={setHip} min={50} max={200} />}
      </div>
      <Out show={valid}>
        <Stat label={f.bodyFat} value={`${fmt(bf ?? 0, 1)}%`} />
        <Stat label={f.fatMass} value={`${fmt((kg * (bf ?? 0)) / 100, 1)} kg`} />
        <Stat label={f.leanMass} value={`${fmt(kg * (1 - (bf ?? 0) / 100), 1)} kg`} />
        <Stat label={f.ffmi} value={fmt(ok(kg) ? ffmi(kg, cm, bf ?? 0) : 0, 1)} />
        <Stat label={f.waistToHeight} value={fmt(waist / cm, 2)} note={notes.waistAim} advice />
      </Out>
    </div>
  );
}

export function OneRepMaxCalc() {
  const o = useT().calc.oneRepMax;
  const [kg, setKg] = useState(60);
  const [reps, setReps] = useState(8);
  const [rir, setRir] = useState(0);
  const max = ok(kg, reps) ? oneRepMax(kg, reps, rir) : 0;
  return (
    <div className="calc glass">
      <div className="grid">
        <Num label={o.lifted} value={kg} set={setKg} min={1} max={500} />
        <Num label={o.reps} value={reps} set={setReps} min={1} max={20} step={1} />
        <label className="field">
          {o.rir}
          <select value={rir} onChange={(e) => setRir(Number(e.target.value))}>
            {[0, 1, 2, 3, 4].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>
      <Out show={ok(kg, reps) && reps <= 20}>
        <Stat label={o.max} value={`${fmt(max, 1)} kg`} />
        <table className="calc-table">
          <thead>
            <tr>
              <th>{o.repsHead}</th>
              <th>{o.load}</th>
            </tr>
          </thead>
          <tbody>
            {[1, 3, 5, 8, 10, 12, 15].map((r) => (
              <tr key={r}>
                <td>{r}</td>
                <td>{fmt(loadFor(max, r), 1)} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Out>
    </div>
  );
}

export function HeartRateCalc() {
  const { calc, data } = useT();
  const h = calc.heartRate;
  const [age, setAge] = useState(30);
  const [rest, setRest] = useState(NaN);
  const valid = ok(age) && age >= 10 && age <= 100;
  return (
    <div className="calc glass">
      <div className="grid two">
        <Num label={calc.age} value={age} set={setAge} min={10} max={100} step={1} />
        <Num label={h.resting} value={rest} set={setRest} min={30} max={110} step={1} />
      </div>
      <Out show={valid}>
        <Stat label={h.max} value={`${fmt(maxHeartRate(age))} bpm`} />
        <table className="calc-table">
          <thead>
            <tr>
              <th>{h.zone}</th>
              <th>{h.rate}</th>
            </tr>
          </thead>
          <tbody>
            {heartRateZones(age, ok(rest) ? rest : undefined).map((z) => (
              <tr key={z.zone}>
                <td>
                  {z.zone}. {data.zones[z.zone - 1]}
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
  const { calc, notes } = useT();
  const [kg, setKg] = useState(70);
  const [mins, setMins] = useState(60);
  // About 0.5-1 litre of sweat an hour of training; the midpoint, in 250 ml steps.
  const extra = Math.round(((Number.isFinite(mins) ? mins : 0) / 60) * 750 / 250) * 250;
  return (
    <div className="calc glass">
      <div className="grid two">
        <Num label={calc.weight} value={kg} set={setKg} min={20} max={250} />
        <Num label={calc.water.exercise} value={mins} set={setMins} min={0} max={600} step={5} />
      </div>
      <Out show={ok(kg)}>
        <Stat label={calc.water.baseline} value={fill(calc.water.litres, { n: fmt(waterMl(kg) / 1000, 1) })} />
        <Stat label={calc.water.withExercise} value={fill(calc.water.litres, { n: fmt((waterMl(kg) + extra) / 1000, 1) })} note={notes.waterCheck} advice />
      </Out>
    </div>
  );
}

export function BurnCalc() {
  const { calc, data } = useT();
  const [i, setI] = useState(1);
  const [kg, setKg] = useState(70);
  const [mins, setMins] = useState(30);
  return (
    <div className="calc glass">
      <div className="grid">
        <label className="field">
          {calc.burn.activity}
          <select value={i} onChange={(e) => setI(Number(e.target.value))}>
            {ACTIVITIES.map(([n], j) => (
              <option key={n} value={j}>
                {data.activities[n]}
              </option>
            ))}
          </select>
        </label>
        <Num label={calc.weight} value={kg} set={setKg} min={20} max={250} />
        <Num label={calc.burn.minutes} value={mins} set={setMins} min={1} max={600} step={1} />
      </div>
      <Out show={ok(kg, mins)}>
        <Stat label={calc.burn.burned} value={`${fmt(metKcal(ACTIVITIES[i][1], kg, mins))} kcal`} note={`${ACTIVITIES[i][1]} MET`} />
      </Out>
    </div>
  );
}

const ALL = { BmiCalc, TdeeCalc, MacroCalc, ProteinCalc, BodyFatCalc, OneRepMaxCalc, HeartRateCalc, WaterCalc, BurnCalc };

/** One hydratable entry point, so a page can pick its calculator by name. */
export default function Calc({ name, t }: { name: keyof typeof ALL; t: CalcT }) {
  const C = ALL[name];
  return (
    <T.Provider value={t}>
      <C />
    </T.Provider>
  );
}
