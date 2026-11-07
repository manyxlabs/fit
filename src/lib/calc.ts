// Every formula the app and the calculator pages share. Inputs are metric: kg, cm, years.

export type Sex = 'male' | 'female';
export type Goal = 'lose' | 'maintain' | 'gain' | 'recomp';

/** Kilocalories in a kilogram of body-weight change, the usual mixed fat and lean estimate. */
export const KCAL_PER_KG = 7700;

export const ACTIVITY = [
  { id: 'sedentary', label: 'Sedentary', detail: 'Desk job, little exercise', factor: 1.2 },
  { id: 'light', label: 'Lightly active', detail: 'Training 1-3 days a week', factor: 1.375 },
  { id: 'moderate', label: 'Moderately active', detail: 'Training 3-5 days a week', factor: 1.55 },
  { id: 'very', label: 'Very active', detail: 'Hard training 6-7 days, or a physical job plus training', factor: 1.725 },
  { id: 'extreme', label: 'Extremely active', detail: 'Twice-daily training or heavy manual work', factor: 1.9 },
] as const;
export type Activity = (typeof ACTIVITY)[number]['id'];

export const bmi = (kg: number, cm: number) => kg / (cm / 100) ** 2;

/** WHO bands, or the WHO Asia-Pacific ones, which put South Asians' risk at a lower BMI. */
export function bmiBand(value: number, asian: boolean): BmiBand {
  if (value < 18.5) return 'under';
  if (value < (asian ? 23 : 25)) return 'healthy';
  if (value < (asian ? 25 : 30)) return 'over';
  return 'obese';
}
export type BmiBand = 'under' | 'healthy' | 'over' | 'obese';

export function healthyWeight(cm: number, asian: boolean): [number, number] {
  const m2 = (cm / 100) ** 2;
  return [18.5 * m2, (asian ? 22.9 : 24.9) * m2];
}

/** Mifflin-St Jeor, or Katch-McArdle when body fat is known, which suits lean, muscular people better. */
export function bmr(p: { sex: Sex; kg: number; cm: number; age: number; bodyFat?: number }) {
  if (p.bodyFat !== undefined) return 370 + 21.6 * p.kg * (1 - p.bodyFat / 100);
  return 10 * p.kg + 6.25 * p.cm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
}

export const activityFactor = (a: Activity) => ACTIVITY.find((x) => x.id === a)!.factor;

/** Weekly change as a fraction of body weight, by goal. Recomp eats at maintenance. */
export const RATES: Record<Goal, { min: number; max: number; default: number }> = {
  lose: { min: -0.01, max: -0.0025, default: -0.005 },
  maintain: { min: 0, max: 0, default: 0 },
  recomp: { min: 0, max: 0, default: 0 },
  gain: { min: 0.001, max: 0.005, default: 0.0025 },
};

/** Below these, a diet needs supervision; the target is held here and flagged. */
export const KCAL_FLOOR: Record<Sex, number> = { male: 1500, female: 1200 };

export function calorieTarget(tdee: number, kg: number, weeklyRate: number, sex: Sex) {
  const raw = tdee + (weeklyRate * kg * KCAL_PER_KG) / 7;
  return { kcal: Math.max(raw, KCAL_FLOOR[sex]), floored: raw < KCAL_FLOOR[sex] };
}

const PROTEIN_PER_KG: Record<Goal, number> = { lose: 2.2, recomp: 2.0, maintain: 1.6, gain: 1.8 };

/**
 * Protein scales with body weight, but past a BMI of 30 the extra weight is mostly fat,
 * so it is counted as if the person weighed what a BMI of 30 would be.
 */
export function macros(p: { kcal: number; kg: number; cm: number; goal: Goal }) {
  const refKg = Math.min(p.kg, 30 * (p.cm / 100) ** 2);
  const protein = PROTEIN_PER_KG[p.goal] * refKg;
  // Fat at 0.8 g/kg, and never under 20% of calories, for hormones and vitamin uptake.
  const fat = Math.max(0.8 * refKg, (0.2 * p.kcal) / 9);
  const carbs = Math.max(0, (p.kcal - protein * 4 - fat * 9) / 4);
  return { protein, fat, carbs, fibre: (14 * p.kcal) / 1000 };
}

export const waterMl = (kg: number) => 35 * kg;

/** US Navy tape method. Circumferences in cm; hip is needed for women only. */
export function navyBodyFat(p: { sex: Sex; cm: number; neck: number; waist: number; hip?: number }) {
  const { log10 } = Math;
  if (p.sex === 'male') {
    if (p.waist <= p.neck) return undefined;
    return 495 / (1.0324 - 0.19077 * log10(p.waist - p.neck) + 0.15456 * log10(p.cm)) - 450;
  }
  if (p.hip === undefined || p.waist + p.hip <= p.neck) return undefined;
  return 495 / (1.29579 - 0.35004 * log10(p.waist + p.hip - p.neck) + 0.221 * log10(p.cm)) - 450;
}

/** Fat-free mass index, normalised to 1.8 m. Around 25 is the natural ceiling for most men. */
export function ffmi(kg: number, cm: number, bodyFat: number) {
  const m = cm / 100;
  return (kg * (1 - bodyFat / 100)) / m ** 2 + 6.1 * (1.8 - m);
}

/** Epley, counting reps left in reserve as reps the set could have done. */
export const oneRepMax = (kg: number, reps: number, rir = 0) => (reps + rir <= 1 ? kg : kg * (1 + (reps + rir) / 30));
/** The load `oneRepMax` puts at this many reps with this many in reserve. */
export const loadFor = (e1rm: number, reps: number, rir = 0) => (reps + rir <= 1 ? e1rm : e1rm / (1 + (reps + rir) / 30));

/** Tanaka's estimate, closer than 220 - age across adult ages. */
export const maxHeartRate = (age: number) => 208 - 0.7 * age;

/** Zones 1-5 (recovery, endurance, tempo, threshold, max): Karvonen when resting heart rate is known, else plain percentages of the maximum. */
export function heartRateZones(age: number, resting?: number) {
  const max = maxHeartRate(age);
  const at = (f: number) => Math.round(resting === undefined ? max * f : resting + (max - resting) * f);
  return [
    { zone: 1, from: at(0.5), to: at(0.6) },
    { zone: 2, from: at(0.6), to: at(0.7) },
    { zone: 3, from: at(0.7), to: at(0.8) },
    { zone: 4, from: at(0.8), to: at(0.9) },
    { zone: 5, from: at(0.9), to: Math.round(max) },
  ];
}

export const metKcal = (met: number, kg: number, minutes: number) => (met * kg * minutes) / 60;

export const age = (birthYear: number, now = new Date()) => now.getFullYear() - birthYear;

/**
 * A smoothed weight series (exponential moving average), so day-to-day water swings
 * do not read as fat gain or loss.
 */
export function trend(points: { date: string; kg: number }[], alpha = 0.1) {
  let t: number | undefined;
  return points.map((p) => ({ date: p.date, kg: p.kg, trend: (t = t === undefined ? p.kg : t + alpha * (p.kg - t)) }));
}

/**
 * Real maintenance from what was eaten and how weight moved: average intake minus the energy
 * the change in stored mass accounts for. The change is a least-squares slope, which uses every
 * weigh-in and, unlike a moving average, does not lag. Undefined until the data can carry it.
 */
export function adaptiveTdee(weights: { date: string; kg: number }[], intakes: number[]) {
  if (weights.length < 8 || intakes.length < 10) return undefined;
  const xs = weights.map((w) => Date.parse(w.date) / 86_400_000);
  if (xs.at(-1)! - xs[0] < 13) return undefined;
  const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  const mx = mean(xs);
  const my = mean(weights.map((w) => w.kg));
  const slope =
    weights.reduce((s, w, i) => s + (xs[i] - mx) * (w.kg - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  return mean(intakes) - slope * KCAL_PER_KG;
}
