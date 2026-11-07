// The more area's health advice (supplements in src/app/More.tsx, fasting in ProfileForm.tsx); see ../health.ts.
export default {
  /** A tag after a supplement's name: how well studies back it. */
  evidence: { strong: 'strong evidence', moderate: 'moderate evidence', situational: 'situational evidence', weak: 'weak evidence' },
  supplements: {
    creatine: {
      dose: '3-5 g a day, any time, every day. No loading needed.',
      why: 'The best-proven legal supplement for strength, reps and lean mass. Saturates in about 3-4 weeks.',
      caution: 'Drink enough water. A 1-2 kg early gain is water in the muscle, not fat.',
    },
    protein: {
      dose: '20-40 g a serving, only to fill the gap food leaves.',
      why: 'Convenience, not magic: it counts the same as protein from food.',
      caution: 'Choose third-party tested brands. Whey isolate suits the lactose-sensitive; soy or pea blends suit vegans.',
    },
    caffeine: {
      dose: '3-6 mg per kg, 30-60 minutes before training. Most people do well on 200-300 mg.',
      why: 'Improves strength, endurance and focus.',
      caution: 'Not within 8 hours of bed. Skip it with heart rhythm problems, high blood pressure or pregnancy without medical advice.',
    },
    vitaminD: {
      dose: 'Per a blood test. Commonly 1,000-2,000 IU a day.',
      why: 'Deficiency is very common in India despite the sun, and affects bones, muscle and immunity.',
      caution: 'Test first; high doses for long periods without testing can be harmful.',
    },
    b12: {
      dose: 'Per a blood test. Commonly 250-500 mcg a day or 2,000 mcg a week.',
      why: 'Found almost only in animal foods; deficiency causes fatigue, anaemia and nerve damage.',
    },
    omega3: {
      dose: 'About 1-2 g of EPA plus DHA a day.',
      why: 'For heart health and joint comfort when oily fish is rarely eaten. Algae oil is the vegan source.',
    },
    iron: {
      dose: 'Only per a blood test and a doctor.',
      why: 'Iron-deficiency anaemia is widespread among Indian women and hurts endurance and recovery.',
      caution: 'Never take it without a test: excess iron is toxic.',
    },
    electrolytes: {
      dose: 'During long or very sweaty sessions.',
      why: 'Replaces sodium and potassium lost in sweat, which matters in Indian summers.',
    },
    magnesium: {
      dose: '200-400 mg in the evening.',
      why: 'May help sleep or cramps if intake is low; not essential for most.',
    },
    calcium: {
      dose: 'Only enough to reach about 1,000 mg a day with food.',
      why: 'For vegans and anyone eating little dairy.',
    },
  },
  /** Why a supplement is suggested to this person. */
  reasons: {
    creatine: 'You train regularly; it suits every goal, including fat loss.',
    /** {g} is grams of protein. */
    protein: 'Your food falls about {g} g a day short of your protein target.',
    vitaminD: 'Get a blood test; most Indians are low.',
    /** By the person's diet. */
    b12: {
      veg: 'Vegetarian diets supply little or no B12.',
      egg: 'Eggetarian diets supply little or no B12.',
      vegan: 'Vegan diets supply little or no B12.',
    },
    omega3: 'Without fish there is almost no EPA or DHA in the diet.',
    iron: 'Check ferritin and haemoglobin in your yearly blood test.',
    calcium: 'Without dairy, calcium is easy to under-eat.',
    caffeine: 'Optional, before training.',
  },
  notWorthIt: {
    bcaa: { name: 'BCAAs and EAAs', why: 'Redundant once daily protein is adequate.' },
    testosterone: { name: 'Testosterone boosters', why: 'No meaningful effect in healthy men; some are spiked with banned drugs.' },
    fatBurners: { name: 'Fat burners', why: 'Mostly caffeine at a premium; some contain unsafe stimulants.' },
    massGainers: { name: 'Mass gainers', why: 'Expensive sugar and oil. Milk, banana, oats and peanut butter do the same for a fraction.' },
    preWorkout: { name: 'Proprietary pre-workout blends', why: 'Hidden doses. Plain caffeine is the part that works.' },
    glutamine: { name: 'Glutamine', why: 'No benefit to muscle growth in healthy people.' },
    detox: { name: 'Detox and cleanse products', why: 'The liver and kidneys already do this.' },
  },
  buySafely: 'Buy third-party tested products and avoid proprietary blends. Check with a doctor if you have a medical condition, take medication or are pregnant.',
  fasting:
    "Do not fast without a doctor's advice if you are pregnant or breastfeeding, diabetic on insulin or other glucose-lowering medicine, have or had an eating disorder, are under 18, or have kidney or heart disease. Your calorie and protein targets stay the same; fasting only changes when you eat.",
};
