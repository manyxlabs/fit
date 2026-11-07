// Labels for the shared data, read from the data modules themselves so English has one source.
// Every other language's data.ts gives the same keys as literals; exercise and food names stay in
// English everywhere, as gyms and menus in India use them, so they are not here.
import { ACTIVITIES } from '../../data/activities';
import { EQUIPMENT, EXERCISES, MUSCLES, type ExerciseId } from '../../data/exercises';
import { MEALS } from '../../data/meals';
import { POSES, type PoseId } from '../../data/poses';
import { GOALS, LEVELS, PROGRAMS, RUN, type ProgramId } from '../../data/programs';
import { DIETS, SUPPLEMENTS } from '../../data/supplements';
import { ACTIVITY } from '../../lib/calc';
import type { Widen } from '../shape';

const map = <K extends string, V, O>(o: Record<K, V>, f: (v: V) => O) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, f(v as V)])) as Record<K, O>;

/** Day names as programs store them, less "Week 3 · " before and " A" after, which are drawn from `week` and `letter`. */
export const dayPart = (name: string) => name.replace(/^Week \d+ · /, '').replace(/ [A-C]$/, '').replace(/^Run \d+$/, 'Run');
const parts = [...new Set(Object.values(PROGRAMS).flatMap((p) => p.days.map((d) => dayPart(d.name))))].sort();

const data = {
  sex: { male: 'Male', female: 'Female' },
  /** The goal as a person picks it in their profile. */
  goals: { lose: 'Lose fat', maintain: 'Maintain', recomp: 'Build muscle, lose fat (recomp)', gain: 'Build muscle (lean bulk)' },
  /** The same goals, short, as the calculators list them. */
  goalsShort: { lose: 'Lose fat', maintain: 'Maintain', recomp: 'Recomp', gain: 'Build muscle' },
  activity: Object.fromEntries(ACTIVITY.map((a) => [a.id, { label: a.label, detail: a.detail }])) as Record<(typeof ACTIVITY)[number]['id'], { label: string; detail: string }>,
  bmi: { under: 'Underweight', healthy: 'Healthy', over: 'Overweight', obese: 'Obese' },
  zones: ['Recovery', 'Endurance', 'Tempo', 'Threshold', 'Max'],
  diets: { ...DIETS },
  equipment: { ...EQUIPMENT },
  muscles: { ...MUSCLES },
  meals: { ...MEALS },
  /** Logged activities keep the English name, so a change of language never splits one activity in two. */
  supplements: map(SUPPLEMENTS, (s) => s.name),
  activities: Object.fromEntries(ACTIVITIES.map(([n]) => [n, n])) as Record<string, string>,
  exerciseCues: map(EXERCISES as Record<ExerciseId, { cue: string }>, (e) => e.cue),
  poses: map(POSES as Record<PoseId, { name: string; cue: string }>, (p) => ({ name: p.name, cue: p.cue })),
  programs: map(PROGRAMS as Record<ProgramId, { name: string; about: string }>, (p) => ({ name: p.name, about: p.about })),
  programGoals: { ...GOALS },
  levels: { ...LEVELS },
  run: map(RUN, (r) => ({ label: r.label, effort: r.effort })),
  days: Object.fromEntries(parts.map((p) => [p, p])) as Record<string, string>,
  week: 'Week {n}',
  runDay: 'Run {n}',
};

export default data;
export type Data = Widen<typeof data>;
