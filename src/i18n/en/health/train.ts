// The train area's health advice (src/app/Train.tsx, and Today.tsx for the day's advice); see ../health.ts.
import type { Advice } from '../../../lib/coach';

export default {
  /** The day's training advice, from the morning check-in: sick, short of sleep, or tired. */
  advice: {
    fever: 'Fever, body aches, chest congestion or a stomach bug: skip training. Exercise with a fever raises the risk of complications.',
    sickEat: 'Eat at maintenance, keep protein high and drink plenty of fluids.',
    sickReturn: 'Come back 24-48 hours after symptoms clear, at 50-70% of your usual sets.',
    sickDoctor: 'See a doctor for chest pain, trouble breathing, a lasting fever or palpitations.',
    sleepSwap: 'Under 4.5 hours of sleep: swap the session for a walk or mobility work, or rest.',
    sleepEat: 'Keep calories and protein normal; poor sleep raises hunger, so plan protein-rich snacks.',
    sleepCaffeine: 'Caffeine early only, and aim for an early night.',
    aboveNeck: 'Symptoms only above the neck: light training is usually fine. About 40% fewer sets and keep it short.',
    aboveNeckStop: 'Stop if you feel worse as you go.',
    tired: 'Short sleep, low energy or heavy soreness: about 25% fewer sets, one more rep in reserve than usual, no max attempts.',
    tiredNap: 'A 20-30 minute nap before 3 pm helps.',
  } satisfies Record<Advice, string>,
  cardio: {
    howMuch: '2-3 easy sessions of 20-40 minutes a week help the heart and recovery. Keep them away from heavy leg days.',
    eatBack: 'Calories here are estimates for reference; your target already counts your usual activity, so do not eat them back by default.',
  },
};
