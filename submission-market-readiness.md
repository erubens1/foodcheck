# FoodCheck Submission Fix: Target Market + Investment Readiness

## Target Customer & Market Scope

FoodCheck targets health-conscious consumers who make frequent food decisions but do not want to manually log every meal. The beachhead customer is a mobile-first grocery shopper or restaurant diner who is actively managing one of five high-frequency nutrition goals: weight loss, muscle gain, prediabetes/diabetes risk, high blood pressure, or athletic performance.

The initial market is U.S. adults who already have a reason to care about food labels but find existing nutrition tools too tedious. This includes people trying to lose weight, people tracking protein, people managing blood sugar or sodium, athletes comparing grocery products, and families trying to make healthier choices at restaurants and supermarkets. The product starts as a consumer app because the decision happens in the aisle, at the menu, or at the plate. Over time, the buyer can expand to B2B2C channels such as employers, health plans, nutrition coaches, gyms, grocery retailers, and wellness programs that want lightweight food-decision support without a heavy clinical backend.

The market is large enough for a venture-scale wedge because the nutrition problem is not limited to one niche diet. CDC data reports 40.1 million people in the U.S. with diabetes and 115.2 million U.S. adults with prediabetes. CDC/NCHS also reports adult obesity prevalence of 40.3% in 2021-2023. Those are only two health-driven segments; they do not include athletes, people pursuing weight-loss goals without a diagnosis, food-sensitive shoppers, or families using nutrition apps for general wellness.

FoodCheck’s beachhead is not “everyone who eats.” It is specifically people who already have a nutrition objective and currently abandon tracking because it takes too much work. That makes the first target market:

1. U.S. mobile users who check nutrition labels or use diet/fitness apps.
2. Users managing weight, blood sugar, sodium, protein, or dietary restrictions.
3. Grocery and restaurant shoppers who need a decision before they buy, not a calorie log after they eat.

## Differentiation & Investment Readiness

Most nutrition products are post-meal logging tools. They ask users to search a database, estimate portions, and enter food after the decision has already been made. FoodCheck is positioned as a pre-decision nutrition copilot.

The differentiated wedge is that FoodCheck helps users choose before they buy or eat:

- Scan a grocery item and get a red/yellow/green recommendation for personal goals and restrictions.
- Point at or paste a restaurant menu and rank likely better choices, such as highest protein or lowest sugar.
- Compare a grocery shelf and rank products by high protein, low sugar, and value per gram of protein.
- Join social challenges like a 30-day protein challenge or reduce sugar challenge to turn nutrition decisions into streaks.

This makes FoodCheck more than a calorie counter. It is a decision layer for food. The app combines barcode lookup, Open Food Facts, USDA fallback nutrition data, menu OCR, profile-based recommendations, and local streak tracking in a static mobile-first web app that can deploy cheaply on GitHub Pages.

The current prototype has four measurable proof points:

1. A barcode or sample product produces a traffic-light recommendation with reasons and source status.
2. A menu sample produces ranked meal recommendations before ordering.
3. A shelf comparison ranks products by highest protein, lowest sugar, best fit, and best value per gram of protein.
4. A FoodCheck Challenge flow lets users join a 30-day challenge, complete today, track a streak, and generate share text.

Because this is a hackathon prototype, we are not claiming external customer traction yet. Instead, the first impact metrics are product-usage metrics we can validate in a pilot:

- Time to nutrition decision: target under 15 seconds from scan/photo/text to recommendation.
- Weekly engagement: target 10 food checks per active user per week.
- Comparison behavior: target at least 3 products or menu items compared in shopping/restaurant sessions.
- Habit formation: target 30% of users completing at least 7 challenge days in their first month.
- Decision usefulness: target 70% of pilot users reporting that FoodCheck changed or confirmed a food choice.

These metrics map directly to the product thesis: FoodCheck wins if it reduces food-decision friction enough that people use it repeatedly in real buying moments.

## Short Paste-Ready Version

FoodCheck targets mobile-first grocery shoppers and restaurant diners who already have a nutrition reason to care but abandon traditional food tracking because it is too much work. The beachhead customer is a U.S. adult managing weight loss, muscle gain, prediabetes/diabetes risk, high blood pressure, athletic fueling, or dietary restrictions. The initial buyer is the consumer, with a path to B2B2C distribution through employers, health plans, nutrition coaches, gyms, grocery retailers, and wellness programs.

This is a large market because the problem spans multiple health and wellness segments. CDC data reports 40.1 million people in the U.S. with diabetes and 115.2 million U.S. adults with prediabetes. CDC/NCHS also reports adult obesity prevalence of 40.3% in 2021-2023. These segments alone represent tens of millions of people who make daily food decisions where nutrition visibility matters.

FoodCheck is differentiated from calorie counters because it is a pre-decision nutrition copilot, not just a post-meal log. It helps users decide before they buy or eat: scan a product, compare a grocery shelf, analyze a restaurant menu, or join a nutrition challenge. The prototype demonstrates four measurable workflows: barcode traffic-light recommendations, menu ranking, shelf comparison by protein/sugar/value, and 30-day challenge streaks.

We are not claiming external traction yet. Our first pilot metrics will be time to recommendation under 15 seconds, 10 food checks per active user per week, at least 3 compared products or menu items per shopping/restaurant session, 30% of users completing at least 7 challenge days in their first month, and 70% of pilot users reporting that FoodCheck changed or confirmed a food choice.

## Sources

- CDC National Diabetes Statistics Report: https://www.cdc.gov/diabetes/php/data-research/index.html
- CDC/NCHS adult obesity data brief: https://www.cdc.gov/nchs/products/databriefs/db508.htm
