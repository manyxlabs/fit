# Food data sources

Nutrient data: U.S. Department of Agriculture, Agricultural Research Service. FoodData Central. fdc.nal.usda.gov (CC0 1.0).
Every entry in `ingredients.json` comes from the SR Legacy dataset (final release, April 2018) and keeps its `fdcId` and USDA description.
Where USDA has no exact match for an Indian ingredient, the closest USDA food is used, and its `usdaName` shows which one.

Recipes in `recipes.json` are our own estimates.
Their ingredient weights, oil quantities and cooked weights are typical home-cooking amounts, not measured lab values.
`scripts/foods.mjs` combines both files into `src/data/foods.json`.
