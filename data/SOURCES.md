# Food data sources

Nutrient data: U.S. Department of Agriculture, Agricultural Research Service. FoodData Central. fdc.nal.usda.gov (CC0 1.0).
Every entry in `ingredients.json` with an `fdcId` comes from FoodData Central and keeps its USDA description in `usdaName`.
Almost all come from the SR Legacy dataset (final release, April 2018).
Where USDA has no exact match for an Indian ingredient, the closest USDA food is used, and its `usdaName` shows which one.
Roasted makhana (fdcId 2447156) comes from the Branded Foods dataset, the only FoodData Central record of popped makhana with plain seasoning (water lily seeds, sunflower oil, pink salt).

Branded Indian products carry a `source` URL instead of an `fdcId`.
Their values are the brand's own nutrition label as shown on that page, converted to per 100 g, with 100 ml counted as 100 g.
Labels that list no fibre are entered as 0 g fibre.

Ragi (finger millet), singhara (water chestnut flour) and samak (barnyard millet) are missing on purpose.
FoodData Central has no record of them, and the FAO/INFOODS tables that do are licensed CC BY-NC-SA 3.0 IGO, which does not allow use in an MIT-licensed app.
IFCT 2017 and INDB are not used: IFCT needs NIN's permission and INDB has no licence.

`vrat: true` marks an ingredient that is commonly eaten on Navratri, Ekadashi and other vrat days.
A recipe counts as vrat food only when every one of its ingredients does, so `scripts/foods.mjs` works that out and recipes never set it.
Customs differ between families and regions; the list follows the common North and West Indian practice.

Recipes in `recipes.json` are our own estimates.
Their ingredient weights, oil quantities and cooked weights are typical home-cooking amounts, not measured lab values.
`scripts/foods.mjs` combines both files into `src/data/foods.json`.
