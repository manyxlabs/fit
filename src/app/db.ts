import { openDB, type DBSchema } from 'idb';
import type { Activity, Goal, Sex } from '../lib/calc';
import type { CheckIn, SetLog } from '../lib/coach';
import type { Equipment, ExerciseId } from '../data/exercises';
import type { Diet, SupplementId } from '../data/supplements';
import type { Plan, ProgramId } from '../data/programs';
import type { Meal } from '../data/meals';
import type { Fasting } from '../lib/fasting';

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
  /** A home setup with a pull-up bar or dip station. */
  bar?: boolean;
  days: number;
  /** Chosen in the profile; without it, the muscle program for the setup and days. */
  program?: ProgramId;
  asian: boolean;
  /** When set, replaces the formula's maintenance estimate. */
  tdeeOverride?: number;
  fasting?: Fasting;
};

/** Per 100 g. Copied into each log entry, so later edits to a food never rewrite history. */
export type Nutrients = { kcal: number; protein: number; carbs: number; fat: number; fibre: number };
export type FoodRef = Nutrients & { name: string; diet: Diet };
export type { Meal };
export type FoodEntry = { id?: number; date: string; meal: Meal; food: FoodRef; grams: number };
export type CustomFood = FoodRef & { id?: number; vrat?: boolean };

export const foodRef = (f: FoodRef): FoodRef => ({ name: f.name, diet: f.diet, kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat, fibre: f.fibre });

export type Workout = {
  id?: number;
  date: string;
  day: string;
  /** `rir` is set where the load comes from the estimated one-rep max. */
  exercises: { exercise: ExerciseId; range: [number, number]; planned: number; rir?: number; sets: SetLog[] }[];
};

/** `day` names the program day it completed, for activities logged from a run or yoga plan. */
export type Activity_ = { id?: number; date: string; name: string; met: number; minutes: number; km?: number; day?: string };
/** Circumferences in cm; bodyFat is a percentage from a scale or health app, not the tape. */
export type Measurement = { date: string; waist?: number; neck?: number; hip?: number; chest?: number; arm?: number; thigh?: number; bodyFat?: number };
/** `vrat` is a one-day fast (Ekadashi and the like); `plan` is which meal plan variant Shuffle reached. */
export type Day = CheckIn & { steps?: number; waterMl?: number; supplements?: SupplementId[]; vrat?: boolean; plan?: number; restingHr?: number };
export const POSES = ['front', 'side', 'back'] as const;
export type Pose = (typeof POSES)[number];
/** A JPEG, already downscaled and stripped of EXIF. */
export type Photo = { date: string; pose: Pose; blob: Blob };

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
  photos: { key: [string, Pose]; value: Photo };
}

export const STORES = ['settings', 'weights', 'food', 'customFoods', 'workouts', 'activities', 'days', 'measurements', 'photos'] as const;

export const db = openDB<Schema>('fit', 2, {
  upgrade(d, old) {
    if (old < 1) {
      d.createObjectStore('settings');
      d.createObjectStore('weights', { keyPath: 'date' });
      d.createObjectStore('food', { keyPath: 'id', autoIncrement: true }).createIndex('date', 'date');
      d.createObjectStore('customFoods', { keyPath: 'id', autoIncrement: true });
      d.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true }).createIndex('date', 'date');
      d.createObjectStore('activities', { keyPath: 'id', autoIncrement: true }).createIndex('date', 'date');
      d.createObjectStore('days', { keyPath: 'date' });
      d.createObjectStore('measurements', { keyPath: 'date' });
    }
    if (!d.objectStoreNames.contains('photos')) d.createObjectStore('photos', { keyPath: ['date', 'pose'] });
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

/**
 * Photos go in as base64 JPEG inside the same JSON, so there is one file and one restore path.
 * JPEG does not compress further, so a zip would only save base64's third, for a dependency
 * and a second format. Left out on request, for a small backup taken often.
 */
export async function backup(photos: boolean) {
  const d = await db;
  const out: Record<string, unknown> = { app: 'fit', version: 1 };
  for (const s of STORES) {
    if (s === 'photos') {
      if (photos) out.photos = await Promise.all((await d.getAll('photos')).map(async ({ blob, ...p }) => ({ ...p, jpeg: await dataUrl(blob) })));
    } else out[s] = s === 'settings' ? Object.fromEntries(await Promise.all((await d.getAllKeys(s)).map(async (k) => [k, await d.get(s, k)]))) : await d.getAll(s);
  }
  return out;
}

const dataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

/**
 * Replaces everything with a backup's contents, in one transaction so a bad file changes nothing.
 * A backup taken without photos leaves the photos here as they are.
 */
export async function restore(data: Record<string, unknown>) {
  if (data.app !== 'fit' || data.version !== 1) throw new Error('This is not a Fit backup.');
  // Decoded first: a transaction that awaits anything but its own requests commits early.
  const photos =
    data.photos &&
    (await Promise.all(
      (data.photos as (Omit<Photo, 'blob'> & { jpeg: string })[]).map(async ({ jpeg, ...p }) => {
        if (!jpeg?.startsWith('data:image/jpeg;base64,') || !POSES.includes(p.pose)) throw new Error('This backup has a damaged photo.');
        return { ...p, blob: await (await fetch(jpeg)).blob() };
      }),
    ));
  const stores = STORES.filter((s) => s !== 'photos' || photos);
  const d = await db;
  const tx = d.transaction(stores, 'readwrite');
  for (const s of stores) {
    const store = tx.objectStore(s);
    await store.clear();
    if (s === 'settings') for (const [k, v] of Object.entries((data.settings ?? {}) as Settings)) await store.put(v, k as keyof Settings);
    else for (const row of (s === 'photos' ? photos : (data[s] ?? [])) as never[]) await store.put(row);
  }
  await tx.done;
}
