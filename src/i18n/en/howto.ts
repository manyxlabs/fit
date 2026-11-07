// The exercise pages' how-tos: health advice, published in a language only once reviewed (../review.ts).
import { HOW_TO, type HowTo } from '../../data/exercise-guides';
import type { ExerciseId } from '../../data/exercises';

type Dose = [beginners: string, more: string];
import type { Widen } from '../shape';

const howto = {
  exercises: HOW_TO as Record<ExerciseId, HowTo>,
  breathing: {
    hold: 'Breathe slowly and steadily for the whole hold; never hold your breath. Stay still rather than shaking through it.',
    conditioning: 'Breathe rhythmically and move at a pace you can hold for the whole round. Slow down before your form breaks.',
    compound: 'Breathe in and brace your midsection before each rep, hold it through the hardest part, and breathe out at the top. Lower in about 2-3 seconds, then lift firmly without bouncing.',
    isolation: 'Breathe out as you lift and in as you lower. Lift in about 1-2 seconds, pause briefly where the muscle is shortest, and lower in 2-3 seconds.',
  },
  /** Who each line of a dose is for: beginners, then those further on. */
  doseWho: { beginners: 'Beginners', hold: 'Progressing', conditioning: 'Fitness', muscle: 'Building muscle' },
  dose: {
    hold: ['2-3 holds of 20-30 seconds, resting 30-60 seconds between them.', '3 holds of 45-60 seconds, then move to the harder version.'] as Dose,
    conditioning: ['3-5 rounds of 20-30 seconds, with 30-60 seconds of rest.', '6-10 rounds of 30-40 seconds, with 20-30 seconds of rest.'] as Dose,
    bodyweight: ['2-3 sets, stopping each 2-3 reps short of failure.', '3-4 sets of 8-20 reps, stopping 0-2 reps short of failure. Past 20, move to the harder version.'] as Dose,
    compound: ['3 sets of 6-10 reps, stopping 2-3 reps short of failure.', '3-4 sets of 6-12 reps, stopping 1-2 reps short of failure.'] as Dose,
    isolation: ['2-3 sets of 10-15 reps, stopping 2-3 reps short of failure.', '3-4 sets of 10-20 reps, stopping 0-2 reps short of failure.'] as Dose,
  },
};

export default howto;
export type Howto = Widen<typeof howto>;
