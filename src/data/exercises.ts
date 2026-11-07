export const MUSCLES = {
  chest: 'Chest',
  lats: 'Lats',
  upperBack: 'Upper back',
  frontDelts: 'Front delts',
  sideDelts: 'Side delts',
  rearDelts: 'Rear delts',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  abs: 'Abs',
} as const;
export type Muscle = keyof typeof MUSCLES;

export const EQUIPMENT = {
  gym: 'Full gym',
  dumbbells: 'Dumbbells and a bench',
  bodyweight: 'Bodyweight only',
} as const;
export type Equipment = keyof typeof EQUIPMENT;

export type Exercise = {
  name: string;
  /** Counted as a full hard set for these. */
  primary: Muscle[];
  /** Counted as half a set for these. */
  secondary: Muscle[];
  /** The setups it can be done in. */
  setups: Equipment[];
  compound: boolean;
  /** kg added when every set reaches the top of its rep range; 0 for bodyweight moves, which add reps. */
  step: number;
  cue: string;
};

const ex = (
  name: string,
  primary: Muscle[],
  secondary: Muscle[],
  setups: Equipment[],
  compound: boolean,
  step: number,
  cue: string,
): Exercise => ({ name, primary, secondary, setups, compound, step, cue });

const G: Equipment[] = ['gym'];
const GD: Equipment[] = ['gym', 'dumbbells'];
const ALL: Equipment[] = ['gym', 'dumbbells', 'bodyweight'];

export const EXERCISES = {
  benchPress: ex('Barbell bench press', ['chest'], ['triceps', 'frontDelts'], G, true, 2.5, 'Shoulder blades pinned, bar to lower chest, feet driving.'),
  inclineDbPress: ex('Incline dumbbell press', ['chest'], ['frontDelts', 'triceps'], GD, true, 2, 'Bench at 30 degrees, lower until a deep stretch, press up and slightly in.'),
  dbBenchPress: ex('Dumbbell bench press', ['chest'], ['triceps', 'frontDelts'], GD, true, 2, 'Elbows about 45 degrees from the body, full stretch at the bottom.'),
  machineChestPress: ex('Machine chest press', ['chest'], ['triceps', 'frontDelts'], G, true, 2.5, 'Seat so handles line up with mid chest, slow on the way back.'),
  cableFly: ex('Cable fly', ['chest'], [], G, false, 2.5, 'Soft elbows, hug a barrel, feel the stretch at the back.'),
  dbFly: ex('Dumbbell fly', ['chest'], [], GD, false, 1, 'Lower wide until a stretch, stop before the shoulders complain.'),
  pushUp: ex('Push-up', ['chest'], ['triceps', 'frontDelts'], ALL, true, 0, 'Body in one line, chest to the floor. Elevate the feet when 20 reps get easy.'),
  dip: ex('Dip', ['chest', 'triceps'], ['frontDelts'], ['gym', 'bodyweight'], true, 2.5, 'Lean forward slightly, lower until upper arms are parallel to the floor.'),

  pullUp: ex('Pull-up', ['lats'], ['biceps', 'upperBack'], ['gym', 'bodyweight'], true, 2.5, 'Start from a dead hang, drive elbows to the ribs, chin over the bar.'),
  latPulldown: ex('Lat pulldown', ['lats'], ['biceps', 'upperBack'], G, true, 2.5, 'Lean back slightly, pull the bar to the upper chest, full stretch at the top.'),
  barbellRow: ex('Barbell row', ['upperBack', 'lats'], ['biceps', 'rearDelts'], G, true, 2.5, 'Hinge to about 45 degrees, pull to the belly, no jerking.'),
  dbRow: ex('One-arm dumbbell row', ['lats', 'upperBack'], ['biceps'], GD, true, 2, 'Pull the elbow towards the hip, let the shoulder stretch forward at the bottom.'),
  seatedCableRow: ex('Seated cable row', ['upperBack', 'lats'], ['biceps', 'rearDelts'], G, true, 2.5, 'Chest tall, squeeze the shoulder blades, reach forward under control.'),
  invertedRow: ex('Inverted row', ['upperBack', 'lats'], ['biceps', 'rearDelts'], ['gym', 'bodyweight'], true, 0, 'Under a table or low bar, body straight, chest to the edge.'),

  ohp: ex('Overhead press', ['frontDelts'], ['triceps', 'sideDelts'], G, true, 2.5, 'Glutes tight, bar path close to the face, lock out overhead.'),
  dbShoulderPress: ex('Seated dumbbell shoulder press', ['frontDelts'], ['triceps', 'sideDelts'], GD, true, 2, 'Lower to ear height, press without arching the back.'),
  pikePushUp: ex('Pike push-up', ['frontDelts'], ['triceps'], ALL, true, 0, 'Hips high, head goes forward of the hands. Elevate the feet to progress.'),
  lateralRaise: ex('Lateral raise', ['sideDelts'], [], GD, false, 1, 'Lead with the elbows, raise to shoulder height, slow down.'),
  cableLateralRaise: ex('Cable lateral raise', ['sideDelts'], [], G, false, 1.25, 'Cable from behind the body for tension at the bottom.'),
  reverseFly: ex('Rear delt fly', ['rearDelts'], ['upperBack'], GD, false, 1, 'Chest on an incline bench, sweep the arms out, not back.'),
  facePull: ex('Face pull', ['rearDelts', 'upperBack'], [], G, false, 2.5, 'Rope to the forehead, elbows high, thumbs pointing back.'),

  bbCurl: ex('Barbell curl', ['biceps'], [], G, false, 1.25, 'Elbows still at the sides, no swinging.'),
  inclineDbCurl: ex('Incline dumbbell curl', ['biceps'], [], GD, false, 1, 'Arms hang behind the body for a long stretch.'),
  hammerCurl: ex('Hammer curl', ['biceps'], [], GD, false, 1, 'Thumbs up, curl across the body or straight up.'),
  chinUp: ex('Chin-up', ['lats', 'biceps'], ['upperBack'], ['gym', 'bodyweight'], true, 2.5, 'Palms facing you, full hang to chest near the bar.'),
  pushdown: ex('Triceps pushdown', ['triceps'], [], G, false, 2.5, 'Elbows pinned, straighten fully, control the way up.'),
  overheadExtension: ex('Overhead triceps extension', ['triceps'], [], GD, false, 1, 'Elbows by the ears, lower deep behind the head.'),
  closeGripPushUp: ex('Close-grip push-up', ['triceps'], ['chest'], ALL, true, 0, 'Hands under the shoulders, elbows brush the ribs.'),

  backSquat: ex('Back squat', ['quads', 'glutes'], ['abs'], G, true, 2.5, 'Brace, sit between the heels, knees track over the toes, hit depth.'),
  legPress: ex('Leg press', ['quads', 'glutes'], [], G, true, 5, 'Lower until the hips start to curl, never lock the knees hard.'),
  gobletSquat: ex('Goblet squat', ['quads', 'glutes'], ['abs'], GD, true, 2, 'Dumbbell at the chest, elbows inside the knees at the bottom.'),
  bulgarianSplitSquat: ex('Bulgarian split squat', ['quads', 'glutes'], [], ALL, true, 2, 'Rear foot on a bench, front knee travels forward, torso tall.'),
  legExtension: ex('Leg extension', ['quads'], [], G, false, 2.5, 'Pause at the top, slow on the way down.'),
  romanianDeadlift: ex('Romanian deadlift', ['hamstrings', 'glutes'], ['upperBack'], G, true, 2.5, 'Push the hips back, bar close to the legs, stop at a deep stretch.'),
  dbRdl: ex('Dumbbell Romanian deadlift', ['hamstrings', 'glutes'], [], GD, true, 2, 'Soft knees, hips back, flat back throughout.'),
  deadlift: ex('Deadlift', ['glutes', 'hamstrings'], ['upperBack', 'quads'], G, true, 5, 'Bar over mid-foot, brace, push the floor away, lock out with the glutes.'),
  legCurl: ex('Seated leg curl', ['hamstrings'], [], G, false, 2.5, 'Lean forward for a deeper stretch, squeeze at the bottom.'),
  nordicCurl: ex('Nordic curl', ['hamstrings'], [], ['bodyweight', 'dumbbells'], false, 0, 'Feet anchored, lower as slowly as you can, push back up with the hands.'),
  hipThrust: ex('Hip thrust', ['glutes'], ['hamstrings'], GD, true, 2.5, 'Upper back on a bench, chin tucked, pause with the hips fully extended.'),
  gluteBridge: ex('Single-leg glute bridge', ['glutes'], ['hamstrings'], ALL, false, 0, 'Drive through the heel, keep the pelvis level.'),
  walkingLunge: ex('Walking lunge', ['quads', 'glutes'], [], ALL, true, 2, 'Long steps, back knee just above the floor.'),
  calfRaise: ex('Standing calf raise', ['calves'], [], ALL, false, 2.5, 'Full stretch at the bottom, pause, then all the way up.'),

  cableCrunch: ex('Cable crunch', ['abs'], [], G, false, 2.5, 'Curl the ribs to the pelvis, hips stay still.'),
  hangingLegRaise: ex('Hanging leg raise', ['abs'], [], ['gym', 'bodyweight'], false, 0, 'Tilt the pelvis up at the top, no swinging.'),
  plank: ex('Plank', ['abs'], [], ALL, false, 0, 'Squeeze glutes and abs, ribs down. Count seconds as reps.'),
} satisfies Record<string, Exercise>;
export type ExerciseId = keyof typeof EXERCISES;

/** Others that train the same main muscle in the same setup, for swapping one out. */
export function alternatives(id: ExerciseId, setup: Equipment) {
  const main = EXERCISES[id].primary[0];
  return (Object.keys(EXERCISES) as ExerciseId[]).filter(
    (o) => o !== id && EXERCISES[o].primary[0] === main && (EXERCISES[o].setups as Equipment[]).includes(setup),
  );
}
