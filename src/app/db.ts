import { openDB, type DBSchema } from 'idb';
import type { Activity, Goal, Sex } from '../lib/calc';
import type { CheckIn, SetLog } from '../lib/coach';
import type { Equipment, ExerciseId } from '../data/exercises';
import type { Diet, SupplementId } from '../data/supplements';
import type { Plan, ProgramId } from '../data/programs';

export type Profile = {
  sex: Sex;
  birthYear: number;
  cm: number;
  activity: Activity;
  goal: Goal;
  /** Weekly change as a fraction of body weight. */
  rate: number;
  diet: Diet;
  setup: Equipment;
  days: number;
  /** Chosen in the profile; without it, the muscle program for the setup and days. */
  program?: ProgramId;
  asian: boolean;
  /** When set, replaces the formula's maintenance estimate. */
  tdeeOverride?: number;
};

/** Per 100 g. Copied into each log entry, so later edits to a food never rewrite history. */
export type Nutrients = { kcal: number; protein: number; carbs: number; fat: number; fibre: number };
export type FoodRef = Nutrients & { name: string; diet: Diet };
export type Meal = 'breakfast' | 'lunch' | 'snacks' | 'dinner';
export type FoodEntry = { id?: number; date: string; meal: Meal; food: FoodRef; grams: number };
export type CustomFood = FoodRef & { id?: number };

export type Workout = {
  id?: number;
  date: string;
  day: string;
  /** `rir` is set where the load comes from the estimated one-rep max. */
  exercises: { exercise: ExerciseId; range: [number, number]; planned: number; rir?: number; sets: SetLog[] }[];
};

/** `day` names the program day it completed, for activities logged from a run or yoga plan. */
export type Activity_ = { id?: number; date: string; name: string; met: number; minutes: number; km?: number; day?: string };
export type Measurement = { date: string; waist?: number; neck?: number; hip?: number; chest?: number; arm?: number; thigh?: number };
export type Day = CheckIn & { steps?: number; waterMl?: number; supplements?: SupplementId[] };

export type Settings = {
  profile?: Profile;
  /** The program as edited, else the template's. */
  program?: Plan;
  deloadedOn?: string;
  /** The workout in progress, kept across reloads. */
  draft?: Workout;
  /** The run or yoga session in progress, as timestamps so it survives a reload or the phone sleeping. */
  timer?: { day: string; started: number; paused: number; pausedAt?: number };
};

interface Schema extends DBSchema {
  settings: { key: keyof Settings; value: Settings[keyof Settings] };
  weights: { key: string; value: { date: string; kg: number } };
  food: { key: number; value: FoodEntry; indexes: { date: string } };
  customFoods: { key: number; value: CustomFood };
  workouts: { key: number; value: Workout; indexes: { date: string } };
  activities: { key: number; value: Activity_; indexes: { date: string } };
  days: { key: string; value: Day };
  measurements: { key: string; value: Measurement };
}

export const STORES = ['settings', 'weights', 'food', 'customFoods', 'workouts', 'activities', 'days', 'measurements'] as const;

export const db = openDB<Schema>('fit', 1, {
  upgrade(d) {
    d.createObjectStore('settings');
    d.createObjectStore('weights', { keyPath: 'date' });
    d.createObjectStore('food', { keyPath: 'id', autoIncrement: true }).createIndex('date', 'date');
    d.createObjectStore('customFoods', { keyPath: 'id', autoIncrement: true });
    d.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true }).createIndex('date', 'date');
    d.createObjectStore('activities', { keyPath: 'id', autoIncrement: true }).createIndex('date', 'date');
    d.createObjectStore('days', { keyPath: 'date' });
    d.createObjectStore('measurements', { keyPath: 'date' });
  },
});

export async function getSetting<K extends keyof Settings>(key: K) {
  return (await (await db).get('settings', key)) as Settings[K];
}
export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  await (await db).put('settings', value, key);
}

/** The local calendar date, which is what "today" means to the person logging. */
export function today(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + n);
  return today(d);
}

export async function backup() {
  const d = await db;
  const out: Record<string, unknown> = { app: 'fit', version: 1 };
  for (const s of STORES) out[s] = s === 'settings' ? Object.fromEntries(await Promise.all((await d.getAllKeys(s)).map(async (k) => [k, await d.get(s, k)]))) : await d.getAll(s);
  return out;
}

/** Replaces everything with a backup's contents, in one transaction so a bad file changes nothing. */
export async function restore(data: Record<string, unknown>) {
  if (data.app !== 'fit' || data.version !== 1) throw new Error('This is not a Fit backup.');
  const d = await db;
  const tx = d.transaction(STORES, 'readwrite');
  for (const s of STORES) {
    const store = tx.objectStore(s);
    await store.clear();
    if (s === 'settings') for (const [k, v] of Object.entries((data.settings ?? {}) as Settings)) await store.put(v, k as keyof Settings);
    else for (const row of (data[s] ?? []) as never[]) await store.put(row);
  }
  await tx.done;
}
