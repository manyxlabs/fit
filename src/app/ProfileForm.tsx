import { useState, type SubmitEvent } from 'react';
import { ACTIVITY, RATES, type Activity, type Goal, type Sex } from '../lib/calc';
import { EQUIPMENT, type Equipment } from '../data/exercises';
import { DIETS, type Diet } from '../data/supplements';
import { CITIES, IF_WINDOWS, ifName, type CityId, type Fasting } from '../lib/fasting';
import type { Profile } from './db';

const GOALS: Record<Goal, string> = {
  lose: 'Lose fat',
  maintain: 'Maintain',
  recomp: 'Build muscle, lose fat (recomp)',
  gain: 'Build muscle (lean bulk)',
};

const RATE_CHOICES: Record<Goal, number[]> = {
  lose: [-0.0025, -0.005, -0.0075, -0.01],
  maintain: [0],
  recomp: [0],
  gain: [0.001, 0.0025, 0.005],
};

const thisYear = new Date().getFullYear();

/** The profile fields; `kg` is asked for only when there is no weight logged yet. */
export function ProfileForm(props: { initial?: Profile; kg?: number; askWeight: boolean; submit: string; onSave: (p: Profile, kg?: number) => void }) {
  const i = props.initial;
  const [goal, setGoal] = useState<Goal>(i?.goal ?? 'gain');
  const [rate, setRate] = useState(i?.rate ?? RATES.gain.default);
  const [kg, setKg] = useState(props.kg);
  const [fast, setFast] = useState(i?.fasting?.mode ?? 'none');
  const [city, setCity] = useState(i?.fasting && 'city' in i.fasting ? i.fasting.city : i?.fasting?.mode === 'ramadan' ? 'manual' : '');

  function save(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const num = (k: string) => Number(f.get(k));
    props.onSave(
      {
        sex: f.get('sex') as Sex,
        birthYear: num('birthYear'),
        cm: num('cm'),
        activity: f.get('activity') as Activity,
        goal,
        rate,
        diet: f.get('diet') as Diet,
        setup: f.get('setup') as Equipment,
        days: num('days'),
        asian: f.get('asian') === 'on',
        tdeeOverride: i?.tdeeOverride,
        fasting: fasting(f),
      },
      props.askWeight ? num('kg') : undefined,
    );
  }

  return (
    <form className="stack" onSubmit={save}>
      <fieldset className="seg">
        <legend>Sex</legend>
        {(['male', 'female'] as Sex[]).map((s) => (
          <label key={s}>
            <input type="radio" name="sex" value={s} defaultChecked={(i?.sex ?? 'male') === s} required />
            {s === 'male' ? 'Male' : 'Female'}
          </label>
        ))}
      </fieldset>
      <div className="grid">
        <label className="field">
          Birth year
          <input name="birthYear" type="number" inputMode="numeric" min={thisYear - 90} max={thisYear - 13} defaultValue={i?.birthYear} required />
        </label>
        <label className="field">
          Height (cm)
          <input name="cm" type="number" inputMode="decimal" min={120} max={230} step="0.1" defaultValue={i?.cm} required />
        </label>
        {props.askWeight && (
          <label className="field">
            Weight (kg)
            <input name="kg" type="number" inputMode="decimal" min={30} max={250} step="0.1" value={kg ?? ''} onChange={(e) => setKg(e.target.valueAsNumber || undefined)} required />
          </label>
        )}
      </div>
      <label className="field">
        Activity, counting your whole day
        <select name="activity" defaultValue={i?.activity ?? 'moderate'}>
          {ACTIVITY.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}: {a.detail}
            </option>
          ))}
        </select>
      </label>
      <div className="grid two">
        <label className="field">
          Goal
          <select
            value={goal}
            onChange={(e) => {
              const g = e.target.value as Goal;
              setGoal(g);
              setRate(RATES[g].default);
            }}
          >
            {(Object.keys(GOALS) as Goal[]).map((g) => (
              <option key={g} value={g}>
                {GOALS[g]}
              </option>
            ))}
          </select>
        </label>
        {RATE_CHOICES[goal].length > 1 && (
          <label className="field">
            Pace
            <select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
              {RATE_CHOICES[goal].map((r) => (
                <option key={r} value={r}>
                  {Math.abs(r * 100)}% of body weight a week{kg ? ` (${Math.abs(r * kg).toFixed(2)} kg)` : ''}
                  {r === RATES[goal].default ? ', recommended' : ''}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="grid three">
        <label className="field">
          Diet
          <select name="diet" defaultValue={i?.diet ?? 'veg'}>
            {(Object.keys(DIETS) as Diet[]).map((d) => (
              <option key={d} value={d}>
                {DIETS[d]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Where you train
          <select name="setup" defaultValue={i?.setup ?? 'gym'}>
            {(Object.keys(EQUIPMENT) as Equipment[]).map((s) => (
              <option key={s} value={s}>
                {EQUIPMENT[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Training days a week
          <select name="days" defaultValue={i?.days ?? 4}>
            {[2, 3, 4, 5, 6].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid two">
        <label className="field">
          Fasting
          <select name="fasting" value={fast} onChange={(e) => setFast(e.target.value as typeof fast)}>
            <option value="none">None</option>
            <option value="if">Intermittent fasting</option>
            <option value="ramadan">Ramadan</option>
            <option value="navratri">Navratri (vrat food only)</option>
          </select>
        </label>
        {fast === 'if' && (
          <>
            <label className="field">
              Eating window
              <select name="ifHours" defaultValue={i?.fasting?.mode === 'if' ? i.fasting.hours : 8}>
                {IF_WINDOWS.map((h) => (
                  <option key={h} value={h}>
                    {ifName(h)}: eat within {h} hours
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              First meal at
              <input name="ifStart" type="time" defaultValue={i?.fasting?.mode === 'if' ? i.fasting.start : '12:00'} required />
            </label>
          </>
        )}
        {fast === 'ramadan' && (
          <label className="field">
            Prayer times
            <select name="city" value={city} onChange={(e) => setCity(e.target.value)} required>
              <option value="" disabled>
                Choose your city
              </option>
              {(Object.keys(CITIES) as CityId[]).map((c) => (
                <option key={c} value={c}>
                  {CITIES[c][0]}
                </option>
              ))}
              <option value="manual">Enter times myself</option>
            </select>
          </label>
        )}
        {fast === 'ramadan' && city === 'manual' && (
          <>
            <label className="field">
              Fajr (suhoor ends)
              <input name="fajr" type="time" defaultValue={i?.fasting?.mode === 'ramadan' && 'fajr' in i.fasting ? i.fasting.fajr : undefined} required />
            </label>
            <label className="field">
              Maghrib (iftar)
              <input name="maghrib" type="time" defaultValue={i?.fasting?.mode === 'ramadan' && 'maghrib' in i.fasting ? i.fasting.maghrib : undefined} required />
            </label>
          </>
        )}
      </div>
      {fast !== 'none' && (
        <p className="hint">
          Do not fast without a doctor's advice if you are pregnant or breastfeeding, diabetic on insulin or other glucose-lowering medicine, have or had an eating disorder, are under 18, or have kidney or heart disease.
          Your calorie and protein targets stay the same; fasting only changes when you eat.
        </p>
      )}
      <label className="check">
        <input name="asian" type="checkbox" defaultChecked={i?.asian ?? true} />
        Use the Asian BMI cut-offs, which flag health risk at a lower BMI for South Asians
      </label>
      <button className="btn primary" type="submit">
        {props.submit}
      </button>
    </form>
  );
}

function fasting(f: FormData): Fasting | undefined {
  const mode = f.get('fasting');
  const city = String(f.get('city'));
  if (mode === 'if') return { mode, start: String(f.get('ifStart')), hours: Number(f.get('ifHours')) };
  if (mode === 'ramadan') return city in CITIES ? { mode, city: city as CityId } : { mode, fajr: String(f.get('fajr')), maghrib: String(f.get('maghrib')) };
  if (mode === 'navratri') return { mode };
  return undefined;
}
