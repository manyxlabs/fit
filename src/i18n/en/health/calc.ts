import { CALCULATORS } from '../../../calcs/list';

type Slug = (typeof CALCULATORS)[number]['slug'];

export default {
  how: Object.fromEntries(CALCULATORS.map((c) => [c.slug, [...c.how]])) as Record<Slug, string[]>,
  floored: 'Held at the safe minimum',
  waistAim: 'Aim under 0.5',
  waterCheck: 'More in heat; pale-yellow urine is the check',
};
