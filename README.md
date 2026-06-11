# FoodLight Scanner

FoodLight is a quick mobile web app for supermarket barcode checks. It scans or accepts a barcode, looks up the product in Open Food Facts, then returns a red/yellow/green result with reasons for selected health, gut health, athlete certification, religious, and personal dietary profiles.

The app also supports personalized goal checks for weight loss, muscle gain, prediabetes, high blood pressure, and marathon training. These recommendations are best-effort label screens based on available nutrition data, not a medical plan. The current heuristics emphasize calorie density, protein, fiber, sugar/carbohydrates, saturated fat, sodium, and training-fuel carbohydrate/protein balance.

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
