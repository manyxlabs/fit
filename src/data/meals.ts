import type { Meal } from '../app/db';
import { FOODS, fits, type Food } from './foods';
import type { Diet } from './supplements';

/** Which part of the day a template suits. Suhoor and iftar are the Ramadan meals. */
type Kind = 'breakfast' | 'main' | 'snack' | 'suhoor' | 'iftar';
/** Food name, then the fewest and most of its unit (the first unit unless named), and the step between. */
type Item = [food: string, min: number, max: number, step?: number, unit?: string];
type Template = { name: string; kinds: Kind[]; items: Item[] };

const B: Kind[] = ['breakfast'];
const BS: Kind[] = ['breakfast', 'suhoor'];
const M: Kind[] = ['main'];
const S: Kind[] = ['snack'];
const KATORI = 0.5;

const TEMPLATES: Template[] = [
  // Breakfast
  { name: 'Poha with curd', kinds: B, items: [['Poha', 1, 2, 0.5], ['Curd (dahi)', 0.5, 1.5, KATORI]] },
  { name: 'Upma with chai', kinds: B, items: [['Upma', 1, 2, 0.5], ['Chai (no sugar)', 1, 1]] },
  { name: 'Idli, sambar and chutney', kinds: BS, items: [['Idli', 2, 6], ['Sambar', 1, 2, KATORI], ['Coconut chutney', 1, 3]] },
  { name: 'Dosa, sambar and chutney', kinds: B, items: [['Dosa', 1, 3], ['Sambar', 1, 2, KATORI], ['Coconut chutney', 1, 3]] },
  { name: 'Pesarattu with chutney', kinds: B, items: [['Pesarattu', 1, 3], ['Coconut chutney', 1, 3], ['Filter coffee', 0, 1]] },
  { name: 'Adai with chutney', kinds: B, items: [['Adai', 1, 3], ['Coconut chutney', 1, 3]] },
  { name: 'Besan chilla with curd', kinds: B, items: [['Besan chilla', 2, 4], ['Curd (dahi)', 0.5, 1.5, KATORI]] },
  { name: 'Moong dal chilla with Greek yogurt', kinds: B, items: [['Moong dal chilla', 2, 4], ['Greek yogurt (plain)', 0.5, 1.5, 0.5]] },
  { name: 'Oats chilla with curd', kinds: B, items: [['Oats chilla', 2, 4], ['Curd (low fat)', 0.5, 1.5, KATORI]] },
  { name: 'Paneer paratha with curd', kinds: BS, items: [['Paneer paratha', 1, 3], ['Curd (dahi)', 0.5, 1.5, KATORI]] },
  { name: 'Sattu paratha with curd', kinds: BS, items: [['Sattu paratha', 1, 3], ['Curd (dahi)', 0.5, 1.5, KATORI]] },
  { name: 'Aloo paratha with curd', kinds: B, items: [['Aloo paratha', 1, 2], ['Curd (dahi)', 0.5, 1.5, KATORI]] },
  { name: 'Thepla with curd', kinds: B, items: [['Thepla', 2, 5], ['Curd (dahi)', 0.5, 1.5, KATORI]] },
  { name: 'Overnight oats', kinds: BS, items: [['Overnight oats', 1, 2, 0.5], ['Banana', 0, 1], ['Protein shake (whey + water)', 0, 1]] },
  { name: 'Oats porridge with dates', kinds: ['suhoor'], items: [['Oats porridge', 1, 2, 0.5], ['Dates', 2, 4], ['Almonds', 0, 1, 1, '1 handful'], ['Protein shake (whey + water)', 0, 1]] },
  { name: 'Oats with soy milk', kinds: BS, items: [['Oats (raw)', 0.5, 1, 0.5], ['Soy milk (unsweetened)', 1, 1.5, 0.5], ['Banana', 0, 1], ['Soy protein isolate', 0, 1]] },
  { name: 'Peanut butter toast with milk', kinds: BS, items: [['Peanut butter toast', 1, 2], ['Milk (toned)', 1, 1.5, 0.5]] },
  { name: 'Paneer bhurji with toast', kinds: BS, items: [['Paneer bhurji', 0.5, 1.5, KATORI], ['Brown bread', 2, 4]] },
  { name: 'Tofu bhurji with roti', kinds: BS, items: [['Tofu bhurji', 1, 2, KATORI], ['Roti', 1, 3]] },
  { name: 'Masala oats with boiled eggs', kinds: B, items: [['Masala oats', 1, 1.5, 0.5], ['Boiled egg', 1, 4]] },
  { name: 'Omelette with toast', kinds: BS, items: [['Omelette', 1, 2], ['Brown bread', 2, 4]] },
  { name: 'Egg white omelette with toast', kinds: B, items: [['Egg white omelette', 1, 2], ['Brown bread', 2, 4]] },
  { name: 'Egg bhurji with roti', kinds: BS, items: [['Egg bhurji', 1, 2], ['Roti', 1, 3]] },
  { name: 'Boiled eggs with toast', kinds: BS, items: [['Boiled egg', 2, 4], ['Brown bread', 2, 4], ['Milk (toned)', 0, 1.5, 0.5]] },

  // Lunch and dinner
  { name: 'Roti, dal, sabzi and curd', kinds: M, items: [['Roti', 1, 5], ['Dal tadka', 1, 2, KATORI], ['Mixed veg', 1, 1.5, KATORI], ['Curd (dahi)', 0.5, 1.5, KATORI]] },
  { name: 'Roti, moong dal and bhindi', kinds: M, items: [['Roti', 1, 5], ['Moong dal', 1, 2, KATORI], ['Bhindi sabzi', 1, 1.5, KATORI], ['Kachumber salad', 0, 1, KATORI]] },
  { name: 'Multigrain roti, chana dal and aloo gobi', kinds: M, items: [['Multigrain roti', 1, 5], ['Chana dal', 1, 2, KATORI], ['Aloo gobi', 1, 1.5, KATORI]] },
  { name: 'Brown rice, masoor dal and cabbage', kinds: M, items: [['Brown rice (cooked)', 1, 2, KATORI], ['Masoor dal', 1, 2, KATORI], ['Cabbage sabzi', 1, 1.5, KATORI]] },
  { name: 'Rice, sambar, poriyal and curd', kinds: M, items: [['Rice (cooked)', 1, 2, KATORI], ['Sambar', 1, 2, KATORI], ['Beans poriyal', 1, 1.5, KATORI], ['Curd (dahi)', 0.5, 1, KATORI]] },
  { name: 'Rajma chawal with curd', kinds: M, items: [['Rajma chawal', 1, 1.5, 0.5], ['Curd (dahi)', 0.5, 1.5, KATORI], ['Kachumber salad', 0, 1, KATORI]] },
  { name: 'Rajma with quinoa and salad', kinds: M, items: [['Rajma', 1, 2, KATORI], ['Quinoa (cooked)', 1, 2, KATORI], ['Kachumber salad', 1, 1]] },
  { name: 'Chole with roti and salad', kinds: M, items: [['Chole', 1, 2, KATORI], ['Roti', 2, 4], ['Kachumber salad', 1, 1]] },
  { name: 'Palak paneer with roti', kinds: M, items: [['Palak paneer', 1, 2, KATORI], ['Roti', 1, 4], ['Kachumber salad', 0, 1, KATORI]] },
  { name: 'Matar paneer, roti and raita', kinds: M, items: [['Matar paneer', 1, 2, KATORI], ['Roti', 1, 4], ['Raita', 0.5, 1, KATORI]] },
  { name: 'Paneer bhurji with roti', kinds: M, items: [['Paneer bhurji', 1, 2, KATORI], ['Roti', 1, 4], ['Plain dal', 0, 1, KATORI], ['Kachumber salad', 0, 1, KATORI]] },
  { name: 'Soya chunk curry with roti', kinds: M, items: [['Soya chunk curry', 1, 2, KATORI], ['Roti', 1, 4], ['Boiled soya chunks', 0, 1, KATORI], ['Kachumber salad', 1, 1]] },
  { name: 'Tofu bhurji, roti and dal', kinds: M, items: [['Tofu bhurji', 1, 2, KATORI], ['Roti', 1, 4], ['Dal fry', 0.5, 1, KATORI]] },
  { name: 'Khichdi with curd and papad', kinds: M, items: [['Khichdi', 1, 2, KATORI], ['Curd (dahi)', 0.5, 1.5, KATORI], ['Roasted papad', 0, 1]] },
  { name: 'Curd rice with poriyal', kinds: M, items: [['Curd rice', 1, 2, KATORI], ['Beans poriyal', 1, 1.5, KATORI]] },
  { name: 'Egg curry with rice', kinds: M, items: [['Egg curry', 1, 1.5, 0.5], ['Rice (cooked)', 1, 2, KATORI], ['Kachumber salad', 0, 1, KATORI]] },
  { name: 'Egg bhurji, roti and dal', kinds: M, items: [['Egg bhurji', 1, 2], ['Roti', 1, 4], ['Dal tadka', 0.5, 1, KATORI]] },
  { name: 'Chicken curry with rice', kinds: M, items: [['Chicken curry', 1, 2, KATORI], ['Rice (cooked)', 1, 2, KATORI], ['Kachumber salad', 0, 1, KATORI]] },
  { name: 'Chicken curry with roti', kinds: M, items: [['Chicken curry', 1, 2, KATORI], ['Roti', 1, 4], ['Kachumber salad', 0, 1, KATORI]] },
  { name: 'Chicken tikka, roti and salad', kinds: M, items: [['Chicken tikka', 0.5, 1.5, 0.5, '1 plate'], ['Roti', 1, 4], ['Kachumber salad', 1, 1]] },
  { name: 'Grilled chicken, brown rice and sabzi', kinds: M, items: [['Grilled chicken breast', 1, 2], ['Brown rice (cooked)', 1, 2, KATORI], ['Mixed veg', 1, 1.5, KATORI]] },
  { name: 'Chicken keema with roti', kinds: M, items: [['Chicken keema', 1, 2, KATORI], ['Roti', 1, 4], ['Raita', 0, 1, KATORI]] },
  { name: 'Tandoori chicken, roti and salad', kinds: M, items: [['Tandoori chicken', 1, 3], ['Roti', 1, 4], ['Kachumber salad', 1, 1]] },
  { name: 'Chicken biryani with raita', kinds: M, items: [['Chicken biryani', 1, 1.5, 0.5], ['Raita', 0.5, 1, KATORI]] },
  { name: 'Fish curry with rice', kinds: M, items: [['Fish curry', 1, 2, KATORI], ['Rice (cooked)', 1, 2, KATORI], ['Kachumber salad', 0, 1, KATORI]] },
  { name: 'Fish tikka, roti and salad', kinds: M, items: [['Fish tikka', 0.5, 1.5, 0.5, '1 plate'], ['Roti', 1, 4], ['Kachumber salad', 1, 1]] },

  // Snacks
  { name: 'Protein shake', kinds: S, items: [['Protein shake (whey + milk)', 1, 2], ['Banana', 0, 1]] },
  { name: 'Whey shake with an apple', kinds: S, items: [['Protein shake (whey + water)', 1, 2], ['Apple', 1, 1]] },
  { name: 'Soy protein shake', kinds: S, items: [['Soy protein isolate', 1, 2], ['Soy milk (unsweetened)', 1, 1.5, 0.5], ['Banana', 0, 1]] },
  { name: 'Greek yogurt with fruit', kinds: S, items: [['Greek yogurt (plain)', 1, 2.5, 0.5], ['Apple', 1, 1]] },
  { name: 'Sprouts chaat', kinds: S, items: [['Moong sprouts', 1, 2, KATORI], ['Guava', 0, 1]] },
  { name: 'Chana chaat', kinds: S, items: [['Chana chaat', 1, 2, KATORI]] },
  { name: 'Roasted chana and chaas', kinds: S, items: [['Roasted chana', 1, 2], ['Chaas', 1, 2]] },
  { name: 'Amul High Protein Buttermilk', kinds: S, items: [['Amul High Protein Buttermilk', 1, 2], ['Roasted chana', 0, 2]] },
  { name: 'Amul High Protein Lassi', kinds: S, items: [['Amul High Protein Plain Lassi', 1, 2], ['Banana', 0, 1]] },
  { name: 'Amul High Protein Milk', kinds: ['snack', 'iftar'], items: [['Amul High Protein Milk', 1, 2], ['Almonds', 0, 1, 1, '1 handful'], ['Banana', 0, 1]] },
  { name: 'Paneer tikka', kinds: S, items: [['Paneer tikka', 3, 8]] },
  { name: 'Boiled eggs', kinds: S, items: [['Boiled egg', 2, 4], ['Egg white', 0, 4], ['Apple', 0, 1]] },
  { name: 'Chicken tikka', kinds: S, items: [['Chicken tikka', 4, 8]] },
  { name: 'Peanuts and guava', kinds: S, items: [['Roasted peanuts', 1, 2], ['Guava', 1, 1]] },
  { name: 'Makhana with chai', kinds: S, items: [['Roasted makhana', 1, 3], ['Chai (no sugar)', 1, 1]] },
  { name: 'Dhokla', kinds: S, items: [['Dhokla', 3, 6]] },
  { name: 'Chikki with milk', kinds: S, items: [['Chikki', 1, 2], ['Milk (toned)', 1, 1.5, 0.5]] },

  // Iftar, after dates
  { name: 'Dates, chana chaat and coconut water', kinds: ['iftar'], items: [['Dates', 2, 4], ['Chana chaat', 1, 2, KATORI], ['Coconut water', 1, 1]] },
  { name: 'Dates, fruit and sprouts', kinds: ['iftar'], items: [['Dates', 2, 4], ['Fruit salad', 1, 1.5, 0.5], ['Sprouts salad', 1, 2, KATORI], ['Nimbu pani', 1, 1]] },
  { name: 'Dates, fruit and pakora', kinds: ['iftar'], items: [['Dates', 2, 4], ['Fruit salad', 1, 1.5, 0.5], ['Paneer pakora', 2, 4], ['Nimbu pani', 1, 1]] },
  { name: 'Dates, dahi vada and fruit', kinds: ['iftar'], items: [['Dates', 2, 4], ['Dahi vada', 1, 3], ['Watermelon', 1, 2]] },
  { name: 'Dates, chicken tikka and fruit', kinds: ['iftar'], items: [['Dates', 2, 4], ['Chicken tikka', 4, 8], ['Fruit salad', 1, 1.5, 0.5], ['Coconut water', 0, 1]] },

  // Vrat (every food here is vrat, so these show on fast days)
  { name: 'Sabudana khichdi with curd', kinds: ['breakfast', 'main'], items: [['Sabudana khichdi', 1, 1.5, 0.5], ['Curd (dahi)', 0.5, 1.5, KATORI]] },
  { name: 'Sabudana vada with curd', kinds: B, items: [['Sabudana vada', 2, 4], ['Curd (dahi)', 1, 1.5, KATORI]] },
  { name: 'Greek yogurt with fruit and nuts', kinds: BS, items: [['Greek yogurt (plain)', 1, 2.5, 0.5], ['Fruit salad', 0.5, 1, 0.5], ['Almonds', 1, 1, 1, '1 handful']] },
  { name: 'Fruit with nuts', kinds: B, items: [['Fruit salad', 1, 1.5, 0.5], ['Roasted peanuts', 1, 2], ['Almonds', 0, 1, 1, '1 handful']] },
  { name: 'Vrat paneer bhurji with rajgira roti', kinds: ['breakfast', 'main'], items: [['Vrat paneer bhurji', 0.5, 2, KATORI], ['Rajgira roti', 1, 3]] },
  { name: 'Kuttu roti, vrat aloo and Greek yogurt', kinds: M, items: [['Kuttu roti', 1, 4], ['Vrat aloo', 1, 1.5, KATORI], ['Greek yogurt (plain)', 0.5, 2, 0.5]] },
  { name: 'Rajgira roti, paneer and raita', kinds: M, items: [['Rajgira roti', 1, 4], ['Paneer', 0.5, 1.5, KATORI, '1 katori'], ['Raita', 0.5, 1, KATORI]] },
  { name: 'Kuttu puri, vrat aloo and raita', kinds: M, items: [['Kuttu puri', 2, 4], ['Vrat aloo', 1, 1.5, KATORI], ['Raita', 0.5, 1, KATORI]] },
  { name: 'Kuttu puri with boiled potato', kinds: M, items: [['Kuttu puri', 2, 5], ['Boiled potato', 1, 2], ['Cucumber', 0, 1]] },
  { name: 'High protein paneer with sweet potato', kinds: M, items: [['Amul High Protein Paneer', 1, 4], ['Boiled sweet potato', 1, 2], ['Cucumber', 0, 1]] },
  { name: 'Cottage cheese with papaya', kinds: S, items: [['Low fat cottage cheese', 0.5, 1.5, 0.5], ['Papaya', 1, 1]] },
  { name: 'Shakarkandi chaat', kinds: S, items: [['Shakarkandi chaat', 1, 1.5, 0.5], ['Roasted peanuts', 0, 1]] },
  { name: 'Amul High Protein Milk with makhana', kinds: ['snack', 'breakfast'], items: [['Amul High Protein Milk', 1, 2], ['Roasted makhana', 1, 2], ['Banana', 0, 1]] },
  { name: 'Dates, fruit and Greek yogurt', kinds: ['iftar'], items: [['Dates', 2, 4], ['Fruit salad', 1, 1.5, 0.5], ['Greek yogurt (plain)', 1, 2, 0.5], ['Nimbu pani', 0, 1]] },
  { name: 'Dates, paneer tikka and fruit', kinds: ['iftar'], items: [['Dates', 2, 4], ['Paneer tikka', 3, 8], ['Fruit salad', 1, 1.5, 0.5], ['Coconut water', 0, 1]] },
  { name: 'Dates, fruit and a protein shake', kinds: ['iftar'], items: [['Dates', 2, 4], ['Fruit salad', 1, 1.5, 0.5], ['Protein shake (whey + milk)', 1, 2]] },
  { name: 'Dates, boiled eggs and fruit', kinds: ['iftar'], items: [['Dates', 2, 4], ['Boiled egg', 2, 4], ['Fruit salad', 1, 1.5, 0.5], ['Nimbu pani', 0, 1]] },
  { name: 'Greek yogurt with oats and fruit', kinds: ['suhoor'], items: [['Greek yogurt (plain)', 1, 2, 0.5], ['Oats (raw)', 0.5, 1, 0.5], ['Banana', 1, 1], ['Dates', 0, 3]] },
  { name: 'Chicken keema with paratha', kinds: ['suhoor'], items: [['Chicken keema', 1, 1.5, KATORI], ['Plain paratha', 1, 2], ['Curd (dahi)', 0, 1, KATORI]] },
  { name: 'Makhana with milk', kinds: S, items: [['Roasted makhana', 1, 2], ['Milk (toned)', 1, 1.5, 0.5]] },
  { name: 'Makhana kheer', kinds: S, items: [['Makhana kheer', 1, 1.5, 0.5]] },
  { name: 'Peanuts and banana', kinds: S, items: [['Roasted peanuts', 1, 2], ['Banana', 1, 1]] },
  { name: 'Banana shake', kinds: S, items: [['Banana shake', 1, 1.5, 0.5], ['Almonds', 0, 1, 1, '1 handful']] },
];

type Resolved = { name: string; kinds: Kind[]; diet: Diet[]; vrat: boolean; items: { food: Food; unit: string; grams: number; min: number; max: number; step: number }[] };

const DIETS: Diet[] = ['vegan', 'veg', 'egg', 'nonveg'];

/** Resolved once at load, so a misspelt food or unit fails every page that plans a day, and the e2e run with it. */
const RESOLVED: Resolved[] = TEMPLATES.map((t) => {
  const items = t.items.map(([name, min, max, step = 1, unitName]) => {
    const food = FOODS.find((f) => f.name === name);
    const unit = food && (unitName ? food.units.find((u) => u[0] === unitName) : food.units[0]);
    if (!food || !unit) throw new Error(`Meal template "${t.name}": no food "${name}"${unitName ? ` with unit "${unitName}"` : ''}`);
    return { food, unit: unit[0].replace(/^1 /, ''), grams: unit[1], min, max, step };
  });
  return {
    name: t.name,
    kinds: t.kinds,
    diet: DIETS.filter((d) => items.every((i) => fits(i.food.diet, d))),
    vrat: items.every((i) => i.food.vrat),
    items,
  };
});

/** How the day is eaten: three meals inside an eating window, or Ramadan's suhoor, iftar and dinner. */
export type PlanMode = 'normal' | 'if' | 'ramadan';

const SLOTS: Record<PlanMode, [Meal, Kind][]> = {
  normal: [['breakfast', 'breakfast'], ['lunch', 'main'], ['snacks', 'snack'], ['dinner', 'main']],
  if: [['lunch', 'main'], ['snacks', 'snack'], ['dinner', 'main']],
  ramadan: [['breakfast', 'suhoor'], ['snacks', 'iftar'], ['dinner', 'main']],
};

export type PlannedItem = { food: Food; count: number; unit: string; grams: number };
export type PlannedMeal = { meal: Meal; name: string; items: PlannedItem[]; kcal: number; protein: number };
export type DayPlan = { meals: PlannedMeal[]; kcal: number; protein: number; ok: boolean };

/** Within 5% of the calorie target and at least 95% of the protein target. */
const KCAL_TOLERANCE = 0.05;
const PROTEIN_FLOOR = 0.95;
const PROTEIN_CEILING = 1.3;
const COMBINATIONS = 60;

/**
 * A day of meals from the templates, scaled to the targets.
 * Each date has its own sequence of distinct template combinations; `variant` walks through those that meet the
 * targets (or, when none do, those closest to them), so the same date and variant give the same plan and a new
 * variant always gives a different one while there is more than one to give.
 * Undefined when the diet and vrat filter leave no template for some meal.
 */
export function planDay(o: { date: string; variant: number; diet: Diet; vrat: boolean; mode: PlanMode; kcal: number; protein: number }): DayPlan | undefined {
  const slots = SLOTS[o.mode];
  const choices = slots.map(([, kind]) => RESOLVED.filter((t) => t.kinds.includes(kind) && t.diet.includes(o.diet) && (!o.vrat || t.vrat)));
  if (choices.some((c) => !c.length)) return undefined;
  // Fewer meals in the day means bigger meals.
  const scale = 4 / slots.length;
  const rand = mulberry32(hash(o.date));
  const seen = new Set<string>();
  const plans: { plan: DayPlan; score: number }[] = [];
  for (let a = 0; a < COMBINATIONS; a++) {
    const picked: Resolved[] = [];
    for (const c of choices) {
      // Lunch and dinner come from the same list; avoid eating the same meal twice when there is a choice.
      const fresh = c.filter((t) => !picked.includes(t));
      const from = fresh.length ? fresh : c;
      picked.push(from[Math.floor(rand() * from.length)]);
    }
    const key = picked.map((t) => t.name).join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    const plan = fit(picked, slots, scale, o.kcal, o.protein);
    plans.push({ plan, score: Math.abs(plan.kcal / o.kcal - 1) + 2 * Math.max(0, 1 - plan.protein / o.protein) });
  }
  const passing = plans.filter((p) => p.plan.ok);
  // Protein past the target only displaces carbs and fat, so plans near it come first when there are any.
  const near = passing.filter((p) => p.plan.protein <= o.protein * PROTEIN_CEILING);
  const list = near.length ? near : passing.length ? passing : plans.sort((a, b) => a.score - b.score);
  return list[o.variant % list.length].plan;
}

/**
 * Starts every item at its least, then first adds the steps with the most protein per kcal until protein is met,
 * then evens out portions until calories are met, never going past the calorie ceiling.
 */
function fit(templates: Resolved[], slots: [Meal, Kind][], scale: number, kcal: number, protein: number): DayPlan {
  const items = templates.flatMap((t, m) =>
    t.items.map((i) => {
      const max = Math.max(i.max, Math.round((i.max * scale) / i.step) * i.step);
      const per = (i.grams * i.step) / 100;
      return { ...i, m, max, count: i.min, dk: i.food.kcal * per, dp: i.food.protein * per };
    }),
  );
  let k = items.reduce((s, i) => s + i.count * (i.dk / i.step), 0);
  let p = items.reduce((s, i) => s + i.count * (i.dp / i.step), 0);
  const ceiling = kcal * (1 + KCAL_TOLERANCE);
  const room = (i: (typeof items)[number]) => i.count + i.step <= i.max + 1e-9 && k + i.dk <= ceiling;
  const raise = (i: (typeof items)[number]) => {
    i.count += i.step;
    k += i.dk;
    p += i.dp;
  };
  while (p < protein) {
    const next = items.filter((i) => room(i) && i.dp > 0).sort((a, b) => b.dp / b.dk - a.dp / a.dk)[0];
    if (!next) break;
    raise(next);
  }
  while (k < kcal) {
    const fill = (i: (typeof items)[number]) => (i.count - i.min) / (i.max - i.min);
    const pool = items.filter((i) => i.max > i.min && room(i));
    // Once protein is met, fill calories from the rest of the plate rather than piling on more whey or eggs.
    const lean = p >= protein ? pool.filter((i) => i.dp / i.dk <= protein / kcal) : [];
    const next = (lean.length ? lean : pool).sort((a, b) => fill(a) - fill(b))[0];
    if (!next) break;
    raise(next);
  }
  const meals = templates.map((t, m) => {
    const mine = items.filter((i) => i.m === m && i.count > 0);
    return {
      meal: slots[m][0],
      name: t.name,
      items: mine.map((i) => ({ food: i.food, count: i.count, unit: i.unit, grams: i.count * i.grams })),
      kcal: mine.reduce((s, i) => s + (i.food.kcal * i.count * i.grams) / 100, 0),
      protein: mine.reduce((s, i) => s + (i.food.protein * i.count * i.grams) / 100, 0),
    };
  });
  return { meals, kcal: k, protein: p, ok: Math.abs(k / kcal - 1) <= KCAL_TOLERANCE && p >= protein * PROTEIN_FLOOR };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ (t + t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
