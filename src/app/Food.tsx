import { useState, type FormEvent } from 'react';
import { FOODS, fits, search, type Food as DbFood } from '../data/foods';
import { MEALS, type Meal } from '../data/meals';
import { addDays, db, today, type CustomFood, type FoodRef, type Profile } from './db';
import { kcalOf, targets, totals, useAsync, useBump } from './hooks';
import { Bar, Card, DateNav, fmt } from './ui';

type Pickable = FoodRef & { units: [string, number][]; aliases?: string[] };
const GRAMS: [string, number] = ['grams', 1];

export function Food({ profile }: { profile: Profile }) {
  const bump = useBump();
  const [date, setDate] = useState(today());
  const [adding, setAdding] = useState<Meal>();
  const data = useAsync(async () => {
    const d = await db;
    const [t, entries, custom, recent] = await Promise.all([
      targets(profile),
      d.getAllFromIndex('food', 'date', date),
      d.getAll('customFoods'),
      d.getAllFromIndex('food', 'date', IDBKeyRange.lowerBound(addDays(today(), -30))),
    ]);
    return { t, entries, custom, recent };
  }, [date, profile]);
  if (!data?.t) return null;
  const { t, entries, custom } = data;
  const sum = totals(entries);

  async function copyYesterday() {
    const d = await db;
    const prev = await d.getAllFromIndex('food', 'date', addDays(date, -1));
    for (const { id: _, ...e } of prev) await d.add('food', { ...e, date });
    bump();
  }

  return (
    <>
      <DateNav date={date} onChange={setDate} max={today()} />
      <Card title="Totals">
        <Bar label="Calories" value={sum.kcal} target={t.kcal} unit="kcal" />
        <Bar label="Protein" value={sum.protein} target={t.protein} unit="g" />
        <Bar label="Carbs" value={sum.carbs} target={t.carbs} unit="g" />
        <Bar label="Fat" value={sum.fat} target={t.fat} unit="g" />
        {!entries.length && (
          <button type="button" className="btn" onClick={copyYesterday}>
            Copy the previous day's food
          </button>
        )}
      </Card>
      {(Object.keys(MEALS) as Meal[]).map((meal) => {
        const list = entries.filter((e) => e.meal === meal);
        return (
          <Card key={meal} title={MEALS[meal]} action={<span className="num muted">{fmt(list.reduce((s, e) => s + kcalOf(e), 0))} kcal</span>}>
            {list.length > 0 && (
              <ul className="entries">
                {list.map((e) => (
                  <li key={e.id}>
                    <div>
                      <strong>{e.food.name}</strong>
                      <span className="muted">
                        {fmt(e.grams)} g · {fmt((e.food.protein * e.grams) / 100, 1)} g protein
                      </span>
                    </div>
                    <span className="num">{fmt(kcalOf(e))}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Remove ${e.food.name}`}
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
                + Add food
              </button>
            )}
          </Card>
        );
      })}
    </>
  );
}

function Picker(props: { profile: Profile; custom: CustomFood[]; recent: FoodRef[]; onPick: (f: FoodRef, grams: number) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState<Pickable>();
  const [creating, setCreating] = useState(false);
  const all: Pickable[] = [...props.custom.map((c) => ({ ...c, units: [] })), ...(FOODS as DbFood[])].filter((f) => fits(f.diet, props.profile.diet));
  const recent = [...new Map(props.recent.toReversed().map((f) => [f.name, f])).values()].slice(0, 8);
  const shown = query ? search(all, query) : recent.map((r) => all.find((f) => f.name === r.name) ?? { ...r, units: [] });

  if (creating) return <CustomFoodForm diet={props.profile.diet} onDone={(f) => (setCreating(false), f && setChosen({ ...f, units: [] }))} />;
  if (chosen) return <Amount food={chosen} onBack={() => setChosen(undefined)} onAdd={(g) => props.onPick(strip(chosen), g)} />;
  return (
    <div className="picker">
      <input type="search" className="search" placeholder="Search: roti, dal, paneer, egg, chicken…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus aria-label="Search foods" />
      {!query && recent.length > 0 && <p className="hint">Recent</p>}
      <ul className="results">
        {shown.map((f) => (
          <li key={f.name}>
            <button type="button" onClick={() => setChosen(f)}>
              <span>{f.name}</span>
              <span className="muted num">
                {fmt(f.kcal)} kcal · {fmt(f.protein, 1)} g protein / 100 g
              </span>
            </button>
          </li>
        ))}
      </ul>
      {query && !shown.length && <p className="hint">No match. Add it as your own food below.</p>}
      <div className="row">
        <button type="button" className="btn" onClick={() => setCreating(true)}>
          Add your own food
        </button>
        <button type="button" className="btn" onClick={props.onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const strip = (f: Pickable): FoodRef => ({ name: f.name, diet: f.diet, kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat, fibre: f.fibre });

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
          Amount
          <input type="number" inputMode="decimal" min={0.25} max={5000} step="any" value={qty || ''} onChange={(e) => setQty(e.target.valueAsNumber)} required autoFocus />
        </label>
        <label className="field">
          Unit
          <select
            value={unit}
            onChange={(e) => {
              const u = Number(e.target.value);
              setUnit(u);
              setQty(units[u] === GRAMS ? 100 : 1);
            }}
          >
            {units.map(([label, g], i) => (
              <option key={label} value={i}>
                {label}
                {label !== 'grams' && ` (${g} g)`}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="num">
        {fmt(grams)} g: <strong>{fmt((f.kcal * grams) / 100)} kcal</strong>, {fmt((f.protein * grams) / 100, 1)} g protein, {fmt((f.carbs * grams) / 100, 1)} g carbs, {fmt((f.fat * grams) / 100, 1)} g fat
      </p>
      <div className="row">
        <button type="submit" className="btn primary" disabled={!(grams > 0)}>
          Add
        </button>
        <button type="button" className="btn" onClick={props.onBack}>
          Back
        </button>
      </div>
    </form>
  );
}

/** Taken per serving, as on a label, and stored per 100 g like every other food. */
function CustomFoodForm(props: { diet: Profile['diet']; onDone: (f?: CustomFood) => void }) {
  async function save(e: FormEvent<HTMLFormElement>) {
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
    };
    food.id = await (await db).add('customFoods', food);
    props.onDone(food);
  }
  return (
    <form className="picker" onSubmit={save}>
      <p>
        <strong>Your own food</strong>, as one serving from its label or recipe
      </p>
      <label className="field">
        Name
        <input name="name" required maxLength={80} autoFocus />
      </label>
      <div className="grid">
        <Num name="grams" label="Serving (g)" min={1} required />
        <Num name="kcal" label="kcal" required />
        <Num name="protein" label="Protein (g)" />
        <Num name="carbs" label="Carbs (g)" />
        <Num name="fat" label="Fat (g)" />
        <Num name="fibre" label="Fibre (g)" />
      </div>
      <label className="field">
        Type
        <select name="diet" defaultValue={props.diet === 'vegan' ? 'vegan' : 'veg'}>
          <option value="vegan">Vegan</option>
          <option value="veg">Vegetarian</option>
          <option value="egg">Contains egg</option>
          <option value="nonveg">Meat or fish</option>
        </select>
      </label>
      <div className="row">
        <button type="submit" className="btn primary">
          Save food
        </button>
        <button type="button" className="btn" onClick={() => props.onDone()}>
          Cancel
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
