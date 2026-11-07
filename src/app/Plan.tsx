import { useMemo } from 'react';
import { planDay, type PlannedMeal } from '../data/meal-plans';
import { db, foodRef, type Day, type FoodEntry, type Meal, type Profile } from './db';
import { useBump, type Targets } from './hooks';
import { adviceLang, fill, h, t as copy } from './i18n';
import { rich } from '../i18n/rich';
import { Card, fmt } from './ui';

const c = copy.food.plan;
const bold = { b: (x: string) => <strong>{x}</strong> };

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
  const logLabel: Record<Meal, string> = mode === 'ramadan' ? { ...c.log, ...c.logRamadan } : c.log;

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
      <Card title={c.title}>
        <p className="hint">{c.none}</p>
      </Card>
    );
  const open = plan.meals.filter((m) => !logged(m));
  return (
    <Card
      title={c.title}
      action={
        <button type="button" className="link-btn" onClick={shuffle}>
          {c.shuffle}
        </button>
      }
    >
      {vrat && <p className="hint">{c.vrat}</p>}
      {plan.meals.map((m) => (
        <div key={m.meal} className="plan-meal">
          <header>
            <h3>{fill(c.mealTitle, { meal: props.names[m.meal], name: m.name })}</h3>
            <span className="num muted">{fill(c.mealTotals, { kcal: fmt(m.kcal), protein: fmt(m.protein) })}</span>
          </header>
          <ul className="entries">
            {m.items.map((i) => (
              <li key={i.food.name}>
                <div>
                  <strong>{i.food.name}</strong>
                  <span className="muted">{fill(c.item, { count: i.count.toLocaleString('en-IN'), unit: i.unit, g: fmt(i.grams) })}</span>
                </div>
                <span className="num">{fmt((i.food.kcal * i.grams) / 100)}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn" disabled={logged(m)} onClick={() => log([m])}>
            {logged(m) ? c.logged : logLabel[m.meal]}
          </button>
        </div>
      ))}
      <p className="num">
        {rich(fill(c.totals, { kcal: fmt(plan.kcal), targetKcal: fmt(t.kcal), protein: fmt(plan.protein), targetProtein: fmt(t.protein) }), bold)}
      </p>
      {!plan.ok && (
        <p className="warn" lang={adviceLang}>
          {plan.protein < t.protein * 0.95
            ? fill(vrat ? h.food.proteinShortVrat : h.food.proteinShort, { pct: fmt((plan.protein / t.protein) * 100) })
            : h.food.kcalOff}
        </p>
      )}
      <button type="button" className="btn primary" disabled={!open.length} onClick={() => log(open)}>
        {open.length ? c.logDay : c.dayLogged}
      </button>
    </Card>
  );
}
