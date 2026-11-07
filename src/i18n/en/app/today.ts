// The today area's copy (src/app/Today.tsx); see ../app.ts.
export default {
  calories: {
    title: 'Calories',
    logFood: 'Log food',
    /** {n} is a number of kcal; <s> is drawn smaller. */
    left: '{n} <s>kcal left</s>',
    over: '{n} <s>kcal over</s>',
    eaten: 'Eaten',
  },
  checkIn: {
    title: 'How are you today?',
    sleep: 'Sleep last night (h)',
    energy: 'Energy',
    /** A scale from 1 (worst) to 5, as the options of one list. */
    energyLevels: ['1 Drained', '2 Low', '3 Okay', '4 Good', '5 Great'],
    soreness: 'Soreness',
    /** Muscle soreness, from 1 (none) to 5. */
    sorenessLevels: ['1 None', '2 Mild', '3 Some', '4 Heavy', '5 Very heavy'],
    unwell: 'Feeling unwell?',
    sick: { none: 'No', aboveNeck: 'Only above the neck: runny nose, mild sore throat', belowNeck: 'Fever, body aches, chest or stomach symptoms' },
  },
  training: {
    title: 'Training',
    view: 'View',
    start: 'Start',
    /** {name} is the next workout, such as "Week 3 · Upper B". */
    next: 'Next up: <b>{name}</b>',
  },
  water: {
    title: 'Water',
    /** {n} and {target} are litres, such as "1.5 of 3.2 litres"; <s> is drawn smaller. */
    amount: '{n} <s>of {target} litres</s>',
  },
  body: {
    title: 'Body',
    weight: 'Weight (kg)',
    steps: 'Steps',
  },
  supplements: {
    title: 'Supplements',
    guide: 'Guide',
  },
  fasting: {
    title: 'Fasting',
    ramadan: 'Ramadan',
    navratri: 'Navratri',
    /** The live state; <b> is drawn bold, {time} is a clock time. */
    state: {
      ifEating: '<b>Eating window open</b>, closes at {time}',
      ifFasting: '<b>Fasting</b>, eating window opens at {time}',
      ramadanEating: '<b>Eating window open</b>, suhoor ends at {time}',
      ramadanFasting: '<b>Fasting</b>, iftar at {time}',
    },
    /** {fajr} and {maghrib} are clock times, drawn bold. */
    times: 'Suhoor ends <b>{fajr}</b> · Iftar <b>{maghrib}</b>',
    timesTomorrow: 'Tomorrow: Suhoor ends <b>{fajr}</b> · Iftar <b>{maghrib}</b>',
    /** {city} is a city name, kept in English. */
    cityHint: "Worked out for {city} from the sun's position (Fajr at 18 degrees); your mosque's timetable may differ by a few minutes.",
    vrat: 'Vrat today (Ekadashi or another fast day)',
    navratriHint: 'On for all of Navratri. Change it in More.',
    /** <a> links to the Food tab's day plan. */
    vratHint: 'Food search and the meal plan show only vrat foods. <a>Plan the day</a>',
  },
};
