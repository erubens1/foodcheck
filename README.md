# FoodCheck Nutrition Copilot

FoodCheck is a quick mobile web app for supermarket barcode checks. It scans or accepts a barcode, looks up the product in Open Food Facts, then returns a red/yellow/green result with reasons for selected health, gut health, athlete certification, religious, and personal dietary profiles.

The app also supports personalized goal checks for weight loss, muscle gain, prediabetes, high blood pressure, and marathon training. These recommendations are best-effort label screens based on available nutrition data, not a medical plan. The current heuristics emphasize calorie density, protein, fiber, sugar/carbohydrates, saturated fat, sodium, and training-fuel carbohydrate/protein balance.

The Nutrition Copilot panel supports two pre-decision workflows:

- Menu mode accepts pasted menu text or a menu photo. Photo OCR runs in the browser, then menu items are ranked for the user's selected goals.
- Shelf mode compares several products by barcode and optional price, then ranks best overall fit, highest protein, lowest sugar, and best value per gram of protein.

The FoodCheck Challenge panel adds a local social layer with 30-day protein, Mediterranean diet, and reduce sugar challenges. Streak progress is stored in the browser, and users can share challenge progress through the native share sheet or copied text.

## Judge-safe demo

Use this public no-auth path for automated judging:

```text
https://erubens1.github.io/foodcheck/?demo=judge
```

The `?demo=judge` path runs a seeded, no-network proof flow: it loads a demo barcode result, fills and analyzes a sample restaurant menu, builds a sample grocery shelf comparison, and completes one day of the 30-day protein challenge. It does not require login, camera permission, OAuth, payment, or a live third-party product lookup.

The same flow is available in the app through the **Run judge demo** button.

## Production-ready vs hackathon-grade

Production-ready in this prototype:

- Static mobile web app deployable on GitHub Pages with no backend required.
- Public no-auth demo path for judging and demos.
- Deterministic seeded demo data for barcode, menu, shelf, and challenge workflows.
- In-browser profile matching for health goals, gut health, athlete certification signals, religious rules, and personal preferences.
- Local browser storage for selected profiles, scan history, and challenge streaks.

Hackathon-grade and needing production hardening:

- Nutrition recommendations are rule-based screens, not medical advice or clinician-grade personalization.
- Open Food Facts and USDA data can be incomplete; production should add stronger source coverage, freshness checks, and confidence scoring.
- USDA currently uses the public `DEMO_KEY`; production should proxy a private key through a small backend or edge function.
- Menu photo OCR is browser-based and best-effort; production should add better menu item parsing and portion estimation.
- Certification checks look for label-data signals only; production should verify against official INFORMED and NSF product directories.

Opportunity metric: CDC data reports 40.1 million people in the U.S. with diabetes and 115.2 million U.S. adults with prediabetes, creating a large audience that makes frequent food decisions where fast nutrition guidance matters.

## Run locally

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`.

For phone camera access, serve the folder over HTTPS or open it from a localhost-capable mobile development setup. Browsers usually block camera access on plain `file://` pages and most non-local HTTP pages.

## Deploy on GitHub Pages

Use this folder as the project root. There is no build command and no output directory; GitHub Pages can serve the static files directly.

One straightforward setup:

1. Create a GitHub repository and add these files.
2. In the repository, open **Settings > Pages**.
3. Choose **Deploy from a branch**.
4. Select the branch that contains `index.html`, usually `main`.
5. Select `/root` as the folder.
6. Wait for GitHub to publish the site at `https://your-username.github.io/your-repo/`.

The `.nojekyll` file keeps GitHub Pages from running Jekyll processing. The app uses relative paths, so it works under a project URL like `/your-repo/`.

For phone camera access, use the published HTTPS GitHub Pages URL. Local files and plain HTTP pages usually cannot access the camera.

## Data source

Product data comes from a small client-side aggregator:

- Open Food Facts is the primary source for labels, ingredients, allergens, traces, product images, Nutri-Score, NOVA, and ingredient-analysis fields.
- USDA FoodData Central is used as a branded-food nutrition fallback when it has an exact UPC/GTIN match.

Missing or incomplete data is treated cautiously. The app shows source status after each lookup so shoppers can see whether the result used one source, merged sources, or sparse data.

The USDA lookup currently uses the public `DEMO_KEY`, which is fine for light testing but rate-limited. For a public app with more traffic, replace it with a tiny proxy such as a Cloudflare Worker so a real USDA API key is not exposed in GitHub Pages JavaScript.

Low FODMAP and other gut-health checks are best-effort ingredient screens. They are not medical advice, certified low-FODMAP testing, or a substitute for package labels and clinician/dietitian guidance.

Athlete certification checks look for label-data signals for Informed Sport, Informed Choice, and NSF Certified for Sport. For drug-tested athletes, always verify the exact product and batch in the official certification directory before use.
