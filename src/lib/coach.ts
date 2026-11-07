import { EXERCISES, loadStep, type Equipment, type ExerciseId } from '../data/exercises';
import { loadFor, oneRepMax } from './calc';

export type SetLog = { kg: number; reps: number; rir: number };

/** Why a target is what it is; the app words it in the person's language. */
export type TargetNote =
  | { kind: 'pickLoad' | 'startLow' | 'harder' }
  | { kind: 'addLoad'; high: number; step: number }
  | { kind: 'sameLoad' | 'aim'; reps: number }
  | { kind: 'workUp'; reps: number; rir: number }
  | { kind: 'ofMax'; percent: number; max: number };

/**
 * Double progression: hold the load and add reps until every set reaches the top of the
 * range, then add the exercise's smallest load step and start again from the bottom.
 * Where no weight can be added, reps go up to the top of the range, then a harder variation.
 */
export function nextTarget(id: ExerciseId, range: [number, number], last: SetLog[], setup: Equipment): { kg?: number; reps: number; note: TargetNote } {
  const [low, high] = range;
  const step = loadStep(id, setup);
  if (!last.length) return { kg: undefined, reps: low, note: { kind: step ? 'pickLoad' : 'startLow' } };
  const kg = Math.max(...last.map((s) => s.kg));
  const top = last.filter((s) => s.kg === kg);
  if (top.every((s) => s.reps >= high)) {
    if (step === 0) return { kg: kg || undefined, reps: high, note: { kind: 'harder' } };
    return { kg: kg + step, reps: low, note: { kind: 'addLoad', high, step } };
  }
  const reps = Math.min(high, Math.min(...top.map((s) => s.reps)) + 1);
  return kg ? { kg, reps, note: { kind: 'sameLoad', reps } } : { kg: undefined, reps, note: { kind: 'aim', reps } };
}

/**
 * Strength progression: the load for these reps and reps in reserve from the best estimated max
 * of the last three sessions, so it rises as sets get easier and holds through one bad day.
 */
export function strengthTarget(id: ExerciseId, reps: number, rir: number, sessions: SetLog[][]): { kg?: number; reps: number; note: TargetNote } {
  const e1rm = Math.max(0, ...sessions.slice(-3).map(bestE1rm));
  if (!e1rm) return { kg: undefined, reps, note: { kind: 'workUp', reps, rir } };
  const step = EXERCISES[id].step || 0.5;
  const kg = Math.round(loadFor(e1rm, reps, rir) / step) * step;
  return { kg, reps, note: { kind: 'ofMax', percent: Math.round((kg / e1rm) * 100), max: Math.round(e1rm) } };
}

export type Sickness = 'none' | 'aboveNeck' | 'belowNeck';
export type CheckIn = { date: string; sleep?: number; energy?: number; soreness?: number; sick?: Sickness };

export type Readiness = {
  level: 'rest' | 'light' | 'reduced' | 'normal';
  /** Fraction of planned sets to do. */
  volume: number;
  /** Extra reps to leave in reserve on every set. */
  extraRir: number;
  advice: Advice[];
};

/** A line of advice for the day, worded by the app. */
export type Advice = 'fever' | 'sickEat' | 'sickReturn' | 'sickDoctor' | 'sleepSwap' | 'sleepEat' | 'sleepCaffeine' | 'aboveNeck' | 'aboveNeckStop' | 'tired' | 'tiredNap';

/** What today's session should be, from how the body is doing. */
export function readiness(c: CheckIn | undefined): Readiness {
  if (c?.sick === 'belowNeck')
    return {
      level: 'rest',
      volume: 0,
      extraRir: 0,
      advice: ['fever', 'sickEat', 'sickReturn', 'sickDoctor'],
    };
  if (c?.sleep !== undefined && c.sleep < 4.5)
    return {
      level: 'light',
      volume: 0,
      extraRir: 0,
      advice: ['sleepSwap', 'sleepEat', 'sleepCaffeine'],
    };
  if (c?.sick === 'aboveNeck')
    return {
      level: 'reduced',
      volume: 0.6,
      extraRir: 1,
      advice: ['aboveNeck', 'aboveNeckStop'],
    };
  const tired = (c?.sleep !== undefined && c.sleep < 6) || (c?.energy !== undefined && c.energy <= 2) || (c?.soreness ?? 0) >= 4;
  if (tired)
    return {
      level: 'reduced',
      volume: 0.75,
      extraRir: 1,
      advice: ['tired', 'tiredNap'],
    };
  return { level: 'normal', volume: 1, extraRir: 0, advice: [] };
}

/** Best estimated one-rep max in a session's sets of one exercise. */
export const bestE1rm = (sets: SetLog[]) => Math.max(0, ...sets.map((s) => oneRepMax(s.kg, s.reps, s.rir)));

/**
 * A deload is due after six hard weeks, or once most main lifts have stopped improving:
 * the best of the last three sessions is no better than the best before them.
 */
export function deloadDue(weeksSinceDeload: number, history: Map<ExerciseId, SetLog[][]>): { kind: 'weeks'; weeks: number } | { kind: 'stalled'; stalled: number; tracked: number } | undefined {
  if (weeksSinceDeload >= 6) return { kind: 'weeks', weeks: weeksSinceDeload };
  let tracked = 0;
  let stalled = 0;
  for (const [id, sessions] of history) {
    // Bodyweight moves log 0 kg, so their estimated max never rises and would always count as stalled.
    if (!EXERCISES[id].compound || !EXERCISES[id].step || sessions.length < 6) continue;
    tracked++;
    const before = Math.max(...sessions.slice(0, -3).map(bestE1rm));
    if (Math.max(...sessions.slice(-3).map(bestE1rm)) <= before) stalled++;
  }
  if (tracked >= 2 && stalled * 2 >= tracked) return { kind: 'stalled', stalled, tracked };
  return undefined;
}
