import type { Diet } from './supplements';
import foods from './foods.json';

/** Per 100 g as eaten. Made by scripts/foods.mjs from data/. */
/** `vrat` marks food commonly eaten on vrat days (Navratri, Ekadashi). */
export type Food = { name: string; aliases?: string[]; diet: Diet; vrat?: true; kcal: number; protein: number; carbs: number; fat: number; fibre: number; units: [string, number][] };

export const FOODS = foods as Food[];

/** Which foods each diet eats: a vegetarian sees vegan and vegetarian foods, and so on up. */
const EATS: Record<Diet, Diet[]> = {
  vegan: ['vegan'],
  veg: ['vegan', 'veg'],
  egg: ['vegan', 'veg', 'egg'],
  nonveg: ['vegan', 'veg', 'egg', 'nonveg'],
};
export const fits = (food: Diet, eater: Diet) => EATS[eater].includes(food);

// Indic spellings differ only in zero-width joiners (സാൻഡ്‌വിച്ച് with or without one), which few people type.
const norm = (s: string) => s.toLowerCase().replace(/[\u200c\u200d]/g, '');

/** Name matches first, then alias matches; every word typed must appear. */
export function search<T extends { name: string; aliases?: string[] }>(list: T[], query: string, limit = 30) {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const score = (f: T) => {
    const name = f.name.toLowerCase();
    if (words.every((w) => name.includes(w))) return name.startsWith(words[0]) ? 0 : 1;
    const hay = norm([name, ...(f.aliases ?? [])].join(' '));
    return words.every((w) => hay.includes(w)) ? 2 : -1;
  };
  return list
    .map((f) => [f, score(f)] as const)
    .filter(([, s]) => s >= 0)
    .sort((a, b) => a[1] - b[1] || a[0].name.length - b[0].name.length)
    .slice(0, limit)
    .map(([f]) => f);
}
