// The today area's health advice (src/app/Today.tsx); see ../health.ts.
export default {
  floored: 'Your pace would put you below a safe minimum, so the target is held there. Choose a slower pace in More.',
  /** Replaces "Next up: ..." on a day to train lighter; {name} is the workout, {pct} a whole number. */
  nextReduced: 'Next up: <b>{name}</b>, at about {pct}% of the sets',
  bodyHint: 'Weigh in each morning after the toilet; the trend matters, not any one day. Aim for 7,000-10,000 steps.',
  fasting: {
    /** Glasses of 250 ml for each part of a Ramadan night. */
    water: 'Water: {iftar} glasses at iftar, {evening} through the evening, {dinner} with dinner and {suhoor} at suhoor.',
    /** {g} is grams of protein for each of the three meals. */
    protein: 'Protein: about {g} g each at iftar, dinner and suhoor.',
    safety: 'Break the fast and see a doctor if you feel faint, dizzy, confused or unwell.',
  },
};
