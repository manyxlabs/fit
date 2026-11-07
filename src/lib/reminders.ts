// Reminder schedules, shared by the app (which edits them) and the Worker (which sends them).
// A schedule holds times of day only, never anything logged, so the server learns nothing about health.
import { MEALS, type Meal } from '../data/meals';
import type { Locale } from '../i18n/locales';
import { PUSH } from '../i18n/push';

/** "HH:MM", 24-hour, in the person's own timezone. */
export type Time = string;
export type Schedule = {
  weighIn?: Time;
  meals?: Partial<Record<Meal, Time>>;
  /** Every `every` minutes from `from` to `to`, inclusive. */
  water?: { every: number; from: Time; to: Time };
  /** `days` are 0 (Sunday) to 6. */
  workout?: { days: number[]; time: Time };
  bedtime?: Time;
};
export type Kind = 'weighIn' | Meal | 'water' | 'workout' | 'bedtime';

export const WATER_EVERY = [60, 90, 120, 180];

const TAB: Record<Kind, string> = { weighIn: 'today', breakfast: 'food', lunch: 'food', snacks: 'food', dinner: 'food', water: 'today', workout: 'train', bedtime: 'today' };

/** What a notification says, in the person's language, and the app tab it opens. */
export const message = (kind: Kind, lang: Locale) => ({ title: PUSH[lang].title, body: PUSH[lang].body[kind], tab: TAB[kind] });

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const minutes = (t: Time) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const isTime = (x: unknown): x is Time => typeof x === 'string' && TIME.test(x);

export function validTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** A schedule from an untrusted source, keeping only the expected shape; null if anything is off. */
export function parseSchedule(x: unknown): Schedule | null {
  if (!x || typeof x !== 'object') return null;
  const s = x as Record<string, unknown>;
  const out: Schedule = {};
  const known = new Set(['weighIn', 'meals', 'water', 'workout', 'bedtime']);
  if (Object.keys(s).some((k) => !known.has(k))) return null;
  if (s.weighIn !== undefined) {
    if (!isTime(s.weighIn)) return null;
    out.weighIn = s.weighIn;
  }
  if (s.bedtime !== undefined) {
    if (!isTime(s.bedtime)) return null;
    out.bedtime = s.bedtime;
  }
  if (s.meals !== undefined) {
    const m = s.meals as Record<string, unknown>;
    if (!m || typeof m !== 'object' || Object.entries(m).some(([k, v]) => !(k in MEALS) || !isTime(v))) return null;
    out.meals = m as Schedule['meals'];
  }
  if (s.water !== undefined) {
    const w = s.water as Record<string, unknown>;
    if (!w || !WATER_EVERY.includes(w.every as number) || !isTime(w.from) || !isTime(w.to) || minutes(w.from) > minutes(w.to)) return null;
    out.water = { every: w.every as number, from: w.from, to: w.to };
  }
  if (s.workout !== undefined) {
    const w = s.workout as Record<string, unknown>;
    const days = w?.days;
    if (!Array.isArray(days) || !days.length || days.length > 7 || days.some((d) => !Number.isInteger(d) || d < 0 || d > 6) || new Set(days).size !== days.length || !isTime(w.time))
      return null;
    out.workout = { days: [...days].sort(), time: w.time };
  }
  return out;
}

/** Each reminder as minutes after local midnight, for a day of the week. */
function times(s: Schedule, weekday: number): [number, Kind][] {
  const out: [number, Kind][] = [];
  if (s.weighIn) out.push([minutes(s.weighIn), 'weighIn']);
  for (const [meal, t] of Object.entries(s.meals ?? {}) as [Meal, Time][]) out.push([minutes(t), meal]);
  if (s.water) for (let m = minutes(s.water.from); m <= minutes(s.water.to); m += s.water.every) out.push([m, 'water']);
  if (s.workout?.days.includes(weekday)) out.push([minutes(s.workout.time), 'workout']);
  if (s.bedtime) out.push([minutes(s.bedtime), 'bedtime']);
  return out;
}

/** The wall-clock date in a timezone at an instant. */
function localDate(at: number, tz: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(at).map((p) => [p.type, Number(p.value)]),
  );
  return { y: parts.year!, m: parts.month!, d: parts.day! };
}

/** How far a timezone's clock is ahead of UTC at an instant, in ms. */
function offset(at: number, tz: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
      .formatToParts(at)
      .map((x) => [x.type, Number(x.value)]),
  );
  return Date.UTC(p.year!, p.month! - 1, p.day!, p.hour!, p.minute!, p.second!) - Math.floor(at / 1000) * 1000;
}

/** The instant a local wall-clock time happens; checked twice, so a DST change in between is caught. */
function instant(y: number, m: number, d: number, mins: number, tz: string) {
  const wall = Date.UTC(y, m - 1, d, 0, mins);
  const first = wall - offset(wall, tz);
  return wall - offset(first, tz);
}

/** The next reminders strictly after `after`, all of those that fall due at that same instant. */
export function next(s: Schedule, tz: string, after: number): { at: number; kinds: Kind[] } | null {
  const { y, m, d } = localDate(after, tz);
  // Eight days covers a weekly reminder whose time today has passed.
  for (let i = 0; i <= 7; i++) {
    const day = new Date(Date.UTC(y, m - 1, d + i));
    let best: { at: number; kinds: Kind[] } | null = null;
    for (const [mins, kind] of times(s, day.getUTCDay())) {
      const at = instant(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), mins, tz);
      if (at <= after) continue;
      if (!best || at < best.at) best = { at, kinds: [kind] };
      else if (at === best.at && !best.kinds.includes(kind)) best.kinds.push(kind);
    }
    if (best) return best;
  }
  return null;
}
