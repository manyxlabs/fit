import { useState } from 'react';
import { readiness, type Sickness } from '../lib/coach';
import { recommend, SUPPLEMENTS, type SupplementId } from '../data/supplements';
import { db, getSetting, today, type Day, type Profile } from './db';
import { targets, totals, useAsync, useBump } from './hooks';
import { nextDay } from './Train';
import { Bar, Card, DateNav, fmt } from './ui';

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
      <Card title="Calories" action={<a href="#food">Log food</a>}>
        <p className="big num">
          {fmt(Math.abs(left))} <span>kcal {left >= 0 ? 'left' : 'over'}</span>
        </p>
        <Bar label="Eaten" value={eaten.kcal} target={t.kcal} unit="kcal" />
        <Bar label="Protein" value={eaten.protein} target={t.protein} unit="g" />
        <Bar label="Carbs" value={eaten.carbs} target={t.carbs} unit="g" />
        <Bar label="Fat" value={eaten.fat} target={t.fat} unit="g" />
        <Bar label="Fibre" value={eaten.fibre} target={t.fibre} unit="g" />
        {t.floored && <p className="warn">Your pace would put you below a safe minimum, so the target is held there. Choose a slower pace in More.</p>}
      </Card>

      <Card title="How are you today?">
        <div className="grid">
          <label className="field">
            Sleep last night (h)
            <input type="number" inputMode="decimal" min={0} max={16} step="0.5" defaultValue={day.sleep} key={`z${date}${day.sleep}`} onBlur={(e) => e.target.valueAsNumber !== day.sleep && patch({ sleep: num(e.target.valueAsNumber) })} />
          </label>
          <label className="field">
            Energy
            <select value={day.energy ?? ''} onChange={(e) => patch({ energy: num(Number(e.target.value)) })}>
              <option value="">-</option>
              {['1 Drained', '2 Low', '3 Okay', '4 Good', '5 Great'].map((l, i) => (
                <option key={l} value={i + 1}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Soreness
            <select value={day.soreness ?? ''} onChange={(e) => patch({ soreness: num(Number(e.target.value)) })}>
              <option value="">-</option>
              {['1 None', '2 Mild', '3 Some', '4 Heavy', '5 Very heavy'].map((l, i) => (
                <option key={l} value={i + 1}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          Feeling unwell?
          <select value={day.sick ?? 'none'} onChange={(e) => patch({ sick: e.target.value as Sickness })}>
            <option value="none">No</option>
            <option value="aboveNeck">Only above the neck: runny nose, mild sore throat</option>
            <option value="belowNeck">Fever, body aches, chest or stomach symptoms</option>
          </select>
        </label>
      </Card>

      {next && (
        <Card title="Training" action={<a href="#train">{ready.level === 'rest' ? 'View' : 'Start'}</a>}>
          <p>
            Next up: <strong>{next.name}</strong>
            {ready.level === 'reduced' && `, at about ${Math.round(ready.volume * 100)}% of the sets`}
          </p>
          {ready.advice.length > 0 && (
            <ul className={`advice ${ready.level}`}>
              {ready.advice.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <div className="grid two">
        <Card title="Water">
          <p className="big num">
            {((day.waterMl ?? 0) / 1000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} <span>of {fmt(t.waterMl / 1000, 1)} litres</span>
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
        <Card title="Body">
          <div className="grid two">
            <label className="field">
              Weight (kg)
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
              Steps
              <input type="number" inputMode="numeric" min={0} max={100000} step="1" defaultValue={day.steps} key={`s${date}${day.steps}`} onBlur={(e) => e.target.valueAsNumber !== day.steps && patch({ steps: num(e.target.valueAsNumber) })} />
            </label>
          </div>
          <p className="hint">Weigh in each morning after the toilet; the trend matters, not any one day. Aim for 7,000-10,000 steps.</p>
        </Card>
      </div>

      <Card title="Supplements" action={<a href="#more">Guide</a>}>
        <ul className="checks">
          {recs.map(({ id }) => (
            <li key={id}>
              <label className="check">
                <input type="checkbox" checked={day.supplements?.includes(id) ?? false} onChange={(e) => patch({ supplements: toggle(day.supplements ?? [], id, e.target.checked) })} />
                {SUPPLEMENTS[id].name}
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
