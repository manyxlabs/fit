import type { Meal } from '../../../data/meals';

// The Reminders card in More (src/app/Reminders.tsx). What the reminders themselves say is in ../push.ts.
export default {
  title: 'Reminders',
  /** The quoted example is the lunch reminder's text in ../push.ts; quote it as translated there. */
  about:
    'Notifications at the times you choose. The server keeps only this browser\'s push address, your timezone and these times, never anything you log, and the reminders say no more than "Time to log lunch".',
  /** Share and Add to Home Screen are the names of buttons on iPhone; use the names iOS shows in this language. */
  ios: 'On iPhone and iPad, reminders need iOS 16.4 or later and Fit on your Home Screen: tap Share, then Add to Home Screen, and open Fit from there.',
  weighIn: 'Morning weigh-in',
  weighInTime: 'Weigh-in time',
  /** A checkbox that turns on the reminder for one meal. */
  logMeal: { breakfast: 'Log breakfast', lunch: 'Log lunch', snacks: 'Log snacks', dinner: 'Log dinner' } satisfies Record<Meal, string>,
  /** The label of a meal reminder's time; {meal} is the meal's name, such as Lunch. */
  mealTime: '{meal} time',
  water: 'Water',
  waterEvery: 'Water every',
  /** An option in the Water every menu; {hours} is 1, 1.5, 2 or 3. */
  everyHours: 'every {hours} h',
  /** The hours water reminders are sent between: <from></from> and <until></until> are the two time boxes, <to>...</to> the words drawn between them. */
  waterHours: '<from></from> <to>to</to> <until></until>',
  waterFrom: 'Water from',
  waterUntil: 'Water until',
  waterOrder: 'Water reminders must start before they end.',
  /** A checkbox, and the label of the weekday toggles under it. */
  workoutDays: 'Workout days',
  workoutTime: 'Workout time',
  bedtime: 'Bedtime',
  /** The label of the bedtime reminder's time box. */
  bedtimeTime: 'Bedtime',
  turnOn: 'Turn on reminders',
  save: 'Save reminders',
  turnOff: 'Turn off reminders',
  on: 'Reminders are on.',
  off: 'Reminders are off.',
  unsupported: 'This browser cannot show reminders.',
  blocked: "Notifications are blocked for this site. Allow them in your browser's site settings, then try again.",
  unavailable: 'Reminders are not available right now. Try again later.',
  saveFailed: 'Could not save your reminders. Try again.',
  turnOffFailed: 'Could not turn off reminders. Try again.',
};
