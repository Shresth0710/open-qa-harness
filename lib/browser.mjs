import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The folder that holds package.json and node_modules (the clone, or the installed plugin).
export const HARNESS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const INSTALL_DEPS = `npm install --prefix "${HARNESS_ROOT}"`;
export const installBrowser = (name = 'chromium') => `cd "${HARNESS_ROOT}" && npx playwright install ${name}`;

export const BROWSERS = ['chromium', 'firefox', 'webkit'];
export const BROWSER_LABEL = { chromium: 'Chromium', firefox: 'Firefox', webkit: 'WebKit' };

// Validates --browser; returns the engine name (default chromium).
export function browserName(opt) {
  const name = String(opt || 'chromium').toLowerCase();
  if (!BROWSERS.includes(name)) {
    const err = new Error(`--browser must be one of: ${BROWSERS.join(', ')} (got "${opt}")`);
    err.exitCode = 2;
    throw err;
  }
  return name;
}

export const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};

export const SKIP_LINK_RE = /(log-?out|sign-?out|delete|remove|destroy|unsubscribe|deactivate|cancel-?(account|subscription))/i;
export const ASSET_RE = /\.(js|mjs|css|map|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|eot|mp4|webm|mp3|pdf|zip|gz|json|xml|txt)(\?|#|$)/i;

export async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    throw new Error(`Playwright is not installed. Run: ${INSTALL_DEPS}`);
  }
}

export async function launch({ headless = true, browser = 'chromium' } = {}) {
  const name = browserName(browser);
  const pw = await loadPlaywright();
  try {
    return await pw[name].launch({ headless });
  } catch (err) {
    if (/Executable doesn't exist|install/i.test(err.message)) {
      throw new Error(`${BROWSER_LABEL[name]} is not installed for Playwright. Run: ${installBrowser(name)}`);
    }
    throw err;
  }
}

// Fail fast, before any browser starts, when the start URL does not answer at all.
// Any HTTP status counts as reachable; only a network-level failure is an error (exit code 2).
export async function assertReachable(url) {
  try {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
    await res.body?.cancel().catch(() => {});
  } catch (e) {
    const reason = e.name === 'TimeoutError' ? 'no answer in 20 s' : e.cause?.code || e.cause?.message || e.message;
    const err = new Error(`could not load ${url}: ${reason}`);
    err.exitCode = 2;
    throw err;
  }
}

export async function newContext(browser, kind, authFile) {
  const opts = { ...VIEWPORTS[kind], ignoreHTTPSErrors: false };
  if (browser.browserType().name() === 'firefox') delete opts.isMobile; // Firefox has no mobile emulation mode
  if (authFile) {
    if (!fs.existsSync(authFile)) throw new Error(`Auth file not found: ${authFile} (create it with: oqa login <url> --save ${authFile})`);
    opts.storageState = authFile;
  }
  return browser.newContext(opts);
}

export function normalise(href, base) {
  try {
    const u = new URL(href, base);
    if (!isHashRoute(u.hash)) u.hash = '';
    return u;
  } catch {
    return null;
  }
}

// Hash routers (#/path or #!/path) put the route in the fragment; a plain #anchor is not a route.
export function isHashRoute(hash) {
  return /^#!?\//.test(hash || '');
}

export function routeOf(u) {
  return u.pathname + u.search + (isHashRoute(u.hash) ? u.hash : '');
}

// Outline an element, screenshot the viewport, remove the outline.
export async function shotWithOutline(page, selector, file) {
  let outlined = false;
  if (selector) {
    try {
      outlined = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        el.setAttribute('data-oqa-prev-style', el.getAttribute('style') || '');
        el.style.outline = '4px solid #e11d48';
        el.style.outlineOffset = '3px';
        return true;
      }, selector);
    } catch {
      outlined = false;
    }
  }
  await page.waitForTimeout(150);
  await page.screenshot({ path: file });
  if (outlined) {
    await page
      .evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const prev = el.getAttribute('data-oqa-prev-style');
        if (prev) el.setAttribute('style', prev);
        else el.removeAttribute('style');
        el.removeAttribute('data-oqa-prev-style');
      }, selector)
      .catch(() => {});
  }
  return outlined;
}
