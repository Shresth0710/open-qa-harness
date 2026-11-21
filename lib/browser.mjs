import fs from 'node:fs';

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
    throw new Error('Playwright is not installed. Run: npm install');
  }
}

export async function launch({ headless = true } = {}) {
  const { chromium } = await loadPlaywright();
  try {
    return await chromium.launch({ headless });
  } catch (err) {
    if (/Executable doesn't exist|install/i.test(err.message)) {
      throw new Error('Chromium is not installed for Playwright. Run: npm run setup');
    }
    throw err;
  }
}

export async function newContext(browser, kind, authFile) {
  const opts = { ...VIEWPORTS[kind], ignoreHTTPSErrors: false };
  if (authFile) {
    if (!fs.existsSync(authFile)) throw new Error(`Auth file not found: ${authFile} (create it with: oqa login <url> --save ${authFile})`);
    opts.storageState = authFile;
  }
  return browser.newContext(opts);
}

export function normalise(href, base) {
  try {
    const u = new URL(href, base);
    u.hash = '';
    return u;
  } catch {
    return null;
  }
}

export function routeOf(u) {
  return u.pathname + u.search;
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
