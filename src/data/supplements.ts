import type { Goal, Sex } from '../lib/calc';

export type Diet = 'veg' | 'egg' | 'nonveg' | 'vegan';
export const DIETS: Record<Diet, string> = {
  veg: 'Vegetarian',
  egg: 'Eggetarian',
  nonveg: 'Non-vegetarian',
  vegan: 'Vegan',
};

export type Evidence = 'strong' | 'moderate' | 'situational' | 'weak';

export type Supplement = {
  name: string;
  evidence: Evidence;
  dose: string;
  why: string;
  caution?: string;
};

export const SUPPLEMENTS = {
  creatine: { name: 'Creatine monohydrate', evidence: 'strong', dose: '3-5 g a day, any time, every day. No loading needed.', why: 'The best-proven legal supplement for strength, reps and lean mass. Saturates in about 3-4 weeks.', caution: 'Drink enough water. A 1-2 kg early gain is water in the muscle, not fat.' },
  protein: { name: 'Protein powder', evidence: 'strong', dose: '20-40 g a serving, only to fill the gap food leaves.', why: 'Convenience, not magic: it counts the same as protein from food.', caution: 'Choose third-party tested brands. Whey isolate suits the lactose-sensitive; soy or pea blends suit vegans.' },
  caffeine: { name: 'Caffeine', evidence: 'strong', dose: '3-6 mg per kg, 30-60 minutes before training. Most people do well on 200-300 mg.', why: 'Improves strength, endurance and focus.', caution: 'Not within 8 hours of bed. Skip it with heart rhythm problems, high blood pressure or pregnancy without medical advice.' },
  vitaminD: { name: 'Vitamin D3', evidence: 'situational', dose: 'Per a blood test. Commonly 1,000-2,000 IU a day.', why: 'Deficiency is very common in India despite the sun, and affects bones, muscle and immunity.', caution: 'Test first; high doses for long periods without testing can be harmful.' },
  b12: { name: 'Vitamin B12', evidence: 'strong', dose: 'Per a blood test. Commonly 250-500 mcg a day or 2,000 mcg a week.', why: 'Found almost only in animal foods; deficiency causes fatigue, anaemia and nerve damage.' },
  omega3: { name: 'Omega-3 (EPA + DHA)', evidence: 'moderate', dose: 'About 1-2 g of EPA plus DHA a day.', why: 'For heart health and joint comfort when oily fish is rarely eaten. Algae oil is the vegan source.' },
  iron: { name: 'Iron', evidence: 'situational', dose: 'Only per a blood test and a doctor.', why: 'Iron-deficiency anaemia is widespread among Indian women and hurts endurance and recovery.', caution: 'Never take it without a test: excess iron is toxic.' },
  electrolytes: { name: 'Electrolytes', evidence: 'situational', dose: 'During long or very sweaty sessions.', why: 'Replaces sodium and potassium lost in sweat, which matters in Indian summers.' },
  magnesium: { name: 'Magnesium', evidence: 'weak', dose: '200-400 mg in the evening.', why: 'May help sleep or cramps if intake is low; not essential for most.' },
  calcium: { name: 'Calcium', evidence: 'situational', dose: 'Only enough to reach about 1,000 mg a day with food.', why: 'For vegans and anyone eating little dairy.' },
} satisfies Record<string, Supplement>;
export type SupplementId = keyof typeof SUPPLEMENTS;

/** Commonly sold, little to show for the money. */
export const NOT_WORTH_IT = [
  { name: 'BCAAs and EAAs', why: 'Redundant once daily protein is adequate.' },
  { name: 'Testosterone boosters', why: 'No meaningful effect in healthy men; some are spiked with banned drugs.' },
  { name: 'Fat burners', why: 'Mostly caffeine at a premium; some contain unsafe stimulants.' },
  { name: 'Mass gainers', why: 'Expensive sugar and oil. Milk, banana, oats and peanut butter do the same for a fraction.' },
  { name: 'Proprietary pre-workout blends', why: 'Hidden doses. Plain caffeine is the part that works.' },
  { name: 'Glutamine', why: 'No benefit to muscle growth in healthy people.' },
  { name: 'Detox and cleanse products', why: 'The liver and kidneys already do this.' },
];

export type Recommendation = { id: SupplementId; reason: string };

export function recommend(p: { diet: Diet; sex: Sex; goal: Goal; proteinGap: number; trainsHard: boolean }) {
  const out: Recommendation[] = [];
  if (p.trainsHard) out.push({ id: 'creatine', reason: 'You train regularly; it suits every goal, including fat loss.' });
  if (p.proteinGap > 20) out.push({ id: 'protein', reason: `Your food falls about ${Math.round(p.proteinGap)} g a day short of your protein target.` });
  out.push({ id: 'vitaminD', reason: 'Get a blood test; most Indians are low.' });
  if (p.diet !== 'nonveg') out.push({ id: 'b12', reason: `${DIETS[p.diet]} diets supply little or no B12.` });
  if (p.diet !== 'nonveg') out.push({ id: 'omega3', reason: 'Without fish there is almost no EPA or DHA in the diet.' });
  if (p.sex === 'female') out.push({ id: 'iron', reason: 'Check ferritin and haemoglobin in your yearly blood test.' });
  if (p.diet === 'vegan') out.push({ id: 'calcium', reason: 'Without dairy, calcium is easy to under-eat.' });
  if (p.trainsHard) out.push({ id: 'caffeine', reason: 'Optional, before training.' });
  return out;
}
