// The progress area's health advice; see ../health.ts.
export default {
  /** The weekly review on the Progress tab: one suggestion at a time, the most important first. */
  review: {
    noFood: 'Log your food for a week to get a review here.',
    /** Grams of protein a day: the week's average and the target. */
    protein: 'Protein averaged {avg} g against {target} g. Add a protein source to two meals: curd, paneer, eggs, chicken, soya chunks or a whey shake.',
    sleep: 'Sleep averaged {hours} hours. Getting to 7-9 does more for recovery than any supplement.',
    workouts: 'Fewer workouts than planned this week. If the plan is too much, set fewer days in More; consistency beats ambition.',
    notGaining: 'Weight did not go up this week. If that holds for a second week, add 150-250 kcal a day.',
    notLosing: 'Weight did not go down this week. If that holds for a second week, cut 150-250 kcal or add 2,000 daily steps.',
    onTrack: 'On track. Keep everything the same next week.',
  },
};
