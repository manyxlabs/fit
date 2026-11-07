import type { Diet } from './supplements';
import foods from './foods.json';

/** Per 100 g as eaten. Made by scripts/foods.mjs from data/. */
export type Food = { name: string; aliases?: string[]; diet: Diet; kcal: number; protein: number; carbs: number; fat: number; fibre: number; units: [string, number][] };

export const FOODS = foods as Food[];

/** Which foods each diet eats: a vegetarian sees vegan and vegetarian foods, and so on up. */
const EATS: Record<Diet, Diet[]> = {
  vegan: ['vegan'],
  veg: ['vegan', 'veg'],
  egg: ['vegan', 'veg', 'egg'],
  nonveg: ['vegan', 'veg', 'egg', 'nonveg'],
};
export const fits = (food: Diet, eater: Diet) => EATS[eater].includes(food);

/** Name matches first, then alias matches; every word typed must appear. */
export function search<T extends { name: string; aliases?: string[] }>(list: T[], query: string, limit = 30) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const score = (f: T) => {
    const name = f.name.toLowerCase();
    if (words.every((w) => name.includes(w))) return name.startsWith(words[0]) ? 0 : 1;
    const hay = [name, ...(f.aliases ?? [])].join(' ').toLowerCase();
    return words.every((w) => hay.includes(w)) ? 2 : -1;
  };
  return list
    .map((f) => [f, score(f)] as const)
    .filter(([, s]) => s >= 0)
    .sort((a, b) => a[1] - b[1] || a[0].name.length - b[0].name.length)
    .slice(0, limit)
    .map(([f]) => f);
}
