import { EXERCISES, type Equipment, type ExerciseId, type Muscle } from './exercises';

/** Exercise, sets, bottom and top of the rep range. */
export type Slot = [ExerciseId, number, number, number];
export type Day = { name: string; slots: Slot[] };
export type Program = { name: string; days: Day[] };

const fullBodyGym: Day[] = [
  { name: 'Full body A', slots: [['backSquat', 3, 5, 8], ['benchPress', 3, 6, 10], ['seatedCableRow', 3, 8, 12], ['lateralRaise', 2, 12, 20], ['legCurl', 2, 10, 15], ['inclineDbCurl', 2, 10, 15]] },
  { name: 'Full body B', slots: [['romanianDeadlift', 3, 6, 10], ['ohp', 3, 6, 10], ['latPulldown', 3, 8, 12], ['legPress', 2, 10, 15], ['cableFly', 2, 12, 15], ['pushdown', 2, 10, 15]] },
  { name: 'Full body C', slots: [['bulgarianSplitSquat', 3, 8, 12], ['inclineDbPress', 3, 8, 12], ['pullUp', 3, 5, 10], ['hipThrust', 2, 8, 12], ['facePull', 2, 12, 20], ['calfRaise', 3, 10, 15]] },
];

const upperGym = (n: string, press: ExerciseId, pull: ExerciseId): Day => ({
  name: n,
  slots: [[press, 3, 6, 10], [pull, 3, 6, 10], ['inclineDbPress', 3, 8, 12], ['latPulldown', 3, 8, 12], ['lateralRaise', 3, 12, 20], ['inclineDbCurl', 2, 10, 15], ['overheadExtension', 2, 10, 15]],
});
const lowerGym = (n: string, main: ExerciseId, hinge: ExerciseId): Day => ({
  name: n,
  slots: [[main, 3, 5, 8], [hinge, 3, 6, 10], ['legExtension', 2, 10, 15], ['legCurl', 3, 10, 15], ['calfRaise', 3, 10, 15], ['cableCrunch', 2, 10, 15]],
});

const push: Day = { name: 'Push', slots: [['benchPress', 3, 6, 10], ['dbShoulderPress', 3, 8, 12], ['cableFly', 3, 12, 15], ['lateralRaise', 3, 12, 20], ['pushdown', 3, 10, 15]] };
const pull: Day = { name: 'Pull', slots: [['pullUp', 3, 5, 10], ['barbellRow', 3, 6, 10], ['seatedCableRow', 2, 10, 12], ['facePull', 3, 12, 20], ['inclineDbCurl', 3, 10, 15], ['hammerCurl', 2, 10, 15]] };
const legs: Day = { name: 'Legs', slots: [['backSquat', 3, 5, 8], ['romanianDeadlift', 3, 6, 10], ['legPress', 2, 10, 15], ['legCurl', 3, 10, 15], ['calfRaise', 3, 10, 15], ['hangingLegRaise', 2, 8, 15]] };

const fullBodyDb: Day[] = [
  { name: 'Full body A', slots: [['gobletSquat', 3, 8, 12], ['dbBenchPress', 3, 8, 12], ['dbRow', 3, 8, 12], ['lateralRaise', 2, 12, 20], ['dbRdl', 2, 8, 12], ['hammerCurl', 2, 10, 15]] },
  { name: 'Full body B', slots: [['bulgarianSplitSquat', 3, 8, 12], ['dbShoulderPress', 3, 8, 12], ['pushUp', 3, 8, 20], ['dbRow', 3, 8, 12], ['hipThrust', 2, 10, 15], ['overheadExtension', 2, 10, 15]] },
  { name: 'Full body C', slots: [['dbRdl', 3, 8, 12], ['inclineDbPress', 3, 8, 12], ['reverseFly', 3, 12, 20], ['walkingLunge', 2, 10, 15], ['inclineDbCurl', 2, 10, 15], ['calfRaise', 3, 12, 20]] },
];
const upperDb: Day = { name: 'Upper', slots: [['dbBenchPress', 3, 8, 12], ['dbRow', 3, 8, 12], ['dbShoulderPress', 3, 8, 12], ['dbFly', 2, 12, 15], ['lateralRaise', 3, 12, 20], ['inclineDbCurl', 2, 10, 15], ['overheadExtension', 2, 10, 15]] };
const lowerDb: Day = { name: 'Lower', slots: [['gobletSquat', 3, 8, 12], ['dbRdl', 3, 8, 12], ['bulgarianSplitSquat', 2, 8, 12], ['hipThrust', 2, 10, 15], ['calfRaise', 3, 12, 20], ['plank', 2, 30, 60]] };

const fullBodyBw: Day[] = [
  { name: 'Full body A', slots: [['bulgarianSplitSquat', 3, 8, 15], ['pushUp', 3, 8, 20], ['invertedRow', 3, 8, 15], ['pikePushUp', 2, 6, 12], ['gluteBridge', 2, 10, 20], ['plank', 2, 30, 60]] },
  { name: 'Full body B', slots: [['walkingLunge', 3, 10, 20], ['pullUp', 3, 3, 10], ['dip', 3, 6, 15], ['nordicCurl', 2, 3, 8], ['calfRaise', 3, 15, 25], ['hangingLegRaise', 2, 8, 15]] },
  { name: 'Full body C', slots: [['bulgarianSplitSquat', 3, 8, 15], ['pikePushUp', 3, 6, 12], ['invertedRow', 3, 8, 15], ['closeGripPushUp', 2, 8, 20], ['chinUp', 2, 3, 10], ['gluteBridge', 2, 10, 20]] },
];

export const PROGRAMS: Record<Equipment, Partial<Record<2 | 3 | 4 | 5 | 6, Program>>> = {
  gym: {
    2: { name: 'Full body, twice a week', days: fullBodyGym.slice(0, 2) },
    3: { name: 'Full body', days: fullBodyGym },
    4: { name: 'Upper / lower', days: [upperGym('Upper A', 'benchPress', 'barbellRow'), lowerGym('Lower A', 'backSquat', 'romanianDeadlift'), upperGym('Upper B', 'ohp', 'pullUp'), lowerGym('Lower B', 'legPress', 'deadlift')] },
    5: { name: 'Upper / lower + push / pull / legs', days: [upperGym('Upper', 'benchPress', 'barbellRow'), lowerGym('Lower', 'backSquat', 'romanianDeadlift'), push, pull, legs] },
    6: { name: 'Push / pull / legs, twice', days: [push, pull, legs, push, pull, legs] },
  },
  dumbbells: {
    2: { name: 'Full body, twice a week', days: fullBodyDb.slice(0, 2) },
    3: { name: 'Full body', days: fullBodyDb },
    4: { name: 'Upper / lower', days: [upperDb, lowerDb, upperDb, lowerDb] },
  },
  bodyweight: {
    2: { name: 'Full body, twice a week', days: fullBodyBw.slice(0, 2) },
    3: { name: 'Full body', days: fullBodyBw },
  },
};

/** The program for the closest supported number of days at or below the one asked for. */
export function programFor(setup: Equipment, days: number) {
  const options = PROGRAMS[setup];
  for (let d = Math.min(days, 6); d >= 2; d--) {
    const p = options[d as 2 | 3 | 4 | 5 | 6];
    if (p) return p;
  }
  return options[2]!;
}

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
