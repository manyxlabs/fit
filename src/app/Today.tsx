import { useState } from 'react';
import { readiness, type Sickness } from '../lib/coach';
import { recommend, type SupplementId } from '../data/supplements';
import { CITIES, ifName, ramadanTimes, vratDay, windowState } from '../lib/fasting';
import { addDays, db, getSetting, today, type Day, type Profile } from './db';
import { targets, totals, useAsync, useBump, useNow, type Targets } from './hooks';
import { adviceLang, d as labels, date as fmtDate, dayLabel, fill, h, t as copy } from './i18n';
import { nextDay } from './Train';
import { Bar, Card, DateNav, fmt } from './ui';
import { rich } from '../i18n/rich';

const c = copy.today;
const small = { s: (x: string) => <span>{x}</span> };
const bold = { b: (x: string) => <strong>{x}</strong> };

export function Today({ profile }: { profile: Profile }) {
  const bump = useBump();
  const [date, setDate] = useState(today());
  const data = useAsync(async () => {
    const d = await db;
    const [t, entries, day, weight, program] = await Promise.all([
      targets(profile),
      d.getAllFromIndex('food', 'date', date),
      d.get('days', date),
      d.get('weights', date),
      getSetting('program'),
    ]);
    return { t, eaten: totals(entries), day: day ?? { date }, weight, next: program && (await nextDay(program)) };
  }, [date, profile]);
  if (!data?.t) return null;
  const { t, eaten, day, weight, next } = data;

  async function patch(change: Partial<Day>) {
    await (await db).put('days', { ...day, ...change, date });
    bump();
  }
  const ready = readiness(day);
  const left = t.kcal - eaten.kcal;
  const recs = recommend({ diet: profile.diet, sex: profile.sex, goal: profile.goal, proteinGap: 0, trainsHard: profile.days >= 2 });

  return (
    <>
      <DateNav date={date} onChange={setDate} max={today()} />
      <Card title={c.calories.title} action={<a href="#food">{c.calories.logFood}</a>}>
        <p className="big num">{rich(fill(left >= 0 ? c.calories.left : c.calories.over, { n: fmt(Math.abs(left)) }), small)}</p>
        <Bar label={c.calories.eaten} value={eaten.kcal} target={t.kcal} unit="kcal" />
        <Bar label={copy.food.macros.protein} value={eaten.protein} target={t.protein} unit="g" />
        <Bar label={copy.food.macros.carbs} value={eaten.carbs} target={t.carbs} unit="g" />
        <Bar label={copy.food.macros.fat} value={eaten.fat} target={t.fat} unit="g" />
        <Bar label={copy.food.macros.fibre} value={eaten.fibre} target={t.fibre} unit="g" />
        {t.floored && (
          <p className="warn" lang={adviceLang}>
            {h.today.floored}
          </p>
        )}
      </Card>

      {profile.fasting && <FastingCard profile={profile} t={t} day={day} date={date} patch={patch} />}

      <Card title={c.checkIn.title}>
        <div className="grid">
          <label className="field">
            {c.checkIn.sleep}
            <input type="number" inputMode="decimal" min={0} max={16} step="0.5" defaultValue={day.sleep} key={`z${date}${day.sleep}`} onBlur={(e) => e.target.valueAsNumber !== day.sleep && patch({ sleep: num(e.target.valueAsNumber) })} />
          </label>
          <label className="field">
            {c.checkIn.energy}
            <select value={day.energy ?? ''} onChange={(e) => patch({ energy: num(Number(e.target.value)) })}>
              <option value="">-</option>
              {c.checkIn.energyLevels.map((l, i) => (
                <option key={l} value={i + 1}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            {c.checkIn.soreness}
            <select value={day.soreness ?? ''} onChange={(e) => patch({ soreness: num(Number(e.target.value)) })}>
              <option value="">-</option>
              {c.checkIn.sorenessLevels.map((l, i) => (
                <option key={l} value={i + 1}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          {c.checkIn.unwell}
          <select value={day.sick ?? 'none'} onChange={(e) => patch({ sick: e.target.value as Sickness })}>
            {(['none', 'aboveNeck', 'belowNeck'] as const).map((s) => (
              <option key={s} value={s}>
                {c.checkIn.sick[s]}
              </option>
            ))}
          </select>
        </label>
      </Card>

      {next && (
        <Card title={c.training.title} action={<a href="#train">{ready.level === 'rest' ? c.training.view : c.training.start}</a>}>
          {ready.level === 'reduced' ? (
            <p lang={adviceLang}>{rich(fill(h.today.nextReduced, { name: dayLabel(next.name), pct: Math.round(ready.volume * 100) }), bold)}</p>
          ) : (
            <p>{rich(fill(c.training.next, { name: dayLabel(next.name) }), bold)}</p>
          )}
          {ready.advice.length > 0 && (
            <ul className={`advice ${ready.level}`} lang={adviceLang}>
              {ready.advice.map((a) => (
                <li key={a}>{h.train.advice[a]}</li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <div className="grid two">
        <Card title={c.water.title}>
          <p className="big num">
            {rich(fill(c.water.amount, { n: ((day.waterMl ?? 0) / 1000).toLocaleString('en-IN', { maximumFractionDigits: 2 }), target: fmt(t.waterMl / 1000, 1) }), small)}
          </p>
          <div className="row">
            <button type="button" className="btn" onClick={() => patch({ waterMl: Math.max(0, (day.waterMl ?? 0) - 250) })} disabled={!day.waterMl}>
              − 250 ml
            </button>
            <button type="button" className="btn primary" onClick={() => patch({ waterMl: (day.waterMl ?? 0) + 250 })}>
              + 250 ml
            </button>
          </div>
        </Card>
        <Card title={c.body.title}>
          <div className="grid two">
            <label className="field">
              {c.body.weight}
              <input
                type="number"
                inputMode="decimal"
                min={30}
                max={250}
                step="0.1"
                defaultValue={weight?.kg}
                key={`w${date}${weight?.kg}`}
                onBlur={async (e) => {
                  const kg = e.target.valueAsNumber;
                  if (kg >= 30 && kg <= 250 && kg !== weight?.kg) {
                    await (await db).put('weights', { date, kg });
                    bump();
                  }
                }}
              />
            </label>
            <label className="field">
              {c.body.steps}
              <input type="number" inputMode="numeric" min={0} max={100000} step="1" defaultValue={day.steps} key={`s${date}${day.steps}`} onBlur={(e) => e.target.valueAsNumber !== day.steps && patch({ steps: num(e.target.valueAsNumber) })} />
            </label>
          </div>
          <p className="hint" lang={adviceLang}>
            {h.today.bodyHint}
          </p>
        </Card>
      </div>

      {!profile.fasting && <FastingCard profile={profile} t={t} day={day} date={date} patch={patch} />}

      <Card title={c.supplements.title} action={<a href="#more">{c.supplements.guide}</a>}>
        <ul className="checks">
          {recs.map(({ id }) => (
            <li key={id}>
              <label className="check">
                <input type="checkbox" checked={day.supplements?.includes(id) ?? false} onChange={(e) => patch({ supplements: toggle(day.supplements ?? [], id, e.target.checked) })} />
                {labels.supplements[id]}
              </label>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

const num = (n: number) => (Number.isFinite(n) && n > 0 ? n : undefined);
const toggle = (list: SupplementId[], id: SupplementId, on: boolean) => (on ? [...new Set([...list, id])] : list.filter((x) => x !== id));

const time = (d: Date) => fmtDate(d, { hour: 'numeric', minute: '2-digit' });
/** `n` split into `parts` near-equal whole numbers, the larger ones first. */
const split = (n: number, parts: number) => Array.from({ length: parts }, (_, i) => Math.floor(n / parts) + (i < n % parts ? 1 : 0));

function FastingCard(props: { profile: Profile; t: Targets; day: Day; date: string; patch: (c: Partial<Day>) => void }) {
  const now = useNow();
  const { t, day, date } = props;
  const f = props.profile.fasting;
  const live = date === today(now) ? windowState(f, now) : undefined;
  const vrat = vratDay(f, day);
  // After iftar, the fast that matters is tomorrow's, whose suhoor is the one being counted down to.
  const next = f?.mode === 'ramadan' && live?.eating && now >= ramadanTimes(f, date).maghrib;
  const ramadan = f?.mode === 'ramadan' ? { ...ramadanTimes(f, next ? addDays(date, 1) : date), city: 'city' in f ? CITIES[f.city][0] : undefined } : undefined;
  const water = split(Math.ceil(t.waterMl / 250), 4);
  return (
    <Card title={c.fasting.title} action={f && <span className="muted">{f.mode === 'if' ? ifName(f.hours) : c.fasting[f.mode]}</span>}>
      {live && (
        <p className="fast-state" role="status">
          {rich(fill(c.fasting.state[`${ramadan ? 'ramadan' : 'if'}${live.eating ? 'Eating' : 'Fasting'}`], { time: time(live.until) }), bold)}
        </p>
      )}
      {ramadan && (
        <>
          <p className="num">{rich(fill(next ? c.fasting.timesTomorrow : c.fasting.times, { fajr: time(ramadan.fajr), maghrib: time(ramadan.maghrib) }), bold)}</p>
          {ramadan.city && <p className="hint">{fill(c.fasting.cityHint, { city: ramadan.city })}</p>}
          <ul className="advice" lang={adviceLang}>
            <li>{fill(h.today.fasting.water, { iftar: water[0], evening: water[1], dinner: water[2], suhoor: water[3] })}</li>
            <li>{fill(h.today.fasting.protein, { g: fmt(Math.round(t.protein / 3 / 5) * 5) })}</li>
          </ul>
        </>
      )}
      <label className="check">
        <input type="checkbox" checked={vrat} disabled={f?.mode === 'navratri'} onChange={(e) => props.patch({ vrat: e.target.checked })} />
        {c.fasting.vrat}
      </label>
      {f?.mode === 'navratri' && <p className="hint">{c.fasting.navratriHint}</p>}
      {vrat && <p className="hint">{rich(c.fasting.vratHint, { a: (x) => <a href="#food">{x}</a> })}</p>}
      {(f || vrat) && (
        <p className="hint" lang={adviceLang}>
          {h.today.fasting.safety}
        </p>
      )}
    </Card>
  );
}
