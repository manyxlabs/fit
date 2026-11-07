// The calculators' copy: their pages' names and descriptions (from src/calcs/list.ts) and the
// calculators' own labels. What they explain about health is in health.ts, which waits for review.
import { CALCULATORS } from '../../calcs/list';
import type { Widen } from '../shape';

type Slug = (typeof CALCULATORS)[number]['slug'];

const calc = {
  pages: Object.fromEntries(CALCULATORS.map((c) => [c.slug, { name: c.name, title: c.title, description: c.description }])) as Record<Slug, { name: string; title: string; description: string }>,
  sex: 'Sex',
  age: 'Age',
  weight: 'Weight (kg)',
  height: 'Height (cm)',
  activity: 'Activity, counting your whole day',
  goal: 'Goal',
  fillIn: 'Fill in every field to see the result.',
  bmi: {
    asian: 'Asian cut-offs (WHO Asia-Pacific), for people of South Asian descent',
    bmi: 'BMI',
    healthy: 'Healthy weight for your height',
  },
  tdee: {
    bmr: 'BMR, at complete rest',
    maintenance: 'Maintenance (TDEE)',
    lose: 'Fat loss, 0.5% a week',
    gain: 'Lean gain, 0.25% a week',
  },
  macros: { calories: 'Calories', protein: 'Protein', fat: 'Fat', carbs: 'Carbs', fibre: 'Fibre' },
  protein: { perDay: 'Protein a day', perMeal: 'Over 4 meals', each: '{grams} g each' },
  bodyFat: {
    neck: 'Neck (cm)',
    waistMale: 'Waist at the navel (cm)',
    waistFemale: 'Waist at the narrowest (cm)',
    hips: 'Hips at the widest (cm)',
    bodyFat: 'Body fat',
    fatMass: 'Fat mass',
    leanMass: 'Lean mass',
    ffmi: 'Fat-free mass index',
    waistToHeight: 'Waist to height',
  },
  oneRepMax: { lifted: 'Weight lifted (kg)', reps: 'Reps done', rir: 'Reps left in reserve', max: 'Estimated one-rep max', repsHead: 'Reps', load: 'Load' },
  heartRate: { resting: 'Resting heart rate (optional)', max: 'Estimated maximum heart rate', zone: 'Zone', rate: 'Heart rate' },
  water: { exercise: 'Exercise today (minutes)', baseline: 'Baseline', withExercise: 'With exercise', litres: '{n} litres' },
  burn: { activity: 'Activity', minutes: 'Minutes', burned: 'Calories burned' },
};

export default calc;
export type Calc = Widen<typeof calc>;
