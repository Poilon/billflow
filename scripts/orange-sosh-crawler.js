#!/usr/bin/env node
/**
 * Playwright crawler to log into Sosh/Orange and pull invoice links.
 *
 * Requirements:
 *   - npm install playwright
 *   - export ORANGE_LOGIN="email_or_msisdn"
 *   - export ORANGE_PASSWORD="password"
 *   - export ORANGE_CONTRACT_ID="9082365680" // your billing account/line id
 *
 * Run:
 *   node scripts/orange-sosh-crawler.js
 *
 * Behavior:
 *   - Reuses a persistent browser profile in .tmp/orange-session to avoid MFA churn.
 *   - Navigates to sosh.fr -> Identifiez-vous -> id.orange.fr -> espace-client.orange.fr.
 *   - Captures invoice metadata by sniffing XHR/JSON responses; falls back to DOM scrape.
 *   - Downloads PDFs to tmp/invoices (can override with INVOICE_DIR).
 *
 * Notes:
 *   - If an OTP/captcha is presented, the script bails with a clear message.
 *   - Set HEADLESS=false to debug visually; set DEBUG_SCREENSHOT=1 to capture final screen.
 */

/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ORANGE_LOGIN = process.env.ORANGE_LOGIN;
const ORANGE_PASSWORD = process.env.ORANGE_PASSWORD;
const ORANGE_CONTRACT_ID = process.env.ORANGE_CONTRACT_ID;
const HEADLESS = process.env.HEADLESS !== "false";
const INVOICE_DIR = process.env.INVOICE_DIR || "tmp/invoices";
const SESSION_DIR = path.resolve(".tmp/orange-session");

if (!ORANGE_LOGIN || !ORANGE_PASSWORD || !ORANGE_CONTRACT_ID) {
  console.error("Missing ORANGE_LOGIN / ORANGE_PASSWORD / ORANGE_CONTRACT_ID env vars.");
  process.exit(1);
}

const FACTURE_URL = `https://espace-client.orange.fr/facture-paiement/${ORANGE_CONTRACT_ID}/historique-des-factures`;

function log(step, extra = {}) {
  console.log(JSON.stringify({ step, ...extra }));
}

function mask(value) {
  if (!value) return "";
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
}

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

async function detectLoginGate(page) {
  const url = page.url();
  if (/id\.orange\.fr/.test(url)) return "login";
  if (/sosh\.fr/.test(url)) return "sosh";
  if (/espace-client\.orange\.fr/.test(url)) return "authenticated";
  return "unknown";
}

async function loginIfNeeded(page) {
  const tryClickPasswordMode = async () => {
    const bottomCta = page.getByText(/identifier avec votre mot de passe/i);
    if ((await bottomCta.count()) > 0) {
      await bottomCta.first().click({ timeout: 2000 }).catch(() => {});
      log("password_mode_click_bottom_cta");
      await page.waitForTimeout(500);
      return true;
    }
    const candidates = [
      page.getByRole("button", { name: /mot de passe|password/i }),
      page.getByRole("link", { name: /mot de passe|password/i }),
      page.getByText(/s['’]identifier.*mot de passe/i),
      page.getByText(/mot de passe/i),
      page.locator('button:has-text("mot de passe")'),
      page.locator('a:has-text("mot de passe")'),
    ];
    for (const cand of candidates) {
      if ((await cand.count()) > 0) {
        await cand.first().click({ timeout: 2000 }).catch(() => {});
        log("password_mode_click");
        await page.waitForTimeout(500);
        return true;
      }
    }
    return false;
  };

  const findLoginField = async () => {
    const selector =
      'input[name="login"], input#login, input[type="email"], input[type="text"][name*="login"], input[name*="ident"]';
    try {
      await page.waitForSelector(selector, { timeout: 15000 });
      return page.locator(selector);
    } catch {
      const frames = page.frames().filter((f) => f !== page.mainFrame());
      if (frames.length) {
        try {
          await frames[0].waitForSelector(selector, { timeout: 8000 });
          return frames[0].locator(selector);
        } catch {
          /* ignore */
        }
      }
      return null;
    }
  };

  const findPasswordField = async () => {
    const selector =
      '#password-label, input[type="password"], input[autocomplete="current-password"], input[name="password"], input[id="password"], input[name*="pass"], input[id*="pass"], input[name*="code"], input[id*="code"]';
    try {
      await page.waitForSelector(selector, { timeout: 25000 });
      return page.locator(selector);
    } catch {
      const frames = page.frames().filter((f) => f !== page.mainFrame());
      if (frames.length) {
        try {
          await frames[0].waitForSelector(selector, { timeout: 15000 });
          return frames[0].locator(selector);
        } catch {
          /* ignore */
        }
      }
      return null;
    }
  };

  const state = await detectLoginGate(page);
  if (state === "authenticated") {
    log("already_authenticated", { url: page.url() });
    return;
  }

  log("login_start", { gate: state });

  // Start from Sosh home to follow the official path (helps with cookies / consent).
  if (state !== "login") {
    await page.goto("https://www.sosh.fr/", { waitUntil: "domcontentloaded" });
    log("goto_sosh");
    try {
      const accept = page.getByRole("button", { name: /accepter|tout accepter|ok/i });
      if (await accept.count()) {
        await accept.first().click({ timeout: 3000 }).catch(() => {});
        log("cookies_accepted");
      }
    } catch {
      /* ignore cookie popup failures */
    }
    const identLink = page.getByRole("link", { name: /identifiez-vous/i });
    if (await identLink.count()) {
      await identLink.first().click();
      log("click_identifiez_vous");
    } else {
      const alt = page.locator("a[href*='identification'], a[href*='login']");
      if (await alt.count()) {
        await alt.first().click();
        log("click_login_fallback");
      }
    }
    await Promise.race([
      page.waitForURL(/id\.orange\.fr|login\.orange\.fr/, { timeout: 20000 }),
      page.waitForTimeout(4000),
    ]);
    if (!/id\.orange\.fr|login\.orange\.fr/.test(page.url())) {
      log("forcing_login_portal");
      await page.goto("https://login.orange.fr/", { waitUntil: "domcontentloaded" });
      await page.waitForURL(/id\.orange\.fr|login\.orange\.fr/, { timeout: 20000 });
    }
  }

  // Fill identifier.
  let loginField = await findLoginField();
  log("login_field_found", { found: !!loginField && (await loginField.count()) > 0 });
  if (!loginField || (await loginField.count()) === 0) throw new Error("login_field_not_found");
  await loginField.first().fill(ORANGE_LOGIN);
  log("login_filled", { login: mask(ORANGE_LOGIN) });

  const continueBtn = page.getByRole("button", { name: /continuer|suivant|valider/i });
  if (await continueBtn.count()) {
    await continueBtn.first().click();
    log("continue_clicked");
    await Promise.race([tryClickPasswordMode(), page.waitForTimeout(1500)]);
    await page.waitForTimeout(800);
  }

  // Fill password.
  let passwordField = await findPasswordField();
  log("password_field_found", { found: !!passwordField && (await passwordField.count()) > 0 });
  if (!passwordField || (await passwordField.count()) === 0) throw new Error("password_field_not_found");
  await passwordField.first().fill(ORANGE_PASSWORD);
  log("password_filled");

  const submitBtn = page.getByRole("button", { name: /se connecter|connexion|valider/i });
  if (await submitBtn.count()) {
    await submitBtn.first().click();
    log("submit_clicked");
  } else {
    await page.keyboard.press("Enter");
    log("submit_enter_key");
  }

  // Wait for redirect or error.
  await page.waitForTimeout(500);
  const otpPrompt = await page
    .locator("input[name*='otp'], input[name*='code'], input[autocomplete='one-time-code']")
    .count();
  const captchaFrame = await page.locator("iframe[src*='captcha'], iframe[src*='recaptcha']").count();
  if (otpPrompt || captchaFrame) {
    log("otp_or_captcha_detected", { otpPrompt, captchaFrame });
    throw new Error("mfa_or_captcha_required");
  }

  await page.waitForURL(/espace-client\.orange\.fr|sosh\.fr/, { timeout: 20000 });
  log("login_success", { url: page.url() });
}

async function collectInvoiceMetadata(page) {
  const invoices = [];
  const apiPayloads = [];

  page.on("response", async (res) => {
    const url = res.url();
    if (!/facture|invoice|bill|historique/.test(url)) return;
    if (res.request().resourceType() !== "xhr") return;
    try {
      const json = await res.json();
      apiPayloads.push({ url, json });
    } catch {
      /* swallow non-JSON */
    }
  });

  await page.goto(FACTURE_URL, { waitUntil: "networkidle" });
  log("facture_page_loaded", { url: page.url() });

  // Let XHRs fire.
  await page.waitForTimeout(2000);

  // Try to parse API payloads if present.
  for (const payload of apiPayloads) {
    if (Array.isArray(payload.json)) {
      payload.json.forEach((item) => {
        if (item && (item.pdfUrl || item.url || item.link)) {
          invoices.push({
            source: "api",
            date: item.date || item.billingDate || null,
            amount: item.amount || item.price || null,
            pdfUrl: item.pdfUrl || item.url || item.link,
          });
        }
      });
    } else if (payload.json && payload.json.invoices) {
      payload.json.invoices.forEach((item) => {
        invoices.push({
          source: "api",
          date: item.date || null,
          amount: item.amount || null,
          pdfUrl: item.pdfUrl || item.url || item.link,
        });
      });
    }
  }

  // Fallback: DOM scrape for anchors that look like PDFs.
  if (!invoices.length) {
    log("fallback_dom_scrape");
    const domInvoices = await page.$$eval("a", (links) =>
      links
        .filter((a) => a.href && (a.href.includes("facture") || a.href.endsWith(".pdf")))
        .map((a) => ({
          source: "dom",
          text: a.textContent?.trim() || "",
          pdfUrl: a.href,
        }))
    );
    invoices.push(...domInvoices);
  }

  // Deduplicate by URL.
  const seen = new Set();
  const unique = invoices.filter((inv) => {
    if (!inv.pdfUrl) return false;
    if (seen.has(inv.pdfUrl)) return false;
    seen.add(inv.pdfUrl);
    return true;
  });
  log("invoices_parsed", { count: unique.length });
  return unique;
}

async function downloadInvoices(page, invoices) {
  await ensureDir(INVOICE_DIR);
  const results = [];
  const client = page.request;

  for (const inv of invoices) {
    if (!inv.pdfUrl) continue;
    const resp = await client.get(inv.pdfUrl);
    if (!resp || resp.status() >= 400) {
      log("invoice_download_failed", { url: inv.pdfUrl, status: resp?.status() });
      continue;
    }
    const buf = Buffer.from(await resp.body());
    const datePart = inv.date ? String(inv.date).replace(/\W+/g, "_").slice(0, 32) : "invoice";
    const fileName = `${datePart || "invoice"}_${results.length + 1}.pdf`;
    const dest = path.join(INVOICE_DIR, fileName);
    await fs.promises.writeFile(dest, buf);
    results.push({ ...inv, file: dest });
    log("invoice_saved", { url: inv.pdfUrl, file: dest });
  }
  return results;
}

async function main() {
  await ensureDir(SESSION_DIR);
  log("crawler_start", {
    headless: HEADLESS,
    invoiceDir: INVOICE_DIR,
    contractId: ORANGE_CONTRACT_ID,
    login: mask(ORANGE_LOGIN),
  });
  const context = await chromium.launchPersistentContext(SESSION_DIR, {
    headless: HEADLESS,
    viewport: { width: 1400, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  });

  const page = context.pages()[0] || (await context.newPage());

  try {
    await loginIfNeeded(page);
    const invoices = await collectInvoiceMetadata(page);
    const saved = await downloadInvoices(page, invoices);
    log("done", { saved: saved.length, invoicesFound: invoices.length });
    if (process.env.DEBUG_SCREENSHOT) {
      await page.screenshot({ path: "tmp/factures-final.png", fullPage: true });
      log("screenshot", { file: "tmp/factures-final.png" });
    }
  } catch (err) {
    log("error", { message: err.message || String(err) });
    if (process.env.DEBUG_SCREENSHOT) {
      await page.screenshot({ path: "tmp/failure.png", fullPage: true }).catch(() => {});
      log("screenshot", { file: "tmp/failure.png" });
    }
    process.exitCode = 1;
  } finally {
    await context.close();
  }
}

main();
