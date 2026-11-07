// Builds src/data/foods.json from data/ingredients.json (USDA) and data/recipes.json (our recipes).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const fail = (message) => {
  throw new Error(message);
};

const NUTRIENTS = ['kcal', 'protein', 'carbs', 'fat', 'fibre'];
// Least to most permissive: a dish takes the most permissive diet among its ingredients.
const DIETS = ['vegan', 'veg', 'egg', 'nonveg'];

function checkUnits(where, units) {
  if (!Array.isArray(units) || units.length === 0) fail(`${where}: units must be a non-empty array`);
  for (const unit of units) {
    if (!Array.isArray(unit) || unit.length !== 2 || typeof unit[0] !== 'string' || !unit[0] || !(unit[1] > 0)) {
      fail(`${where}: bad unit ${JSON.stringify(unit)}`);
    }
  }
}

function checkDiet(where, diet) {
  if (!DIETS.includes(diet)) fail(`${where}: diet must be one of ${DIETS.join(', ')}, got ${JSON.stringify(diet)}`);
}

// Only `true` is allowed, so a food is vrat-friendly only when someone said so.
function checkVrat(where, vrat) {
  if (vrat !== undefined && vrat !== true) fail(`${where}: vrat must be true or absent`);
}

const ingredients = new Map();
for (const item of read('data/ingredients.json')) {
  const where = `ingredient ${JSON.stringify(item.key)}`;
  if (typeof item.key !== 'string' || !item.key) fail(`${where}: missing key`);
  if (ingredients.has(item.key)) fail(`${where}: duplicate key`);
  checkDiet(where, item.diet);
  if (!Number.isInteger(item.fdcId) && !/^https:\/\//.test(item.source)) fail(`${where}: needs a USDA fdcId or a brand label source URL`);
  checkVrat(where, item.vrat);
  for (const n of NUTRIENTS) {
    if (typeof item[n] !== 'number' || !(item[n] >= 0)) fail(`${where}: ${n} must be a non-negative number`);
  }
  if (item.carbs < item.fibre || item.protein + item.carbs + item.fat > 100) fail(`${where}: impossible macros`);
  // Fibre counted at 2 kcal/g. USDA's food-specific Atwater factors drift up to ~15% from the generic
  // ones on vegetables and protein isolates; the 10 kcal floor covers near-zero foods like lemon juice.
  const atwater = 4 * item.protein + 4 * item.carbs - 2 * item.fibre + 9 * item.fat;
  if (Math.abs(item.kcal - atwater) > Math.max(0.15 * item.kcal, 10)) {
    fail(`${where}: kcal ${item.kcal} disagrees with macros (${atwater.toFixed(0)} kcal)`);
  }
  if (item.plain) {
    if (typeof item.name !== 'string' || !item.name) fail(`${where}: plain food needs a name`);
    checkUnits(where, item.units);
  }
  ingredients.set(item.key, item);
}

const round = (value, n) => Number(value.toFixed(n));
const food = ({ name, aliases, diet, units }, per100g, vrat) => ({
  name,
  ...(aliases && { aliases }),
  diet,
  ...(vrat && { vrat }),
  ...Object.fromEntries(NUTRIENTS.map((n) => [n, round(per100g[n], n === 'kcal' ? 0 : 1)])),
  units,
});

const foods = [...ingredients.values()].filter((item) => item.plain).map((item) => food(item, item, item.vrat));

for (const recipe of read('data/recipes.json')) {
  const where = `recipe ${JSON.stringify(recipe.name)}`;
  if (typeof recipe.name !== 'string' || !recipe.name) fail(`${where}: missing name`);
  checkDiet(where, recipe.diet);
  checkUnits(where, recipe.units);
  if (recipe.aliases && !(Array.isArray(recipe.aliases) && recipe.aliases.every((a) => typeof a === 'string' && a))) {
    fail(`${where}: aliases must be non-empty strings`);
  }
  if (!(recipe.cookedGrams > 0)) fail(`${where}: cookedGrams must be positive`);
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) fail(`${where}: no ingredients`);
  const total = Object.fromEntries(NUTRIENTS.map((n) => [n, 0]));
  if ('vrat' in recipe) fail(`${where}: vrat comes from its ingredients, do not set it`);
  let diet = 0;
  let vrat = true;
  for (const [key, grams] of recipe.ingredients) {
    const item = ingredients.get(key) ?? fail(`${where}: unknown ingredient ${JSON.stringify(key)}`);
    if (!(grams > 0)) fail(`${where}: ${key} grams must be positive`);
    for (const n of NUTRIENTS) total[n] += (item[n] * grams) / 100;
    diet = Math.max(diet, DIETS.indexOf(item.diet));
    vrat &&= item.vrat === true;
  }
  if (recipe.diet !== DIETS[diet]) fail(`${where}: diet is ${recipe.diet} but its ingredients make it ${DIETS[diet]}`);
  foods.push(food(recipe, Object.fromEntries(NUTRIENTS.map((n) => [n, (total[n] / recipe.cookedGrams) * 100])), vrat));
}

const names = new Set();
for (const { name } of foods) {
  const key = name.toLowerCase();
  if (names.has(key)) fail(`duplicate food name ${JSON.stringify(name)}`);
  names.add(key);
}

// Names in each Indian language's script, so search finds a food however it is typed; the food's
// name itself stays English everywhere, as menus and packs in India print it.
const byName = new Map(foods.map((f) => [f.name, f]));
for (const file of readdirSync(new URL('data/aliases/', root)).filter((f) => f.endsWith('.json')).sort()) {
  for (const [name, list] of Object.entries(read(`data/aliases/${file}`))) {
    const f = byName.get(name) ?? fail(`data/aliases/${file}: no food ${JSON.stringify(name)}`);
    if (!Array.isArray(list) || !list.every((a) => typeof a === 'string' && a.trim() === a && a)) fail(`data/aliases/${file}: ${name}: aliases must be trimmed, non-empty strings`);
    f.aliases = [...new Set([...(f.aliases ?? []), ...list])];
  }
}
// Aliases next to the name, where food() puts them, so the file reads the same either way.
for (const [i, { name, aliases, ...rest }] of foods.entries()) foods[i] = { name, ...(aliases && { aliases }), ...rest };

writeFileSync(new URL('src/data/foods.json', root), `[\n${foods.map((f) => JSON.stringify(f)).join(',\n')}\n]\n`);
console.log(`Wrote ${foods.length} foods to src/data/foods.json`);
