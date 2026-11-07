import type { Kind } from '../../lib/reminders';

// What a reminder notification says, built by the Worker (src/lib/reminders.ts). Generic on purpose:
// it passes through the browser's push service, so it never names anything a person logged.
export default {
  /** The app's name, shown as the notification's heading. */
  title: 'Fit',
  body: {
    weighIn: 'Time for your morning weigh-in',
    breakfast: 'Time to log breakfast',
    lunch: 'Time to log lunch',
    snacks: 'Time to log snacks',
    dinner: 'Time to log dinner',
    water: 'Time for a glass of water',
    workout: 'Time to train',
    bedtime: 'Time to wind down for bed',
  } satisfies Record<Kind, string>,
};
