const ZXING_CDN = "https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm";
const TESSERACT_CDN = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
const OFF_PRODUCT_ENDPOINT = "https://world.openfoodfacts.org/api/v2/product/";
const USDA_SEARCH_ENDPOINT = "https://api.nal.usda.gov/fdc/v1/foods/search";
const USDA_API_KEY = "DEMO_KEY";
const SAMPLE_BARCODE = "3017620422003";
const JUDGE_DEMO_BARCODE = "000000000001";
const STORAGE_KEYS = {
  selected: "foodlight:selectedProfiles",
  history: "foodlight:history",
  challenges: "foodlight:challenges"
};

const defaultProfiles = ["general-health"];

const challengeTemplates = [
  {
    id: "protein-30",
    title: "30-day protein challenge",
    durationDays: 30,
    chip: "Build muscle",
    description: "Hit a protein-forward choice each day.",
    dailyGoal: "Choose a food with at least 10 g protein per 100 g, or log a protein-focused meal.",
    sharePrompt: "I am building a protein streak with FoodCheck."
  },
  {
    id: "mediterranean-30",
    title: "Mediterranean diet challenge",
    durationDays: 30,
    chip: "Heart-smart",
    description: "Stack days with fish, legumes, whole grains, vegetables, nuts, or olive oil.",
    dailyGoal: "Pick one Mediterranean-style food or meal each day.",
    sharePrompt: "I am building a Mediterranean eating streak with FoodCheck."
  },
  {
    id: "reduce-sugar-30",
    title: "Reduce sugar challenge",
    durationDays: 30,
    chip: "Lower sugar",
    description: "Choose lower-sugar foods and dodge sneaky sweet picks.",
    dailyGoal: "Choose an option with under 5 g sugar per 100 g, or skip a sugary item.",
    sharePrompt: "I am reducing sugar one day at a time with FoodCheck."
  }
];

const dom = {
  startScan: document.querySelector("#startScan"),
  stopScan: document.querySelector("#stopScan"),
  video: document.querySelector("#videoPreview"),
  scannerFrame: document.querySelector("#scannerFrame"),
  cameraEmpty: document.querySelector("#cameraEmpty"),
  cameraResultOverlay: document.querySelector("#cameraResultOverlay"),
  cameraResultLabel: document.querySelector("#cameraResultLabel"),
  cameraResultTitle: document.querySelector("#cameraResultTitle"),
  cameraResultReason: document.querySelector("#cameraResultReason"),
  manualForm: document.querySelector("#manualForm"),
  barcodeInput: document.querySelector("#barcodeInput"),
  sampleProduct: document.querySelector("#sampleProduct"),
  clearHistory: document.querySelector("#clearHistory"),
  runJudgeDemo: document.querySelector("#runJudgeDemo"),
  judgeDemoStatus: document.querySelector("#judgeDemoStatus"),
  statusText: document.querySelector("#statusText"),
  profileGroups: document.querySelector("#profileGroups"),
  resetProfiles: document.querySelector("#resetProfiles"),
  confidencePill: document.querySelector("#confidencePill"),
  resultCard: document.querySelector("#resultCard"),
  resultHeadline: document.querySelector("#resultHeadline"),
  resultReason: document.querySelector("#resultReason"),
  productSummary: document.querySelector("#productSummary"),
  productImage: document.querySelector("#productImage"),
  productName: document.querySelector("#productName"),
  productMeta: document.querySelector("#productMeta"),
  sourceSummary: document.querySelector("#sourceSummary"),
  sourceList: document.querySelector("#sourceList"),
  checkList: document.querySelector("#checkList"),
  menuModeButton: document.querySelector("#menuModeButton"),
  shelfModeButton: document.querySelector("#shelfModeButton"),
  menuCopilotMode: document.querySelector("#menuCopilotMode"),
  shelfCopilotMode: document.querySelector("#shelfCopilotMode"),
  menuImageInput: document.querySelector("#menuImageInput"),
  sampleMenu: document.querySelector("#sampleMenu"),
  analyzeMenu: document.querySelector("#analyzeMenu"),
  menuTextInput: document.querySelector("#menuTextInput"),
  menuCopilotResults: document.querySelector("#menuCopilotResults"),
  shelfForm: document.querySelector("#shelfForm"),
  shelfBarcodeInput: document.querySelector("#shelfBarcodeInput"),
  shelfPriceInput: document.querySelector("#shelfPriceInput"),
  sampleShelf: document.querySelector("#sampleShelf"),
  clearShelf: document.querySelector("#clearShelf"),
  shelfList: document.querySelector("#shelfList"),
  shelfCopilotResults: document.querySelector("#shelfCopilotResults"),
  challengeStatusPill: document.querySelector("#challengeStatusPill"),
  challengeGrid: document.querySelector("#challengeGrid"),
  challengeProgress: document.querySelector("#challengeProgress"),
  activeChallengeLabel: document.querySelector("#activeChallengeLabel"),
  activeChallengeName: document.querySelector("#activeChallengeName"),
  activeChallengeDetail: document.querySelector("#activeChallengeDetail"),
  challengeStreak: document.querySelector("#challengeStreak"),
  challengeCompleted: document.querySelector("#challengeCompleted"),
  challengeProgressBar: document.querySelector("#challengeProgressBar"),
  completeChallengeToday: document.querySelector("#completeChallengeToday"),
  shareChallenge: document.querySelector("#shareChallenge"),
  shareCard: document.querySelector("#shareCard"),
  shareCardTitle: document.querySelector("#shareCardTitle"),
  shareCardStats: document.querySelector("#shareCardStats"),
  shareCardNote: document.querySelector("#shareCardNote"),
  challengeShareStatus: document.querySelector("#challengeShareStatus"),
  historyList: document.querySelector("#historyList")
};

const state = {
  selectedProfiles: new Set(loadJson(STORAGE_KEYS.selected, defaultProfiles)),
  history: loadJson(STORAGE_KEYS.history, []),
  challenges: loadChallengeState(),
  activeProduct: null,
  shelfItems: [],
  scanner: {
    stream: null,
    detector: null,
    nativeLoop: 0,
    zxingReader: null,
    zxingControls: null,
    busy: false,
    lastCode: "",
    lastAt: 0
  }
};

const profiles = [
  {
    id: "goal-lose-20",
    group: "Personalized goals",
    label: "Lose 20 lbs",
    evaluate: evaluateLoseWeightGoal
  },
  {
    id: "goal-gain-muscle",
    group: "Personalized goals",
    label: "Gain muscle",
    evaluate: evaluateGainMuscleGoal
  },
  {
    id: "prediabetic",
    group: "Personalized goals",
    label: "Prediabetic",
    evaluate: evaluatePrediabeticGoal
  },
  {
    id: "high-blood-pressure",
    group: "Personalized goals",
    label: "High blood pressure",
    evaluate: evaluateBloodPressureGoal
  },
  {
    id: "marathon-training",
    group: "Personalized goals",
    label: "Marathon training",
    evaluate: evaluateMarathonTrainingGoal
  },
  {
    id: "general-health",
    group: "Health",
    label: "General wellness",
    evaluate: evaluateGeneralHealth
  },
  {
    id: "diabetes-aware",
    group: "Health",
    label: "Diabetes aware",
    evaluate: evaluateDiabetesAware
  },
  {
    id: "low-sodium",
    group: "Health",
    label: "Low sodium",
    evaluate: evaluateLowSodium
  },
  {
    id: "low-sugar",
    group: "Health",
    label: "Low sugar",
    evaluate: evaluateLowSugar
  },
  {
    id: "low-fodmap",
    group: "Gut health",
    label: "Low FODMAP",
    evaluate: evaluateLowFodmap
  },
  {
    id: "lactose-sensitive",
    group: "Gut health",
    label: "Lactose sensitive",
    evaluate: evaluateLactoseSensitive
  },
  {
    id: "reflux-aware",
    group: "Gut health",
    label: "Reflux aware",
    evaluate: evaluateRefluxAware
  },
  {
    id: "sensitive-gut-additives",
    group: "Gut health",
    label: "Sensitive gut additives",
    evaluate: evaluateSensitiveGutAdditives
  },
  {
    id: "fiber-support",
    group: "Gut health",
    label: "Fiber support",
    evaluate: evaluateFiberSupport
  },
  {
    id: "informed-certified",
    group: "Athlete certifications",
    label: "INFORMED certified",
    evaluate: evaluateInformedCertified
  },
  {
    id: "nsf-sport-certified",
    group: "Athlete certifications",
    label: "NSF Certified for Sport",
    evaluate: evaluateNsfSportCertified
  },
  {
    id: "halal",
    group: "Religious",
    label: "Halal",
    evaluate: evaluateHalal
  },
  {
    id: "kosher",
    group: "Religious",
    label: "Kosher",
    evaluate: evaluateKosher
  },
  {
    id: "no-pork",
    group: "Religious",
    label: "No pork",
    evaluate: evaluateNoPork
  },
  {
    id: "no-alcohol",
    group: "Religious",
    label: "No alcohol",
    evaluate: evaluateNoAlcohol
  },
  {
    id: "vegan",
    group: "Personal",
    label: "Vegan",
    evaluate: evaluateVegan
  },
  {
    id: "vegetarian",
    group: "Personal",
    label: "Vegetarian",
    evaluate: evaluateVegetarian
  },
  {
    id: "gluten-free",
    group: "Personal",
    label: "Gluten-free",
    evaluate: evaluateGlutenFree
  },
  {
    id: "dairy-free",
    group: "Personal",
    label: "Dairy-free",
    evaluate: evaluateDairyFree
  },
  {
    id: "nut-free",
    group: "Personal",
    label: "Nut-free",
    evaluate: evaluateNutFree
  },
  {
    id: "palm-oil-free",
    group: "Personal",
    label: "Palm oil free",
    evaluate: evaluatePalmOilFree
  }
];

const productFields = [
  "code",
  "product_name",
  "generic_name",
  "brands",
  "quantity",
  "labels",
  "image_front_small_url",
  "image_front_url",
  "image_url",
  "nutriscore_grade",
  "nova_group",
  "ecoscore_grade",
  "labels_tags",
  "categories_tags",
  "ingredients_tags",
  "ingredients_text",
  "ingredients_text_en",
  "allergens_tags",
  "traces_tags",
  "additives_tags",
  "nutriments",
  "ingredients_analysis_tags",
  "attribute_groups"
];

init();

function init() {
  renderProfiles();
  renderHistory();
  renderChallenges();
  bindEvents();
  refreshActiveEvaluation();
  analyzeMenuText();
  renderShelfList();
  renderShelfCopilot();

  if (new URLSearchParams(window.location.search).get("demo") === "judge") {
    window.setTimeout(runJudgeDemo, 0);
  }

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

function bindEvents() {
  dom.startScan.addEventListener("click", startScanner);
  dom.stopScan.addEventListener("click", stopScanner);
  dom.manualForm.addEventListener("submit", event => {
    event.preventDefault();
    const code = cleanBarcode(dom.barcodeInput.value);
    if (!code) {
      setStatus("Enter a valid barcode number.");
      return;
    }
    handleBarcode(code);
  });
  dom.sampleProduct.addEventListener("click", () => handleBarcode(JUDGE_DEMO_BARCODE));
  dom.runJudgeDemo.addEventListener("click", runJudgeDemo);
  dom.clearHistory.addEventListener("click", () => {
    state.history = [];
    saveJson(STORAGE_KEYS.history, state.history);
    renderHistory();
  });
  dom.resetProfiles.addEventListener("click", () => {
    state.selectedProfiles = new Set(defaultProfiles);
    saveSelectedProfiles();
    renderProfiles();
    refreshActiveEvaluation();
    analyzeMenuText();
    renderShelfCopilot();
  });
  dom.menuModeButton.addEventListener("click", () => setCopilotMode("menu"));
  dom.shelfModeButton.addEventListener("click", () => setCopilotMode("shelf"));
  dom.sampleMenu.addEventListener("click", () => {
    dom.menuTextInput.value = sampleMenuText();
    analyzeMenuText();
  });
  dom.analyzeMenu.addEventListener("click", analyzeMenuText);
  dom.menuImageInput.addEventListener("change", handleMenuImage);
  dom.shelfForm.addEventListener("submit", event => {
    event.preventDefault();
    addShelfBarcode();
  });
  dom.sampleShelf.addEventListener("click", addSampleShelf);
  dom.clearShelf.addEventListener("click", () => {
    state.shelfItems = [];
    renderShelfList();
    renderShelfCopilot();
  });
  dom.completeChallengeToday.addEventListener("click", completeTodayChallenge);
  dom.shareChallenge.addEventListener("click", shareActiveChallenge);
}

async function startScanner() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("Camera access is not available in this browser.");
    return;
  }

  await stopScanner();
  hideCameraResult();
  setStatus("Starting camera...");
  dom.startScan.disabled = true;

  try {
    if (window.BarcodeDetector) {
      await startNativeScanner();
    } else {
      await startZxingScanner();
    }
  } catch (nativeError) {
    try {
      await stopScanner();
      await startZxingScanner();
    } catch (fallbackError) {
      setStatus("Camera scanner could not start. Manual barcode entry is ready.");
      console.error(nativeError, fallbackError);
    }
  } finally {
    dom.startScan.disabled = false;
  }
}

async function startNativeScanner() {
  const formats = await getSupportedBarcodeFormats();
  state.scanner.detector = new BarcodeDetector(
    formats.length ? { formats } : undefined
  );
  state.scanner.stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  });
  dom.video.srcObject = state.scanner.stream;
  await dom.video.play();
  dom.scannerFrame.classList.add("has-video");
  setStatus("Scanner ready.");
  scanNativeFrame();
}

async function startZxingScanner() {
  setStatus("Loading scanner...");
  const { BrowserMultiFormatReader } = await import(ZXING_CDN);
  state.scanner.zxingReader = new BrowserMultiFormatReader();
  state.scanner.zxingControls = await state.scanner.zxingReader.decodeFromVideoDevice(
    undefined,
    dom.video,
    result => {
      if (result) {
        handleDetectedCode(result.getText());
      }
    }
  );
  dom.scannerFrame.classList.add("has-video");
  setStatus("Scanner ready.");
}

async function stopScanner() {
  if (state.scanner.nativeLoop) {
    cancelAnimationFrame(state.scanner.nativeLoop);
    state.scanner.nativeLoop = 0;
  }
  if (state.scanner.zxingControls) {
    state.scanner.zxingControls.stop();
    state.scanner.zxingControls = null;
  }
  if (state.scanner.zxingReader?.reset) {
    state.scanner.zxingReader.reset();
  }
  if (state.scanner.stream) {
    state.scanner.stream.getTracks().forEach(track => track.stop());
    state.scanner.stream = null;
  }
  const liveStream = dom.video.srcObject;
  if (liveStream?.getTracks) {
    liveStream.getTracks().forEach(track => track.stop());
  }
  dom.video.srcObject = null;
  dom.scannerFrame.classList.remove("has-video");
}

async function scanNativeFrame() {
  if (!state.scanner.detector || state.scanner.busy) {
    state.scanner.nativeLoop = requestAnimationFrame(scanNativeFrame);
    return;
  }

  try {
    const barcodes = await state.scanner.detector.detect(dom.video);
    if (barcodes.length) {
      handleDetectedCode(barcodes[0].rawValue);
      return;
    }
  } catch (error) {
    console.error(error);
  }

  state.scanner.nativeLoop = requestAnimationFrame(scanNativeFrame);
}

async function handleDetectedCode(rawCode) {
  const code = cleanBarcode(rawCode);
  const now = Date.now();
  if (!code || (code === state.scanner.lastCode && now - state.scanner.lastAt < 3500)) {
    return;
  }
  state.scanner.lastCode = code;
  state.scanner.lastAt = now;
  navigator.vibrate?.(60);
  await stopScanner();
  handleBarcode(code);
}

async function handleBarcode(code) {
  if (state.scanner.busy) {
    return;
  }
  state.scanner.busy = true;
  dom.barcodeInput.value = code;
  setStatus(`Checking ${code} across data sources...`);
  renderLoadingResult(code);

  try {
    const product = await fetchProduct(code);
    state.activeProduct = product;
    const evaluation = evaluateProduct(product);
    renderProductResult(product, evaluation);
    addHistory(product, evaluation);
    renderChallenges();
    setStatus("Result ready.");
  } catch (error) {
    state.activeProduct = null;
    renderErrorResult(code, error.message);
    setStatus(error.message);
  } finally {
    state.scanner.busy = false;
  }
}

async function fetchProduct(code) {
  if (code === JUDGE_DEMO_BARCODE) {
    return createJudgeDemoProduct();
  }

  const sourceResults = await Promise.all([
    fetchOpenFoodFactsProduct(code),
    fetchUsdaProduct(code)
  ]);
  const openFoodFacts = sourceResults.find(result => result.id === "off")?.product || null;
  const usda = sourceResults.find(result => result.id === "usda")?.product || null;

  if (!openFoodFacts && !usda) {
    throw new Error("Product not found in available data sources.");
  }

  return mergeProductData(code, openFoodFacts, usda, sourceResults);
}

async function fetchOpenFoodFactsProduct(code) {
  const url = `${OFF_PRODUCT_ENDPOINT}${encodeURIComponent(code)}.json?fields=${encodeURIComponent(productFields.join(","))}`;

  try {
    const payload = await fetchJsonWithTimeout(url);
    if (payload.status !== 1 || !payload.product) {
      return sourceResult("off", "Open Food Facts", "missing", "No matching product record.");
    }
    return sourceResult("off", "Open Food Facts", "found", "Ingredients, allergens, labels, and nutrition.", payload.product);
  } catch (error) {
    return sourceResult("off", "Open Food Facts", "error", readableLookupError(error));
  }
}

async function fetchUsdaProduct(code) {
  const url = new URL(USDA_SEARCH_ENDPOINT);
  url.searchParams.set("api_key", USDA_API_KEY);
  url.searchParams.set("query", code);
  url.searchParams.set("dataType", "Branded");
  url.searchParams.set("pageSize", "10");

  try {
    const payload = await fetchJsonWithTimeout(url.toString());
    const food = pickUsdaBarcodeMatch(payload.foods || [], code);
    if (!food) {
      return sourceResult("usda", "USDA FoodData Central", "missing", "No exact GTIN/UPC match.");
    }
    return sourceResult(
      "usda",
      "USDA FoodData Central",
      "found",
      "Branded nutrition fallback.",
      normalizeUsdaFood(food, code)
    );
  } catch (error) {
    return sourceResult("usda", "USDA FoodData Central", "error", readableLookupError(error));
  }
}

async function fetchJsonWithTimeout(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Lookup failed with status ${response.status}.`);
    }
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Lookup timed out.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function sourceResult(id, label, status, detail, product = null) {
  return { id, label, status, detail, product };
}

function createJudgeDemoProduct() {
  const nutriments = {
    "energy-kcal_100g": 160,
    proteins_100g: 24,
    carbohydrates_100g: 17,
    sugars_100g: 2,
    fiber_100g: 3.2,
    fat_100g: 6,
    "saturated-fat_100g": 1.1,
    sodium_100g: 0.04,
    salt_100g: 0.1
  };

  return {
    code: JUDGE_DEMO_BARCODE,
    product_name: "Judge Demo Protein Bowl",
    generic_name: "Seeded high-protein meal",
    brands: "FoodCheck demo",
    quantity: "300 g",
    labels: "High protein, low sugar",
    labels_tags: ["en:high-protein"],
    categories_tags: ["en:prepared-meals", "en:salmon", "en:rice"],
    ingredients_tags: ["en:salmon", "en:brown-rice", "en:spinach", "en:olive-oil", "en:lemon"],
    ingredients_text: "Salmon, brown rice, spinach, olive oil, lemon.",
    ingredients_text_en: "Salmon, brown rice, spinach, olive oil, lemon.",
    allergens_tags: ["en:fish"],
    traces_tags: [],
    additives_tags: [],
    nutriments,
    ingredients_analysis_tags: [],
    _nutrimentSources: Object.fromEntries(Object.keys(nutriments).map(key => [key, "Seeded judge demo"])),
    _sourceResults: [
      sourceResult("demo", "Seeded judge demo", "found", "Local no-network product for verification.")
    ],
    _dataSources: {
      found: ["Seeded judge demo"],
      identity: "Seeded judge demo",
      ingredients: "Seeded judge demo",
      nutrition: "Seeded judge demo"
    }
  };
}

function readableLookupError(error) {
  return error?.message || "Lookup failed.";
}

function mergeProductData(code, openFoodFacts, usda, sourceResults) {
  const product = {
    ...(usda || {}),
    ...(openFoodFacts || {})
  };

  product.code = product.code || code;
  product.product_name = firstFilled(openFoodFacts?.product_name, openFoodFacts?.generic_name, usda?.product_name, usda?.generic_name);
  product.generic_name = firstFilled(openFoodFacts?.generic_name, usda?.generic_name);
  product.brands = firstFilled(openFoodFacts?.brands, usda?.brands);
  product.quantity = firstFilled(openFoodFacts?.quantity, usda?.quantity);
  product.labels = firstFilled(openFoodFacts?.labels, usda?.labels);
  product.ingredients_text = firstFilled(openFoodFacts?.ingredients_text, openFoodFacts?.ingredients_text_en, usda?.ingredients_text);
  product.ingredients_text_en = firstFilled(openFoodFacts?.ingredients_text_en, openFoodFacts?.ingredients_text, usda?.ingredients_text_en);
  product.categories_tags = mergeArrays(openFoodFacts?.categories_tags, usda?.categories_tags);
  product.ingredients_tags = mergeArrays(openFoodFacts?.ingredients_tags, usda?.ingredients_tags);
  product.labels_tags = mergeArrays(openFoodFacts?.labels_tags, usda?.labels_tags);
  product.allergens_tags = mergeArrays(openFoodFacts?.allergens_tags, usda?.allergens_tags);
  product.traces_tags = mergeArrays(openFoodFacts?.traces_tags, usda?.traces_tags);
  product.additives_tags = mergeArrays(openFoodFacts?.additives_tags, usda?.additives_tags);
  product.nutriments = mergeNutriments(openFoodFacts?.nutriments, usda?.nutriments);
  product._nutrimentSources = buildNutrimentSources(openFoodFacts?.nutriments, usda?.nutriments);
  product._sourceResults = sourceResults.map(({ id, label, status, detail }) => ({ id, label, status, detail }));
  product._dataSources = {
    found: sourceResults.filter(result => result.status === "found").map(result => result.label),
    identity: firstFoundLabel(sourceResults, openFoodFacts, usda, "product_name"),
    ingredients: openFoodFacts?.ingredients_text || openFoodFacts?.ingredients_text_en || openFoodFacts?.ingredients_tags?.length
      ? "Open Food Facts"
      : usda?.ingredients_text
        ? "USDA FoodData Central"
        : "",
    nutrition: nutritionSourceLabel(product._nutrimentSources)
  };

  return product;
}

function normalizeUsdaFood(food, code) {
  const nutriments = {};
  const nutrientMap = {
    "203": { key: "proteins_100g", divisor: 1 },
    "204": { key: "fat_100g", divisor: 1 },
    "205": { key: "carbohydrates_100g", divisor: 1 },
    "208": { key: "energy-kcal_100g", divisor: 1 },
    "269": { key: "sugars_100g", divisor: 1 },
    "291": { key: "fiber_100g", divisor: 1 },
    "307": { key: "sodium_100g", divisor: 1000 },
    "539": { key: "added-sugars_100g", divisor: 1 },
    "601": { key: "cholesterol_100g", divisor: 1000 },
    "605": { key: "trans-fat_100g", divisor: 1 },
    "606": { key: "saturated-fat_100g", divisor: 1 }
  };

  arrayifyRaw(food.foodNutrients).forEach(nutrient => {
    const id = String(nutrient.nutrientId || nutrient.nutrientNumber || "");
    const mapped = nutrientMap[id];
    const value = numberOrNull(nutrient.value);
    if (!mapped || value === null) {
      return;
    }
    nutriments[mapped.key] = value / mapped.divisor;
    if (mapped.key === "sodium_100g") {
      nutriments.salt_100g = (value / 1000) * 2.5;
    }
  });

  const brand = firstFilled(food.brandOwner, food.brandName);
  const serving = food.servingSize && food.servingSizeUnit
    ? `${food.servingSize} ${food.servingSizeUnit}`
    : "";

  return {
    code,
    product_name: titleCase(firstFilled(food.description, food.lowercaseDescription)),
    generic_name: titleCase(firstFilled(food.marketCountry, food.brandedFoodCategory)),
    brands: brand,
    quantity: firstFilled(food.packageWeight, serving),
    labels: "",
    labels_tags: [],
    categories_tags: food.brandedFoodCategory ? [`en:${slugify(food.brandedFoodCategory)}`] : [],
    ingredients_tags: [],
    ingredients_text: food.ingredients || "",
    ingredients_text_en: food.ingredients || "",
    allergens_tags: [],
    traces_tags: [],
    additives_tags: [],
    nutriments,
    ingredients_analysis_tags: []
  };
}

function pickUsdaBarcodeMatch(foods, code) {
  const variants = barcodeVariants(code);
  return foods.find(food => variants.has(cleanBarcode(food.gtinUpc))) || null;
}

function barcodeVariants(code) {
  const clean = cleanBarcode(code);
  return new Set([
    clean,
    clean.replace(/^0+/, ""),
    clean.padStart(12, "0"),
    clean.padStart(13, "0"),
    clean.padStart(14, "0")
  ].filter(Boolean));
}

function mergeNutriments(openFoodFacts = {}, usda = {}) {
  const merged = { ...usda, ...openFoodFacts };
  Object.entries(usda || {}).forEach(([key, value]) => {
    if (!hasUsableValue(merged[key]) && hasUsableValue(value)) {
      merged[key] = value;
    }
  });
  return merged;
}

function buildNutrimentSources(openFoodFacts = {}, usda = {}) {
  const sources = {};
  Object.entries(usda || {}).forEach(([key, value]) => {
    if (hasUsableValue(value)) {
      sources[key] = "USDA FoodData Central";
    }
  });
  Object.entries(openFoodFacts || {}).forEach(([key, value]) => {
    if (hasUsableValue(value)) {
      sources[key] = "Open Food Facts";
    }
  });
  return sources;
}

function nutritionSourceLabel(nutrimentSources) {
  const sources = [...new Set(Object.values(nutrimentSources || {}))];
  if (sources.length > 1) {
    return "Open Food Facts + USDA FoodData Central";
  }
  return sources[0] || "";
}

function firstFoundLabel(sourceResults, openFoodFacts, usda, field) {
  if (openFoodFacts?.[field]) {
    return sourceResults.find(result => result.id === "off")?.label || "Open Food Facts";
  }
  if (usda?.[field]) {
    return sourceResults.find(result => result.id === "usda")?.label || "USDA FoodData Central";
  }
  return "";
}

function renderProfiles() {
  const grouped = groupBy(profiles, profile => profile.group);
  dom.profileGroups.innerHTML = "";

  for (const [group, groupProfiles] of grouped.entries()) {
    const groupEl = document.createElement("section");
    groupEl.className = "profile-group";
    groupEl.innerHTML = `<h3>${escapeHtml(group)}</h3>`;

    const options = document.createElement("div");
    options.className = "profile-options";

    groupProfiles.forEach(profile => {
      const label = document.createElement("label");
      label.className = "profile-option";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = profile.id;
      input.checked = state.selectedProfiles.has(profile.id);
      input.addEventListener("change", () => {
        if (input.checked) {
          state.selectedProfiles.add(profile.id);
        } else {
          state.selectedProfiles.delete(profile.id);
        }
        saveSelectedProfiles();
        refreshActiveEvaluation();
        analyzeMenuText({ quiet: true });
        renderShelfCopilot();
      });
      const text = document.createElement("span");
      text.textContent = profile.label;
      label.append(input, text);
      options.append(label);
    });

    groupEl.append(options);
    dom.profileGroups.append(groupEl);
  }
}

function renderLoadingResult(code) {
  dom.confidencePill.textContent = "Checking";
  setResultStatus("idle");
  dom.resultHeadline.textContent = "Looking up product";
  dom.resultReason.textContent = `Barcode ${code}`;
  showCameraResult("idle", "Checking", "Looking up product", `Barcode ${code}`);
  dom.productSummary.classList.add("hidden");
  dom.sourceSummary.classList.add("hidden");
  dom.checkList.innerHTML = "";
}

function renderErrorResult(code, message) {
  dom.confidencePill.textContent = "No product";
  setResultStatus("yellow");
  dom.resultHeadline.textContent = "Not enough data";
  dom.resultReason.textContent = `${message} Barcode ${code} can still be checked against the package label.`;
  showCameraResult("yellow", "Not great", "Not enough data", `${message} Check the package label.`);
  dom.productSummary.classList.add("hidden");
  dom.sourceSummary.classList.add("hidden");
  dom.checkList.innerHTML = "";
}

function renderProductResult(product, evaluation) {
  const statusText = statusLabel(evaluation.status);
  dom.confidencePill.textContent = evaluation.dataQuality;
  setResultStatus(evaluation.status);
  dom.resultHeadline.textContent = `${statusText} for selected profiles`;
  dom.resultReason.textContent = evaluation.summary;
  showCameraResult(
    evaluation.status,
    statusText,
    product.product_name || product.generic_name || "Product checked",
    evaluation.summary
  );

  const image = product.image_front_small_url || product.image_front_url || product.image_url || "";
  if (image) {
    dom.productImage.src = image;
    dom.productImage.alt = product.product_name || "Product image";
  } else {
    dom.productImage.removeAttribute("src");
    dom.productImage.alt = "";
  }
  dom.productName.textContent = product.product_name || product.generic_name || "Unnamed product";
  dom.productMeta.textContent = [product.brands, product.quantity, product.code, product._dataSources?.nutrition].filter(Boolean).join(" | ");
  dom.productSummary.classList.remove("hidden");
  renderSourceSummary(product);

  dom.checkList.innerHTML = "";
  evaluation.checks.forEach(check => {
    const item = document.createElement("article");
    item.className = `check-item status-${check.status}`;
    item.innerHTML = `
      <span class="check-dot"></span>
      <div>
        <h3>${escapeHtml(check.label)}: ${escapeHtml(statusLabel(check.status))}</h3>
        <p>${escapeHtml(check.reason)}</p>
      </div>
    `;
    dom.checkList.append(item);
  });
}

function refreshActiveEvaluation() {
  if (!state.activeProduct) {
    const selectedCount = state.selectedProfiles.size || defaultProfiles.length;
    dom.confidencePill.textContent = "No scan";
    dom.resultReason.textContent = `${selectedCount} profile${selectedCount === 1 ? "" : "s"} selected.`;
    hideCameraResult();
    dom.sourceSummary.classList.add("hidden");
    return;
  }
  renderProductResult(state.activeProduct, evaluateProduct(state.activeProduct));
}

function renderSourceSummary(product) {
  const results = product._sourceResults || [];
  dom.sourceList.innerHTML = "";

  results.forEach(source => {
    const item = document.createElement("article");
    item.className = `source-item status-${source.status}`;
    item.innerHTML = `
      <span class="source-dot"></span>
      <span>
        <span class="source-name">${escapeHtml(source.label)}</span>
        <span class="source-detail">${escapeHtml(source.detail)}</span>
      </span>
    `;
    dom.sourceList.append(item);
  });

  if (results.length) {
    dom.sourceSummary.classList.remove("hidden");
  } else {
    dom.sourceSummary.classList.add("hidden");
  }
}

function setCopilotMode(mode) {
  const isMenu = mode === "menu";
  dom.menuCopilotMode.classList.toggle("hidden", !isMenu);
  dom.shelfCopilotMode.classList.toggle("hidden", isMenu);
  dom.menuModeButton.classList.toggle("active", isMenu);
  dom.shelfModeButton.classList.toggle("active", !isMenu);
  dom.menuModeButton.setAttribute("aria-pressed", String(isMenu));
  dom.shelfModeButton.setAttribute("aria-pressed", String(!isMenu));
}

async function handleMenuImage() {
  const file = dom.menuImageInput.files?.[0];
  if (!file) {
    return;
  }

  setStatus("Reading menu photo...");
  dom.analyzeMenu.disabled = true;

  try {
    const text = await recognizeMenuText(file);
    dom.menuTextInput.value = text.trim();
    analyzeMenuText();
    setStatus("Menu photo analyzed.");
  } catch (error) {
    setStatus("Menu photo could not be read. Paste menu text instead.");
    renderCopilotCards(dom.menuCopilotResults, [
      {
        status: "yellow",
        title: "Photo OCR unavailable",
        detail: readableLookupError(error) || "Paste menu text and tap Analyze menu."
      }
    ]);
  } finally {
    dom.analyzeMenu.disabled = false;
  }
}

async function recognizeMenuText(file) {
  await loadScriptOnce(TESSERACT_CDN, "Tesseract");
  const result = await window.Tesseract.recognize(file, "eng");
  return result?.data?.text || "";
}

function analyzeMenuText(options = {}) {
  const text = dom.menuTextInput.value.trim();
  if (!text) {
    if (!options.quiet) {
      renderCopilotCards(dom.menuCopilotResults, [
        {
          status: "yellow",
          title: "Add a menu first",
          detail: "Use a menu photo or paste a few menu lines to compare options before ordering."
        }
      ]);
    }
    return;
  }

  const items = parseMenuItems(text).map(item => ({
    ...item,
    estimate: estimateMenuItem(item.name)
  }));

  if (!items.length) {
    renderCopilotCards(dom.menuCopilotResults, [
      {
        status: "yellow",
        title: "No menu items found",
        detail: "Put each menu item on its own line for the strongest comparison."
      }
    ]);
    return;
  }

  const ranked = items
    .map(item => ({
      ...item,
      fit: scoreMenuItemForGoals(item.estimate)
    }))
    .sort((a, b) => b.fit.score - a.fit.score);

  const highestProtein = [...items].sort((a, b) => b.estimate.protein - a.estimate.protein)[0];
  const lowestSugar = [...items].sort((a, b) => a.estimate.sugar - b.estimate.sugar)[0];
  const calorieTarget = 650;
  const highCalorie = [...items].sort((a, b) => b.estimate.calories - a.estimate.calories)[0];
  const cards = [
    {
      status: ranked[0].fit.status,
      title: `Best fit: ${ranked[0].name}`,
      detail: ranked[0].fit.reason
    },
    {
      status: "green",
      title: `Highest protein: ${highestProtein.name}`,
      detail: `Likely about ${highestProtein.estimate.protein} g protein. ${highestProtein.estimate.reason}`
    },
    {
      status: lowestSugar.estimate.sugar <= 8 ? "green" : "yellow",
      title: `Lowest sugar: ${lowestSugar.name}`,
      detail: `Estimated around ${lowestSugar.estimate.sugar} g sugar before sauces or drinks.`
    }
  ];

  if (highCalorie.estimate.calories > calorieTarget) {
    const over = Math.round(((highCalorie.estimate.calories - calorieTarget) / calorieTarget) * 100);
    cards.push({
      status: over >= 60 ? "red" : "yellow",
      title: `${highCalorie.name} exceeds target`,
      detail: `Estimated ${highCalorie.estimate.calories} kcal, about ${over}% over a ${calorieTarget} kcal meal target.`
    });
  }

  renderCopilotCards(dom.menuCopilotResults, cards);
}

function parseMenuItems(text) {
  return text
    .split(/\n|;/)
    .map(line => line.replace(/\s+\$?\d+(?:\.\d{2})?\s*$/g, "").trim())
    .filter(line => line.length >= 3)
    .slice(0, 12)
    .map(line => ({ name: titleCase(line) }));
}

function estimateMenuItem(name) {
  const text = name.toLowerCase();
  let calories = 520;
  let protein = 15;
  let carbs = 35;
  let sugar = 6;
  let sodium = 650;
  let fat = 18;
  const reasons = [];

  const apply = (condition, changes, reason) => {
    if (!condition) {
      return;
    }
    calories += changes.calories || 0;
    protein += changes.protein || 0;
    carbs += changes.carbs || 0;
    sugar += changes.sugar || 0;
    sodium += changes.sodium || 0;
    fat += changes.fat || 0;
    reasons.push(reason);
  };

  apply(/grilled|baked|roasted/.test(text), { calories: -90, fat: -8 }, "grilled or baked prep");
  apply(/salmon|tuna|fish/.test(text), { protein: 24, fat: 4, calories: 20 }, "fish protein");
  apply(/chicken|turkey/.test(text), { protein: 22, fat: -4, calories: -20 }, "lean poultry");
  apply(/steak|beef/.test(text), { protein: 24, fat: 10, calories: 120 }, "high-protein beef");
  apply(/tofu|tempeh/.test(text), { protein: 12, fat: -4, calories: -40 }, "plant protein");
  apply(/shrimp|prawn/.test(text), { protein: 18, fat: -8, calories: -70 }, "lean seafood");
  apply(/bean|lentil|chickpea/.test(text), { protein: 7, carbs: 18, fiber: 5, calories: 70 }, "fiber-rich legumes");
  apply(/burger|combo/.test(text), { calories: 420, protein: 12, carbs: 35, sodium: 700, fat: 22 }, "burger/combo meal");
  apply(/fries|chips/.test(text), { calories: 330, carbs: 42, sodium: 300, fat: 18 }, "fried side");
  apply(/fried|crispy/.test(text), { calories: 250, fat: 18, sodium: 350 }, "fried preparation");
  apply(/alfredo|cream|creamy|cheese|mac/.test(text), { calories: 260, fat: 22, sodium: 350 }, "creamy or cheesy sauce");
  apply(/pasta|noodle|rice|bowl|wrap|sandwich/.test(text), { carbs: 35, calories: 160 }, "carb base");
  apply(/dessert|cake|cookie|brownie|ice cream|syrup/.test(text), { sugar: 36, carbs: 45, calories: 280 }, "dessert sugar");
  apply(/soda|lemonade|sweet tea|shake/.test(text), { sugar: 38, carbs: 40, calories: 180 }, "sweet drink");
  apply(/soup|ramen|deli|bacon|cured/.test(text), { sodium: 700 }, "higher-sodium item");
  apply(/salad/.test(text), { calories: -130, carbs: -15, fat: -6 }, "lighter salad base");

  return {
    calories: Math.max(80, Math.round(calories)),
    protein: Math.max(0, Math.round(protein)),
    carbs: Math.max(0, Math.round(carbs)),
    sugar: Math.max(0, Math.round(sugar)),
    sodium: Math.max(0, Math.round(sodium)),
    fat: Math.max(0, Math.round(fat)),
    reason: reasons.slice(0, 2).join(", ") || "estimated from menu wording"
  };
}

function scoreMenuItemForGoals(estimate) {
  const selected = state.selectedProfiles;
  let score = 50;
  const reasons = [];

  if (selected.has("goal-gain-muscle")) {
    score += estimate.protein * 1.4;
    reasons.push(`${estimate.protein} g estimated protein for muscle support`);
  }
  if (selected.has("goal-lose-20")) {
    score += Math.max(0, 700 - estimate.calories) / 18;
    if (estimate.calories > 700) {
      score -= 20;
    }
    reasons.push(`${estimate.calories} kcal estimated for calorie-target fit`);
  }
  if (selected.has("prediabetic") || selected.has("low-sugar")) {
    score -= estimate.sugar * 1.2;
    score -= Math.max(0, estimate.carbs - 45) * 0.5;
    reasons.push(`${estimate.sugar} g estimated sugar for blood-sugar awareness`);
  }
  if (selected.has("high-blood-pressure") || selected.has("low-sodium")) {
    score -= Math.max(0, estimate.sodium - 600) / 35;
    reasons.push(`${estimate.sodium} mg estimated sodium`);
  }
  if (selected.has("marathon-training")) {
    score += estimate.carbs * 0.55 + estimate.protein * 0.35;
    if (estimate.fat > 25) {
      score -= 12;
    }
    reasons.push(`${estimate.carbs} g carbs and ${estimate.protein} g protein for training fuel`);
  }
  if (!reasons.length) {
    score += estimate.protein - estimate.sugar - Math.max(0, estimate.calories - 650) / 30;
    reasons.push("balanced against general protein, sugar, and calorie signals");
  }

  return {
    score,
    status: score >= 70 ? "green" : score >= 45 ? "yellow" : "red",
    reason: reasons.slice(0, 2).join("; ")
  };
}

async function addShelfBarcode() {
  const code = cleanBarcode(dom.shelfBarcodeInput.value);
  const price = numberOrNull(dom.shelfPriceInput.value);
  if (!code) {
    setStatus("Enter a shelf barcode.");
    return;
  }

  setStatus(`Adding ${code} to shelf comparison...`);
  try {
    const product = await fetchProduct(code);
    state.shelfItems = [
      ...state.shelfItems.filter(item => item.product.code !== product.code),
      {
        id: `${product.code}-${Date.now()}`,
        product,
        price
      }
    ].slice(-6);
    dom.shelfBarcodeInput.value = "";
    dom.shelfPriceInput.value = "";
    renderShelfList();
    renderShelfCopilot();
    setStatus("Shelf comparison updated.");
  } catch (error) {
    setStatus(error.message);
  }
}

function addSampleShelf() {
  state.shelfItems = [
    createShelfDemoItem("Power Greek Yogurt", "demo-yogurt", 1.49, "150 g", {
      "energy-kcal_100g": 90,
      proteins_100g: 10,
      carbohydrates_100g: 5,
      sugars_100g: 4,
      fiber_100g: 0,
      fat_100g: 0.5,
      sodium_100g: 0.045
    }),
    createShelfDemoItem("Protein Oat Bar", "demo-protein-bar", 2.49, "60 g", {
      "energy-kcal_100g": 360,
      proteins_100g: 30,
      carbohydrates_100g: 32,
      sugars_100g: 3,
      fiber_100g: 10,
      fat_100g: 9,
      sodium_100g: 0.21
    }),
    createShelfDemoItem("Chocolate Hazelnut Spread", "demo-spread", 4.99, "350 g", {
      "energy-kcal_100g": 539,
      proteins_100g: 6,
      carbohydrates_100g: 58,
      sugars_100g: 56,
      fiber_100g: 0,
      fat_100g: 31,
      sodium_100g: 0.04
    })
  ];
  setCopilotMode("shelf");
  renderShelfList();
  renderShelfCopilot();
}

async function runJudgeDemo() {
  state.selectedProfiles = new Set([
    "general-health",
    "goal-gain-muscle",
    "prediabetic",
    "low-sodium",
    "low-fodmap"
  ]);
  saveSelectedProfiles();
  renderProfiles();

  await handleBarcode(JUDGE_DEMO_BARCODE);

  dom.menuTextInput.value = sampleMenuText();
  setCopilotMode("menu");
  analyzeMenuText();

  addSampleShelf();

  state.challenges.activeId = "protein-30";
  state.challenges.progress["protein-30"] = {
    joinedAt: todayKey(),
    completedDates: []
  };
  saveChallengeState();
  renderChallenges();
  completeTodayChallenge();

  setStatus("Judge demo ready: seeded product, menu, shelf, and challenge results are visible.");
  dom.judgeDemoStatus.innerHTML = "Demo complete: no auth, no camera, no third-party lookup required.";
}

function createShelfDemoItem(name, code, price, quantity, nutriments) {
  return {
    id: code,
    price,
    product: {
      code,
      product_name: name,
      brands: "Demo shelf",
      quantity,
      nutriments,
      _sourceResults: [
        sourceResult("demo", "Demo shelf", "found", "Seeded comparison product.")
      ],
      _dataSources: {
        found: ["Demo shelf"],
        nutrition: "Demo shelf"
      }
    }
  };
}

function renderShelfList() {
  dom.shelfList.innerHTML = "";
  if (!state.shelfItems.length) {
    dom.shelfList.innerHTML = `<p class="history-empty">No shelf products yet.</p>`;
    return;
  }

  state.shelfItems.forEach(item => {
    const metrics = shelfMetrics(item);
    const row = document.createElement("article");
    row.className = "shelf-item";
    row.innerHTML = `
      <div>
        <h3>${escapeHtml(item.product.product_name || "Unnamed product")}</h3>
        <p>${escapeHtml([item.product.brands, item.product.quantity, item.product.code].filter(Boolean).join(" | "))}</p>
      </div>
      <div class="shelf-metrics">
        <span>${formatNumber(metrics.protein || 0)} g protein</span>
        <span>${formatNumber(metrics.sugar || 0)} g sugar</span>
        <span>${item.price !== null ? formatMoney(item.price) : "No price"}</span>
      </div>
    `;
    dom.shelfList.append(row);
  });
}

function renderShelfCopilot() {
  if (!state.shelfItems.length) {
    renderCopilotCards(dom.shelfCopilotResults, [
      {
        status: "yellow",
        title: "Build a shelf set",
        detail: "Add two or more barcodes, or use Sample shelf, to rank products by protein, sugar, and value."
      }
    ]);
    return;
  }

  const items = state.shelfItems.map(item => ({
    item,
    metrics: shelfMetrics(item)
  }));

  const proteinBest = [...items].sort((a, b) => b.metrics.protein - a.metrics.protein)[0];
  const sugarBest = [...items].sort((a, b) => a.metrics.sugar - b.metrics.sugar)[0];
  const valueCandidates = items.filter(entry => entry.metrics.pricePerProtein !== null);
  const valueBest = valueCandidates.sort((a, b) => a.metrics.pricePerProtein - b.metrics.pricePerProtein)[0];
  const bestFit = [...items]
    .map(entry => ({ ...entry, score: scoreShelfItemForGoals(entry.metrics) }))
    .sort((a, b) => b.score.score - a.score.score)[0];

  const cards = [
    {
      status: bestFit.score.status,
      title: `Best for your goals: ${bestFit.item.product.product_name}`,
      detail: bestFit.score.reason
    },
    {
      status: "green",
      title: `Best option for high protein: ${proteinBest.item.product.product_name}`,
      detail: `${formatNumber(proteinBest.metrics.protein)} g protein per 100 g.`
    },
    {
      status: sugarBest.metrics.sugar <= 5 ? "green" : "yellow",
      title: `Lowest sugar: ${sugarBest.item.product.product_name}`,
      detail: `${formatNumber(sugarBest.metrics.sugar)} g sugar per 100 g.`
    }
  ];

  if (valueBest) {
    cards.push({
      status: "green",
      title: `Best value per gram protein: ${valueBest.item.product.product_name}`,
      detail: `${formatMoney(valueBest.metrics.pricePerProtein)} per gram of protein using package size and price.`
    });
  } else {
    cards.push({
      status: "yellow",
      title: "Add prices for value ranking",
      detail: "Enter price next to a barcode to calculate best value per gram of protein."
    });
  }

  renderCopilotCards(dom.shelfCopilotResults, cards);
}

function renderChallenges() {
  dom.challengeGrid.innerHTML = "";

  challengeTemplates.forEach(template => {
    const progress = getChallengeProgress(template.id);
    const isActive = state.challenges.activeId === template.id;
    const card = document.createElement("article");
    card.className = `challenge-card${isActive ? " active" : ""}`;
    card.innerHTML = `
      <span class="challenge-chip">${escapeHtml(template.chip)}</span>
      <div>
        <h3>${escapeHtml(template.title)}</h3>
        <p>${escapeHtml(template.description)}</p>
      </div>
    `;
    const button = document.createElement("button");
    button.className = `button ${isActive ? "button-primary" : "button-secondary"}`;
    button.type = "button";
    button.textContent = isActive ? "Active" : progress.completedDates.length ? "Resume" : "Join";
    button.addEventListener("click", () => joinChallenge(template.id));
    card.append(button);
    dom.challengeGrid.append(card);
  });

  renderActiveChallenge();
}

function joinChallenge(challengeId) {
  state.challenges.activeId = challengeId;
  ensureChallengeProgress(challengeId);
  saveChallengeState();
  renderChallenges();
}

function renderActiveChallenge() {
  const template = getActiveChallengeTemplate();
  if (!template) {
    dom.challengeStatusPill.textContent = "No challenge";
    dom.challengeProgress.classList.add("hidden");
    dom.shareCard.classList.add("hidden");
    return;
  }

  const progress = getChallengeProgress(template.id);
  const streak = calculateStreak(progress.completedDates);
  const completed = progress.completedDates.length;
  const percent = Math.min(100, Math.round((completed / template.durationDays) * 100));
  const qualification = getChallengeQualification(template, state.activeProduct);
  const completedToday = progress.completedDates.includes(todayKey());

  dom.challengeStatusPill.textContent = `${streak} day streak`;
  dom.challengeProgress.classList.remove("hidden");
  dom.activeChallengeLabel.textContent = `${template.durationDays}-day challenge`;
  dom.activeChallengeName.textContent = template.title;
  dom.activeChallengeDetail.textContent = qualification.detail;
  dom.challengeStreak.textContent = String(streak);
  dom.challengeCompleted.textContent = `${completed}/${template.durationDays}`;
  dom.challengeProgressBar.style.width = `${percent}%`;
  dom.completeChallengeToday.disabled = completedToday;
  dom.completeChallengeToday.textContent = completedToday
    ? "Today complete"
    : qualification.qualifies
      ? "Complete with this scan"
      : "Mark today complete";
  renderShareCard(template, progress, qualification);
}

function completeTodayChallenge() {
  const template = getActiveChallengeTemplate();
  if (!template) {
    setStatus("Join a challenge first.");
    return;
  }

  const progress = getChallengeProgress(template.id);
  const today = todayKey();
  if (!progress.completedDates.includes(today)) {
    progress.completedDates.push(today);
    progress.completedDates.sort();
  }
  saveChallengeState();
  renderChallenges();
  setStatus("Challenge streak updated.");
}

async function shareActiveChallenge() {
  const template = getActiveChallengeTemplate();
  if (!template) {
    setStatus("Join a challenge first.");
    return;
  }

  const progress = getChallengeProgress(template.id);
  const qualification = getChallengeQualification(template, state.activeProduct);
  const text = buildChallengeShareText(template, progress, qualification);
  renderShareCard(template, progress, qualification);
  dom.shareCard.classList.remove("hidden");

  try {
    if (navigator.share) {
      await navigator.share({ title: template.title, text });
      dom.challengeShareStatus.textContent = "Share sheet opened.";
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      dom.challengeShareStatus.textContent = "Share text copied.";
    } else {
      dom.challengeShareStatus.textContent = text;
    }
  } catch {
    dom.challengeShareStatus.textContent = text;
  }
}

function renderShareCard(template, progress, qualification) {
  const streak = calculateStreak(progress.completedDates);
  const completed = progress.completedDates.length;
  dom.shareCardTitle.textContent = template.title;
  dom.shareCardStats.textContent = `${streak} day streak | ${completed}/${template.durationDays} days complete`;
  dom.shareCardNote.textContent = qualification.qualifies
    ? `Today's FoodCheck pick: ${qualification.detail}`
    : template.sharePrompt;
}

function buildChallengeShareText(template, progress, qualification) {
  const streak = calculateStreak(progress.completedDates);
  const completed = progress.completedDates.length;
  const scanLine = qualification.qualifies ? ` Today's pick: ${qualification.detail}` : "";
  return `${template.sharePrompt} ${streak} day streak, ${completed}/${template.durationDays} days complete.${scanLine}`;
}

function getActiveChallengeTemplate() {
  return challengeTemplates.find(template => template.id === state.challenges.activeId) || null;
}

function ensureChallengeProgress(challengeId) {
  if (!state.challenges.progress[challengeId]) {
    state.challenges.progress[challengeId] = {
      joinedAt: todayKey(),
      completedDates: []
    };
  }
  return state.challenges.progress[challengeId];
}

function getChallengeProgress(challengeId) {
  return ensureChallengeProgress(challengeId);
}

function getChallengeQualification(template, product) {
  if (!product) {
    return {
      qualifies: false,
      detail: `${template.dailyGoal} Scan a product or mark progress manually.`
    };
  }

  const ctx = createContext(product);
  const name = product.product_name || "This product";
  const protein = numberOrNull(ctx.nutriments.proteins_100g);
  const sugar = numberOrNull(ctx.nutriments.sugars_100g);

  if (template.id === "protein-30") {
    if (protein !== null && protein >= 10) {
      return {
        qualifies: true,
        detail: `${name} counts with ${formatNumber(protein)} g protein per 100 g.`
      };
    }
    return {
      qualifies: false,
      detail: `${name} does not look protein-forward yet. Aim for 10 g protein per 100 g or a protein-focused meal.`
    };
  }

  if (template.id === "reduce-sugar-30") {
    if (sugar !== null && sugar < 5) {
      return {
        qualifies: true,
        detail: `${name} counts as lower sugar at ${formatNumber(sugar)} g per 100 g.`
      };
    }
    return {
      qualifies: false,
      detail: sugar === null
        ? `${name} is missing sugar data.`
        : `${name} has ${formatNumber(sugar)} g sugar per 100 g, so it is not a lower-sugar pick.`
    };
  }

  const signals = findSignals(ctx, mediterraneanChallengeTerms, 2);
  if (signals.length) {
    return {
      qualifies: true,
      detail: `${name} counts with Mediterranean-style signal: ${formatSignalList(signals)}.`
    };
  }

  return {
    qualifies: false,
    detail: `${name} does not show a clear Mediterranean-style signal. Look for fish, legumes, vegetables, whole grains, nuts, or olive oil.`
  };
}

function calculateStreak(completedDates) {
  const completed = new Set(completedDates);
  let streak = 0;
  let cursor = new Date();

  while (completed.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function shelfMetrics(item) {
  const nutriments = item.product.nutriments || {};
  const protein = numberOrNull(nutriments.proteins_100g) || 0;
  const sugar = numberOrNull(nutriments.sugars_100g) || 0;
  const carbs = numberOrNull(nutriments.carbohydrates_100g) || 0;
  const energy = numberOrNull(nutriments["energy-kcal_100g"]) || 0;
  const sodiumMg = numberOrNull(nutriments.sodium_100g) !== null ? numberOrNull(nutriments.sodium_100g) * 1000 : null;
  const packageGrams = parseQuantityGrams(item.product.quantity);
  const totalProtein = packageGrams && protein ? (protein * packageGrams) / 100 : null;
  const pricePerProtein = item.price !== null && totalProtein ? item.price / totalProtein : null;
  return {
    protein,
    sugar,
    carbs,
    energy,
    sodiumMg,
    packageGrams,
    totalProtein,
    pricePerProtein
  };
}

function scoreShelfItemForGoals(metrics) {
  const selected = state.selectedProfiles;
  let score = 50;
  const reasons = [];

  if (selected.has("goal-gain-muscle")) {
    score += metrics.protein * 1.5;
    reasons.push(`${formatNumber(metrics.protein)} g protein per 100 g`);
  }
  if (selected.has("goal-lose-20")) {
    score += Math.max(0, 250 - metrics.energy) / 8;
    score += metrics.protein * 0.5;
    reasons.push(`${formatNumber(metrics.energy)} kcal per 100 g`);
  }
  if (selected.has("prediabetic") || selected.has("low-sugar")) {
    score -= metrics.sugar * 1.5;
    reasons.push(`${formatNumber(metrics.sugar)} g sugar per 100 g`);
  }
  if ((selected.has("high-blood-pressure") || selected.has("low-sodium")) && metrics.sodiumMg !== null) {
    score -= Math.max(0, metrics.sodiumMg - 120) / 20;
    reasons.push(`${formatNumber(metrics.sodiumMg)} mg sodium per 100 g`);
  }
  if (selected.has("marathon-training")) {
    score += metrics.carbs * 0.5 + metrics.protein * 0.4;
    reasons.push(`${formatNumber(metrics.carbs)} g carbs and ${formatNumber(metrics.protein)} g protein`);
  }
  if (!reasons.length) {
    score += metrics.protein - metrics.sugar - Math.max(0, metrics.energy - 300) / 18;
    reasons.push("balanced by protein, sugar, and calories");
  }

  return {
    score,
    status: score >= 70 ? "green" : score >= 45 ? "yellow" : "red",
    reason: reasons.slice(0, 2).join("; ")
  };
}

function renderCopilotCards(container, cards) {
  container.innerHTML = "";
  cards.forEach(card => {
    const item = document.createElement("article");
    item.className = `copilot-card status-${card.status}`;
    item.innerHTML = `
      <span class="check-dot"></span>
      <div>
        <h3>${escapeHtml(card.title)}</h3>
        <p>${escapeHtml(card.detail)}</p>
      </div>
    `;
    container.append(item);
  });
}

function sampleMenuText() {
  return [
    "Grilled salmon with rice",
    "Burger combo with fries",
    "Chicken Caesar salad",
    "Pasta Alfredo",
    "Tofu vegetable bowl",
    "Chocolate milkshake"
  ].join("\n");
}

function evaluateProduct(product) {
  const ctx = createContext(product);
  const activeProfiles = profiles.filter(profile => state.selectedProfiles.has(profile.id));
  const checks = (activeProfiles.length ? activeProfiles : profiles.filter(profile => defaultProfiles.includes(profile.id)))
    .map(profile => {
      const result = profile.evaluate(ctx);
      return {
        label: profile.label,
        status: result.status,
        reason: result.reason
      };
    });

  const status = combineStatuses(checks.map(check => check.status));
  const summary = buildSummary(checks, ctx);

  return {
    status,
    summary,
    checks,
    dataQuality: dataQualityLabel(ctx)
  };
}

function buildSummary(checks, ctx) {
  const red = checks.filter(check => check.status === "red");
  const yellow = checks.filter(check => check.status === "yellow");
  if (red.length) {
    return `${red[0].label} is flagged: ${red[0].reason}`;
  }
  if (yellow.length) {
    return `${yellow[0].label} needs caution: ${yellow[0].reason}`;
  }
  if (!ctx.hasIngredients && !ctx.hasNutrition) {
    return "No selected profile found a conflict, but product data is sparse.";
  }
  return "No selected profile found a conflict in the available product data.";
}

function createContext(product) {
  const labels = arrayify(product.labels_tags);
  const ingredients = arrayify(product.ingredients_tags);
  const categories = arrayify(product.categories_tags);
  const allergens = arrayify(product.allergens_tags);
  const traces = arrayify(product.traces_tags);
  const additives = arrayify(product.additives_tags);
  const analysis = arrayify(product.ingredients_analysis_tags);
  const ingredientText = [
    product.labels,
    product.ingredients_text_en,
    product.ingredients_text,
    product.generic_name,
    product.brands,
    product.product_name
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const nutriments = product.nutriments || {};

  return {
    product,
    labels,
    ingredients,
    categories,
    allergens,
    traces,
    additives,
    analysis,
    text: ingredientText,
    hasIngredients: ingredients.length > 0 || Boolean(product.ingredients_text || product.ingredients_text_en),
    hasNutrition: Object.keys(nutriments).length > 0,
    sourceCount: product._dataSources?.found?.length || 0,
    dataSources: product._dataSources || {},
    nutrimentSources: product._nutrimentSources || {},
    nutriments,
    nutriScore: String(product.nutriscore_grade || "").toLowerCase(),
    nova: Number(product.nova_group || 0)
  };
}

function evaluateGeneralHealth(ctx) {
  const reasons = [];
  let status = "green";

  if (["d", "e"].includes(ctx.nutriScore)) {
    status = "red";
    reasons.push(`Nutri-Score is ${ctx.nutriScore.toUpperCase()}.`);
  } else if (ctx.nutriScore === "c") {
    status = maxStatus(status, "yellow");
    reasons.push("Nutri-Score is C.");
  } else if (["a", "b"].includes(ctx.nutriScore)) {
    reasons.push(`Nutri-Score is ${ctx.nutriScore.toUpperCase()}.`);
  }

  const sugar = numberOrNull(ctx.nutriments.sugars_100g);
  const satFat = numberOrNull(ctx.nutriments["saturated-fat_100g"]);
  const salt = getSaltPer100g(ctx);

  if (sugar !== null) {
    if (sugar >= 22.5) {
      status = "red";
      reasons.push(`High sugars at ${formatNumber(sugar)} g per 100 g.`);
    } else if (sugar >= 5) {
      status = maxStatus(status, "yellow");
      reasons.push(`Moderate sugars at ${formatNumber(sugar)} g per 100 g.`);
    }
  }

  if (satFat !== null) {
    if (satFat >= 5) {
      status = "red";
      reasons.push(`High saturated fat at ${formatNumber(satFat)} g per 100 g.`);
    } else if (satFat >= 1.5) {
      status = maxStatus(status, "yellow");
      reasons.push(`Moderate saturated fat at ${formatNumber(satFat)} g per 100 g.`);
    }
  }

  if (salt !== null) {
    if (salt >= 1.5) {
      status = "red";
      reasons.push(`High salt at ${formatNumber(salt)} g per 100 g.`);
    } else if (salt >= 0.3) {
      status = maxStatus(status, "yellow");
      reasons.push(`Moderate salt at ${formatNumber(salt)} g per 100 g.`);
    }
  }

  if (ctx.nova >= 4) {
    status = maxStatus(status, "yellow");
    reasons.push("NOVA group 4 indicates an ultra-processed food.");
  }

  if (!reasons.length) {
    if (!ctx.hasNutrition) {
      return result("yellow", "Nutrition data is missing, so the health check is incomplete.");
    }
    return result("green", "Nutrition indicators look reasonable in the available data.");
  }

  return result(status, reasons.slice(0, 3).join(" "));
}

function evaluateDiabetesAware(ctx) {
  const sugar = numberOrNull(ctx.nutriments.sugars_100g);
  const carbs = numberOrNull(ctx.nutriments.carbohydrates_100g);
  if (sugar === null && carbs === null) {
    return result("yellow", "Sugar and carbohydrate data are missing.");
  }
  if (sugar !== null && sugar >= 22.5) {
    return result("red", `Sugars are high at ${formatNumber(sugar)} g per 100 g.`);
  }
  if (carbs !== null && carbs >= 50) {
    return result("yellow", `Carbohydrates are high at ${formatNumber(carbs)} g per 100 g.`);
  }
  if (sugar !== null && sugar >= 5) {
    return result("yellow", `Sugars are moderate at ${formatNumber(sugar)} g per 100 g.`);
  }
  return result("green", "Sugars are low in the available nutrition data.");
}

function evaluateLowSodium(ctx) {
  const salt = getSaltPer100g(ctx);
  if (salt === null) {
    return result("yellow", "Salt and sodium data are missing.");
  }
  if (salt >= 1.5) {
    return result("red", `Salt is high at ${formatNumber(salt)} g per 100 g.`);
  }
  if (salt >= 0.3) {
    return result("yellow", `Salt is moderate at ${formatNumber(salt)} g per 100 g.`);
  }
  return result("green", `Salt is low at ${formatNumber(salt)} g per 100 g.`);
}

function evaluateLowSugar(ctx) {
  const sugar = numberOrNull(ctx.nutriments.sugars_100g);
  if (sugar === null) {
    return result("yellow", "Sugar data is missing.");
  }
  if (sugar >= 22.5) {
    return result("red", `Sugars are high at ${formatNumber(sugar)} g per 100 g.`);
  }
  if (sugar >= 5) {
    return result("yellow", `Sugars are moderate at ${formatNumber(sugar)} g per 100 g.`);
  }
  return result("green", `Sugars are low at ${formatNumber(sugar)} g per 100 g.`);
}

function evaluateLoseWeightGoal(ctx) {
  const energy = getEnergyKcalPer100g(ctx);
  const sugar = numberOrNull(ctx.nutriments.sugars_100g);
  const fiber = numberOrNull(ctx.nutriments.fiber_100g);
  const protein = numberOrNull(ctx.nutriments.proteins_100g);
  const satFat = numberOrNull(ctx.nutriments["saturated-fat_100g"]);

  if (!ctx.hasNutrition || energy === null) {
    return result("yellow", "Calories are missing, so weight-loss fit cannot be estimated from the label.");
  }

  const blockers = [];
  if (energy >= 450) {
    blockers.push(`very calorie dense at ${formatNumber(energy)} kcal per 100 g`);
  }
  if (sugar !== null && sugar >= 22.5) {
    blockers.push(`high sugar at ${formatNumber(sugar)} g per 100 g`);
  }
  if (satFat !== null && satFat >= 5) {
    blockers.push(`high saturated fat at ${formatNumber(satFat)} g per 100 g`);
  }
  if (blockers.length) {
    return result("red", `For a lose-20-lbs goal, use sparingly: ${blockers.slice(0, 2).join("; ")}.`);
  }

  const supportsSatiety = (fiber !== null && fiber >= 3) || (protein !== null && protein >= 8);
  if (energy <= 200 && supportsSatiety && (sugar === null || sugar < 5)) {
    return result("green", "Good fit for a weight-loss goal: lower calorie density with protein or fiber for fullness.");
  }

  const cautions = [];
  if (energy > 250) {
    cautions.push(`${formatNumber(energy)} kcal per 100 g`);
  }
  if (!supportsSatiety) {
    cautions.push("little protein or fiber for fullness");
  }
  if (sugar !== null && sugar >= 5) {
    cautions.push(`moderate sugar at ${formatNumber(sugar)} g per 100 g`);
  }

  return result("yellow", `Can fit a weight-loss plan with portion control: ${cautions.slice(0, 2).join("; ") || "moderate nutrition profile"}.`);
}

function evaluateGainMuscleGoal(ctx) {
  const protein = numberOrNull(ctx.nutriments.proteins_100g);
  const energy = getEnergyKcalPer100g(ctx);
  const sugar = numberOrNull(ctx.nutriments.sugars_100g);
  const satFat = numberOrNull(ctx.nutriments["saturated-fat_100g"]);

  if (protein === null) {
    return result("yellow", "Protein data is missing, so muscle-building value cannot be estimated.");
  }

  if (protein >= 20 && (satFat === null || satFat < 5) && (sugar === null || sugar < 22.5)) {
    return result("green", `Strong muscle-support option: ${formatNumber(protein)} g protein per 100 g.`);
  }

  if (protein >= 10) {
    const caution = satFat !== null && satFat >= 5
      ? ` Saturated fat is high at ${formatNumber(satFat)} g per 100 g.`
      : "";
    return result("yellow", `Useful protein source for gaining muscle at ${formatNumber(protein)} g per 100 g.${caution}`);
  }

  if ((energy !== null && energy >= 350) || (sugar !== null && sugar >= 22.5)) {
    return result("red", `Poor muscle-building tradeoff: only ${formatNumber(protein)} g protein per 100 g with high calories or sugar.`);
  }

  return result("yellow", `Not a major muscle-building food: ${formatNumber(protein)} g protein per 100 g.`);
}

function evaluatePrediabeticGoal(ctx) {
  const sugar = numberOrNull(ctx.nutriments.sugars_100g);
  const addedSugar = numberOrNull(ctx.nutriments["added-sugars_100g"]);
  const carbs = numberOrNull(ctx.nutriments.carbohydrates_100g);
  const fiber = numberOrNull(ctx.nutriments.fiber_100g);

  if (sugar === null && carbs === null) {
    return result("yellow", "Sugar and carbohydrate data are missing, so blood-sugar impact is uncertain.");
  }

  if ((addedSugar !== null && addedSugar >= 10) || (sugar !== null && sugar >= 22.5) || (carbs !== null && carbs >= 60 && (fiber === null || fiber < 3))) {
    return result("red", `Prediabetes caution: ${describeCarbSugar(sugar, carbs, fiber, addedSugar)}.`);
  }

  if ((sugar !== null && sugar >= 5) || (carbs !== null && carbs >= 30 && (fiber === null || fiber < 3))) {
    return result("yellow", `May raise blood sugar quickly; pair with protein/fiber and watch portion size. ${describeCarbSugar(sugar, carbs, fiber, addedSugar)}.`);
  }

  if ((fiber !== null && fiber >= 3) && (sugar === null || sugar < 5)) {
    return result("green", `Better fit for prediabetes: low sugar with ${formatNumber(fiber)} g fiber per 100 g.`);
  }

  return result("green", "Better fit for prediabetes based on the available sugar and carbohydrate data.");
}

function evaluateBloodPressureGoal(ctx) {
  const sodiumMg = getSodiumMgPer100g(ctx);
  const salt = getSaltPer100g(ctx);
  const satFat = numberOrNull(ctx.nutriments["saturated-fat_100g"]);

  if (sodiumMg === null && salt === null) {
    return result("yellow", "Sodium data is missing, so blood-pressure fit cannot be confirmed.");
  }

  if ((salt !== null && salt >= 1.5) || (sodiumMg !== null && sodiumMg >= 600)) {
    return result("red", `High-blood-pressure caution: high sodium at ${formatSodium(sodiumMg, salt)} per 100 g.`);
  }

  if ((salt !== null && salt >= 0.3) || (sodiumMg !== null && sodiumMg >= 120)) {
    return result("yellow", `Moderate sodium at ${formatSodium(sodiumMg, salt)} per 100 g; compare with daily sodium goals.`);
  }

  if (satFat !== null && satFat >= 5) {
    return result("yellow", `Sodium is low, but saturated fat is high at ${formatNumber(satFat)} g per 100 g.`);
  }

  return result("green", `Good blood-pressure fit: low sodium at ${formatSodium(sodiumMg, salt)} per 100 g.`);
}

function evaluateMarathonTrainingGoal(ctx) {
  const carbs = numberOrNull(ctx.nutriments.carbohydrates_100g);
  const protein = numberOrNull(ctx.nutriments.proteins_100g);
  const fat = numberOrNull(ctx.nutriments.fat_100g);
  const sugar = numberOrNull(ctx.nutriments.sugars_100g);
  const sodiumMg = getSodiumMgPer100g(ctx);

  if (hasAlcohol(ctx)) {
    return result("red", "Not a good marathon-training choice around workouts because alcohol is listed.");
  }

  if (carbs === null && protein === null) {
    return result("yellow", "Carbohydrate and protein data are missing, so training value is uncertain.");
  }

  if (carbs !== null && carbs >= 20 && (fat === null || fat <= 10)) {
    const sodiumNote = sodiumMg !== null && sodiumMg >= 120
      ? ` Includes ${formatNumber(sodiumMg)} mg sodium per 100 g, which may help replace sweat losses during long efforts.`
      : "";
    return result("green", `Good training-fuel fit: ${formatNumber(carbs)} g carbohydrates per 100 g with manageable fat.${sodiumNote}`);
  }

  if (protein !== null && protein >= 10 && carbs !== null && carbs >= 10) {
    return result("green", `Good recovery-style option: ${formatNumber(protein)} g protein and ${formatNumber(carbs)} g carbs per 100 g.`);
  }

  if (carbs !== null && carbs >= 20 && fat !== null && fat > 10) {
    return result("yellow", `Has useful carbs at ${formatNumber(carbs)} g per 100 g, but fat may slow digestion before runs.`);
  }

  if (sugar !== null && sugar >= 22.5 && (protein === null || protein < 5)) {
    return result("yellow", `Fast sugar source at ${formatNumber(sugar)} g per 100 g; better for targeted fueling than everyday nutrition.`);
  }

  return result("yellow", "Not a strong marathon-training fuel or recovery option based on the available carb/protein data.");
}

function evaluateLowFodmap(ctx) {
  if (hasLabel(ctx, ["low-fodmap", "fodmap-friendly", "monash-low-fodmap-certified"])) {
    return result("green", "Marked low FODMAP; still check the serving size on the package.");
  }
  if (!ctx.hasIngredients) {
    return result("yellow", "Ingredient data is missing, and FODMAP checks depend on ingredients and serving size.");
  }

  const likelyHigh = findSignals(ctx, lowFodmapLikelyHighTerms);
  if (likelyHigh.length) {
    return result("red", `Likely high-FODMAP ingredient found: ${formatSignalList(likelyHigh)}. Serving size can still change tolerance.`);
  }

  const portionDependent = findSignals(ctx, lowFodmapPortionTerms);
  if (portionDependent.length) {
    return result("yellow", `Potential FODMAP or portion-dependent term found: ${formatSignalList(portionDependent)}.`);
  }

  return result("green", "No common high-FODMAP ingredient was found in the available data; this is not a certified low-FODMAP result.");
}

function evaluateLactoseSensitive(ctx) {
  if (hasLabel(ctx, ["lactose-free"])) {
    return result("green", "Marked lactose-free.");
  }
  if (hasTrace(ctx, ["milk", "lactose"])) {
    return result("yellow", "May contain traces of milk or lactose.");
  }
  if (!ctx.hasIngredients) {
    return result("yellow", "Ingredient data is missing.");
  }

  const likelyLactose = findSignals(ctx, lactoseLikelyTerms);
  if (likelyLactose.length) {
    return result("red", `Likely lactose source found: ${formatSignalList(likelyLactose)}.`);
  }

  const variableLactose = findSignals(ctx, lactoseCautionTerms);
  if (variableLactose.length) {
    return result("yellow", `Dairy-derived or variable-lactose term found: ${formatSignalList(variableLactose)}.`);
  }

  return result("green", "No obvious lactose source was found in the available ingredient data.");
}

function evaluateRefluxAware(ctx) {
  const fat = numberOrNull(ctx.nutriments.fat_100g);
  const satFat = numberOrNull(ctx.nutriments["saturated-fat_100g"]);
  const triggers = findSignals(ctx, refluxTriggerTerms);

  if (hasAlcohol(ctx)) {
    return result("red", "Alcohol is listed, which is a common reflux trigger.");
  }
  if (fat !== null && fat >= 17.5) {
    return result("red", `High fat at ${formatNumber(fat)} g per 100 g, and high-fat foods are common reflux triggers.`);
  }
  if (triggers.length >= 2) {
    return result("red", `Multiple common reflux triggers found: ${formatSignalList(triggers)}.`);
  }
  if (triggers.length) {
    return result("yellow", `Common reflux trigger found: ${formatSignalList(triggers)}.`);
  }
  if ((fat !== null && fat >= 8) || (satFat !== null && satFat >= 5)) {
    return result("yellow", "Fat content is elevated, which may bother reflux-sensitive shoppers.");
  }
  if (!ctx.hasIngredients && !ctx.hasNutrition) {
    return result("yellow", "Ingredient and nutrition data are missing.");
  }

  return result("green", "No common reflux trigger was found in the available data.");
}

function evaluateSensitiveGutAdditives(ctx) {
  if (!ctx.hasIngredients) {
    return result("yellow", "Ingredient data is missing.");
  }

  const strongTriggers = findSignals(ctx, sensitiveGutStrongTerms);
  if (strongTriggers.length) {
    return result("red", `Gut-sensitive sweetener or added fermentable fiber found: ${formatSignalList(strongTriggers)}.`);
  }

  const cautionTriggers = findSignals(ctx, sensitiveGutCautionTerms);
  if (cautionTriggers.length) {
    return result("yellow", `Additive or sweetener that may bother sensitive guts found: ${formatSignalList(cautionTriggers)}.`);
  }

  return result("green", "No common sensitive-gut additive trigger was found in the available ingredient data.");
}

function evaluateFiberSupport(ctx) {
  const fiber = numberOrNull(ctx.nutriments.fiber_100g);
  const fiberSignals = findSignals(ctx, fiberSupportTerms);

  if (fiber !== null) {
    if (fiber >= 6) {
      return result("green", `High fiber at ${formatNumber(fiber)} g per 100 g.`);
    }
    if (fiber >= 3) {
      return result("yellow", `Moderate fiber at ${formatNumber(fiber)} g per 100 g.`);
    }
    return result("red", `Low fiber at ${formatNumber(fiber)} g per 100 g.`);
  }

  if (fiberSignals.length) {
    return result("yellow", `Fiber-supporting ingredient found, but nutrition fiber data is missing: ${formatSignalList(fiberSignals)}.`);
  }

  return result("yellow", "Fiber data is missing, so gut fiber support cannot be confirmed.");
}

function evaluateInformedCertified(ctx) {
  const certifications = findSignals(ctx, informedCertificationTerms);
  if (certifications.length) {
    return result("green", `INFORMED certification signal found: ${formatSignalList(certifications)}. Verify the product and batch in the official directory.`);
  }

  if (hasAnySignal(ctx, ["informed"])) {
    return result("yellow", "INFORMED is mentioned, but Informed Sport or Informed Choice certification is not clear.");
  }

  if (isSportsSupplement(ctx)) {
    return result("yellow", "Sports supplement or performance product detected, but no INFORMED certification is shown in the available data.");
  }

  if (!ctx.hasIngredients) {
    return result("yellow", "Product label data is sparse, so INFORMED certification cannot be confirmed.");
  }

  return result("yellow", "No Informed Sport or Informed Choice certification is shown in the available product data.");
}

function evaluateNsfSportCertified(ctx) {
  const certifications = findSignals(ctx, nsfSportCertificationTerms);
  if (certifications.length) {
    return result("green", `NSF Certified for Sport signal found: ${formatSignalList(certifications)}. Verify the product in the official NSF directory.`);
  }

  if (hasAnySignal(ctx, ["nsf"])) {
    return result("yellow", "NSF is mentioned, but NSF Certified for Sport is not clear.");
  }

  if (isSportsSupplement(ctx)) {
    return result("yellow", "Sports supplement or performance product detected, but NSF Certified for Sport is not shown in the available data.");
  }

  if (!ctx.hasIngredients) {
    return result("yellow", "Product label data is sparse, so NSF Certified for Sport cannot be confirmed.");
  }

  return result("yellow", "No NSF Certified for Sport certification is shown in the available product data.");
}

function evaluateHalal(ctx) {
  if (hasLabel(ctx, ["halal"])) {
    if (hasPork(ctx) || hasAlcohol(ctx)) {
      return result("red", "Halal label exists, but pork or alcohol terms are also present.");
    }
    return result("green", "Marked halal and no obvious pork or alcohol terms were found.");
  }
  if (hasPork(ctx)) {
    return result("red", "Pork, ham, bacon, or lard is listed or tagged.");
  }
  if (hasAlcohol(ctx)) {
    return result("red", "Alcohol, wine, beer, or liqueur terms are listed.");
  }
  if (hasAnySignal(ctx, animalCautionTerms)) {
    return result("yellow", "Animal-derived ingredients are listed, but halal certification is not shown.");
  }
  if (!ctx.hasIngredients) {
    return result("yellow", "Ingredient data is missing and halal certification is not shown.");
  }
  return result("yellow", "No obvious forbidden ingredient was found, but halal certification is not shown.");
}

function evaluateKosher(ctx) {
  if (hasLabel(ctx, ["kosher"])) {
    if (hasPork(ctx) || hasShellfish(ctx)) {
      return result("red", "Kosher label exists, but pork or shellfish terms are also present.");
    }
    return result("green", "Marked kosher and no obvious pork or shellfish terms were found.");
  }
  if (hasPork(ctx)) {
    return result("red", "Pork, ham, bacon, or lard is listed or tagged.");
  }
  if (hasShellfish(ctx)) {
    return result("red", "Shellfish terms are listed or tagged.");
  }
  if (hasAnySignal(ctx, animalCautionTerms)) {
    return result("yellow", "Animal-derived ingredients are listed, but kosher certification is not shown.");
  }
  if (!ctx.hasIngredients) {
    return result("yellow", "Ingredient data is missing and kosher certification is not shown.");
  }
  return result("yellow", "No obvious forbidden ingredient was found, but kosher certification is not shown.");
}

function evaluateNoPork(ctx) {
  if (hasPork(ctx)) {
    return result("red", "Pork, ham, bacon, or lard is listed or tagged.");
  }
  if (hasAnySignal(ctx, ["gelatin", "gelatine", "natural-flavour", "natural-flavor"])) {
    return result("yellow", "Gelatin or natural flavors are listed without a clear source.");
  }
  if (!ctx.hasIngredients) {
    return result("yellow", "Ingredient data is missing.");
  }
  return result("green", "No pork terms were found in the available ingredient data.");
}

function evaluateNoAlcohol(ctx) {
  if (hasAlcohol(ctx)) {
    return result("red", "Alcohol, wine, beer, or liqueur terms are listed.");
  }
  if (hasAnySignal(ctx, ["vanilla-extract", "flavouring", "flavoring", "natural-flavour", "natural-flavor"])) {
    return result("yellow", "Flavoring or extract terms are listed without enough detail.");
  }
  if (!ctx.hasIngredients) {
    return result("yellow", "Ingredient data is missing.");
  }
  return result("green", "No alcohol terms were found in the available ingredient data.");
}

function evaluateVegan(ctx) {
  if (ctx.analysis.includes("en:non-vegan") || hasAnySignal(ctx, veganRedTerms)) {
    return result("red", "Animal-derived ingredients are listed or flagged.");
  }
  if (hasLabel(ctx, ["vegan"]) || ctx.analysis.includes("en:vegan")) {
    return result("green", "Marked vegan in the available product data.");
  }
  if (ctx.analysis.includes("en:maybe-vegan")) {
    return result("yellow", "Open Food Facts marks this as maybe vegan.");
  }
  if (!ctx.hasIngredients) {
    return result("yellow", "Ingredient data is missing.");
  }
  return result("yellow", "No animal-derived ingredient was found, but vegan status is not confirmed.");
}

function evaluateVegetarian(ctx) {
  if (ctx.analysis.includes("en:non-vegetarian") || hasAnySignal(ctx, vegetarianRedTerms)) {
    return result("red", "Meat, fish, shellfish, gelatin, or similar terms are listed.");
  }
  if (hasLabel(ctx, ["vegetarian", "vegan"]) || ctx.analysis.includes("en:vegetarian") || ctx.analysis.includes("en:vegan")) {
    return result("green", "Marked vegetarian or vegan in the available product data.");
  }
  if (ctx.analysis.includes("en:maybe-vegetarian") || hasAnySignal(ctx, ["rennet", "carmine"])) {
    return result("yellow", "Vegetarian status is uncertain from the listed ingredients.");
  }
  if (!ctx.hasIngredients) {
    return result("yellow", "Ingredient data is missing.");
  }
  return result("green", "No meat or fish terms were found in the available ingredient data.");
}

function evaluateGlutenFree(ctx) {
  if (hasAllergen(ctx, glutenTerms)) {
    return result("red", "Gluten, wheat, barley, or rye is listed as an allergen or ingredient.");
  }
  if (hasTrace(ctx, glutenTerms)) {
    return result("yellow", "May contain traces of gluten, wheat, barley, or rye.");
  }
  if (hasLabel(ctx, ["gluten-free"])) {
    return result("green", "Marked gluten-free.");
  }
  if (!ctx.hasIngredients) {
    return result("yellow", "Ingredient data is missing.");
  }
  return result("yellow", "No gluten term was found, but gluten-free certification is not shown.");
}

function evaluateDairyFree(ctx) {
  if (hasAllergen(ctx, dairyTerms)) {
    return result("red", "Milk, lactose, whey, casein, or dairy is listed.");
  }
  if (hasTrace(ctx, dairyTerms)) {
    return result("yellow", "May contain traces of milk or dairy.");
  }
  if (hasLabel(ctx, ["dairy-free", "milk-free", "lactose-free"])) {
    return result("green", "Marked dairy-free, milk-free, or lactose-free.");
  }
  if (!ctx.hasIngredients) {
    return result("yellow", "Ingredient data is missing.");
  }
  return result("green", "No dairy term was found in the available ingredient data.");
}

function evaluateNutFree(ctx) {
  if (hasAllergen(ctx, nutTerms)) {
    return result("red", "Peanuts, tree nuts, or nut terms are listed.");
  }
  if (hasTrace(ctx, nutTerms)) {
    return result("yellow", "May contain traces of peanuts or tree nuts.");
  }
  if (!ctx.hasIngredients) {
    return result("yellow", "Ingredient data is missing.");
  }
  return result("green", "No peanut or tree nut term was found in the available ingredient data.");
}

function evaluatePalmOilFree(ctx) {
  if (ctx.analysis.includes("en:palm-oil") || hasAnySignal(ctx, ["palm-oil", "palm-fat", "huile-de-palme"])) {
    return result("red", "Palm oil or palm fat is listed or flagged.");
  }
  if (ctx.analysis.includes("en:maybe-palm-oil")) {
    return result("yellow", "Open Food Facts marks this as maybe containing palm oil.");
  }
  if (ctx.analysis.includes("en:palm-oil-free") || hasLabel(ctx, ["palm-oil-free"])) {
    return result("green", "Marked palm-oil-free.");
  }
  if (!ctx.hasIngredients) {
    return result("yellow", "Ingredient data is missing.");
  }
  return result("green", "No palm oil term was found in the available ingredient data.");
}

const porkTerms = ["pork", "ham", "bacon", "lard", "prosciutto", "pepperoni", "chorizo", "salami"];
const alcoholTerms = ["alcohol", "wine", "beer", "rum", "brandy", "liqueur", "liquor", "whisky", "whiskey", "bourbon"];
const shellfishTerms = ["shrimp", "prawn", "crab", "lobster", "oyster", "clam", "mussel", "scallop", "shellfish"];
const animalCautionTerms = ["gelatin", "gelatine", "rennet", "collagen", "animal-fat", "beef", "chicken", "meat", "fish"];
const lowFodmapLikelyHighTerms = [
  "garlic",
  "garlic-powder",
  "garlic-salt",
  "onion",
  "onion-powder",
  "onion-salt",
  "shallot",
  "leek",
  "inulin",
  "chicory",
  "chicory-root",
  "fructo-oligosaccharide",
  "fructooligosaccharide",
  "oligofructose",
  "honey",
  "agave",
  "high-fructose-corn-syrup",
  "fructose",
  "apple",
  "pear",
  "mango",
  "watermelon",
  "cherry",
  "cherries",
  "apricot",
  "peach",
  "nectarine",
  "plum",
  "prune",
  "fig",
  "date",
  "raisin",
  "dried-fruit",
  "artichoke",
  "asparagus",
  "cauliflower",
  "mushroom",
  "brussels-sprout",
  "cabbage",
  "lentil",
  "chickpea",
  "chick-pea",
  "hummus",
  "falafel",
  "kidney-bean",
  "black-bean",
  "pinto-bean",
  "cannellini",
  "lima-bean",
  "soybean",
  "soy-bean",
  "split-pea",
  "cashew",
  "pistachio",
  "sorbitol",
  "mannitol",
  "xylitol",
  "maltitol",
  "isomalt",
  "lactitol"
];
const lowFodmapPortionTerms = [
  "wheat",
  "rye",
  "barley",
  "spelt",
  "milk",
  "lactose",
  "yogurt",
  "yoghurt",
  "soft-cheese",
  "cream",
  "ice-cream",
  "fruit-juice",
  "juice-concentrate",
  "molasses",
  "erythritol",
  "green-pea",
  "peas",
  "beans",
  "natural-flavour",
  "natural-flavor",
  "spices",
  "seasoning",
  "sauce",
  "marinade"
];
const lactoseLikelyTerms = [
  "lactose",
  "milk",
  "milk-powder",
  "dry-milk",
  "condensed-milk",
  "evaporated-milk",
  "yogurt",
  "yoghurt",
  "ice-cream",
  "whey",
  "curds",
  "cottage-cheese",
  "ricotta"
];
const lactoseCautionTerms = ["cream", "cheese", "butter", "casein", "caseinate", "milk-solids"];
const refluxTriggerTerms = [
  "coffee",
  "caffeine",
  "cola",
  "energy-drink",
  "chocolate",
  "cocoa",
  "mint",
  "peppermint",
  "spearmint",
  "tomato",
  "citrus",
  "orange",
  "lemon",
  "lime",
  "grapefruit",
  "chili",
  "chilli",
  "jalapeno",
  "hot-sauce",
  "capsaicin",
  "spicy"
];
const sensitiveGutStrongTerms = [
  "sorbitol",
  "mannitol",
  "xylitol",
  "maltitol",
  "isomalt",
  "lactitol",
  "inulin",
  "chicory",
  "chicory-root",
  "fructo-oligosaccharide",
  "fructooligosaccharide",
  "oligofructose"
];
const sensitiveGutCautionTerms = [
  "erythritol",
  "sucralose",
  "aspartame",
  "acesulfame",
  "saccharin",
  "stevia",
  "carrageenan",
  "xanthan-gum",
  "guar-gum",
  "locust-bean-gum",
  "gellan-gum",
  "cellulose-gum",
  "carboxymethylcellulose",
  "polysorbate-80",
  "mono-and-diglycerides"
];
const fiberSupportTerms = [
  "fiber",
  "fibre",
  "whole-grain",
  "wholegrain",
  "oat",
  "oats",
  "bran",
  "psyllium",
  "chia",
  "flaxseed",
  "linseed",
  "beans",
  "lentil",
  "chickpea"
];
const informedCertificationTerms = [
  "informed-sport",
  "informed-choice",
  "informed-protein",
  "informed-ingredient",
  "informed-certified",
  "informed-certification",
  "certified-by-informed",
  "lgc-informed"
];
const nsfSportCertificationTerms = [
  "nsf-certified-for-sport",
  "certified-for-sport",
  "nsf-sport",
  "nsfsport",
  "nsf-certified-sport",
  "certified-by-nsf-for-sport"
];
const sportsSupplementTerms = [
  "supplement",
  "dietary-supplement",
  "sports-nutrition",
  "protein-powder",
  "protein-bar",
  "nutrition-bar",
  "pre-workout",
  "post-workout",
  "creatine",
  "bcaa",
  "amino-acid",
  "electrolyte",
  "hydration",
  "energy-drink",
  "collagen",
  "multivitamin",
  "vitamin",
  "minerals",
  "ergogenic",
  "whey-protein"
];
const mediterraneanChallengeTerms = [
  "olive-oil",
  "extra-virgin-olive-oil",
  "salmon",
  "tuna",
  "sardine",
  "mackerel",
  "fish",
  "lentil",
  "chickpea",
  "bean",
  "hummus",
  "whole-grain",
  "wholegrain",
  "oat",
  "barley",
  "quinoa",
  "vegetable",
  "tomato",
  "spinach",
  "eggplant",
  "pepper",
  "almond",
  "walnut",
  "pistachio",
  "nut"
];
const veganRedTerms = [
  ...animalCautionTerms,
  "milk",
  "lactose",
  "whey",
  "casein",
  "butter",
  "cream",
  "cheese",
  "egg",
  "honey",
  "carmine",
  "shellac",
  "fish",
  "anchovy",
  "meat"
];
const vegetarianRedTerms = ["beef", "chicken", "pork", "meat", "fish", "anchovy", "shellfish", "gelatin", "gelatine"];
const glutenTerms = ["gluten", "wheat", "barley", "rye", "spelt", "malt"];
const dairyTerms = ["milk", "lactose", "whey", "casein", "butter", "cream", "cheese", "dairy", "yogurt", "yoghurt"];
const nutTerms = [
  "peanut",
  "nut",
  "almond",
  "cashew",
  "hazelnut",
  "walnut",
  "pecan",
  "pistachio",
  "macadamia",
  "brazil-nut"
];

function hasPork(ctx) {
  return hasAnySignal(ctx, porkTerms);
}

function hasAlcohol(ctx) {
  return hasAnySignal(ctx, alcoholTerms);
}

function hasShellfish(ctx) {
  return hasAnySignal(ctx, shellfishTerms);
}

function hasLabel(ctx, terms) {
  return ctx.labels.some(tag => terms.some(term => normalizedIncludes(tag, term)));
}

function hasAllergen(ctx, terms) {
  return [...ctx.allergens, ...ctx.ingredients].some(tag => terms.some(term => normalizedIncludes(tag, term))) ||
    terms.some(term => containsWholeishTerm(ctx.text, term));
}

function hasTrace(ctx, terms) {
  return ctx.traces.some(tag => terms.some(term => normalizedIncludes(tag, term)));
}

function hasAnySignal(ctx, terms) {
  const searchableTags = [
    ...ctx.labels,
    ...ctx.ingredients,
    ...ctx.categories,
    ...ctx.allergens,
    ...ctx.traces,
    ...ctx.additives,
    ...ctx.analysis
  ];
  return searchableTags.some(tag => terms.some(term => normalizedIncludes(tag, term))) ||
    terms.some(term => containsWholeishTerm(ctx.text, term));
}

function isSportsSupplement(ctx) {
  return hasAnySignal(ctx, sportsSupplementTerms);
}

function findSignals(ctx, terms, limit = 3) {
  const matches = [];
  terms.forEach(term => {
    if (matches.length >= limit) {
      return;
    }
    if (hasAnySignal(ctx, [term])) {
      matches.push(formatTerm(term));
    }
  });
  return [...new Set(matches)];
}

function getSaltPer100g(ctx) {
  const salt = numberOrNull(ctx.nutriments.salt_100g);
  if (salt !== null) {
    return salt;
  }
  const sodium = numberOrNull(ctx.nutriments.sodium_100g);
  return sodium === null ? null : sodium * 2.5;
}

function getSodiumMgPer100g(ctx) {
  const sodium = numberOrNull(ctx.nutriments.sodium_100g);
  if (sodium !== null) {
    return sodium * 1000;
  }
  const salt = numberOrNull(ctx.nutriments.salt_100g);
  return salt === null ? null : (salt / 2.5) * 1000;
}

function getEnergyKcalPer100g(ctx) {
  const kcal = numberOrNull(ctx.nutriments["energy-kcal_100g"]);
  if (kcal !== null) {
    return kcal;
  }
  const energyKj = numberOrNull(ctx.nutriments.energy_100g);
  return energyKj === null ? null : energyKj / 4.184;
}

function describeCarbSugar(sugar, carbs, fiber, addedSugar) {
  const parts = [];
  if (sugar !== null) {
    parts.push(`${formatNumber(sugar)} g sugars`);
  }
  if (addedSugar !== null) {
    parts.push(`${formatNumber(addedSugar)} g added sugars`);
  }
  if (carbs !== null) {
    parts.push(`${formatNumber(carbs)} g carbs`);
  }
  if (fiber !== null) {
    parts.push(`${formatNumber(fiber)} g fiber`);
  }
  return `${parts.join(", ")} per 100 g`;
}

function formatSodium(sodiumMg, salt) {
  if (sodiumMg !== null) {
    return `${formatNumber(sodiumMg)} mg sodium`;
  }
  return `${formatNumber(salt)} g salt`;
}

function combineStatuses(statuses) {
  if (statuses.includes("red")) {
    return "red";
  }
  if (statuses.includes("yellow")) {
    return "yellow";
  }
  return "green";
}

function maxStatus(a, b) {
  const rank = { green: 1, yellow: 2, red: 3 };
  return rank[b] > rank[a] ? b : a;
}

function result(status, reason) {
  return { status, reason };
}

function statusLabel(status) {
  return {
    red: "Bad",
    yellow: "Not great",
    green: "Good",
    idle: "Waiting"
  }[status] || "Not great";
}

function dataQualityLabel(ctx) {
  if (ctx.sourceCount > 1 && ctx.hasIngredients && ctx.hasNutrition) {
    return "Merged data";
  }
  if (ctx.hasIngredients && ctx.hasNutrition) {
    return "Good data";
  }
  if (ctx.hasIngredients || ctx.hasNutrition) {
    return "Partial data";
  }
  return "Sparse data";
}

function setResultStatus(status) {
  dom.resultCard.classList.remove("status-idle", "status-red", "status-yellow", "status-green");
  dom.resultCard.classList.add(`status-${status}`);
}

function showCameraResult(status, label, title, reason) {
  dom.cameraResultOverlay.classList.remove("hidden", "status-idle", "status-red", "status-yellow", "status-green");
  dom.cameraResultOverlay.classList.add(`status-${status}`);
  dom.cameraResultLabel.textContent = label;
  dom.cameraResultTitle.textContent = title;
  dom.cameraResultReason.textContent = reason;
}

function hideCameraResult() {
  dom.cameraResultOverlay.classList.add("hidden");
}

function addHistory(product, evaluation) {
  const entry = {
    code: product.code,
    name: product.product_name || product.generic_name || "Unnamed product",
    status: evaluation.status,
    at: Date.now()
  };
  state.history = [
    entry,
    ...state.history.filter(item => item.code !== entry.code)
  ].slice(0, 7);
  saveJson(STORAGE_KEYS.history, state.history);
  renderHistory();
}

function renderHistory() {
  dom.historyList.innerHTML = "";
  if (!state.history.length) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "No recent scans.";
    dom.historyList.append(empty);
    return;
  }

  state.history.forEach(item => {
    const button = document.createElement("button");
    button.className = `history-item status-${item.status}`;
    button.type = "button";
    button.addEventListener("click", () => handleBarcode(item.code));
    button.innerHTML = `
      <span class="history-signal"></span>
      <span>
        <span class="history-name">${escapeHtml(item.name)}</span>
        <span class="history-code">${escapeHtml(item.code)}</span>
      </span>
      <span class="history-status">${escapeHtml(statusLabel(item.status))}</span>
    `;
    dom.historyList.append(button);
  });
}

async function getSupportedBarcodeFormats() {
  const preferred = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"];
  if (!BarcodeDetector.getSupportedFormats) {
    return preferred;
  }
  const supported = await BarcodeDetector.getSupportedFormats();
  return preferred.filter(format => supported.includes(format));
}

function setStatus(message) {
  dom.statusText.textContent = message;
}

function cleanBarcode(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 14);
  return digits.length >= 6 ? digits : "";
}

function arrayify(value) {
  return Array.isArray(value) ? value.map(item => String(item).toLowerCase()) : [];
}

function arrayifyRaw(value) {
  return Array.isArray(value) ? value : [];
}

function firstFilled(...values) {
  return values.find(value => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null && String(value).trim() !== "";
  }) || "";
}

function mergeArrays(...arrays) {
  const merged = [];
  arrays.flatMap(array => Array.isArray(array) ? array : []).forEach(item => {
    const value = String(item || "").toLowerCase();
    if (value && !merged.includes(value)) {
      merged.push(value);
    }
  });
  return merged;
}

function hasUsableValue(value) {
  return value !== undefined && value !== null && value !== "" && Number.isFinite(Number(value));
}

function titleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b[a-z]/g, char => char.toUpperCase());
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizedIncludes(value, term) {
  const source = String(value || "").toLowerCase().replace(/^en:/, "");
  const needle = String(term || "").toLowerCase().replace(/\s+/g, "-");
  return source.includes(needle) || source.replace(/-/g, " ").includes(needle.replace(/-/g, " "));
}

function containsWholeishTerm(text, term) {
  const normalizedText = String(text || "").toLowerCase().replace(/[_-]/g, " ");
  const normalizedTerm = String(term || "").toLowerCase().replace(/[_-]/g, " ");
  const pattern = new RegExp(`(^|[^a-z])${escapeRegExp(normalizedTerm)}([^a-z]|$)`, "i");
  return pattern.test(normalizedText);
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

function formatMoney(value) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(value);
}

function parseQuantityGrams(value) {
  const text = String(value || "").toLowerCase();
  const kg = text.match(/([\d.]+)\s*kg/);
  if (kg) {
    return Number(kg[1]) * 1000;
  }
  const grams = text.match(/([\d.]+)\s*g\b/);
  if (grams) {
    return Number(grams[1]);
  }
  const ounces = text.match(/([\d.]+)\s*(?:oz|ounce|ounces)/);
  if (ounces) {
    return Number(ounces[1]) * 28.3495;
  }
  return null;
}

function loadScriptOnce(src, globalName) {
  if (globalName && window[globalName]) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Script failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Script failed to load.")), { once: true });
    document.head.append(script);
  });
}

function formatSignalList(items) {
  return items.slice(0, 3).join(", ");
}

function formatTerm(term) {
  return String(term || "").replace(/-/g, " ");
}

function groupBy(items, getKey) {
  const groups = new Map();
  items.forEach(item => {
    const key = getKey(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  });
  return groups;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function todayKey() {
  return dateKey(new Date());
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadChallengeState() {
  const loaded = loadJson(STORAGE_KEYS.challenges, null);
  if (!loaded || typeof loaded !== "object") {
    return {
      activeId: "",
      progress: {}
    };
  }
  return {
    activeId: typeof loaded.activeId === "string" ? loaded.activeId : "",
    progress: loaded.progress && typeof loaded.progress === "object" ? loaded.progress : {}
  };
}

function saveChallengeState() {
  saveJson(STORAGE_KEYS.challenges, state.challenges);
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function saveSelectedProfiles() {
  saveJson(STORAGE_KEYS.selected, [...state.selectedProfiles]);
}
