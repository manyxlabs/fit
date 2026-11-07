import { createContext, useContext, useEffect, useState } from 'react';
import { adaptiveTdee, age, activityFactor, bmr, calorieTarget, macros, waterMl } from '../lib/calc';
import { addDays, db, today, type FoodEntry, type Profile } from './db';

/** Bumped after every write, so each view re-reads what it shows. */
export const Version = createContext<{ v: number; bump: () => void }>({ v: 0, bump: () => {} });
export const useBump = () => useContext(Version).bump;

export function useAsync<T>(load: () => Promise<T>, deps: unknown[]): T | undefined {
  const { v } = useContext(Version);
  const [value, setValue] = useState<T>();
  useEffect(() => {
    let live = true;
    load().then((x) => live && setValue(x));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, ...deps]);
  return value;
}

export const kcalOf = (e: FoodEntry) => (e.food.kcal * e.grams) / 100;

export function totals(entries: FoodEntry[]) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };
  for (const e of entries) for (const k of Object.keys(t) as (keyof typeof t)[]) t[k] += (e.food[k] * e.grams) / 100;
  return t;
}

export async function latestWeight() {
  const cursor = await (await db).transaction('weights').store.openCursor(null, 'prev');
  return cursor?.value;
}

/**
 * Maintenance from the formula until four weeks of logs can measure it, then from the logs.
 * Days with under 800 kcal logged are treated as incompletely logged and left out.
 */
export async function targets(p: Profile) {
  const d = await db;
  const w = await latestWeight();
  if (!w) return undefined;
  const from = addDays(today(), -28);
  const weights = await d.getAll('weights', IDBKeyRange.lowerBound(from));
  const byDay = new Map<string, number>();
  for (const e of await d.getAllFromIndex('food', 'date', IDBKeyRange.bound(from, addDays(today(), -1)))) byDay.set(e.date, (byDay.get(e.date) ?? 0) + kcalOf(e));
  const measured = adaptiveTdee(weights, [...byDay.values()].filter((k) => k >= 800));
  const formula = bmr({ sex: p.sex, kg: w.kg, cm: p.cm, age: age(p.birthYear) }) * activityFactor(p.activity);
  const tdee = p.tdeeOverride ?? measured ?? formula;
  const { kcal, floored } = calorieTarget(tdee, w.kg, p.rate, p.sex);
  return { kg: w.kg, formula, measured, tdee, kcal, floored, ...macros({ kcal, kg: w.kg, cm: p.cm, goal: p.goal }), waterMl: waterMl(w.kg) };
}
export type Targets = NonNullable<Awaited<ReturnType<typeof targets>>>;
