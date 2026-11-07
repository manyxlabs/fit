import { useState, type FormEvent } from 'react';
import { ACTIVITY, RATES, type Activity, type Goal, type Sex } from '../lib/calc';
import { EQUIPMENT, type Equipment } from '../data/exercises';
import { DIETS, type Diet } from '../data/supplements';
import { GOALS as PROGRAM_GOALS, LEVELS, PROGRAMS, programFor, programsFor, type Program, type ProgramId } from '../data/programs';
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
  const [setup, setSetup] = useState<Equipment>(i?.setup ?? 'gym');
  const [days, setDays] = useState(i?.days ?? 4);
  const [program, setProgram] = useState(i?.program);

  function save(e: FormEvent<HTMLFormElement>) {
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
        setup,
        days,
        program: program && programsFor(setup, days).includes(program) ? program : undefined,
        asian: f.get('asian') === 'on',
        tdeeOverride: i?.tdeeOverride,
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
          <select value={setup} onChange={(e) => setSetup(e.target.value as Equipment)}>
            {(Object.keys(EQUIPMENT) as Equipment[]).map((s) => (
              <option key={s} value={s}>
                {EQUIPMENT[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Training days a week
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[2, 3, 4, 5, 6].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>
      <ProgramPicker setup={setup} days={days} value={program} onChange={setProgram} />
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

/** The programs that fit the setup and days, grouped by goal; empty means the recommended muscle program. */
export function ProgramPicker(props: { setup: Equipment; days: number; value?: ProgramId; onChange: (id?: ProgramId) => void }) {
  const ids = programsFor(props.setup, props.days);
  const value = props.value && ids.includes(props.value) ? props.value : undefined;
  const shown: Program = PROGRAMS[value ?? programFor(props.setup, props.days)];
  return (
    <>
      <label className="field">
        Program
        <select value={value ?? ''} onChange={(e) => props.onChange((e.target.value || undefined) as ProgramId | undefined)}>
          <option value="">Recommended: {PROGRAMS[programFor(props.setup, props.days)].name}</option>
          {(Object.keys(PROGRAM_GOALS) as Program['goal'][]).map((g) => {
            const group = ids.filter((id) => PROGRAMS[id].goal === g);
            return (
              group.length > 0 && (
                <optgroup key={g} label={PROGRAM_GOALS[g]}>
                  {group.map((id) => {
                    const p: Program = PROGRAMS[id];
                    return (
                      <option key={id} value={id}>
                        {p.name} ({p.perWeek} days, {LEVELS[p.level]})
                      </option>
                    );
                  })}
                </optgroup>
              )
            );
          })}
        </select>
      </label>
      <p className="hint">{shown.about}</p>
    </>
  );
}
