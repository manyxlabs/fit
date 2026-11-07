export const MUSCLES = {
  chest: 'Chest',
  lats: 'Lats',
  upperBack: 'Upper back',
  traps: 'Traps',
  lowerBack: 'Lower back',
  frontDelts: 'Front delts',
  sideDelts: 'Side delts',
  rearDelts: 'Rear delts',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  adductors: 'Adductors',
  calves: 'Calves',
  abs: 'Abs',
  obliques: 'Obliques',
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
  /** Holds log seconds as reps; conditioning moves are for fitness rather than a muscle, and swap among themselves. */
  kind?: 'hold' | 'conditioning';
};

const ex = (
  name: string,
  primary: Muscle[],
  secondary: Muscle[],
  setups: Equipment[],
  compound: boolean,
  step: number,
  cue: string,
  kind?: Exercise['kind'],
): Exercise => ({ name, primary, secondary, setups, compound, step, cue, ...(kind && { kind }) });

const G: Equipment[] = ['gym'];
const GD: Equipment[] = ['gym', 'dumbbells'];
const ALL: Equipment[] = ['gym', 'dumbbells', 'bodyweight'];

export const EXERCISES = {
  benchPress: ex('Barbell bench press', ['chest'], ['triceps', 'frontDelts'], G, true, 2.5, 'Shoulder blades pinned, bar to lower chest, feet driving.'),
  inclineBenchPress: ex('Incline barbell bench press', ['chest'], ['frontDelts', 'triceps'], G, true, 2.5, 'Bench at about 30 degrees, bar to the upper chest, shoulder blades pinned.'),
  inclineDbPress: ex('Incline dumbbell press', ['chest'], ['frontDelts', 'triceps'], GD, true, 2, 'Bench at 30 degrees, lower until a deep stretch, press up and slightly in.'),
  dbBenchPress: ex('Dumbbell bench press', ['chest'], ['triceps', 'frontDelts'], GD, true, 2, 'Elbows about 45 degrees from the body, full stretch at the bottom.'),
  machineChestPress: ex('Machine chest press', ['chest'], ['triceps', 'frontDelts'], G, true, 2.5, 'Seat so handles line up with mid chest, slow on the way back.'),
  cableFly: ex('Cable fly', ['chest'], [], G, false, 2.5, 'Soft elbows, hug a barrel, feel the stretch at the back.'),
  pecDeck: ex('Pec deck', ['chest'], [], G, false, 2.5, 'Handles at chest height, elbows slightly bent, squeeze the hands together in front.'),
  dbFly: ex('Dumbbell fly', ['chest'], [], GD, false, 1, 'Lower wide until a stretch, stop before the shoulders complain.'),
  pushUp: ex('Push-up', ['chest'], ['triceps', 'frontDelts'], ALL, true, 0, 'Body in one line, chest to the floor. Elevate the feet when 20 reps get easy.'),
  inclinePushUp: ex('Incline push-up', ['chest'], ['triceps', 'frontDelts'], ALL, true, 0, 'Hands on a bench, counter or wall, body in one line. Use a lower surface as it gets easy.'),
  dip: ex('Dip', ['chest', 'triceps'], ['frontDelts'], ['gym', 'bodyweight'], true, 2.5, 'Lean forward slightly, lower until upper arms are parallel to the floor.'),

  pullUp: ex('Pull-up', ['lats'], ['biceps', 'upperBack'], ['gym', 'bodyweight'], true, 2.5, 'Start from a dead hang, drive elbows to the ribs, chin over the bar.'),
  latPulldown: ex('Lat pulldown', ['lats'], ['biceps', 'upperBack'], G, true, 2.5, 'Lean back slightly, pull the bar to the upper chest, full stretch at the top.'),
  straightArmPulldown: ex('Straight-arm pulldown', ['lats'], [], G, false, 2.5, 'Arms almost straight, sweep the bar down to the thighs, ribs down.'),
  barbellRow: ex('Barbell row', ['upperBack', 'lats'], ['biceps', 'rearDelts', 'lowerBack'], G, true, 2.5, 'Hinge to about 45 degrees, pull to the belly, no jerking.'),
  tBarRow: ex('T-bar row', ['upperBack', 'lats'], ['biceps', 'rearDelts', 'lowerBack'], G, true, 2.5, 'Flat back at about 45 degrees, pull the handle to the lower chest.'),
  dbRow: ex('One-arm dumbbell row', ['lats', 'upperBack'], ['biceps'], GD, true, 2, 'Pull the elbow towards the hip, let the shoulder stretch forward at the bottom.'),
  chestSupportedRow: ex('Chest-supported dumbbell row', ['upperBack', 'lats'], ['rearDelts', 'biceps'], GD, true, 2, 'Chest on an incline bench, pull the elbows back past the ribs, chest stays on the pad.'),
  seatedCableRow: ex('Seated cable row', ['upperBack', 'lats'], ['biceps', 'rearDelts'], G, true, 2.5, 'Chest tall, squeeze the shoulder blades, reach forward under control.'),
  invertedRow: ex('Inverted row', ['upperBack', 'lats'], ['biceps', 'rearDelts'], ['gym', 'bodyweight'], true, 0, 'Under a table or low bar, body straight, chest to the edge.'),
  bandRow: ex('Band row', ['upperBack', 'lats'], ['biceps', 'rearDelts'], GD, true, 0, 'Band anchored at chest height, pull the hands to the ribs, squeeze the shoulder blades.'),
  shrug: ex('Dumbbell shrug', ['traps'], ['forearms'], GD, false, 2, 'Lift the shoulders straight up towards the ears, pause, lower slowly. No rolling.'),
  backExtension: ex('Back extension', ['lowerBack', 'glutes'], ['hamstrings'], G, false, 2.5, 'Pad just below the hip bones, lower with a flat back, rise until the body is straight.'),

  ohp: ex('Overhead press', ['frontDelts'], ['triceps', 'sideDelts'], G, true, 2.5, 'Glutes tight, bar path close to the face, lock out overhead.'),
  dbShoulderPress: ex('Seated dumbbell shoulder press', ['frontDelts'], ['triceps', 'sideDelts'], GD, true, 2, 'Lower to ear height, press without arching the back.'),
  arnoldPress: ex('Arnold press', ['frontDelts'], ['sideDelts', 'triceps'], GD, true, 2, 'Start with the palms facing you at chin height, turn them forward as you press.'),
  landminePress: ex('Landmine press', ['frontDelts', 'chest'], ['triceps'], G, true, 2.5, 'One end of the bar anchored, press up and forward from the shoulder, ribs down.'),
  pikePushUp: ex('Pike push-up', ['frontDelts'], ['triceps'], ALL, true, 0, 'Hips high, head goes forward of the hands. Elevate the feet to progress.'),
  lateralRaise: ex('Lateral raise', ['sideDelts'], [], GD, false, 1, 'Lead with the elbows, raise to shoulder height, slow down.'),
  cableLateralRaise: ex('Cable lateral raise', ['sideDelts'], [], G, false, 1.25, 'Cable from behind the body for tension at the bottom.'),
  leanAwayLateralRaise: ex('Lean-away lateral raise', ['sideDelts'], [], GD, false, 1, 'Hold a post and lean away, raise the dumbbell out to the side, slow on the way down.'),
  uprightRow: ex('Wide-grip upright row', ['sideDelts'], ['traps'], GD, true, 2, 'Hands wider than the shoulders, lead with the elbows, stop at lower-chest height.'),
  reverseFly: ex('Rear delt fly', ['rearDelts'], ['upperBack'], GD, false, 1, 'Chest on an incline bench, sweep the arms out, not back.'),
  facePull: ex('Face pull', ['rearDelts', 'upperBack'], [], G, false, 2.5, 'Rope to the forehead, elbows high, thumbs pointing back.'),
  bandPullApart: ex('Band pull-apart', ['rearDelts', 'upperBack'], [], GD, false, 0, 'Arms straight at shoulder height, pull the band apart to the chest, squeeze the shoulder blades.'),

  bbCurl: ex('Barbell curl', ['biceps'], [], G, false, 1.25, 'Elbows still at the sides, no swinging.'),
  inclineDbCurl: ex('Incline dumbbell curl', ['biceps'], [], GD, false, 1, 'Arms hang behind the body for a long stretch.'),
  hammerCurl: ex('Hammer curl', ['biceps'], ['forearms'], GD, false, 1, 'Thumbs up, curl across the body or straight up.'),
  preacherCurl: ex('Preacher curl', ['biceps'], [], G, false, 1.25, 'Armpits snug on the pad, lower until the arms are nearly straight, no bouncing.'),
  chinUp: ex('Chin-up', ['lats', 'biceps'], ['upperBack'], ['gym', 'bodyweight'], true, 2.5, 'Palms facing you, full hang to chest near the bar.'),
  pushdown: ex('Triceps pushdown', ['triceps'], [], G, false, 2.5, 'Elbows pinned, straighten fully, control the way up.'),
  overheadExtension: ex('Overhead triceps extension', ['triceps'], [], GD, false, 1, 'Elbows by the ears, lower deep behind the head.'),
  skullCrusher: ex('Skull crusher', ['triceps'], [], GD, false, 1.25, 'Upper arms tilted slightly back, lower the weight behind the head, elbows stay narrow.'),
  closeGripBench: ex('Close-grip bench press', ['triceps', 'chest'], ['frontDelts'], G, true, 2.5, 'Hands just inside shoulder width, elbows tucked, bar to the lower chest.'),
  closeGripPushUp: ex('Close-grip push-up', ['triceps'], ['chest'], ALL, true, 0, 'Hands under the shoulders, elbows brush the ribs.'),
  benchDip: ex('Bench dip', ['triceps'], ['chest', 'frontDelts'], ALL, true, 0, 'Hands on a bench behind you, lower until the upper arms are parallel to the floor, no deeper.'),

  backSquat: ex('Back squat', ['quads', 'glutes'], ['adductors', 'lowerBack', 'abs'], G, true, 2.5, 'Brace, sit between the heels, knees track over the toes, hit depth.'),
  frontSquat: ex('Front squat', ['quads', 'glutes'], ['upperBack', 'abs'], G, true, 2.5, 'Bar on the front of the shoulders, elbows high, sit straight down with a tall torso.'),
  hackSquat: ex('Hack squat', ['quads', 'glutes'], [], G, true, 5, 'Back flat on the pad, feet mid-platform, lower as deep as you can control.'),
  legPress: ex('Leg press', ['quads', 'glutes'], [], G, true, 5, 'Lower until the hips start to curl, never lock the knees hard.'),
  gobletSquat: ex('Goblet squat', ['quads', 'glutes'], ['abs'], GD, true, 2, 'Dumbbell at the chest, elbows inside the knees at the bottom.'),
  bodyweightSquat: ex('Bodyweight squat', ['quads', 'glutes'], [], ALL, true, 0, 'Feet about shoulder-width, arms forward, sit down between the heels with a flat back.'),
  sitToStand: ex('Sit to stand', ['quads', 'glutes'], [], ALL, true, 0, 'From a firm chair, lean forward, stand without using the hands, sit back down slowly.'),
  bulgarianSplitSquat: ex('Bulgarian split squat', ['quads', 'glutes'], [], ALL, true, 2, 'Rear foot on a bench, front knee travels forward, torso tall.'),
  reverseLunge: ex('Reverse lunge', ['quads', 'glutes'], ['adductors'], ALL, true, 2, 'Step back, lower the back knee towards the floor, push through the front foot to return.'),
  walkingLunge: ex('Walking lunge', ['quads', 'glutes'], [], ALL, true, 2, 'Long steps, back knee just above the floor.'),
  stepUp: ex('Step-up', ['quads', 'glutes'], [], ALL, true, 2, 'Whole foot on a knee-high step, drive through the front heel, no push from the back leg.'),
  legExtension: ex('Leg extension', ['quads'], [], G, false, 2.5, 'Pause at the top, slow on the way down.'),
  romanianDeadlift: ex('Romanian deadlift', ['hamstrings', 'glutes'], ['lowerBack', 'upperBack'], G, true, 2.5, 'Push the hips back, bar close to the legs, stop at a deep stretch.'),
  dbRdl: ex('Dumbbell Romanian deadlift', ['hamstrings', 'glutes'], ['lowerBack'], GD, true, 2, 'Soft knees, hips back, flat back throughout.'),
  singleLegRdl: ex('Single-leg Romanian deadlift', ['hamstrings', 'glutes'], [], ALL, true, 2, 'Hinge on one leg, the free leg reaches back in line with the torso. Hold a wall at first.'),
  goodMorning: ex('Good morning', ['hamstrings', 'glutes'], ['lowerBack'], G, true, 2.5, 'Bar on the upper back, soft knees, push the hips back until the hamstrings stop you.'),
  deadlift: ex('Deadlift', ['glutes', 'hamstrings'], ['quads', 'lowerBack', 'upperBack', 'traps', 'forearms'], G, true, 5, 'Bar over mid-foot, brace, push the floor away, lock out with the glutes.'),
  legCurl: ex('Seated leg curl', ['hamstrings'], [], G, false, 2.5, 'Lean forward for a deeper stretch, squeeze at the bottom.'),
  lyingLegCurl: ex('Lying leg curl', ['hamstrings'], ['calves'], G, false, 2.5, 'Hips pressed into the pad, curl the heels towards the glutes, lower slowly.'),
  nordicCurl: ex('Nordic curl', ['hamstrings'], [], ['bodyweight', 'dumbbells'], false, 0, 'Feet anchored, lower as slowly as you can, push back up with the hands.'),
  hipThrust: ex('Hip thrust', ['glutes'], ['hamstrings'], GD, true, 2.5, 'Upper back on a bench, chin tucked, pause with the hips fully extended.'),
  bridge: ex('Glute bridge', ['glutes'], ['hamstrings'], ALL, false, 2.5, 'Feet flat near the hips, push through the heels until the body is straight from knees to shoulders.'),
  gluteBridge: ex('Single-leg glute bridge', ['glutes'], ['hamstrings'], ALL, false, 0, 'Drive through the heel, keep the pelvis level.'),
  hipAbduction: ex('Hip abduction machine', ['glutes'], [], G, false, 2.5, 'Sit tall, push the knees out, pause, return slowly.'),
  bandLateralWalk: ex('Banded lateral walk', ['glutes'], [], GD, false, 0, 'Band above the knees, quarter squat, step sideways without letting the band go slack. Count steps each way.'),
  hipAdduction: ex('Hip adduction machine', ['adductors'], [], G, false, 2.5, 'Start at a comfortable stretch, squeeze the knees together, return slowly.'),
  calfRaise: ex('Standing calf raise', ['calves'], [], ALL, false, 2.5, 'Full stretch at the bottom, pause, then all the way up.'),
  seatedCalfRaise: ex('Seated calf raise', ['calves'], [], GD, false, 2.5, 'Knees bent at 90 degrees, full stretch at the bottom, pause at the top.'),
  singleLegStand: ex('Single-leg stand', ['glutes'], ['calves', 'abs'], ALL, false, 0, 'Stand on one leg beside a counter, hips level, fingertip support only if needed. Seconds each side.', 'hold'),

  cableCrunch: ex('Cable crunch', ['abs'], [], G, false, 2.5, 'Curl the ribs to the pelvis, hips stay still.'),
  crunch: ex('Crunch', ['abs'], [], ALL, false, 0, 'Knees bent, curl the ribs towards the pelvis until the shoulder blades lift, lower slowly.'),
  hangingLegRaise: ex('Hanging leg raise', ['abs'], ['forearms'], ['gym', 'bodyweight'], false, 0, 'Tilt the pelvis up at the top, no swinging.'),
  abWheel: ex('Ab wheel rollout', ['abs'], ['lats'], GD, false, 0, 'From the knees, roll out with the ribs down, only as far as the lower back stays flat.'),
  deadBug: ex('Dead bug', ['abs'], [], ALL, false, 0, 'Lower back flat on the floor, lower the opposite arm and leg slowly, breathe out as you reach.'),
  birdDog: ex('Bird dog', ['abs', 'lowerBack'], ['glutes'], ALL, false, 0, 'On all fours, reach the opposite arm and leg out long, hips level, pause, return.'),
  plank: ex('Plank', ['abs'], [], ALL, false, 0, 'Squeeze glutes and abs, ribs down. Count seconds as reps.', 'hold'),
  hollowHold: ex('Hollow body hold', ['abs'], [], ALL, false, 0, 'Lower back pressed into the floor, arms and legs only as low as you can keep it there.', 'hold'),
  sidePlank: ex('Side plank', ['obliques'], ['abs', 'glutes'], ALL, false, 0, 'Elbow under the shoulder, body in one line, hips high. Seconds each side.', 'hold'),
  pallofPress: ex('Pallof press', ['obliques', 'abs'], [], G, false, 2.5, 'Side-on to a cable at chest height, press the handle straight out and resist the twist.'),
  farmersCarry: ex("Farmer's carry", ['forearms', 'traps'], ['abs', 'obliques'], GD, false, 2, 'Heavy dumbbells at the sides, stand tall, short steady steps. Count seconds as reps.', 'hold'),

  burpee: ex('Burpee', ['quads', 'chest'], ['glutes', 'frontDelts', 'triceps', 'abs'], ALL, false, 0, 'Squat, hands down, step or jump the feet back, feet back in, stand or jump up.', 'conditioning'),
  mountainClimber: ex('Mountain climber', ['abs'], ['frontDelts', 'quads'], ALL, false, 0, 'From a high plank, drive the knees towards the chest one at a time, hips level.', 'conditioning'),
  jumpingJack: ex('Jumping jack', ['calves'], ['glutes', 'sideDelts'], ALL, false, 0, 'Jump the feet wide as the arms rise overhead, land softly on the balls of the feet.', 'conditioning'),
} satisfies Record<string, Exercise>;
export type ExerciseId = keyof typeof EXERCISES;

/**
 * Others that train the same main muscle in the same setup and log the same way, for swapping
 * one out. Conditioning moves train fitness rather than a muscle, so any of them swaps for another.
 */
export function alternatives(id: ExerciseId, setup: Equipment) {
  const a: Exercise = EXERCISES[id];
  return (Object.keys(EXERCISES) as ExerciseId[]).filter((o) => {
    const b: Exercise = EXERCISES[o];
    return o !== id && b.kind === a.kind && (a.kind === 'conditioning' || b.primary[0] === a.primary[0]) && b.setups.includes(setup);
  });
}

export const exerciseSlug = (id: ExerciseId) =>
  EXERCISES[id].name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
