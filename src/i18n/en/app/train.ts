// The train area's copy (src/app/Train.tsx, Timer.tsx); see ../app.ts.
import type { RunStep } from '../../../data/programs';

export default {
  title: 'Training',
  deload: {
    title: 'Time for an easy week',
    /** Why an easy (deload) week is due; # is a number of weeks, at least 6. */
    weeks: { other: 'It has been # weeks since your last easy week.' },
    /** # is the number of main lifts tracked, at least 2; {stalled} how many of them stopped improving. */
    stalled: { other: '{stalled} of your # main lifts have stalled for three sessions.' },
    how: 'Do the same exercises and loads with about 40% fewer sets for one week, then progress again.',
    start: 'Start an easy week',
    on: 'Easy week: about 40% fewer sets, same loads.',
  },
  /** {day} is the next program day, such as "Week 3 · Upper B". */
  next: 'Next: {day}',
  start: { workout: 'Start workout', run: 'Start run', routine: 'Start routine', anyway: 'Start anyway' },
  otherDay: 'Train a different day',
  anotherDay: 'Another day…',
  recent: {
    title: 'Recent workouts',
    sets: { one: '# set', other: '# sets' },
    empty: 'Your finished workouts show here.',
  },
  session: {
    /** The rest timer between sets; {time} is minutes and seconds, such as "2:30", drawn bold. */
    rest: 'Rest <b>{time}</b>',
    skip: 'Skip',
    howTo: 'How to',
    /**
     * The next set to do. {amount} is reps or seconds, or a load and reps such as "60 kg × 8 reps";
     * {sets} is a number of sets; {rir} how many reps to leave in reserve.
     */
    target: 'Target: {amount}, {sets}, {rir}.',
    /** The same for an exercise held for time, such as a plank. */
    targetHold: 'Target: {amount}, {sets}.',
    /** {kg} is a load, {reps} reps or seconds. */
    load: '{kg} kg × {reps}',
    reps: { one: '# rep', other: '# reps' },
    seconds: { one: '# second', other: '# seconds' },
    sets: { one: '# set', other: '# sets' },
    rir: { one: '# rep in reserve', other: '# reps in reserve' },
    finish: 'Finish workout',
    discard: 'Discard',
    discardConfirm: 'Discard this workout?',
  },
  /** Why the target is what it is, after the target line. */
  notes: {
    pickLoad: 'Pick a load you can lift for the bottom of the range with 2-3 reps to spare.',
    startLow: 'Start at the bottom of the range, with some left in the tank.',
    harder: 'Every set reached the top of the range. Move to a harder variation or slow the lowering to 4 seconds.',
    /** {high} is the top of the rep range, {step} the smallest load that can be added. */
    addLoad: 'Every set reached {high}. Add {step} kg.',
    sameLoad: { other: 'Same load, aim for #+ reps on each set.' },
    aim: { other: 'Aim for #+ reps on each set.' },
    /** {reps} is the reps of the set to work up to; # the reps to leave in reserve. */
    workUp: { one: 'Work up in small jumps to a set of {reps} with # rep to spare.', other: 'Work up in small jumps to a set of {reps} with # reps to spare.' },
    /** {percent} of the person's estimated one-rep max, which is {max} kg. */
    ofMax: 'About {percent}% of your estimated max of {max} kg.',
  },
  sets: {
    /** A logged set: {n} is the set's number, {kg} the load, {reps} the reps, {rir} the reps left in reserve. */
    logged: '{n}. {kg} kg × {reps}, {rir} in reserve',
    /** The same for a hold, with {reps} in seconds. */
    loggedHold: '{n}. {kg} kg × {reps} s, {rir} in reserve',
    remove: 'Remove set {n}',
    reps: 'Reps',
    seconds: 'Seconds',
    rir: 'Reps in reserve',
    /** An option in the reps-in-reserve list; RIR is short for reps in reserve. */
    rirOption: '{n} RIR',
    log: 'Log',
  },
  program: {
    /** {name} is the program's name. */
    title: 'Your program: {name}',
    days: 'Days and exercises',
    weeks: 'Weeks and sessions',
    /** {exercise} is an exercise's English name. */
    swap: 'Swap {exercise}',
    perMuscle: 'Hard sets a week per muscle',
    perMuscleHint: 'Beginners grow on about 6-10 a muscle, intermediates on 10-16. Assisting muscles count half.',
  },
  cooldown: {
    title: 'Mobility cool-down',
    /** {min} is the cool-down's length in minutes. */
    start: 'Start the cool-down, {min} min',
  },
  timed: {
    run: 'Run',
    routine: 'Routine',
    finishEarly: 'Finish early',
    discard: 'Discard',
    discardConfirm: 'Discard this session?',
  },
  log: {
    title: 'Log it',
    distance: 'Distance (km)',
    minutes: 'Minutes',
    seconds: 'Seconds',
    /** {pace} is minutes and seconds, such as "6:30". */
    pace: 'Pace {pace} per km',
    saveRun: 'Save run',
    saveSession: 'Save session',
  },
  cardio: {
    title: 'Cardio and sport today',
    /** <b> is the heart-rate range, drawn bold; <m> is drawn muted. {hr} is the resting heart rate in bpm. */
    zone2: 'Easy pace (zone 2): <b>{from}-{to} bpm</b><m>, from your resting heart rate of {hr}.</m>',
    /** The same without a resting heart rate; {more} is the name of the More tab. */
    zone2Age: 'Easy pace (zone 2): <b>{from}-{to} bpm</b><m>, from your age; import a resting heart rate in {more} to fit it to you.</m>',
    /** An activity logged today: its name and minutes. */
    activity: '{name}, {min} min',
    /** The same with a distance in km and a pace in minutes and seconds per km. */
    activityKm: '{name}, {min} min, {km} km at {pace} per km',
    activityLabel: 'Activity',
    minutes: 'Minutes',
    add: 'Add',
  },
  timer: {
    /** Before each pose; {pose} is the pose, or the pose and a side. */
    getReady: 'Get ready: {pose}',
    left: '{pose}, left',
    right: '{pose}, right',
    done: 'Done',
    /** For screen readers, on the countdown; {step} is the current step. */
    timeLeft: '{step}, time left',
    next: 'Next: {step}',
    /** The progress bar of the whole session, in minutes. */
    session: 'Session',
    pause: 'Pause',
    resume: 'Resume',
    skip: 'Skip',
    /** How long a pose is held; {s} is seconds. */
    hold: '{s} s',
    holdEachSide: '{s} s each side',
  },
  /** A run, summed up on one line, for example "5:00 walk, 8 × (1:00 run, 1:30 walk), 5:00 walk, 30 min". */
  runSummary: {
    /** {warm} and {cool} are the warm-up and cool-down steps, {main} the repeated part, {min} the total minutes. */
    all: '{warm}, {main}, {cool}, {min} min',
    /** {reps} rounds of {set}, where {set} is one step. */
    repeat: '{reps} × {set}',
    /** {reps} rounds of {set}, where {set} is several steps. */
    repeatGroup: '{reps} × ({set})',
    /** One step of a run inside the summary line; {time} is minutes and seconds, such as "1:30". */
    step: { walk: '{time} walk', run: '{time} run', easy: '{time} easy run', steady: '{time} steady run', fast: '{time} fast', jog: '{time} jog' } satisfies Record<RunStep[0], string>,
  },
};
