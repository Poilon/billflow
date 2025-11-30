#!/usr/bin/env node
/**
 * Debug script to find the password field on Orange/Sosh login page
 */

const path = require("path");
const { chromium } = require("playwright");
const fs = require("fs");

const ORANGE_LOGIN = process.env.ORANGE_LOGIN;
const SESSION_DIR = path.resolve(".tmp/orange-session");

if (!ORANGE_LOGIN) {
  console.error("Missing ORANGE_LOGIN env var.");
  process.exit(1);
}

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

async function main() {
  await ensureDir(SESSION_DIR);
  await ensureDir("tmp");

  const context = await chromium.launchPersistentContext(SESSION_DIR, {
    headless: false, // Always visible for debugging
    viewport: { width: 1400, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  });

  const page = context.pages()[0] || (await context.newPage());

  try {
    // Go to Sosh
    await page.goto("https://www.sosh.fr/", { waitUntil: "domcontentloaded" });
    console.log("✓ Loaded sosh.fr");

    // Accept cookies
    try {
      const accept = page.getByRole("button", { name: /accepter|tout accepter|ok/i });
      if (await accept.count()) {
        await accept.first().click({ timeout: 3000 });
        console.log("✓ Accepted cookies");
      }
    } catch {}

    // Click "Identifiez-vous"
    const identLink = page.getByRole("link", { name: /identifiez-vous/i });
    if (await identLink.count()) {
      await identLink.first().click();
      console.log("✓ Clicked 'Identifiez-vous'");
    }

    // Wait for login page
    await page.waitForURL(/id\.orange\.fr|login\.orange\.fr/, { timeout: 20000 });
    console.log("✓ On login page:", page.url());

    // Fill login
    const loginField = await page.locator(
      'input[name="login"], input#login, input[type="email"], input[type="text"][name*="login"]'
    );
    if (await loginField.count()) {
      await loginField.first().fill(ORANGE_LOGIN);
      console.log("✓ Filled login");
    }

    // Click continue
    const continueBtn = page.getByRole("button", { name: /continuer|suivant|valider/i });
    if (await continueBtn.count()) {
      await continueBtn.first().click();
      console.log("✓ Clicked continue");
    }

    // Try to click password mode
    await page.waitForTimeout(1000);
    const passwordModeBtn = page.getByText(/identifier avec votre mot de passe/i);
    if (await passwordModeBtn.count()) {
      await passwordModeBtn.first().click({ timeout: 2000 }).catch(() => {});
      console.log("✓ Clicked 'identifier avec votre mot de passe'");
    }

    // Wait a bit for the page to load
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: "tmp/password-page.png", fullPage: true });
    console.log("✓ Screenshot saved to tmp/password-page.png");

    // Dump all input fields
    const inputs = await page.evaluate(() => {
      const fields = Array.from(document.querySelectorAll("input, label"));
      return fields.map((el) => ({
        tag: el.tagName,
        type: el.getAttribute("type"),
        name: el.getAttribute("name"),
        id: el.getAttribute("id"),
        placeholder: el.getAttribute("placeholder"),
        autocomplete: el.getAttribute("autocomplete"),
        class: el.className,
        for: el.getAttribute("for"),
        visible: el.offsetParent !== null,
        text: el.textContent?.trim().substring(0, 50),
      }));
    });

    console.log("\n=== ALL INPUT AND LABEL ELEMENTS ===");
    inputs.forEach((input, i) => {
      if (input.visible) {
        console.log(`\n[${i}] ${input.tag}`, JSON.stringify(input, null, 2));
      }
    });

    // Try different password selectors
    const selectors = [
      'input[type="password"]',
      'input[autocomplete="current-password"]',
      'input[name="password"]',
      'input[id="password"]',
      'input[name*="pass"]',
      'input[id*="pass"]',
      "#password-label",
      'label[for*="password"]',
      'label[id*="password"]',
    ];

    console.log("\n=== TESTING SELECTORS ===");
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      console.log(`${selector}: ${count} match(es)`);
      if (count > 0) {
        const element = await page.locator(selector).first().evaluate((el) => ({
          tag: el.tagName,
          type: el.getAttribute("type"),
          name: el.getAttribute("name"),
          id: el.getAttribute("id"),
          class: el.className,
          for: el.getAttribute("for"),
        }));
        console.log("  →", JSON.stringify(element));
      }
    }

    // Check for password field in iframe
    const frames = page.frames().filter((f) => f !== page.mainFrame());
    console.log(`\n=== IFRAMES: ${frames.length} ===`);
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      console.log(`\nFrame ${i}: ${frame.url()}`);
      const passwordInFrame = await frame.locator('input[type="password"]').count();
      console.log(`  Password fields in frame: ${passwordInFrame}`);
    }

    console.log("\n✓ Debug complete! Check tmp/password-page.png and the output above.");
    console.log("Press Ctrl+C when done inspecting the browser.");

    // Keep browser open for manual inspection
    await page.waitForTimeout(300000); // 5 minutes
  } catch (err) {
    console.error("Error:", err.message);
    await page.screenshot({ path: "tmp/error.png", fullPage: true });
    throw err;
  } finally {
    await context.close();
  }
}

main().catch(console.error);
