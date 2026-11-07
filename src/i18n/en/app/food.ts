// The food area's copy (src/app/Food.tsx, Plan.tsx); see ../app.ts.
export default {
  /** Nutrient names, as bar labels on Today and Food. */
  macros: { kcal: 'Calories', protein: 'Protein', carbs: 'Carbs', fat: 'Fat', fibre: 'Fibre' },
  /** The meals' names during Ramadan; lunch and dinner keep their usual names. */
  ramadanMeals: { breakfast: 'Suhoor', snacks: 'Iftar' },
  totals: 'Totals',
  copyYesterday: "Copy the previous day's food",
  /** Under a logged food: its weight and the protein in it. */
  entry: '{g} g · {protein} g protein',
  /** {name} is a food name. */
  remove: 'Remove {name}',
  addFood: '+ Add food',
  picker: {
    vrat: 'Vrat: showing vrat foods only.',
    /** The examples are foods people search for; keep them as people in this language would type them. */
    search: 'Search: roti, dal, paneer, egg, chicken…',
    searchLabel: 'Search foods',
    recent: 'Recent',
    per100: '{kcal} kcal · {protein} g protein / 100 g',
    noMatch: 'No match. Add it as your own food below.',
    addOwn: 'Add your own food',
    cancel: 'Cancel',
  },
  amount: {
    amount: 'Amount',
    unit: 'Unit',
    /** The unit for weighing a food in grams, in the list of units. */
    grams: 'grams',
    /** A serving unit (kept in English, such as "katori") and its weight. */
    unitGrams: '{unit} ({g} g)',
    /** What the chosen amount holds; <b> is drawn bold. */
    summary: '{g} g: <b>{kcal} kcal</b>, {protein} g protein, {carbs} g carbs, {fat} g fat',
    add: 'Add',
    back: 'Back',
  },
  custom: {
    /** <b> is drawn bold. */
    heading: '<b>Your own food</b>, as one serving from its label or recipe',
    name: 'Name',
    serving: 'Serving (g)',
    protein: 'Protein (g)',
    carbs: 'Carbs (g)',
    fat: 'Fat (g)',
    fibre: 'Fibre (g)',
    type: 'Type',
    diet: { vegan: 'Vegan', veg: 'Vegetarian', egg: 'Contains egg', nonveg: 'Meat or fish' },
    vrat: 'Fine to eat on a vrat day',
    save: 'Save food',
    cancel: 'Cancel',
  },
  plan: {
    title: 'Plan my day',
    none: 'No meal plan fits these food choices yet. Add foods to each meal below instead.',
    shuffle: 'Shuffle',
    vrat: 'Vrat: only vrat foods.',
    /** {meal} is a meal such as Breakfast, {name} the dish, kept in English. */
    mealTitle: '{meal}: {name}',
    mealTotals: '{kcal} kcal · {protein} g protein',
    /** {count} of a serving unit kept in English (such as "katori"), and the weight. */
    item: '{count} × {unit}, {g} g',
    logged: 'Logged',
    log: { breakfast: 'Log breakfast', lunch: 'Log lunch', snacks: 'Log snacks', dinner: 'Log dinner' },
    logRamadan: { breakfast: 'Log suhoor', snacks: 'Log iftar' },
    /** <b> is drawn bold; the plan's calories and protein against the day's targets. */
    totals: 'Plan: <b>{kcal}</b> of {targetKcal} kcal, <b>{protein}</b> of {targetProtein} g protein',
    logDay: 'Log whole day',
    dayLogged: 'Whole day logged',
  },
};
