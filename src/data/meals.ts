export const MEALS = { breakfast: 'Breakfast', lunch: 'Lunch', snacks: 'Snacks', dinner: 'Dinner' } as const;
export type Meal = keyof typeof MEALS;
