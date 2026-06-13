/* EatMeFirst v2 — per-user fridge tracker with AI photo/recipe + barcode lookup.
   - Logged in  -> data syncs to Firebase Realtime DB at fridge/<uid>
   - Guest      -> data stays in localStorage on this device
   - Photo add & recipes -> Claude API (key stored locally, called from browser)
   - Barcode    -> Open Food Facts (free) + optional camera scan (BarcodeDetector)
*/
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { ref, set, onValue, off } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

(function () {
  "use strict";

  const STORE_KEY = "eatmefirst.items.v1";
  const STATS_KEY = "eatmefirst.stats.v1";
  const KEY_KEY = "eatmefirst.anthropicKey";
  const MODEL_KEY = "eatmefirst.model";
  const SOON_DAYS = 2;
  const SUGGEST_DAYS = 3;
  const DEFAULT_PRICE = 3;
  const DEFAULT_MODEL = "claude-opus-4-8";

  const CATEGORIES = [
    { key: "dairy", label: "Dairy", color: "#60a5fa", shelf: 7 },
    { key: "produce", label: "Produce", color: "#4ade80", shelf: 5 },
    { key: "meat", label: "Meat / Fish", color: "#f87171", shelf: 3 },
    { key: "leftovers", label: "Leftovers", color: "#fbbf24", shelf: 3 },
    { key: "bakery", label: "Bakery", color: "#d8a657", shelf: 4 },
    { key: "eggs", label: "Eggs", color: "#fcd34d", shelf: 21 },
    { key: "drinks", label: "Drinks", color: "#38bdf8", shelf: 10 },
    { key: "other", label: "Other", color: "#9ca3af", shelf: 7 },
  ];
  const CAT_KEYS = CATEGORIES.map((c) => c.key);

  const QUICK_ITEMS = [
    { name: "Milk", category: "dairy" },
    { name: "Leftovers", category: "leftovers" },
    { name: "Chicken", category: "meat" },
    { name: "Spinach", category: "produce" },
    { name: "Bread", category: "bakery" },
    { name: "Eggs", category: "eggs" },
  ];

  // ---- State ----
  let items = [];
  let stats = { saved: 0, wasted: 0, money: 0 };
  let activeFilter = "all";
  let currentUser = null;
  let dbRef = null; // active onValue ref when logged in

  // ---- DOM ----
  const $ = (id) => document.getElementById(id);
  const els = {
    form: $("addForm"), name: $("name"), category: $("category"), qty: $("qty"),
    expiry: $("expiry"), price: $("price"), quickAdd: $("quickAdd"),
    list: $("itemList"), listCount: $("listCount"), empty: $("emptyState"),
    filters: $("filters"), suggestCard: $("suggestCard"), suggestText: $("suggestText"),
    statTracked: $("statTracked"), statSaved: $("statSaved"), statMoney: $("statMoney"), statWasted: $("statWasted"),
    notifyBtn: $("notifyBtn"), notifyLabel: $("notifyLabel"),
    userBadge: $("userBadge"), authLink: $("authLink"), syncBanner: $("syncBanner"), footerNote: $("footerNote"),
    // smart add
    photoBtn: $("photoBtn"), photoInput: $("photoInput"), barcodeBtn: $("barcodeBtn"),
    barcodePanel: $("barcodePanel"), barcodeInput: $("barcodeInput"),
    barcodeLookupBtn: $("barcodeLookupBtn"), barcodeScanBtn: $("barcodeScanBtn"),
    smartStatus: $("smartStatus"),
    // recipe
    recipeBtn: $("recipeBtn"), recipeOutput: $("recipeOutput"),
    // settings modal
    settingsBtn: $("settingsBtn"), settingsModal: $("settingsModal"),
    apiKeyInput: $("apiKeyInput"), modelInput: $("modelInput"),
    settingsSaveBtn: $("settingsSaveBtn"), settingsCancelBtn: $("settingsCancelBtn"), settingsClearBtn: $("settingsClearBtn"),
    // scan modal
    scanModal: $("scanModal"), scanVideo: $("scanVideo"), scanStatus: $("scanStatus"), scanCloseBtn: $("scanCloseBtn"),
  };

  // ---- Small helpers ----
  function loadLocal(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function cat(key) { return CATEGORIES.find((c) => c.key === key) || CATEGORIES[CATEGORIES.length - 1]; }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function daysUntil(iso) {
    const d = new Date(iso + "T00:00:00"); const now = new Date(todayISO() + "T00:00:00");
    return Math.round((d - now) / 86400000);
  }
  function urgency(days) { if (days < 0) return "expired"; if (days <= SOON_DAYS) return "soon"; return "fresh"; }
  function expiryLabel(days) {
    if (days < 0) return `Expired ${Math.abs(days)}d ago`;
    if (days === 0) return "Use today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }
  function defaultExpiryFor(catKey) {
    const d = new Date(); d.setDate(d.getDate() + cat(catKey).shelf);
    return d.toISOString().slice(0, 10);
  }

  // ---- Storage backend (Firebase per-user OR localStorage guest) ----
  function persist() {
    if (currentUser) {
      set(ref(db, "fridge/" + currentUser.uid), { items, stats }).catch((e) => console.warn("sync failed", e));
    } else {
      localStorage.setItem(STORE_KEY, JSON.stringify(items));
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }
  }
  function detachCloud() { if (dbRef) { off(dbRef); dbRef = null; } }
  function attachStore() {
    detachCloud();
    if (currentUser) {
      dbRef = ref(db, "fridge/" + currentUser.uid);
      onValue(dbRef, (snap) => {
        const v = snap.val() || {};
        items = Array.isArray(v.items) ? v.items : [];
        stats = v.stats || { saved: 0, wasted: 0, money: 0 };
        render();
      }, (err) => {
        console.warn("read failed", err);
        els.smartStatus.textContent = "Cloud read failed — check database rules.";
      });
    } else {
      items = loadLocal(STORE_KEY, []);
      stats = loadLocal(STATS_KEY, { saved: 0, wasted: 0, money: 0 });
      render();
    }
  }

  // ---- Auth wiring ----
  function updateAccountUI() {
    if (currentUser) {
      const who = currentUser.displayName || currentUser.email;
      els.userBadge.textContent = who;
      els.userBadge.classList.remove("hidden");
      els.authLink.textContent = "Log out";
      els.authLink.href = "#";
      els.syncBanner.classList.add("hidden");
      els.footerNote.textContent = "Synced to your account — your fridge follows you across devices.";
    } else {
      els.userBadge.classList.add("hidden");
      els.authLink.textContent = "Log in";
      els.authLink.href = "log in.html";
      els.syncBanner.classList.remove("hidden");
      els.footerNote.textContent = "Guest mode: data stays on this device. Built with EatMeFirst.";
    }
  }

  // ---- Render ----
  function buildCategoryOptions() {
    els.category.innerHTML = CATEGORIES.map((c) => `<option value="${c.key}">${c.label}</option>`).join("");
  }
  function buildQuickAdd() {
    els.quickAdd.innerHTML =
      `<span style="color:var(--muted);font-size:.8rem;align-self:center;">Quick add:</span>` +
      QUICK_ITEMS.map((q) => `<button type="button" data-name="${q.name}" data-cat="${q.category}"><span class="cat-dot" style="background:${cat(q.category).color}"></span>${q.name}</button>`).join("");
  }
  function render() {
    const sorted = [...items].sort((a, b) => a.expiry.localeCompare(b.expiry));
    const filtered = sorted.filter((it) => {
      if (activeFilter === "all") return true;
      const u = urgency(daysUntil(it.expiry));
      if (activeFilter === "soon") return u === "soon" || u === "expired";
      if (activeFilter === "fresh") return u === "fresh";
      return true;
    });
    els.list.innerHTML = filtered.map(renderItem).join("");
    els.listCount.textContent = items.length ? `(${items.length})` : "";
    els.empty.classList.toggle("hidden", items.length > 0);
    renderStats();
    renderSuggestions(sorted);
  }
  function renderItem(it) {
    const days = daysUntil(it.expiry); const u = urgency(days); const c = cat(it.category);
    const qty = it.qty > 1 ? `<span class="item-meta">×${it.qty}</span> ` : "";
    return `
      <li class="item urgent-${u}" data-id="${it.id}">
        <span class="item-dot" style="background:${c.color}"></span>
        <div class="item-main">
          <div class="item-name">${escapeHtml(it.name)}</div>
          <div class="item-meta">${qty}${c.label}</div>
        </div>
        <span class="badge ${u}">${expiryLabel(days)}</span>
        <div class="item-actions">
          <button class="act-btn eat" data-act="eat" data-id="${it.id}">Ate it</button>
          <button class="act-btn toss" data-act="toss" data-id="${it.id}">Tossed</button>
        </div>
      </li>`;
  }
  function renderStats() {
    els.statTracked.textContent = items.length;
    els.statSaved.textContent = stats.saved || 0;
    els.statMoney.textContent = "$" + Math.round(stats.money || 0);
    els.statWasted.textContent = stats.wasted || 0;
  }
  function renderSuggestions(sorted) {
    const soon = sorted.filter((it) => { const d = daysUntil(it.expiry); return d >= 0 && d <= SUGGEST_DAYS; });
    if (!soon.length) { els.suggestCard.classList.add("hidden"); return; }
    const names = soon.map((it) => it.name);
    const list = names.slice(0, 4).join(", ");
    const extra = names.length > 4 ? ` and ${names.length - 4} more` : "";
    els.suggestText.textContent =
      `${list}${extra} ${names.length === 1 ? "is" : "are"} on the clock. ` +
      `Plan a meal around ${pickMealIdea(soon)} tonight — or hit "Suggest a recipe" above.`;
    els.suggestCard.classList.remove("hidden");
  }
  function pickMealIdea(soonItems) {
    const cats = new Set(soonItems.map((i) => i.category));
    if (cats.has("meat") && cats.has("produce")) return "a stir-fry";
    if (cats.has("produce")) return "a soup or salad";
    if (cats.has("dairy")) return "a smoothie or sauce";
    if (cats.has("bakery")) return "toast, sandwiches, or French toast";
    if (cats.has("leftovers")) return "a clean-out-the-fridge bowl";
    return "a quick fridge-clear meal";
  }

  // ---- Item actions ----
  function makeItem(o) {
    return {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      name: o.name,
      category: CAT_KEYS.includes(o.category) ? o.category : "other",
      qty: Math.max(1, parseInt(o.qty, 10) || 1),
      expiry: o.expiry || defaultExpiryFor(o.category),
      price: parseFloat(o.price) || DEFAULT_PRICE,
      added: todayISO(),
      notified: false,
    };
  }
  function addItem(e) {
    if (e) e.preventDefault();
    const name = els.name.value.trim();
    if (!name) return;
    items = items.concat(makeItem({
      name, category: els.category.value, qty: els.qty.value,
      expiry: els.expiry.value, price: els.price.value,
    }));
    persist(); render();
    els.form.reset(); els.qty.value = 1; prefillExpiry(); els.name.focus();
  }
  function resolveItem(id, ate) {
    const idx = items.findIndex((it) => it.id === id);
    if (idx === -1) return;
    const it = items[idx];
    if (ate) { stats.saved = (stats.saved || 0) + 1; stats.money = (stats.money || 0) + (it.price || DEFAULT_PRICE); }
    else { stats.wasted = (stats.wasted || 0) + 1; }
    items = items.slice(0, idx).concat(items.slice(idx + 1));
    persist(); render();
  }
  function prefillExpiry() { if (!els.expiry.value) els.expiry.value = defaultExpiryFor(els.category.value); }

  // ---- Notifications ----
  function updateNotifyUI() {
    if (!("Notification" in window)) { els.notifyBtn.classList.add("hidden"); return; }
    const granted = Notification.permission === "granted";
    els.notifyBtn.classList.toggle("on", granted);
    els.notifyLabel.textContent = granted ? "Reminders on" : "Reminders";
  }
  function requestNotify() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") { checkExpiringAndNotify(true); return; }
    Notification.requestPermission().then(() => { updateNotifyUI(); checkExpiringAndNotify(true); });
  }
  function checkExpiringAndNotify(force) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const due = items.filter((it) => { const d = daysUntil(it.expiry); return d <= SOON_DAYS && (force || !it.notified); });
    if (!due.length) return;
    const names = due.map((it) => it.name).slice(0, 3).join(", ");
    const more = due.length > 3 ? ` +${due.length - 3} more` : "";
    new Notification("Eat these before they spoil", {
      body: `${names}${more} ${due.length === 1 ? "needs" : "need"} eating soon.`, tag: "eatmefirst-expiry",
    });
    due.forEach((it) => (it.notified = true));
    persist();
  }

  // ================= AI / Claude =================
  function getApiKey() { return (localStorage.getItem(KEY_KEY) || "").trim(); }
  function getModel() { return localStorage.getItem(MODEL_KEY) || DEFAULT_MODEL; }

  async function callClaude({ system, userContent, maxTokens = 1024, schema = null }) {
    const key = getApiKey();
    if (!key) { const err = new Error("NO_KEY"); err.code = "NO_KEY"; throw err; }
    const body = {
      model: getModel(),
      max_tokens: maxTokens,
      messages: [{ role: "user", content: userContent }],
    };
    if (system) body.system = system;
    if (schema) body.output_config = { format: { type: "json_schema", schema } };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let detail = res.status + "";
      try { const j = await res.json(); detail = (j.error && j.error.message) || JSON.stringify(j); } catch (e) {}
      const err = new Error(detail); err.status = res.status; throw err;
    }
    const data = await res.json();
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    return schema ? JSON.parse(text) : text;
  }

  function aiErrorMessage(err) {
    if (err.code === "NO_KEY") return "Add your Anthropic API key first (AI settings).";
    if (err.status === 401) return "Invalid API key — check it in AI settings.";
    if (err.status === 429) return "Rate limited by Anthropic — try again in a moment.";
    if (String(err.message).includes("Failed to fetch"))
      return "Network/CORS error reaching Anthropic. Check your key and connection.";
    return "AI request failed: " + err.message;
  }

  // ---- Photo add (vision) ----
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => { const s = r.result; resolve({ data: s.split(",")[1], media: (s.match(/^data:(.*?);/) || [])[1] || file.type }); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  async function handlePhoto(file) {
    if (!file) return;
    if (!getApiKey()) { openSettings(); return; }
    els.smartStatus.textContent = "Reading photo…";
    els.photoBtn.disabled = true;
    try {
      const { data, media } = await fileToBase64(file);
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          category: { type: "string", enum: CAT_KEYS },
          quantity: { type: "integer" },
          expiry: { type: "string" },
        },
        required: ["name", "category", "quantity"],
        additionalProperties: false,
      };
      const out = await callClaude({
        system:
          "You identify a single food or grocery item from a photo for a fridge tracker. " +
          "Read any printed use-by / best-before / expiry date if visible. " +
          "category must be one of: " + CAT_KEYS.join(", ") + ". " +
          "Respond ONLY as JSON matching the schema.",
        userContent: [
          { type: "image", source: { type: "base64", media_type: media || "image/jpeg", data } },
          { type: "text", text:
            "Identify this item. Give its common name, best category, an integer quantity " +
            "(default 1), and the printed expiry date as YYYY-MM-DD if you can read one (else leave expiry empty)." },
        ],
        maxTokens: 400,
        schema,
      });
      prefillForm(out);
      els.smartStatus.textContent = "Found: " + out.name + " — review and press Add.";
    } catch (err) {
      els.smartStatus.textContent = aiErrorMessage(err);
    } finally {
      els.photoBtn.disabled = false;
      els.photoInput.value = "";
    }
  }
  function prefillForm(o) {
    if (o.name) els.name.value = o.name;
    if (o.category && CAT_KEYS.includes(o.category)) els.category.value = o.category;
    if (o.quantity) els.qty.value = Math.max(1, parseInt(o.quantity, 10) || 1);
    const exp = (o.expiry || "").trim();
    els.expiry.value = /^\d{4}-\d{2}-\d{2}$/.test(exp) ? exp : defaultExpiryFor(els.category.value);
    els.name.focus();
  }

  // ---- Barcode (Open Food Facts) ----
  async function lookupBarcode(code) {
    code = (code || "").replace(/\D/g, "");
    if (!code) { els.smartStatus.textContent = "Enter a barcode number first."; return; }
    els.smartStatus.textContent = "Looking up " + code + "…";
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,categories_tags_en`);
      const j = await res.json();
      if (j.status !== 1 || !j.product) { els.smartStatus.textContent = "No product found for that barcode — add it manually."; return; }
      const p = j.product;
      const name = p.product_name || p.brands || "Unknown item";
      const guessed = guessCategory((p.categories_tags_en || []).join(" ").toLowerCase());
      prefillForm({ name, category: guessed, quantity: 1, expiry: "" });
      els.smartStatus.textContent = name + " — set the use-by date and press Add.";
    } catch (e) {
      els.smartStatus.textContent = "Lookup failed (network). Add it manually.";
    }
  }
  function guessCategory(text) {
    if (/milk|cheese|yogurt|yoghurt|dairy|butter|cream/.test(text)) return "dairy";
    if (/meat|chicken|beef|pork|fish|seafood|sausage/.test(text)) return "meat";
    if (/fruit|vegetable|produce|salad|veg/.test(text)) return "produce";
    if (/bread|bakery|pastr|cake|bun/.test(text)) return "bakery";
    if (/egg/.test(text)) return "eggs";
    if (/drink|juice|beverage|soda|water|tea|coffee/.test(text)) return "drinks";
    return "other";
  }

  // ---- Live barcode scan (optional) ----
  let scanStream = null, scanRunning = false, barcodeDetector = null;
  function scanSupported() { return "BarcodeDetector" in window; }
  async function startScan() {
    if (!scanSupported()) { els.smartStatus.textContent = "Live scanning unsupported here — type the number instead."; return; }
    try {
      barcodeDetector = barcodeDetector || new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
      scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      els.scanVideo.srcObject = scanStream;
      await els.scanVideo.play();
      els.scanModal.classList.remove("hidden");
      scanRunning = true;
      scanTick();
    } catch (e) {
      els.smartStatus.textContent = "Camera unavailable — type the barcode number instead.";
      stopScan();
    }
  }
  async function scanTick() {
    if (!scanRunning) return;
    try {
      const codes = await barcodeDetector.detect(els.scanVideo);
      if (codes && codes.length) {
        const code = codes[0].rawValue;
        els.scanStatus.textContent = "Found: " + code;
        stopScan();
        els.barcodeInput.value = code;
        lookupBarcode(code);
        return;
      }
    } catch (e) { /* keep trying */ }
    requestAnimationFrame(scanTick);
  }
  function stopScan() {
    scanRunning = false;
    if (scanStream) { scanStream.getTracks().forEach((t) => t.stop()); scanStream = null; }
    els.scanModal.classList.add("hidden");
  }

  // ---- Recipe (Claude) ----
  async function suggestRecipe() {
    if (!getApiKey()) { openSettings(); return; }
    if (!items.length) { els.recipeOutput.innerHTML = `<p class="recipe-error">Your fridge is empty — add some items first.</p>`; return; }
    const sorted = [...items].sort((a, b) => a.expiry.localeCompare(b.expiry));
    const focus = sorted.filter((it) => daysUntil(it.expiry) <= SUGGEST_DAYS);
    const pick = (focus.length ? focus : sorted).slice(0, 6);
    const listing = pick.map((it) => `${it.name} (${expiryLabel(daysUntil(it.expiry)).toLowerCase()})`).join(", ");

    els.recipeBtn.disabled = true;
    els.recipeOutput.innerHTML = `<p class="recipe-loading">Cooking up an idea from: ${escapeHtml(listing)}…</p>`;
    try {
      const schema = {
        type: "object",
        properties: {
          title: { type: "string" },
          intro: { type: "string" },
          uses: { type: "array", items: { type: "string" } },
          ingredients: { type: "array", items: { type: "string" } },
          steps: { type: "array", items: { type: "string" } },
        },
        required: ["title", "ingredients", "steps"],
        additionalProperties: false,
      };
      const out = await callClaude({
        system:
          "You are a practical home cook helping reduce food waste. Suggest ONE simple, realistic recipe that " +
          "uses as many of the user's soon-to-expire ingredients as possible. Assume common staples are available " +
          "(oil, salt, pepper, onion, garlic, rice, pasta, flour). Keep it beginner-friendly. " +
          "Respond ONLY as JSON matching the schema. 'uses' = the user's listed items your recipe actually uses.",
        userContent:
          "Ingredients I need to use up soon: " + listing + ". " +
          "Create one recipe that makes the most of them.",
        maxTokens: 1200,
        schema,
      });
      renderRecipe(out);
    } catch (err) {
      els.recipeOutput.innerHTML = `<p class="recipe-error">${escapeHtml(aiErrorMessage(err))}</p>`;
    } finally {
      els.recipeBtn.disabled = false;
    }
  }
  function renderRecipe(r) {
    const uses = (r.uses || []).map((u) => `<span class="use-chip">${escapeHtml(u)}</span>`).join("");
    const ing = (r.ingredients || []).map((i) => `<li>${escapeHtml(i)}</li>`).join("");
    const steps = (r.steps || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("");
    els.recipeOutput.innerHTML = `
      <div class="recipe-dish">
        <h3>${escapeHtml(r.title || "Recipe")}</h3>
        ${r.intro ? `<p class="intro">${escapeHtml(r.intro)}</p>` : ""}
        ${uses ? `<div class="recipe-uses">${uses}</div>` : ""}
        <h4>Ingredients</h4>
        <ul>${ing}</ul>
        <h4>Steps</h4>
        <ol>${steps}</ol>
      </div>`;
  }

  // ---- Settings modal ----
  function openSettings() {
    els.apiKeyInput.value = getApiKey();
    els.modelInput.value = getModel();
    els.settingsModal.classList.remove("hidden");
  }
  function closeSettings() { els.settingsModal.classList.add("hidden"); }
  function saveSettings() {
    const k = els.apiKeyInput.value.trim();
    if (k) localStorage.setItem(KEY_KEY, k); else localStorage.removeItem(KEY_KEY);
    localStorage.setItem(MODEL_KEY, els.modelInput.value);
    closeSettings();
    els.smartStatus.textContent = k ? "AI key saved (this browser only)." : "AI key removed.";
  }

  // ---- Wire up ----
  function init() {
    buildCategoryOptions(); buildQuickAdd(); prefillExpiry();
    updateNotifyUI(); updateAccountUI();
    attachStore(); // guest by default until auth resolves
    if (scanSupported()) els.barcodeScanBtn.classList.remove("hidden");

    els.form.addEventListener("submit", addItem);
    els.category.addEventListener("change", () => { els.expiry.value = defaultExpiryFor(els.category.value); });
    els.notifyBtn.addEventListener("click", requestNotify);

    els.quickAdd.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-name]"); if (!btn) return;
      els.name.value = btn.dataset.name; els.category.value = btn.dataset.cat;
      els.expiry.value = defaultExpiryFor(btn.dataset.cat); addItem();
    });
    els.list.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-act]"); if (!btn) return;
      resolveItem(btn.dataset.id, btn.dataset.act === "eat");
    });
    els.filters.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip"); if (!chip) return;
      activeFilter = chip.dataset.filter;
      [...els.filters.children].forEach((c) => c.classList.toggle("active", c === chip));
      render();
    });

    // Smart add
    els.photoBtn.addEventListener("click", () => els.photoInput.click());
    els.photoInput.addEventListener("change", (e) => handlePhoto(e.target.files[0]));
    els.barcodeBtn.addEventListener("click", () => els.barcodePanel.classList.toggle("hidden"));
    els.barcodeLookupBtn.addEventListener("click", () => lookupBarcode(els.barcodeInput.value));
    els.barcodeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); lookupBarcode(els.barcodeInput.value); } });
    els.barcodeScanBtn.addEventListener("click", startScan);
    els.scanCloseBtn.addEventListener("click", stopScan);

    // Recipe + settings
    els.recipeBtn.addEventListener("click", suggestRecipe);
    els.settingsBtn.addEventListener("click", openSettings);
    els.settingsCancelBtn.addEventListener("click", closeSettings);
    els.settingsSaveBtn.addEventListener("click", saveSettings);
    els.settingsClearBtn.addEventListener("click", () => { localStorage.removeItem(KEY_KEY); els.apiKeyInput.value = ""; });
    els.settingsModal.addEventListener("click", (e) => { if (e.target === els.settingsModal) closeSettings(); });

    // Auth link toggles login/logout
    els.authLink.addEventListener("click", (e) => {
      if (currentUser) { e.preventDefault(); signOut(auth); }
    });

    // React to login/logout
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      updateAccountUI();
      attachStore();
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) { render(); checkExpiringAndNotify(false); }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
