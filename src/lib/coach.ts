import { EXERCISES, loadStep, type Equipment, type ExerciseId } from '../data/exercises';
import { loadFor, oneRepMax } from './calc';

export type SetLog = { kg: number; reps: number; rir: number };

/**
 * Double progression: hold the load and add reps until every set reaches the top of the
 * range, then add the exercise's smallest load step and start again from the bottom.
 * Where no weight can be added, reps go up to the top of the range, then a harder variation.
 */
export function nextTarget(id: ExerciseId, range: [number, number], last: SetLog[], setup: Equipment) {
  const [low, high] = range;
  const step = loadStep(id, setup);
  if (!last.length) return { kg: undefined, reps: low, note: step ? 'Pick a load you can lift for the bottom of the range with 2-3 reps to spare.' : 'Start at the bottom of the range, with some left in the tank.' };
  const kg = Math.max(...last.map((s) => s.kg));
  const top = last.filter((s) => s.kg === kg);
  if (top.every((s) => s.reps >= high)) {
    if (step === 0) return { kg: kg || undefined, reps: high, note: 'Every set reached the top of the range. Move to a harder variation or slow the lowering to 4 seconds.' };
    return { kg: kg + step, reps: low, note: `Every set reached ${high}. Add ${step} kg.` };
  }
  const reps = Math.min(high, Math.min(...top.map((s) => s.reps)) + 1);
  return kg ? { kg, reps, note: `Same load, aim for ${reps}+ reps on each set.` } : { kg: undefined, reps, note: `Aim for ${reps}+ reps on each set.` };
}

/**
 * Strength progression: the load for these reps and reps in reserve from the best estimated max
 * of the last three sessions, so it rises as sets get easier and holds through one bad day.
 */
export function strengthTarget(id: ExerciseId, reps: number, rir: number, sessions: SetLog[][]) {
  const e1rm = Math.max(0, ...sessions.slice(-3).map(bestE1rm));
  if (!e1rm) return { kg: undefined, reps, note: `Work up in small jumps to a set of ${reps} with ${rir} reps to spare.` };
  const step = EXERCISES[id].step || 0.5;
  const kg = Math.round(loadFor(e1rm, reps, rir) / step) * step;
  return { kg, reps, note: `About ${Math.round((kg / e1rm) * 100)}% of your estimated max of ${Math.round(e1rm)} kg.` };
}

export type Sickness = 'none' | 'aboveNeck' | 'belowNeck';
export type CheckIn = { date: string; sleep?: number; energy?: number; soreness?: number; sick?: Sickness };

export type Readiness = {
  level: 'rest' | 'light' | 'reduced' | 'normal';
  /** Fraction of planned sets to do. */
  volume: number;
  /** Extra reps to leave in reserve on every set. */
  extraRir: number;
  advice: string[];
};

/** What today's session should be, from how the body is doing. */
export function readiness(c: CheckIn | undefined): Readiness {
  if (c?.sick === 'belowNeck')
    return {
      level: 'rest',
      volume: 0,
      extraRir: 0,
      advice: [
        'Fever, body aches, chest congestion or a stomach bug: skip training. Exercise with a fever raises the risk of complications.',
        'Eat at maintenance, keep protein high and drink plenty of fluids.',
        'Come back 24-48 hours after symptoms clear, at 50-70% of your usual sets.',
        'See a doctor for chest pain, trouble breathing, a lasting fever or palpitations.',
      ],
    };
  if (c?.sleep !== undefined && c.sleep < 4.5)
    return {
      level: 'light',
      volume: 0,
      extraRir: 0,
      advice: ['Under 4.5 hours of sleep: swap the session for a walk or mobility work, or rest.', 'Keep calories and protein normal; poor sleep raises hunger, so plan protein-rich snacks.', 'Caffeine early only, and aim for an early night.'],
    };
  if (c?.sick === 'aboveNeck')
    return {
      level: 'reduced',
      volume: 0.6,
      extraRir: 1,
      advice: ['Symptoms only above the neck: light training is usually fine. About 40% fewer sets and keep it short.', 'Stop if you feel worse as you go.'],
    };
  const tired = (c?.sleep !== undefined && c.sleep < 6) || (c?.energy !== undefined && c.energy <= 2) || (c?.soreness ?? 0) >= 4;
  if (tired)
    return {
      level: 'reduced',
      volume: 0.75,
      extraRir: 1,
      advice: ['Short sleep, low energy or heavy soreness: about 25% fewer sets, one more rep in reserve than usual, no max attempts.', 'A 20-30 minute nap before 3 pm helps.'],
    };
  return { level: 'normal', volume: 1, extraRir: 0, advice: [] };
}

/** Best estimated one-rep max in a session's sets of one exercise. */
export const bestE1rm = (sets: SetLog[]) => Math.max(0, ...sets.map((s) => oneRepMax(s.kg, s.reps, s.rir)));

/**
 * A deload is due after six hard weeks, or once most main lifts have stopped improving:
 * the best of the last three sessions is no better than the best before them.
 */
export function deloadDue(weeksSinceDeload: number, history: Map<ExerciseId, SetLog[][]>) {
  if (weeksSinceDeload >= 6) return `It has been ${weeksSinceDeload} weeks since your last easy week.`;
  let tracked = 0;
  let stalled = 0;
  for (const [id, sessions] of history) {
    // Bodyweight moves log 0 kg, so their estimated max never rises and would always count as stalled.
    if (!EXERCISES[id].compound || !EXERCISES[id].step || sessions.length < 6) continue;
    tracked++;
    const before = Math.max(...sessions.slice(0, -3).map(bestE1rm));
    if (Math.max(...sessions.slice(-3).map(bestE1rm)) <= before) stalled++;
  }
  if (tracked >= 2 && stalled * 2 >= tracked) return `${stalled} of your ${tracked} main lifts have stalled for three sessions.`;
  return undefined;
}
