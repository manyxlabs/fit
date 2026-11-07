import { useState, type SubmitEvent } from 'react';
import { FOODS, fits, search, type Food as DbFood } from '../data/foods';
import { MEALS, type Meal } from '../data/meals';
import { rich } from '../i18n/rich';
import { vratDay } from '../lib/fasting';
import { addDays, db, foodRef, today, type CustomFood, type FoodRef, type Profile } from './db';
import { kcalOf, targets, totals, useAsync, useBump } from './hooks';
import { d as labels, fill, t as copy } from './i18n';
import { Plan } from './Plan';
import { Bar, Card, DateNav, fmt } from './ui';

const c = copy.food;
const RAMADAN_MEALS: Record<Meal, string> = { ...labels.meals, ...c.ramadanMeals };

type Pickable = FoodRef & { units: [string, number][]; aliases?: string[]; vrat?: boolean };
const GRAMS: [string, number] = ['grams', 1];

export function Food({ profile }: { profile: Profile }) {
  const bump = useBump();
  const [date, setDate] = useState(today());
  const [adding, setAdding] = useState<Meal>();
  const data = useAsync(async () => {
    const d = await db;
    const [t, entries, custom, recent, day] = await Promise.all([
      targets(profile),
      d.getAllFromIndex('food', 'date', date),
      d.getAll('customFoods'),
      d.getAllFromIndex('food', 'date', IDBKeyRange.lowerBound(addDays(today(), -30))),
      d.get('days', date),
    ]);
    return { t, entries, custom, recent, day: day ?? { date } };
  }, [date, profile]);
  if (!data?.t) return null;
  const { t, entries, custom, day } = data;
  const sum = totals(entries);
  const vrat = vratDay(profile.fasting, day);
  const ramadan = profile.fasting?.mode === 'ramadan';
  const names = ramadan ? RAMADAN_MEALS : labels.meals;

  async function copyYesterday() {
    const d = await db;
    const prev = await d.getAllFromIndex('food', 'date', addDays(date, -1));
    for (const { id: _, ...e } of prev) await d.add('food', { ...e, date });
    bump();
  }

  return (
    <>
      <DateNav date={date} onChange={setDate} max={today()} />
      <Card title={c.totals}>
        <Bar label={c.macros.kcal} value={sum.kcal} target={t.kcal} unit="kcal" />
        <Bar label={c.macros.protein} value={sum.protein} target={t.protein} unit="g" />
        <Bar label={c.macros.carbs} value={sum.carbs} target={t.carbs} unit="g" />
        <Bar label={c.macros.fat} value={sum.fat} target={t.fat} unit="g" />
        {!entries.length && (
          <button type="button" className="btn" onClick={copyYesterday}>
            {c.copyYesterday}
          </button>
        )}
      </Card>
      <Plan date={date} profile={profile} t={t} day={day} vrat={vrat} entries={entries} names={names} />
      {(Object.keys(MEALS) as Meal[]).map((meal) => {
        const list = entries.filter((e) => e.meal === meal);
        // Nobody eats lunch during a Ramadan fast; the card stays only to show anything already logged there.
        if (ramadan && meal === 'lunch' && !list.length) return null;
        return (
          <Card key={meal} title={names[meal]} action={<span className="num muted">{fmt(list.reduce((s, e) => s + kcalOf(e), 0))} kcal</span>}>
            {list.length > 0 && (
              <ul className="entries">
                {list.map((e) => (
                  <li key={e.id}>
                    <div>
                      <strong>{e.food.name}</strong>
                      <span className="muted">{fill(c.entry, { g: fmt(e.grams), protein: fmt((e.food.protein * e.grams) / 100, 1) })}</span>
                    </div>
                    <span className="num">{fmt(kcalOf(e))}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={fill(c.remove, { name: e.food.name })}
                      onClick={async () => {
                        await (await db).delete('food', e.id!);
                        bump();
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {adding === meal ? (
              <Picker
                profile={profile}
                vrat={vrat}
                custom={custom}
                recent={data.recent.map((e) => e.food)}
                onPick={async (food, grams) => {
                  await (await db).add('food', { date, meal, food, grams });
                  setAdding(undefined);
                  bump();
                }}
                onClose={() => setAdding(undefined)}
              />
            ) : (
              <button type="button" className="btn" onClick={() => setAdding(meal)}>
                {c.addFood}
              </button>
            )}
          </Card>
        );
      })}
    </>
  );
}

function Picker(props: { profile: Profile; vrat: boolean; custom: CustomFood[]; recent: FoodRef[]; onPick: (f: FoodRef, grams: number) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState<Pickable>();
  const [creating, setCreating] = useState(false);
  const all: Pickable[] = [...props.custom.map((c) => ({ ...c, units: [] })), ...(FOODS as DbFood[])].filter((f) => fits(f.diet, props.profile.diet) && (!props.vrat || f.vrat));
  const recent = [...new Map(props.recent.toReversed().map((f) => [f.name, f])).values()]
    .flatMap((r) => {
      const f = all.find((f) => f.name === r.name);
      // A logged food that is no longer in the list (a deleted own food) still shows, except on a vrat day.
      return f ? [f] : props.vrat ? [] : [{ ...r, units: [] }];
    })
    .slice(0, 8);
  const shown = query ? search(all, query) : recent;

  if (creating) return <CustomFoodForm diet={props.profile.diet} vrat={props.vrat} onDone={(f) => (setCreating(false), f && setChosen({ ...f, units: [] }))} />;
  if (chosen) return <Amount food={chosen} onBack={() => setChosen(undefined)} onAdd={(g) => props.onPick(foodRef(chosen), g)} />;
  return (
    <div className="picker">
      {props.vrat && <p className="hint">{c.picker.vrat}</p>}
      <input type="search" className="search" placeholder={c.picker.search} value={query} onChange={(e) => setQuery(e.target.value)} autoFocus aria-label={c.picker.searchLabel} />
      {!query && recent.length > 0 && <p className="hint">{c.picker.recent}</p>}
      <ul className="results">
        {shown.map((f) => (
          <li key={f.name}>
            <button type="button" onClick={() => setChosen(f)}>
              <span>{f.name}</span>
              <span className="muted num">{fill(c.picker.per100, { kcal: fmt(f.kcal), protein: fmt(f.protein, 1) })}</span>
            </button>
          </li>
        ))}
      </ul>
      {query && !shown.length && <p className="hint">{c.picker.noMatch}</p>}
      <div className="row">
        <button type="button" className="btn" onClick={() => setCreating(true)}>
          {c.picker.addOwn}
        </button>
        <button type="button" className="btn" onClick={props.onClose}>
          {c.picker.cancel}
        </button>
      </div>
    </div>
  );
}

function Amount(props: { food: Pickable; onBack: () => void; onAdd: (grams: number) => void }) {
  const units = [...props.food.units, GRAMS];
  const [unit, setUnit] = useState(0);
  const [qty, setQty] = useState(units[0] === GRAMS ? 100 : 1);
  const grams = qty * units[unit][1];
  const f = props.food;
  return (
    <form
      className="picker"
      onSubmit={(e) => {
        e.preventDefault();
        if (grams > 0) props.onAdd(grams);
      }}
    >
      <p>
        <strong>{f.name}</strong>
      </p>
      <div className="grid two">
        <label className="field">
          {c.amount.amount}
          <input type="number" inputMode="decimal" min={0.25} max={5000} step="any" value={qty || ''} onChange={(e) => setQty(e.target.valueAsNumber)} required autoFocus />
        </label>
        <label className="field">
          {c.amount.unit}
          <select
            value={unit}
            onChange={(e) => {
              const u = Number(e.target.value);
              setUnit(u);
              setQty(units[u] === GRAMS ? 100 : 1);
            }}
          >
            {units.map((u, i) => (
              <option key={u[0]} value={i}>
                {u === GRAMS ? c.amount.grams : fill(c.amount.unitGrams, { unit: u[0], g: u[1] })}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="num">
        {rich(
          fill(c.amount.summary, {
            g: fmt(grams),
            kcal: fmt((f.kcal * grams) / 100),
            protein: fmt((f.protein * grams) / 100, 1),
            carbs: fmt((f.carbs * grams) / 100, 1),
            fat: fmt((f.fat * grams) / 100, 1),
          }),
          { b: (x) => <strong>{x}</strong> },
        )}
      </p>
      <div className="row">
        <button type="submit" className="btn primary" disabled={!(grams > 0)}>
          {c.amount.add}
        </button>
        <button type="button" className="btn" onClick={props.onBack}>
          {c.amount.back}
        </button>
      </div>
    </form>
  );
}

/** Taken per serving, as on a label, and stored per 100 g like every other food. */
function CustomFoodForm(props: { diet: Profile['diet']; vrat: boolean; onDone: (f?: CustomFood) => void }) {
  async function save(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = new FormData(e.currentTarget);
    const n = (k: string) => Number(v.get(k)) || 0;
    const per = 100 / n('grams');
    const food: CustomFood = {
      name: String(v.get('name')).trim(),
      diet: v.get('diet') as CustomFood['diet'],
      kcal: n('kcal') * per,
      protein: n('protein') * per,
      carbs: n('carbs') * per,
      fat: n('fat') * per,
      fibre: n('fibre') * per,
      vrat: v.get('vrat') === 'on',
    };
    food.id = await (await db).add('customFoods', food);
    props.onDone(food);
  }
  return (
    <form className="picker" onSubmit={save}>
      <p>{rich(c.custom.heading, { b: (x) => <strong>{x}</strong> })}</p>
      <label className="field">
        {c.custom.name}
        <input name="name" required maxLength={80} autoFocus />
      </label>
      <div className="grid">
        <Num name="grams" label={c.custom.serving} min={1} required />
        <Num name="kcal" label="kcal" required />
        <Num name="protein" label={c.custom.protein} />
        <Num name="carbs" label={c.custom.carbs} />
        <Num name="fat" label={c.custom.fat} />
        <Num name="fibre" label={c.custom.fibre} />
      </div>
      <label className="field">
        {c.custom.type}
        <select name="diet" defaultValue={props.diet === 'vegan' ? 'vegan' : 'veg'}>
          {(['vegan', 'veg', 'egg', 'nonveg'] as const).map((k) => (
            <option key={k} value={k}>
              {c.custom.diet[k]}
            </option>
          ))}
        </select>
      </label>
      <label className="check">
        <input name="vrat" type="checkbox" defaultChecked={props.vrat} />
        {c.custom.vrat}
      </label>
      <div className="row">
        <button type="submit" className="btn primary">
          {c.custom.save}
        </button>
        <button type="button" className="btn" onClick={() => props.onDone()}>
          {c.custom.cancel}
        </button>
      </div>
    </form>
  );
}

const Num = (p: { name: string; label: string; min?: number; required?: boolean }) => (
  <label className="field">
    {p.label}
    <input name={p.name} type="number" inputMode="decimal" min={p.min ?? 0} max={5000} step="any" required={p.required} />
  </label>
);
