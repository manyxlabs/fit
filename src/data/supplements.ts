import type { Goal, Sex } from '../lib/calc';

export type Diet = 'veg' | 'egg' | 'nonveg' | 'vegan';
export const DIETS: Record<Diet, string> = {
  veg: 'Vegetarian',
  egg: 'Eggetarian',
  nonveg: 'Non-vegetarian',
  vegan: 'Vegan',
};

export type Evidence = 'strong' | 'moderate' | 'situational' | 'weak';

// Doses, reasons and cautions are health copy, in the catalogue (i18n/<lang>/health/more.ts) by id.
// Names stay in English, as they are printed on the tubs and strips sold in India.
export const SUPPLEMENTS = {
  creatine: { name: 'Creatine monohydrate', evidence: 'strong' },
  protein: { name: 'Protein powder', evidence: 'strong' },
  caffeine: { name: 'Caffeine', evidence: 'strong' },
  vitaminD: { name: 'Vitamin D3', evidence: 'situational' },
  b12: { name: 'Vitamin B12', evidence: 'strong' },
  omega3: { name: 'Omega-3 (EPA + DHA)', evidence: 'moderate' },
  iron: { name: 'Iron', evidence: 'situational' },
  electrolytes: { name: 'Electrolytes', evidence: 'situational' },
  magnesium: { name: 'Magnesium', evidence: 'weak' },
  calcium: { name: 'Calcium', evidence: 'situational' },
} satisfies Record<string, { name: string; evidence: Evidence }>;
export type SupplementId = keyof typeof SUPPLEMENTS;

/** Commonly sold, little to show for the money. */
export const NOT_WORTH_IT = ['bcaa', 'testosterone', 'fatBurners', 'massGainers', 'preWorkout', 'glutamine', 'detox'] as const;

/** A supplement suggested to someone, with what its reason needs to be put in words. */
export type Recommendation =
  | { id: 'protein'; gapG: number }
  | { id: 'b12'; diet: Exclude<Diet, 'nonveg'> }
  | { id: 'creatine' | 'vitaminD' | 'omega3' | 'iron' | 'calcium' | 'caffeine' };

export function recommend(p: { diet: Diet; sex: Sex; goal: Goal; proteinGap: number; trainsHard: boolean }) {
  const out: Recommendation[] = [];
  if (p.trainsHard) out.push({ id: 'creatine' });
  if (p.proteinGap > 20) out.push({ id: 'protein', gapG: Math.round(p.proteinGap) });
  out.push({ id: 'vitaminD' });
  if (p.diet !== 'nonveg') out.push({ id: 'b12', diet: p.diet });
  if (p.diet !== 'nonveg') out.push({ id: 'omega3' });
  if (p.sex === 'female') out.push({ id: 'iron' });
  if (p.diet === 'vegan') out.push({ id: 'calcium' });
  if (p.trainsHard) out.push({ id: 'caffeine' });
  return out;
}
