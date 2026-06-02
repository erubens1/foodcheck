const ZXING_CDN = "https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm";
const OFF_PRODUCT_ENDPOINT = "https://world.openfoodfacts.org/api/v2/product/";
const SAMPLE_BARCODE = "3017620422003";
const STORAGE_KEYS = {
  selected: "foodlight:selectedProfiles",
  history: "foodlight:history"
};

const defaultProfiles = ["general-health"];

const dom = {
  startScan: document.querySelector("#startScan"),
  stopScan: document.querySelector("#stopScan"),
  video: document.querySelector("#videoPreview"),
  scannerFrame: document.querySelector("#scannerFrame"),
  cameraEmpty: document.querySelector("#cameraEmpty"),
  manualForm: document.querySelector("#manualForm"),
  barcodeInput: document.querySelector("#barcodeInput"),
  sampleProduct: document.querySelector("#sampleProduct"),
  clearHistory: document.querySelector("#clearHistory"),
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
  checkList: document.querySelector("#checkList"),
  historyList: document.querySelector("#historyList")
};

const state = {
  selectedProfiles: new Set(loadJson(STORAGE_KEYS.selected, defaultProfiles)),
  history: loadJson(STORAGE_KEYS.history, []),
  activeProduct: null,
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
  bindEvents();
  refreshActiveEvaluation();

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
  dom.sampleProduct.addEventListener("click", () => handleBarcode(SAMPLE_BARCODE));
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
  });
}

async function startScanner() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("Camera access is not available in this browser.");
    return;
  }

  await stopScanner();
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
  setStatus(`Checking ${code}...`);
  renderLoadingResult(code);

  try {
    const product = await fetchProduct(code);
    state.activeProduct = product;
    const evaluation = evaluateProduct(product);
    renderProductResult(product, evaluation);
    addHistory(product, evaluation);
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
  const url = `${OFF_PRODUCT_ENDPOINT}${encodeURIComponent(code)}.json?fields=${encodeURIComponent(productFields.join(","))}`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error("Product lookup failed.");
    }
    const payload = await response.json();
    if (payload.status !== 1 || !payload.product) {
      throw new Error("Product not found in Open Food Facts.");
    }
    return payload.product;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Product lookup timed out.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
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
  dom.productSummary.classList.add("hidden");
  dom.checkList.innerHTML = "";
}

function renderErrorResult(code, message) {
  dom.confidencePill.textContent = "No product";
  setResultStatus("yellow");
  dom.resultHeadline.textContent = "Not enough data";
  dom.resultReason.textContent = `${message} Barcode ${code} can still be checked against the package label.`;
  dom.productSummary.classList.add("hidden");
  dom.checkList.innerHTML = "";
}

function renderProductResult(product, evaluation) {
  const statusText = statusLabel(evaluation.status);
  dom.confidencePill.textContent = evaluation.dataQuality;
  setResultStatus(evaluation.status);
  dom.resultHeadline.textContent = `${statusText} for selected profiles`;
  dom.resultReason.textContent = evaluation.summary;

  const image = product.image_front_small_url || product.image_front_url || product.image_url || "";
  if (image) {
    dom.productImage.src = image;
    dom.productImage.alt = product.product_name || "Product image";
  } else {
    dom.productImage.removeAttribute("src");
    dom.productImage.alt = "";
  }
  dom.productName.textContent = product.product_name || product.generic_name || "Unnamed product";
  dom.productMeta.textContent = [product.brands, product.quantity, product.code].filter(Boolean).join(" | ");
  dom.productSummary.classList.remove("hidden");

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
    return;
  }
  renderProductResult(state.activeProduct, evaluateProduct(state.activeProduct));
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
    product.ingredients_text_en,
    product.ingredients_text,
    product.generic_name,
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

function getSaltPer100g(ctx) {
  const salt = numberOrNull(ctx.nutriments.salt_100g);
  if (salt !== null) {
    return salt;
  }
  const sodium = numberOrNull(ctx.nutriments.sodium_100g);
  return sodium === null ? null : sodium * 2.5;
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
