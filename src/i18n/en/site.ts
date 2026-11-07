import type { Widen } from '../shape';
// The public pages' copy, and the shape every other language's site.ts must match key for key.
// {name} is filled in by fill(); <tag>...</tag> marks words drawn as an element (see html.ts).

const site = {
  language: 'Language',
  /** Shown beside a link to a page that exists only in English. */
  inEnglish: 'English',

  header: {
    home: 'Fit home',
    nav: 'Main',
    calculators: 'Calculators',
    guides: 'Guides',
    openApp: 'Open app',
    theme: 'Switch theme',
    toLight: 'Switch to light theme',
    toDark: 'Switch to dark theme',
  },

  footer: {
    disclaimer: 'General fitness information and estimates, not medical advice. See a doctor before starting if you have a medical condition, are pregnant, or are under 18.',
    place: 'Bengaluru',
    nav: 'Elsewhere',
    exercises: 'Exercises',
    privacy: 'Privacy',
    source: 'Source',
    issue: 'Report an issue',
    email: 'Email',
  },

  home: {
    title: 'Free fitness tracker for calories, diet and training',
    description: 'Calories, macros, Indian veg and non-veg food, workouts, recovery and supplements in one free app. No account, no ads, and only you can read your data.',
    heading: 'Everything for your fitness, in one free app',
    lede: 'Calories, Indian veg and non-veg food, training, recovery, supplements and progress. It plans each day and adjusts as you go. No account, no ads, and only you can ever read your data.',
    start: 'Start free',
    tryCalculator: 'Try a calculator',
    features: [
      ['Calories and macros', 'Targets from your body and goal, then measured from your own logs after a few weeks, so they fit you rather than a formula.'],
      ['Indian food, veg and non-veg', 'Roti, dal, paneer, idli, chicken curry and more, in katoris, rotis and pieces, not just grams.'],
      ['Training that progresses', 'A program for the gym, dumbbells at home or bodyweight, with the next weight and reps worked out every session.'],
      ['Recovery that adjusts', 'Slept badly or caught a cold? Today’s session shrinks, or becomes rest, by the same rules coaches use.'],
      ['Supplements, honestly', 'What works for your diet and goal, what to test for first, and what is a waste of money.'],
      ['Progress you can trust', 'Weight trend, body measurements, body fat, strength and a weekly review with one thing to change.'],
    ] as [string, string][],
    calculators: 'Calculators',
    guides: 'Guides',
    exercises: 'Exercise guides',
    allExercises: 'All {count} exercises',
  },

  calculators: {
    title: 'Free fitness calculators',
    description: 'BMI, TDEE, macros, protein, body fat, one-rep max, heart-rate zones, water and calories burned, free and private.',
    heading: 'Fitness calculators',
    lede: 'Free, instant and private: everything is worked out in your browser.',
    crumb: 'Calculators',
    how: 'How it works',
    readMore: 'Read more:',
    ctaHeading: 'Track it every day, free',
    cta: 'The Fit app turns these numbers into a daily plan for food, training and recovery, and adjusts them as you go. No account, and only you can read your data.',
    openApp: 'Open the app',
    others: 'Other calculators',
  },

  guides: {
    title: 'Fitness guides',
    description: 'Plain guides to building muscle, losing fat, Indian diets for fitness, supplements, sleep, cardio and training when sick or tired.',
    heading: 'Guides',
    lede: 'Evidence-based, practical and written for Indian kitchens, veg and non-veg.',
    crumb: 'Guides',
    ctaHeading: 'Put it into practice',
    cta: 'The free Fit app sets your calories, macros and training, and adjusts them from your logs. No account, and only you can read your data.',
    openApp: 'Open the app',
    next: 'Next:',
  },

  exercises: {
    title: 'Exercise guides',
    description: 'How to do {count} gym, home and bodyweight exercises: muscles worked, step-by-step form, common mistakes, sets and reps, and swaps.',
    heading: 'Exercise guides',
    lede: 'Step-by-step form, the muscles each one works, common mistakes and what to swap it for, grouped by the main muscle.',
    crumb: 'Exercises',
    pageTitle: '{name}: how to do it',
    pageDescription: 'How to do the {name}: muscles worked, step-by-step form, common mistakes, sets and reps, and swaps.',
    howToName: 'How to do the {name}',
    main: 'Main muscles',
    assisting: 'Assisting',
    equipment: 'Equipment',
    worksFor: 'Works for',
    withBar: 'with a pull-up bar or dip station at home',
    howTo: 'How to do it',
    mistakes: 'Common mistakes',
    breathing: 'Breathing and tempo',
    harderEasier: 'Make it harder or easier',
    harder: 'Harder:',
    easier: 'Easier:',
    dose: 'Sets and reps',
    safety: 'Safety',
    swaps: 'Swaps',
    noSwaps: 'Nothing in this list trains the same muscles the same way; use the easier or harder version above.',
    ctaHeading: 'Train it with a plan',
    cta: 'The free Fit app builds your program, tells you the weight and reps for every set, and swaps exercises to suit where you train. No account, and only you can read your data.',
    openApp: 'Open the app',
    map: 'Muscles worked: {main}.',
    mapAssist: 'Muscles worked: {main}; assisting: {assist}.',
    front: 'Front',
    back: 'Back',
    mainLegend: 'Main',
    assistLegend: 'Assisting',
  },

  privacy: {
    title: 'Privacy',
    description: 'Fit keeps your health data in your own browser. No account, no tracking, no ads.',
    heading: 'Privacy',
    /** Only for translations, which add it at the top: the English text is the one that binds. */
    prevails: '',
    body: [
      'Everything you enter in Fit (your body, food, workouts, sleep, measurements) is stored in your browser on your device. We can never read it.',
      'Progress photos stay on the device you took them on, even with sync on. Files you import from Apple Health, Samsung Health or Google Fit are read inside your browser and are never uploaded.',
      'There is no account, no analytics, no advertising and no cookies. The site is served by Cloudflare, which processes standard request data such as IP addresses to deliver pages and stop abuse.',
      'Clearing the browser’s site data deletes your data from that device. Use <strong>More → Download backup</strong> to keep a copy, and <strong>Delete everything</strong> to erase it.',
    ],
    syncHeading: 'Sync between your devices',
    sync: [
      'Sync is off until you turn it on in More. It is end-to-end encrypted: your devices encrypt every record with a secret that exists only on them and in the sync link or QR code, and the link keeps it after the <code>#</code>, the part a browser never sends to a server.',
      'While sync is on, our server (Cloudflare Durable Objects) stores, for each record, a random-looking id, the time it was saved, a random tag for the device that saved it, and the encrypted record, so also its size. It also stores a fingerprint (SHA-256) of an access code derived from the secret. Without the secret none of this can be read, by us or anyone else.',
      '<strong>Turn off sync</strong> deletes the encrypted copy from the server. <strong>Remove this device</strong> only stops this device syncing and leaves the copy for your other devices. A copy that no device has synced for 400 days is deleted automatically.',
    ],
    remindersHeading: 'Reminders',
    reminders: [
      'Reminders are off until you turn them on in More. The server then stores your browser’s push subscription (an address at your browser’s push service and its public keys), your time zone, the language of the app and the reminder times you chose, and nothing about your health.',
      'Each reminder is a generic message such as “Time to log lunch”, encrypted for your browser and delivered by its push service (Google, Mozilla, Apple or Microsoft). Turning reminders off deletes the subscription from the server.',
    ],
    contact: 'The code is open source at <repo>{repo}</repo>, so you can check all of this. Questions: <email>{email}</email>.',
  },

  missing: {
    title: 'Page not found',
    description: 'This page does not exist.',
    heading: 'Page not found',
    body: 'That address does not exist here.',
    home: 'Go home',
  },

  app: {
    title: 'Your plan',
    description: 'Your calories, food, training and progress, kept in this browser.',
  },
};

export default site;
export type Site = Widen<typeof site>;
