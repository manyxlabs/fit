import { ACTIVITIES } from './activities';
import { EXERCISES, type Equipment, type ExerciseId, type Muscle } from './exercises';
import type { PoseId } from './poses';

/**
 * Exercise, sets, bottom and top of the rep range. A fifth number, reps in reserve, sets the load
 * from the estimated one-rep max instead of from double progression.
 */
export type Slot = [ExerciseId, number, number, number, rir?: number];
export type Hold = [PoseId, seconds: number];

const metOf = (name: string) => {
  const a = ACTIVITIES.find(([n]) => n === name);
  if (!a) throw new Error(`No activity "${name}"`);
  return a[1];
};

/** What each running interval asks for, and the activity whose MET estimates its calories. */
export const RUN = {
  walk: { label: 'Walk', effort: 'Brisk, arms swinging.', met: metOf('Walking, brisk') },
  run: { label: 'Run', effort: 'Easy: you could talk in short sentences.', met: metOf('Running, 8 km/h') },
  easy: { label: 'Easy run', effort: 'Conversational: you could talk in full sentences.', met: metOf('Running, 8 km/h') },
  steady: { label: 'Steady run', effort: 'Comfortably hard: a few words at a time.', met: metOf('Running, 10 km/h') },
  fast: { label: 'Fast', effort: 'Hard but controlled, about your best 5K pace.', met: metOf('Running, 10 km/h') },
  jog: { label: 'Jog', effort: 'Very easy, to recover. Walk if you need to.', met: metOf('Running, 8 km/h') },
};
export type RunStep = [keyof typeof RUN, seconds: number];

export type LiftDay = { name: string; slots: Slot[]; cooldown?: Hold[] };
/** A warm-up, then `reps` rounds of `set`, then a cool-down. */
export type RunDay = { name: string; warm: RunStep; reps: number; set: RunStep[]; cool: RunStep };
export type HoldDay = { name: string; holds: Hold[] };
export type Day = LiftDay | RunDay | HoldDay;

export const GOALS = { muscle: 'Build muscle', strength: 'Get stronger', health: 'Health and fitness', running: 'Running', mobility: 'Yoga and mobility' } as const;
export const LEVELS = { beginner: 'beginner', intermediate: 'intermediate', any: 'any level' } as const;

export type Program = {
  name: string;
  about: string;
  goal: keyof typeof GOALS;
  level: keyof typeof LEVELS;
  setups: Equipment[];
  perWeek: number;
  days: Day[];
  /** Plans that build to an end repeat from this day once finished; the rest cycle from the start. */
  repeatFrom?: number;
};

/** The program as followed and edited, kept in settings. */
export type Plan = Pick<Program, 'name' | 'days' | 'repeatFrom'> & { id?: ProgramId };

const fullBodyGym: LiftDay[] = [
  { name: 'Full body A', slots: [['backSquat', 3, 5, 8], ['benchPress', 3, 6, 10], ['seatedCableRow', 3, 8, 12], ['lateralRaise', 2, 12, 20], ['legCurl', 2, 10, 15], ['inclineDbCurl', 2, 10, 15]] },
  { name: 'Full body B', slots: [['romanianDeadlift', 3, 6, 10], ['ohp', 3, 6, 10], ['latPulldown', 3, 8, 12], ['legPress', 2, 10, 15], ['cableFly', 2, 12, 15], ['pushdown', 2, 10, 15]] },
  { name: 'Full body C', slots: [['bulgarianSplitSquat', 3, 8, 12], ['inclineDbPress', 3, 8, 12], ['pullUp', 3, 5, 10], ['hipThrust', 2, 8, 12], ['facePull', 2, 12, 20], ['calfRaise', 3, 10, 15]] },
];

const upperGym = (n: string, press: ExerciseId, pull: ExerciseId): LiftDay => ({
  name: n,
  slots: [[press, 3, 6, 10], [pull, 3, 6, 10], ['inclineDbPress', 3, 8, 12], ['latPulldown', 3, 8, 12], ['lateralRaise', 3, 12, 20], ['inclineDbCurl', 2, 10, 15], ['overheadExtension', 2, 10, 15]],
});
const lowerGym = (n: string, main: ExerciseId, hinge: ExerciseId): LiftDay => ({
  name: n,
  slots: [[main, 3, 5, 8], [hinge, 3, 6, 10], ['legExtension', 2, 10, 15], ['legCurl', 3, 10, 15], ['calfRaise', 3, 10, 15], ['cableCrunch', 2, 10, 15]],
});

const push: LiftDay = { name: 'Push', slots: [['benchPress', 3, 6, 10], ['dbShoulderPress', 3, 8, 12], ['cableFly', 3, 12, 15], ['lateralRaise', 3, 12, 20], ['pushdown', 3, 10, 15]] };
const pull: LiftDay = { name: 'Pull', slots: [['pullUp', 3, 5, 10], ['barbellRow', 3, 6, 10], ['seatedCableRow', 2, 10, 12], ['facePull', 3, 12, 20], ['inclineDbCurl', 3, 10, 15], ['hammerCurl', 2, 10, 15]] };
const legs: LiftDay = { name: 'Legs', slots: [['backSquat', 3, 5, 8], ['romanianDeadlift', 3, 6, 10], ['legPress', 2, 10, 15], ['legCurl', 3, 10, 15], ['calfRaise', 3, 10, 15], ['hangingLegRaise', 2, 8, 15]] };

const fullBodyDb: LiftDay[] = [
  { name: 'Full body A', slots: [['gobletSquat', 3, 8, 12], ['dbBenchPress', 3, 8, 12], ['dbRow', 3, 8, 12], ['lateralRaise', 2, 12, 20], ['dbRdl', 2, 8, 12], ['hammerCurl', 2, 10, 15]] },
  { name: 'Full body B', slots: [['bulgarianSplitSquat', 3, 8, 12], ['dbShoulderPress', 3, 8, 12], ['pushUp', 3, 8, 20], ['dbRow', 3, 8, 12], ['hipThrust', 2, 10, 15], ['overheadExtension', 2, 10, 15]] },
  { name: 'Full body C', slots: [['dbRdl', 3, 8, 12], ['inclineDbPress', 3, 8, 12], ['reverseFly', 3, 12, 20], ['walkingLunge', 2, 10, 15], ['inclineDbCurl', 2, 10, 15], ['calfRaise', 3, 12, 20]] },
];
const upperDb: LiftDay = { name: 'Upper', slots: [['dbBenchPress', 3, 8, 12], ['dbRow', 3, 8, 12], ['dbShoulderPress', 3, 8, 12], ['dbFly', 2, 12, 15], ['lateralRaise', 3, 12, 20], ['inclineDbCurl', 2, 10, 15], ['overheadExtension', 2, 10, 15]] };
const lowerDb: LiftDay = { name: 'Lower', slots: [['gobletSquat', 3, 8, 12], ['dbRdl', 3, 8, 12], ['bulgarianSplitSquat', 2, 8, 12], ['hipThrust', 2, 10, 15], ['calfRaise', 3, 12, 20], ['plank', 2, 30, 60]] };

const fullBodyBw: LiftDay[] = [
  { name: 'Full body A', slots: [['bulgarianSplitSquat', 3, 8, 15], ['pushUp', 3, 8, 20], ['invertedRow', 3, 8, 15], ['pikePushUp', 2, 6, 12], ['gluteBridge', 2, 10, 20], ['plank', 2, 30, 60]] },
  { name: 'Full body B', slots: [['walkingLunge', 3, 10, 20], ['pullUp', 3, 3, 10], ['dip', 3, 6, 15], ['nordicCurl', 2, 3, 8], ['calfRaise', 3, 15, 25], ['hangingLegRaise', 2, 8, 15]] },
  { name: 'Full body C', slots: [['bulgarianSplitSquat', 3, 8, 15], ['pikePushUp', 3, 6, 12], ['invertedRow', 3, 8, 15], ['closeGripPushUp', 2, 8, 20], ['chinUp', 2, 3, 10], ['gluteBridge', 2, 10, 20]] },
];

const muscle = (name: string, setup: Equipment, perWeek: number, days: LiftDay[]): Program => ({
  name,
  about: 'Each muscle trained about twice a week with double progression: add reps until every set reaches the top of the range, then add load.',
  goal: 'muscle',
  level: 'any',
  setups: [setup],
  perWeek,
  days,
});

/** Sets, reps and reps in reserve for the main lift over a three-week wave. */
const WAVE: [number, number, number][] = [
  [3, 5, 3],
  [4, 4, 2],
  [5, 3, 1],
];
const strengthDays = WAVE.flatMap(([sets, reps, rir], w): LiftDay[] => {
  const main = (id: ExerciseId): Slot => [id, sets, reps, reps, rir];
  const week = `Week ${w + 1} · `;
  return [
    { name: `${week}Upper A`, slots: [main('benchPress'), ['barbellRow', 4, 6, 8], ['inclineDbPress', 3, 8, 12], ['pullUp', 3, 5, 10], ['facePull', 2, 12, 20]] },
    { name: `${week}Lower A`, slots: [main('backSquat'), ['romanianDeadlift', 3, 6, 8], ['legCurl', 3, 8, 12], ['calfRaise', 3, 8, 12], ['abWheel', 3, 6, 12]] },
    { name: `${week}Upper B`, slots: [main('ohp'), ['closeGripBench', 3, 5, 8], ['chinUp', 3, 5, 10], ['chestSupportedRow', 3, 8, 12], ['lateralRaise', 2, 12, 20]] },
    { name: `${week}Lower B`, slots: [main('deadlift'), ['frontSquat', 3, 5, 8], ['walkingLunge', 2, 8, 12], ['hangingLegRaise', 3, 8, 15]] },
  ];
});

const min = (m: number) => m * 60;
const walk5: RunStep = ['walk', min(5)];

/** Run/walk rounds for each of the nine weeks: rounds, seconds running, seconds walking. */
const FIRST_5K: [number, number, number][] = [
  [8, 60, 90],
  [6, 90, 120],
  [5, 120, 90],
  [4, 180, 90],
  [3, 300, 120],
  [2, 540, 120],
  [1, min(20), 0],
  [1, min(25), 0],
  [1, min(30), 0],
];
const first5k = FIRST_5K.flatMap(([reps, run, rest], w) =>
  [1, 2, 3].map((d): RunDay => ({ name: `Week ${w + 1} · Run ${d}`, warm: walk5, reps, set: rest ? [['run', run], ['walk', rest]] : [['run', run]], cool: walk5 })),
);

/** Per week: easy run minutes, rounds and set of the quality session, and long run minutes. */
const TEN_K: [number, number, RunStep[], number][] = [
  [25, 6, [['fast', 60], ['jog', 120]], 35],
  [25, 8, [['fast', 60], ['jog', 120]], 40],
  [30, 5, [['fast', 120], ['jog', 120]], 45],
  [30, 6, [['fast', 120], ['jog', 120]], 50],
  [35, 3, [['steady', min(5)], ['jog', 120]], 45],
  [35, 2, [['steady', min(8)], ['jog', 120]], 55],
  [30, 1, [['steady', min(20)]], 60],
  [25, 4, [['fast', 60], ['jog', 120]], 65],
];
const tenK = TEN_K.flatMap(([easy, reps, set, long], w): RunDay[] => {
  const week = `Week ${w + 1} · `;
  return [
    { name: `${week}Easy run`, warm: walk5, reps: 1, set: [['easy', min(easy)]], cool: walk5 },
    { name: `${week}${set[0][0] === 'fast' ? 'Intervals' : 'Tempo'}`, warm: ['easy', min(10)], reps, set, cool: ['jog', min(5)] },
    { name: `${week}${w === TEN_K.length - 1 ? '10K' : 'Long run'}`, warm: walk5, reps: 1, set: [['easy', min(long)]], cool: walk5 },
  ];
});

const ROUTINES: [string, Hold[]][] = [
  ['Hips and hamstrings', [['catCow', 60], ['downDog', 45], ['lowLunge', 45], ['halfSplit', 45], ['figureFour', 60], ['butterfly', 60], ['supineTwist', 45], ['savasana', 60]]],
  ['Spine and shoulders', [['childsPose', 60], ['catCow', 60], ['threadNeedle', 45], ['puppy', 45], ['sphinx', 45], ['downDog', 45], ['forwardFold', 60], ['supineTwist', 45], ['legsUpWall', 90]]],
  ['Balance and legs', [['catCow', 45], ['chair', 30], ['warrior2', 30], ['tree', 30], ['quadStretch', 30], ['wideFold', 45], ['downDog', 45], ['bridgePose', 30], ['happyBaby', 45], ['childsPose', 45], ['savasana', 75]]],
];
/** Holds lengthen each week, to the nearest 5 seconds. */
const yoga = [1, 1.25, 1.5, 1.75].flatMap((f, w) =>
  ROUTINES.map(([name, holds]): HoldDay => ({ name: `Week ${w + 1} · ${name}`, holds: holds.map(([p, s]): Hold => [p, Math.round((s * f) / 5) * 5]) })),
);

const cooldown50: Hold[] = [['calfStretch', 30], ['quadStretch', 30], ['chairHamstring', 30], ['doorwayChest', 30]];

export const PROGRAMS = {
  'muscle-gym-2': muscle('Full body, twice a week', 'gym', 2, fullBodyGym.slice(0, 2)),
  'muscle-gym-3': muscle('Full body', 'gym', 3, fullBodyGym),
  'muscle-gym-4': muscle('Upper / lower', 'gym', 4, [upperGym('Upper A', 'benchPress', 'barbellRow'), lowerGym('Lower A', 'backSquat', 'romanianDeadlift'), upperGym('Upper B', 'ohp', 'pullUp'), lowerGym('Lower B', 'legPress', 'deadlift')]),
  'muscle-gym-5': muscle('Upper / lower + push / pull / legs', 'gym', 5, [upperGym('Upper', 'benchPress', 'barbellRow'), lowerGym('Lower', 'backSquat', 'romanianDeadlift'), push, pull, legs]),
  'muscle-gym-6': muscle('Push / pull / legs, twice', 'gym', 6, [push, pull, legs, push, pull, legs]),
  'muscle-dumbbells-2': muscle('Full body, twice a week', 'dumbbells', 2, fullBodyDb.slice(0, 2)),
  'muscle-dumbbells-3': muscle('Full body', 'dumbbells', 3, fullBodyDb),
  'muscle-dumbbells-4': muscle('Upper / lower', 'dumbbells', 4, [upperDb, lowerDb, upperDb, lowerDb]),
  'muscle-bodyweight-2': muscle('Full body, twice a week', 'bodyweight', 2, fullBodyBw.slice(0, 2)),
  'muscle-bodyweight-3': muscle('Full body', 'bodyweight', 3, fullBodyBw),
  'glutes-home': {
    name: 'Glutes and full body at home',
    about: 'Three full-body sessions with extra glute work, using dumbbells, a bench and a mini band. The same double progression as every muscle plan here.',
    goal: 'muscle',
    level: 'any',
    setups: ['dumbbells', 'gym'],
    perWeek: 3,
    days: [
      { name: 'Glutes and full body A', slots: [['hipThrust', 3, 8, 12], ['gobletSquat', 3, 8, 12], ['dbBenchPress', 3, 8, 12], ['dbRow', 3, 8, 12], ['bandLateralWalk', 2, 12, 20], ['deadBug', 2, 8, 12]] },
      { name: 'Glutes and full body B', slots: [['dbRdl', 3, 8, 12], ['bulgarianSplitSquat', 3, 8, 12], ['dbShoulderPress', 3, 8, 12], ['chestSupportedRow', 3, 10, 15], ['gluteBridge', 2, 10, 15], ['sidePlank', 2, 20, 40]] },
      { name: 'Glutes and full body C', slots: [['reverseLunge', 3, 8, 12], ['singleLegRdl', 3, 8, 12], ['hipThrust', 3, 10, 15], ['pushUp', 3, 5, 15], ['lateralRaise', 2, 12, 20], ['plank', 2, 20, 40]] },
    ],
  },
  'strength-4': {
    name: 'Strength, upper / lower',
    about: 'Bench, squat, overhead press and deadlift in sets of 3-5 over a three-week wave. Loads come from your estimated max, so they rise as you get stronger; log reps in reserve honestly.',
    goal: 'strength',
    level: 'intermediate',
    setups: ['gym'],
    perWeek: 4,
    days: strengthDays,
  },
  'beginner-3': {
    name: 'Beginner full body',
    about: 'Two short sessions, alternated three times a week, that need nothing but a sturdy table or bar. Add reps each time; swap in harder moves as they get easy.',
    goal: 'health',
    level: 'beginner',
    setups: ['bodyweight', 'dumbbells', 'gym'],
    perWeek: 3,
    days: [
      { name: 'Beginner A', slots: [['bodyweightSquat', 3, 8, 15], ['inclinePushUp', 3, 6, 15], ['invertedRow', 3, 6, 12], ['bridge', 2, 10, 20], ['deadBug', 2, 6, 10]] },
      { name: 'Beginner B', slots: [['stepUp', 3, 8, 12], ['inclinePushUp', 3, 6, 15], ['invertedRow', 3, 6, 12], ['sidePlank', 2, 15, 30], ['birdDog', 2, 6, 10]] },
    ],
  },
  'over-50': {
    name: 'Strength and balance, 50+',
    about: 'Joint-friendly strength, balance and mobility, three days a week. Higher reps, two sets and small load steps keep progress steady; each session ends with gentle stretches.',
    goal: 'health',
    level: 'beginner',
    setups: ['dumbbells', 'gym'],
    perWeek: 3,
    days: [
      { name: '50+ A', cooldown: cooldown50, slots: [['gobletSquat', 2, 8, 12], ['dbBenchPress', 2, 8, 12], ['chestSupportedRow', 2, 10, 15], ['bridge', 2, 10, 15], ['singleLegStand', 2, 20, 40], ['farmersCarry', 2, 20, 40]] },
      { name: '50+ B', cooldown: cooldown50, slots: [['stepUp', 2, 8, 12], ['dbRdl', 2, 8, 12], ['inclinePushUp', 2, 8, 15], ['dbRow', 2, 10, 15], ['birdDog', 2, 6, 10], ['sidePlank', 2, 15, 30]] },
      { name: '50+ C', cooldown: cooldown50, slots: [['reverseLunge', 2, 8, 12], ['inclineDbPress', 2, 8, 12], ['bandRow', 2, 10, 15], ['calfRaise', 2, 10, 15], ['deadBug', 2, 6, 10], ['singleLegStand', 2, 20, 40]] },
    ],
  },
  'first-5k': {
    name: 'First 5K, run/walk',
    about: 'Nine weeks from walking to running 30 minutes without stopping, three runs a week. Repeat a week whenever it felt too hard; once finished, it keeps repeating week 9.',
    goal: 'running',
    level: 'beginner',
    setups: ['gym', 'dumbbells', 'bodyweight'],
    perWeek: 3,
    days: first5k,
    repeatFrom: first5k.length - 3,
  },
  '10k-builder': {
    name: '10K builder',
    about: 'Eight weeks from a comfortable 5K to 10K: an easy run, an interval or tempo session and a longer run each week, ending with the 10K.',
    goal: 'running',
    level: 'intermediate',
    setups: ['gym', 'dumbbells', 'bodyweight'],
    perWeek: 3,
    days: tenK,
    repeatFrom: tenK.length - 3,
  },
  yoga: {
    name: 'Yoga and mobility',
    about: 'Three 10-20 minute routines of held poses, for the hips, the spine and shoulders, and balance. The holds lengthen each week for four weeks.',
    goal: 'mobility',
    level: 'any',
    setups: ['gym', 'dumbbells', 'bodyweight'],
    perWeek: 3,
    days: yoga,
    repeatFrom: yoga.length - 3,
  },
} satisfies Record<string, Program>;
export type ProgramId = keyof typeof PROGRAMS;

/** The muscle program for the closest supported number of days at or below the one asked for. */
export function programFor(setup: Equipment, days: number): ProgramId {
  for (let d = Math.min(days, 6); d >= 2; d--) {
    const id = `muscle-${setup}-${d}`;
    if (id in PROGRAMS) return id as ProgramId;
  }
  throw new Error(`No program for ${setup}`);
}

/** The programs that fit where and how often someone trains. */
export const programsFor = (setup: Equipment, days: number) =>
  (Object.keys(PROGRAMS) as ProgramId[]).filter((id) => {
    const p: Program = PROGRAMS[id];
    return p.setups.includes(setup) && p.perWeek <= days;
  });

export const planOf = (id: ProgramId): Plan => {
  const p: Program = PROGRAMS[id];
  return { id, name: p.name, days: structuredClone(p.days), repeatFrom: p.repeatFrom };
};

/** Hard sets a week per muscle: a full set where it is a main mover, half where it assists. */
export function weeklySets(days: { slots: { exercise: ExerciseId; sets: number }[] }[]) {
  const out = {} as Record<Muscle, number>;
  for (const day of days)
    for (const { exercise, sets } of day.slots) {
      for (const m of EXERCISES[exercise].primary) out[m] = (out[m] ?? 0) + sets;
      for (const m of EXERCISES[exercise].secondary) out[m] = (out[m] ?? 0) + sets / 2;
    }
  return out;
}
