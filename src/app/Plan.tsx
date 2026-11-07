import { useMemo } from 'react';
import { planDay, type PlannedMeal } from '../data/meals';
import { db, foodRef, type Day, type FoodEntry, type Meal, type Profile } from './db';
import { useBump, type Targets } from './hooks';
import { Card, fmt } from './ui';

/** A day of meals sized to the targets, each loggable in one tap. */
export function Plan(props: { date: string; profile: Profile; t: Targets; day: Day; vrat: boolean; entries: FoodEntry[]; names: Record<Meal, string> }) {
  const bump = useBump();
  const { date, profile, t, day, vrat } = props;
  const variant = day.plan ?? 0;
  const mode = profile.fasting?.mode === 'if' || profile.fasting?.mode === 'ramadan' ? profile.fasting.mode : 'normal';
  const plan = useMemo(
    () => planDay({ date, variant, diet: profile.diet, vrat, mode, kcal: t.kcal, protein: t.protein }),
    [date, variant, profile.diet, vrat, mode, t.kcal, t.protein],
  );

  async function shuffle() {
    await (await db).put('days', { ...day, date, plan: variant + 1 });
    bump();
  }
  // Logged means every item is already in the log as planned, so a reload or a second tap cannot log it twice.
  const logged = (m: PlannedMeal) => m.items.every((i) => props.entries.some((e) => e.meal === m.meal && e.food.name === i.food.name && e.grams === i.grams));
  async function log(meals: PlannedMeal[]) {
    const tx = (await db).transaction('food', 'readwrite');
    for (const m of meals) for (const i of m.items) await tx.store.add({ date, meal: m.meal, food: foodRef(i.food), grams: i.grams });
    await tx.done;
    bump();
  }

  if (!plan)
    return (
      <Card title="Plan my day">
        <p className="hint">No meal plan fits these food choices yet. Add foods to each meal below instead.</p>
      </Card>
    );
  const open = plan.meals.filter((m) => !logged(m));
  return (
    <Card
      title="Plan my day"
      action={
        <button type="button" className="link-btn" onClick={shuffle}>
          Shuffle
        </button>
      }
    >
      {vrat && <p className="hint">Vrat: only vrat foods.</p>}
      {plan.meals.map((m) => (
        <div key={m.meal} className="plan-meal">
          <header>
            <h3>
              {props.names[m.meal]}: {m.name}
            </h3>
            <span className="num muted">
              {fmt(m.kcal)} kcal · {fmt(m.protein)} g protein
            </span>
          </header>
          <ul className="entries">
            {m.items.map((i) => (
              <li key={i.food.name}>
                <div>
                  <strong>{i.food.name}</strong>
                  <span className="muted">
                    {i.count.toLocaleString('en-IN')} × {i.unit}, {fmt(i.grams)} g
                  </span>
                </div>
                <span className="num">{fmt((i.food.kcal * i.grams) / 100)}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn" disabled={logged(m)} onClick={() => log([m])}>
            {logged(m) ? 'Logged' : `Log ${props.names[m.meal].toLowerCase()}`}
          </button>
        </div>
      ))}
      <p className="num">
        Plan: <strong>{fmt(plan.kcal)}</strong> of {fmt(t.kcal)} kcal, <strong>{fmt(plan.protein)}</strong> of {fmt(t.protein)} g protein
      </p>
      {!plan.ok && (
        <p className="warn">
          {plan.protein < t.protein * 0.95
            ? `These meals reach ${fmt((plan.protein / t.protein) * 100)}% of your protein target within your calories. ${vrat ? 'Vrat foods are low in protein; paneer, Greek yogurt and milk help most.' : 'A protein shake, or more paneer, soya, eggs or chicken, closes the gap.'}`
            : 'These meals land a little off your calorie target; adjust a portion when you log.'}
        </p>
      )}
      <button type="button" className="btn primary" disabled={!open.length} onClick={() => log(open)}>
        {open.length ? 'Log whole day' : 'Whole day logged'}
      </button>
    </Card>
  );
}
