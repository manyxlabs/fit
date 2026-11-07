import { useState, type SubmitEvent } from 'react';
import { ACTIVITY, RATES, type Activity, type Goal, type Sex } from '../lib/calc';
import { EQUIPMENT, type Equipment } from '../data/exercises';
import { DIETS, type Diet } from '../data/supplements';
import { GOALS as PROGRAM_GOALS, PROGRAMS, programFor, programsFor, type Program, type ProgramId } from '../data/programs';
import { CITIES, IF_WINDOWS, ifName, type CityId, type Fasting } from '../lib/fasting';
import type { Profile } from './db';
import { adviceLang, d, fill, h, plural, t } from './i18n';

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
  const [fast, setFast] = useState<Fasting['mode'] | 'none'>(i?.fasting?.mode ?? 'none');
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
        setup,
        bar: setup !== 'gym' && f.get('bar') === 'on',
        days,
        program: program && programsFor(setup, days).includes(program) ? program : undefined,
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
        <legend>{t.more.profile.sex}</legend>
        {(['male', 'female'] as Sex[]).map((s) => (
          <label key={s}>
            <input type="radio" name="sex" value={s} defaultChecked={(i?.sex ?? 'male') === s} required />
            {d.sex[s]}
          </label>
        ))}
      </fieldset>
      <div className="grid">
        <label className="field">
          {t.more.profile.birthYear}
          <input name="birthYear" type="number" inputMode="numeric" min={thisYear - 90} max={thisYear - 13} defaultValue={i?.birthYear} required />
        </label>
        <label className="field">
          {t.more.profile.height}
          <input name="cm" type="number" inputMode="decimal" min={120} max={230} step="0.1" defaultValue={i?.cm} required />
        </label>
        {props.askWeight && (
          <label className="field">
            {t.more.profile.weight}
            <input name="kg" type="number" inputMode="decimal" min={30} max={250} step="0.1" value={kg ?? ''} onChange={(e) => setKg(e.target.valueAsNumber || undefined)} required />
          </label>
        )}
      </div>
      <label className="field">
        {t.more.profile.activity}
        <select name="activity" defaultValue={i?.activity ?? 'moderate'}>
          {ACTIVITY.map((a) => (
            <option key={a.id} value={a.id}>
              {fill(t.more.profile.activityOption, d.activity[a.id])}
            </option>
          ))}
        </select>
      </label>
      {/* Without a pace to choose, Goal takes the whole row rather than half of it. */}
      <div className={RATE_CHOICES[goal].length > 1 ? 'grid two' : 'stack'}>
        <label className="field">
          {t.more.profile.goal}
          <select
            value={goal}
            onChange={(e) => {
              const g = e.target.value as Goal;
              setGoal(g);
              setRate(RATES[g].default);
            }}
          >
            {(Object.keys(RATE_CHOICES) as Goal[]).map((g) => (
              <option key={g} value={g}>
                {d.goals[g]}
              </option>
            ))}
          </select>
        </label>
        {RATE_CHOICES[goal].length > 1 && (
          <label className="field">
            {t.more.profile.pace}
            <select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
              {RATE_CHOICES[goal].map((r) => (
                <option key={r} value={r}>
                  {paceLabel(r, kg, r === RATES[goal].default)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="grid three">
        <label className="field">
          {t.more.profile.diet}
          <select name="diet" defaultValue={i?.diet ?? 'veg'}>
            {(Object.keys(DIETS) as Diet[]).map((x) => (
              <option key={x} value={x}>
                {d.diets[x]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          {t.more.profile.setup}
          <select value={setup} onChange={(e) => setSetup(e.target.value as Equipment)}>
            {(Object.keys(EQUIPMENT) as Equipment[]).map((s) => (
              <option key={s} value={s}>
                {d.equipment[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          {t.more.profile.days}
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      {setup !== 'gym' && (
        <label className="check">
          <input name="bar" type="checkbox" defaultChecked={i?.bar} />
          {t.more.profile.bar}
        </label>
      )}
      <ProgramPicker setup={setup} days={days} value={program} onChange={setProgram} />
      <div className="grid two">
        <label className="field">
          {t.more.profile.fasting}
          <select name="fasting" value={fast} onChange={(e) => setFast(e.target.value as typeof fast)}>
            {(Object.keys(t.more.profile.fastingModes) as (typeof fast)[]).map((m) => (
              <option key={m} value={m}>
                {t.more.profile.fastingModes[m]}
              </option>
            ))}
          </select>
        </label>
        {fast === 'if' && (
          <>
            <label className="field">
              {t.more.profile.window}
              <select name="ifHours" defaultValue={i?.fasting?.mode === 'if' ? i.fasting.hours : 8}>
                {IF_WINDOWS.map((n) => (
                  <option key={n} value={n}>
                    {fill(plural(n, t.more.profile.windowOption), { name: ifName(n) })}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              {t.more.profile.firstMeal}
              <input name="ifStart" type="time" defaultValue={i?.fasting?.mode === 'if' ? i.fasting.start : '12:00'} required />
            </label>
          </>
        )}
        {fast === 'ramadan' && (
          <label className="field">
            {t.more.profile.prayerTimes}
            <select name="city" value={city} onChange={(e) => setCity(e.target.value)} required>
              <option value="" disabled>
                {t.more.profile.city}
              </option>
              {(Object.keys(CITIES) as CityId[]).map((c) => (
                <option key={c} value={c}>
                  {CITIES[c][0]}
                </option>
              ))}
              <option value="manual">{t.more.profile.manual}</option>
            </select>
          </label>
        )}
        {fast === 'ramadan' && city === 'manual' && (
          <>
            <label className="field">
              {t.more.profile.fajr}
              <input name="fajr" type="time" defaultValue={i?.fasting?.mode === 'ramadan' && 'fajr' in i.fasting ? i.fasting.fajr : undefined} required />
            </label>
            <label className="field">
              {t.more.profile.maghrib}
              <input name="maghrib" type="time" defaultValue={i?.fasting?.mode === 'ramadan' && 'maghrib' in i.fasting ? i.fasting.maghrib : undefined} required />
            </label>
          </>
        )}
      </div>
      {fast !== 'none' && (
        <p className="hint" lang={adviceLang}>
          {h.more.fasting}
        </p>
      )}
      <label className="check">
        <input name="asian" type="checkbox" defaultChecked={i?.asian ?? true} />
        {t.more.profile.asian}
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
  const shown = d.programs[value ?? programFor(props.setup, props.days)];
  return (
    <>
      <label className="field">
        {t.more.profile.program}
        <select value={value ?? ''} onChange={(e) => props.onChange((e.target.value || undefined) as ProgramId | undefined)}>
          <option value="">{fill(t.more.profile.recommended, { name: d.programs[programFor(props.setup, props.days)].name })}</option>
          {(Object.keys(PROGRAM_GOALS) as Program['goal'][]).map((g) => {
            const group = ids.filter((id) => PROGRAMS[id].goal === g);
            return (
              group.length > 0 && (
                <optgroup key={g} label={d.programGoals[g]}>
                  {group.map((id) => {
                    const p: Program = PROGRAMS[id];
                    return (
                      <option key={id} value={id}>
                        {fill(plural(p.perWeek, t.more.profile.programOption), { name: d.programs[id].name, level: d.levels[p.level] })}
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

function paceLabel(rate: number, kg: number | undefined, recommended: boolean) {
  const percent = Math.abs(rate * 100);
  const pace = kg ? fill(t.more.profile.paceOptionKg, { percent, kg: Math.abs(rate * kg).toFixed(2) }) : fill(t.more.profile.paceOption, { percent });
  return recommended ? fill(t.more.profile.paceRecommended, { pace }) : pace;
}

function fasting(f: FormData): Fasting | undefined {
  const mode = f.get('fasting');
  const city = String(f.get('city'));
  if (mode === 'if') return { mode, start: String(f.get('ifStart')), hours: Number(f.get('ifHours')) };
  if (mode === 'ramadan') return city in CITIES ? { mode, city: city as CityId } : { mode, fajr: String(f.get('fajr')), maghrib: String(f.get('maghrib')) };
  if (mode === 'navratri') return { mode };
  return undefined;
}
