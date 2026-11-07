---
title: Calories and TDEE
description: How to estimate how many calories you burn a day with BMR and activity factors, set a target for your goal, and correct it with real data.
order: 2
---

Every goal, whether losing fat, gaining muscle or holding steady, starts with one number: how many calories you burn in a day.
That number is your total daily energy expenditure, or TDEE.
You can estimate it in a minute with a formula, and then sharpen it with a few weeks of your own data.

## Step 1: BMR, the calories you burn at rest

Basal metabolic rate (BMR) is what your body uses to stay alive at rest: breathing, circulation, brain, organs.
For most people it is the largest part of the day's burn.

The app uses the Mifflin-St Jeor equation, the one most widely validated for the general population:

- **Men:** BMR = 10 x weight (kg) + 6.25 x height (cm) - 5 x age (years) + 5
- **Women:** BMR = 10 x weight (kg) + 6.25 x height (cm) - 5 x age (years) - 161

If you know your body-fat percentage, the [TDEE calculator](/calculators/tdee/) can use the Katch-McArdle formula instead, which works from lean mass and suits very muscular or very lean people better.
You can estimate body fat with the [body-fat calculator](/calculators/body-fat/).

## Step 2: TDEE, BMR times your activity

TDEE adds everything you do on top of resting: work, walking, training, even fidgeting.
It is estimated by multiplying BMR by an activity factor.

| Activity level | What it looks like | Factor |
| --- | --- | --- |
| Sedentary | Desk job, little exercise | 1.2 |
| Lightly active | Training 1-3 days a week | 1.375 |
| Moderately active | Training 3-5 days a week | 1.55 |
| Very active | Hard training 6-7 days, or a physical job plus training | 1.725 |
| Extremely active | Twice-daily training or heavy manual work | 1.9 |

Choose the level that describes your whole day, not just your gym hours.
A software engineer who lifts four times a week but sits for ten hours may be closer to lightly active than moderately active.
A delivery rider or a trainer who is on their feet all day may sit a level higher than their training days alone suggest.
When in doubt, pick the lower level; real data will correct you either way.

## Step 3: set a target for your goal

The app sets your calories from how fast you want your weight to change, as a percentage of body weight per week.
It uses the common estimate that a kilogram of body-weight change is worth about 7,700 kcal.

| Goal | Weekly change | Default |
| --- | --- | --- |
| Fat loss | Lose 0.25-1% of body weight | 0.5% |
| Lean gain | Gain 0.1-0.5% of body weight | 0.25% |
| Maintain or recomposition | No change | Eat at TDEE |

The daily adjustment is the weekly change in kg x 7,700 / 7.

The target never goes below **1,500 kcal for men** or **1,200 kcal for women**.
Below those floors it becomes hard to cover protein, vitamins and minerals, and a diet that low should be supervised by a doctor or dietitian.
If your chosen pace would take you under the floor, the app holds you at the floor and tells you.

## Worked example

Rahul is 25, weighs 75 kg, is 175 cm tall and trains four days a week.

| Step | Calculation | Result |
| --- | --- | --- |
| BMR | 750 + 1,093.75 - 125 + 5 | about 1,724 kcal |
| TDEE | 1,724 x 1.55 | about 2,672 kcal |
| Fat loss at 0.5% a week | 0.375 kg x 7,700 / 7 = about 412 kcal less | about 2,260 kcal |
| Lean gain at 0.25% a week | 0.19 kg x 7,700 / 7 = about 206 kcal more | about 2,880 kcal |

Priya is 30, weighs 60 kg, is 160 cm tall and does yoga twice a week.
Her BMR is 600 + 1,000 - 150 - 161 = 1,289 kcal, and her TDEE at 1.375 is about 1,772 kcal.
Losing 0.5% a week (0.3 kg) means eating about 330 kcal less, so roughly 1,440 kcal, comfortably above the 1,200 kcal floor.

Run your own numbers with the [TDEE calculator](/calculators/tdee/).

## A quick word on BMI

BMI is weight (kg) divided by height (m) squared.
For South Asians, the WHO Asia-Pacific cut-offs are more useful than the global ones, because health risks such as type 2 diabetes rise at a lower BMI.

| BMI | Asian cut-off |
| --- | --- |
| Below 18.5 | Underweight |
| 18.5-22.9 | Healthy |
| 23-24.9 | Overweight |
| 25 and above | Obese |

BMI cannot tell muscle from fat, so a well-trained lifter can read as overweight while being lean.
Pair it with your waist measurement: keeping your waist under half your height is a good rule of thumb.
Check yours with the [BMI calculator](/calculators/bmi/).

## Step 4: calibrate with real data

Formulas are estimates and are often off by 5-10%, which can be 150-250 kcal a day.
Your real maintenance shows up in your own logs.

### How to do it by hand

1. Eat your estimated target consistently for two weeks.
2. Weigh yourself every morning, after the toilet and before food, and look at the weekly average, not single days.
3. If the average is moving at the pace you planned, the estimate is right.
4. If it is not, adjust by about 200 kcal and give it another two weeks.

Daily weight can swing by a kilo or more from salt, water, a heavy dinner or your menstrual cycle.
The weekly average is what matters.

### How the app does it

If you log your food and weight in the [tracker](/app/), it works out your real maintenance for you after 2-4 weeks of logs.
It needs at least 8 weigh-ins and 10 days of food logs across about two weeks before it will give a number.

The idea is simple: whatever you ate, minus what went into or came out of storage, is what you burned.

**Adaptive maintenance = average daily intake - (weight trend's slope in kg per day x 7,700)**

The slope is a straight-line fit through all your weigh-ins, so one salty dinner does not throw it off.

For example, if you averaged 2,400 kcal a day and your weight fell by 0.3 kg a week (about 0.043 kg a day), your stored energy dropped by about 330 kcal a day.
Your real maintenance is about 2,400 + 330 = 2,730 kcal.

The more consistently you log, the better this number gets.
Log the oil, ghee and the second helping too; they are where most of the error hides.

## Next steps

- Split your calories into protein, fat and carbs with [macros explained](/guides/macros-explained/).
- Planning to lose weight? Read [fat loss](/guides/fat-loss/).
- Planning to gain? Read [lean bulk](/guides/lean-bulk/).

This is general information, not medical advice; see a doctor or registered dietitian if you have a medical condition, are pregnant, or plan a very low-calorie diet.
