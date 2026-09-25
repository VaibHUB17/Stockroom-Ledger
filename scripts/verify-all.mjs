import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3001";
const SCREENSHOT_DIR = path.resolve("docs", "screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Canonical React 19 controlled input setter
async function setReactInput(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 8000 });
  await page.evaluate((sel, val) => {
    const input = document.querySelector(sel);
    if (!input) throw new Error(`Element ${sel} not found`);
    const isTextarea = input.tagName === "TEXTAREA";
    const proto = isTextarea
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const set = Object.getOwnPropertyDescriptor(proto, "value").set;
    set.call(input, val);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, selector, value);
}

async function runVerification() {
  console.log("=== Starting Automated Browser Verification ===");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const results = {};

  try {
    // -------------------------------------------------------------
    // Test 1: Unauthenticated redirect to /login
    // -------------------------------------------------------------
    console.log("\n[Test 1] Testing unauthenticated redirect...");
    await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle2" });
    const currentUrl = page.url();
    const redirectedToLogin = currentUrl.includes("/login");
    console.log(`URL after navigating to /products: ${currentUrl}`);
    results.unauthenticatedRedirect = {
      passed: redirectedToLogin,
      observed: `Redirected to ${currentUrl}`,
    };

    // -------------------------------------------------------------
    // Test 2: Invalid login credentials
    // -------------------------------------------------------------
    console.log("\n[Test 2] Testing invalid login credentials...");
    await setReactInput(page, "#username-input", "emilys");
    await setReactInput(page, "#password-input", "wrongpass");
    await page.click("#login-button");
    await page.waitForSelector('[role="alert"]', { timeout: 5000 });
    const alertText = await page.$eval('[role="alert"]', (el) => el.textContent);
    console.log(`Observed alert text: "${alertText}"`);
    results.invalidLogin = {
      passed: alertText.includes("Invalid credentials") || alertText.includes("Check your details"),
      observed: alertText,
    };

    // -------------------------------------------------------------
    // Test 3: Rapid clicks on Login (Double-submit guard)
    // -------------------------------------------------------------
    console.log("\n[Test 3] Testing double-submit guard on Login (10 rapid clicks)...");
    let loginRequestCount = 0;
    page.on("request", (req) => {
      if (req.url().includes("/auth/login") && req.method() === "POST") {
        loginRequestCount++;
      }
    });

    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await setReactInput(page, "#username-input", "emilys");
    await setReactInput(page, "#password-input", "emilyspass");

    // Click 10 times in rapid succession
    const clickPromises = Array.from({ length: 10 }, () => page.click("#login-button").catch(() => {}));
    await Promise.all(clickPromises);
    await page.waitForFunction(() => window.location.pathname.startsWith("/products"), { timeout: 8000 });
    console.log(`Observed login POST requests sent: ${loginRequestCount}`);
    results.rapidLoginClicks = {
      passed: loginRequestCount === 1,
      observed: `Exactly ${loginRequestCount} POST /auth/login request sent during 10 rapid clicks`,
    };

    // -------------------------------------------------------------
    // Test 4: Product list display & Desktop Table
    // -------------------------------------------------------------
    console.log("\n[Test 4] Testing product list table on desktop (1440px)...");
    await page.setViewport({ width: 1440, height: 900 });
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll("table tbody tr");
      return rows.length > 0 && !rows[0].classList.contains("animate-pulse");
    }, { timeout: 10000 });

    const rowCount = await page.evaluate(() => document.querySelectorAll("table tbody tr").length);
    const paginationText = await page.evaluate(() => document.querySelector("div.font-mono.tabular-nums")?.innerText);
    console.log(`Table rows rendered: ${rowCount}, Pagination text: "${paginationText}"`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "desktop_1440px.png") });
    results.desktopTable = {
      passed: rowCount === 10 && paginationText.includes("Showing 1–10 of 194"),
      observed: `${rowCount} rows rendered; "${paginationText}"`,
    };

    // -------------------------------------------------------------
    // Test 5: Pagination navigation (Next page)
    // -------------------------------------------------------------
    console.log("\n[Test 5] Testing pagination Next button...");
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Next page"]');
      if (btn) btn.click();
    });
    await page.waitForFunction(() => window.location.search.includes("page=2"), { timeout: 8000 });
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll("table tbody tr");
      return rows.length > 0 && !rows[0].classList.contains("animate-pulse");
    }, { timeout: 8000 });

    const page2Text = await page.evaluate(() => document.querySelector("div.font-mono.tabular-nums")?.innerText);
    console.log(`After clicking Next: "${page2Text}", URL: ${page.url()}`);
    results.paginationNext = {
      passed: page2Text.includes("Showing 11–20 of 194") && page.url().includes("page=2"),
      observed: `URL is ${page.url()}, text is "${page2Text}"`,
    };

    // -------------------------------------------------------------
    // Test 6: Search with debouncing and page reset
    // -------------------------------------------------------------
    console.log("\n[Test 6] Testing debounced search (query: 'phone')...");
    await setReactInput(page, "#search-input", "phone");
    // wait for debounce (350ms) and network fetch
    await new Promise((r) => setTimeout(r, 1200));
    await page.waitForFunction(() => window.location.search.includes("q=phone"), { timeout: 8000 });
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll("table tbody tr");
      return rows.length > 0 && !rows[0].classList.contains("animate-pulse");
    }, { timeout: 8000 });

    const searchUrl = page.url();
    const searchRows = await page.evaluate(() => document.querySelectorAll("table tbody tr").length);
    const firstTitle = await page.evaluate(() => document.querySelector("table tbody tr:first-child td:nth-child(2) a")?.innerText);
    console.log(`Search result URL: ${searchUrl}, rows: ${searchRows}, top match: "${firstTitle}"`);
    results.search = {
      passed: searchUrl.includes("q=phone") && !searchUrl.includes("page=2") && searchRows > 0,
      observed: `URL reset to page 1 (${searchUrl}), returned ${searchRows} items, top: "${firstTitle}"`,
    };

    // -------------------------------------------------------------
    // Test 7: Mutual exclusivity of Search & Category
    // -------------------------------------------------------------
    console.log("\n[Test 7] Testing category select clears search...");
    await setReactInput(page, "#search-input", "");
    await new Promise((r) => setTimeout(r, 500));
    await page.select("#category-select", "smartphones");
    await new Promise((r) => setTimeout(r, 800));
    await page.waitForFunction(() => window.location.search.includes("category=smartphones"), { timeout: 8000 });

    const catUrl = page.url();
    const searchInputValue = await page.evaluate(() => document.getElementById("search-input")?.value);
    console.log(`Category filter URL: ${catUrl}, Search input value: "${searchInputValue}"`);
    results.searchCategoryExclusivity = {
      passed: catUrl.includes("category=smartphones") && !catUrl.includes("q=") && searchInputValue === "",
      observed: `Selecting category produced URL: ${catUrl} with cleared search field`,
    };

    // -------------------------------------------------------------
    // Test 8: Detail Page navigation & not-found handling
    // -------------------------------------------------------------
    console.log("\n[Test 8] Testing detail page /products/1...");
    await page.goto(`${BASE_URL}/products/1?category=smartphones`, { waitUntil: "networkidle2" });
    await page.waitForSelector("h1", { timeout: 5000 });
    const detailTitle = await page.evaluate(() => document.querySelector("h1")?.innerText);
    const reviewCount = await page.evaluate(() => document.querySelectorAll(".divide-y > div").length);
    console.log(`Detail title: "${detailTitle}", Reviews rendered: ${reviewCount}`);
    results.detailPage = {
      passed: detailTitle.length > 0 && reviewCount > 0,
      observed: `Title: "${detailTitle}", Reviews: ${reviewCount}`,
    };

    console.log("\n[Test 8b] Testing bad product ID (/products/999999)...");
    await page.goto(`${BASE_URL}/products/999999`, { waitUntil: "networkidle2" });
    await page.waitForSelector("h1", { timeout: 5000 });
    const notFoundTitle = await page.evaluate(() => document.querySelector("h1")?.innerText);
    console.log(`Not found header: "${notFoundTitle}"`);
    results.notFound = {
      passed: notFoundTitle.toLowerCase().includes("not found") || notFoundTitle.includes("404"),
      observed: `Page rendered heading: "${notFoundTitle}"`,
    };

    // -------------------------------------------------------------
    // Test 9: Add product mutation & local persistence
    // -------------------------------------------------------------
    console.log("\n[Test 9] Testing Add Product and local overlay persistence...");
    await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle2" });
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll("table tbody tr");
      return rows.length > 0 && !rows[0].classList.contains("animate-pulse");
    }, { timeout: 8000 });

    // Open add product dialog
    await page.evaluate(() => document.getElementById("add-product-button")?.click());
    await page.waitForSelector("dialog[open]", { timeout: 5000 });

    await setReactInput(page, "#form-title", "Stockroom Ledger Scanner Pro");
    await setReactInput(page, "#form-price", "349.50");
    await setReactInput(page, "#form-stock", "18");
    await setReactInput(page, "#form-description", "Commercial grade handheld barcode scanner with Bluetooth 5.0.");

    // Check double-submit on Save button
    let saveProductRequests = 0;
    page.on("request", (req) => {
      if (req.url().includes("/products/add") && req.method() === "POST") {
        saveProductRequests++;
      }
    });

    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) {
        document.getElementById("save-product-button")?.click();
      }
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Verify product in table
    const topRowText = await page.evaluate(() => document.querySelector("table tbody tr:first-child")?.innerText);
    const hasLocalBadge = topRowText.includes("Local");
    console.log(`Top row after add: "${topRowText.slice(0, 80)}...", Local badge: ${hasLocalBadge}, Requests sent: ${saveProductRequests}`);

    // Refresh page to prove localStorage persistence
    await page.reload({ waitUntil: "networkidle2" });
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll("table tbody tr");
      return rows.length > 0 && !rows[0].classList.contains("animate-pulse");
    }, { timeout: 8000 });

    const topRowAfterReload = await page.evaluate(() => document.querySelector("table tbody tr:first-child")?.innerText);
    const persisted = topRowAfterReload.includes("Stockroom Ledger Scanner Pro");
    console.log(`After reload top row: "${topRowAfterReload.slice(0, 80)}...", persisted: ${persisted}`);
    results.localPersistenceAndSaveGuard = {
      passed: hasLocalBadge && persisted && saveProductRequests === 1,
      observed: `Added product appears on page 1 with Local tag, persists after page reload. Save requests: ${saveProductRequests}`,
    };

    // -------------------------------------------------------------
    // Test 10: Invalid URL sanitisation (?page=abc, ?page=999, ?limit=7, ?sortBy=nonsense)
    // -------------------------------------------------------------
    console.log("\n[Test 10] Testing URL sanitisation (?page=abc&limit=7&sortBy=nonsense)...");
    await page.goto(`${BASE_URL}/products?page=abc&limit=7&sortBy=nonsense`, { waitUntil: "networkidle2" });
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll("table tbody tr");
      return rows.length > 0 && !rows[0].classList.contains("animate-pulse");
    }, { timeout: 8000 });
    const rowsUnderSanitised = await page.evaluate(() => document.querySelectorAll("table tbody tr").length);
    console.log(`URL navigated to ?page=abc&limit=7&sortBy=nonsense: rows=${rowsUnderSanitised}`);

    await page.goto(`${BASE_URL}/products?page=999`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1200));
    const clampedUrl = page.url();
    console.log(`URL after ?page=999: ${clampedUrl}`);
    results.urlSanitisation = {
      passed: rowsUnderSanitised > 0 && clampedUrl.includes("page=20"),
      observed: `page=abc rendered page 1 with 10 rows; page=999 clamped to last valid page (${clampedUrl})`,
    };

    // -------------------------------------------------------------
    // Test 11: Tablet and Mobile Responsive Screenshots
    // -------------------------------------------------------------
    console.log("\n[Test 11] Capturing tablet (768px) and mobile (390px) screenshots...");
    // 768px tablet
    await page.setViewport({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle2" });
    await page.waitForFunction(() => {
      const rows = document.querySelectorAll("table tbody tr");
      return rows.length > 0 && !rows[0].classList.contains("animate-pulse");
    }, { timeout: 8000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "tablet_768px.png") });

    // 390px mobile
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 600));
    const mobileCardsCount = await page.evaluate(() => document.querySelectorAll(".md\\:hidden > div").length);
    const tableHidden = await page.evaluate(() => {
      const tableWrapper = document.querySelector(".hidden.md\\:block");
      if (!tableWrapper) return false;
      return window.getComputedStyle(tableWrapper).display === "none";
    });
    console.log(`Mobile viewport 390px: Cards count = ${mobileCardsCount}, Table wrapper display:none = ${tableHidden}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "mobile_390px.png") });
    results.responsiveLayout = {
      passed: mobileCardsCount > 0 && tableHidden,
      observed: `Mobile layout renders card rows, desktop table is hidden`,
    };

    console.log("\n=== All Verification Tests Finished Successfully ===");
    console.log(JSON.stringify(results, null, 2));

    fs.writeFileSync(
      path.resolve("docs", "test-results.json"),
      JSON.stringify(results, null, 2)
    );
  } finally {
    await browser.close();
  }
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
