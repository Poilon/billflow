import fs from "fs";
import path from "path";
import { chromium } from "playwright";

type InvoiceMeta = {
  source: "api" | "dom";
  date?: string | null;
  amount?: string | number | null;
  pdfUrl: string;
  text?: string;
};

export type CrawlerResult = {
  saved: Array<InvoiceMeta & { file: string }>;
  invoicesFound: number;
};

type CrawlerParams = {
  login: string;
  password: string;
  contractId: string;
  headless?: boolean;
  invoiceDir?: string;
};

function log(step: string, meta: Record<string, unknown> = {}) {
  // Centralized logging for server-side crawler; avoids printing sensitive values.
  console.log(JSON.stringify({ source: "orange-sosh", step, ...meta }));
}

function mask(value: string) {
  if (!value) return "";
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
}

async function ensureDir(dirPath: string) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

function factureUrl(contractId: string) {
  return `https://espace-client.orange.fr/facture-paiement/${contractId}/historique-des-factures`;
}

async function detectLoginGate(page: import("playwright").Page) {
  const url = page.url();
  if (/id\.orange\.fr/.test(url)) return "login";
  if (/sosh\.fr/.test(url)) return "sosh";
  if (/espace-client\.orange\.fr/.test(url)) return "authenticated";
  return "unknown";
}

async function loginIfNeeded(
  page: import("playwright").Page,
  creds: { login: string; password: string }
) {
  log("login_if_needed_start", { url: page.url() });

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
      // Try inside first iframe if present
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
  log("login_state_detected", { state });
  if (state === "authenticated") return;

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

  let loginField = await findLoginField();
  log("login_field_found", { found: !!loginField && (await loginField.count()) > 0 });
  if (!loginField || (await loginField.count()) === 0) throw new Error("login_field_not_found");
  await loginField.first().fill(creds.login);
  log("login_filled", { login: mask(creds.login) });

  const continueBtn = page.getByRole("button", { name: /continuer|suivant|valider/i });
  if (await continueBtn.count()) {
    await continueBtn.first().click();
    log("continue_clicked");
    // Some flows require choosing the password auth method.
    await Promise.race([
      tryClickPasswordMode(),
      page.waitForTimeout(1500),
    ]);
    // On certain flows, password field loads after a short delay/navigation.
    await page.waitForTimeout(800);
  }

  let passwordField = await findPasswordField();
  log("password_field_found", { found: !!passwordField && (await passwordField.count()) > 0 });
  if (!passwordField || (await passwordField.count()) === 0) throw new Error("password_field_not_found");
  await passwordField.first().fill(creds.password);
  log("password_filled");

  const submitBtn = page.getByRole("button", { name: /se connecter|connexion|valider/i });
  if (await submitBtn.count()) {
    await submitBtn.first().click();
    log("submit_clicked");
  } else {
    await page.keyboard.press("Enter");
    log("submit_enter_key");
  }

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

async function collectInvoiceMetadata(page: import("playwright").Page, url: string) {
  const invoices: InvoiceMeta[] = [];
  const apiPayloads: Array<{ url: string; json: unknown }> = [];

  page.on("response", async (res) => {
    const resUrl = res.url();
    if (!/facture|invoice|bill|historique/.test(resUrl)) return;
    if (res.request().resourceType() !== "xhr") return;
    try {
      const json = await res.json();
      apiPayloads.push({ url: resUrl, json });
      log("xhr_captured", { url: resUrl });
    } catch {
      /* ignore non JSON */
    }
  });

  await page.goto(url, { waitUntil: "networkidle" });
  log("facture_page_loaded", { url });
  await page.waitForTimeout(2000);

  for (const payload of apiPayloads) {
    const data = payload.json as any;
    if (Array.isArray(data)) {
      data.forEach((item) => {
        if (item && (item.pdfUrl || item.url || item.link)) {
          invoices.push({
            source: "api",
            date: item.date || item.billingDate || null,
            amount: item.amount || item.price || null,
            pdfUrl: item.pdfUrl || item.url || item.link,
          });
        }
      });
    } else if (data && Array.isArray(data.invoices)) {
      data.invoices.forEach((item: any) => {
        invoices.push({
          source: "api",
          date: item.date || null,
          amount: item.amount || null,
          pdfUrl: item.pdfUrl || item.url || item.link,
        });
      });
    }
  }

  if (!invoices.length) {
    log("fallback_dom_scrape");
    const domInvoices = await page.$$eval("a", (links) =>
      links
        .filter((a) => a.href && (a.href.includes("facture") || a.href.endsWith(".pdf")))
        .map((a) => ({
          source: "dom" as const,
          text: a.textContent?.trim() || "",
          pdfUrl: a.href,
        }))
    );
    invoices.push(...domInvoices);
  }

  const seen = new Set<string>();
  const unique = invoices.filter((inv) => {
    if (!inv.pdfUrl) return false;
    if (seen.has(inv.pdfUrl)) return false;
    seen.add(inv.pdfUrl);
    return true;
  });
  log("invoices_parsed", { count: unique.length });
  return unique;
}

async function downloadInvoices(
  page: import("playwright").Page,
  invoices: InvoiceMeta[],
  invoiceDir: string
) {
  await ensureDir(invoiceDir);
  const results: Array<InvoiceMeta & { file: string }> = [];
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
    const dest = path.join(invoiceDir, fileName);
    await fs.promises.writeFile(dest, buf);
    results.push({ ...inv, file: dest });
    log("invoice_saved", { url: inv.pdfUrl, file: dest });
  }

  return results;
}

export async function runOrangeSoshCrawler({
  login,
  password,
  contractId,
  headless = true,
  invoiceDir = "tmp/invoices",
}: CrawlerParams): Promise<CrawlerResult> {
  log("crawler_start", {
    headless,
    invoiceDir,
    contractId,
    login: mask(login),
  });
  const sessionDir = path.resolve(".tmp/orange-session");
  await ensureDir(sessionDir);

  const context = await chromium.launchPersistentContext(sessionDir, {
    headless,
    viewport: { width: 1400, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  });

  const page = context.pages()[0] ?? (await context.newPage());

  try {
    await loginIfNeeded(page, { login, password });
    const invoices = await collectInvoiceMetadata(page, factureUrl(contractId));
    const saved = await downloadInvoices(page, invoices, invoiceDir);
    log("crawler_done", { saved: saved.length, invoicesFound: invoices.length });
    return { saved, invoicesFound: invoices.length };
  } finally {
    await context.close();
  }
}
