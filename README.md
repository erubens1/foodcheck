# FoodLight Scanner

FoodLight is a quick mobile web app for supermarket barcode checks. It scans or accepts a barcode, looks up the product in Open Food Facts, then returns a red/yellow/green result with reasons for selected health, religious, and personal dietary profiles.

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

Product data comes from the Open Food Facts product API. The app uses the available label, ingredient, allergen, trace, nutrition, Nutri-Score, NOVA, and ingredient-analysis fields. Missing or incomplete data is treated cautiously.
