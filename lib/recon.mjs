import fs from 'node:fs';
import path from 'node:path';
import { launch, newContext, normalise, routeOf, isHashRoute, assertReachable, browserName, BROWSER_LABEL, SKIP_LINK_RE, ASSET_RE } from './browser.mjs';
import { c, info, ok, warn, step, slug, show } from './ui.mjs';

export const reconHelp = `Usage: oqa recon <url> [options]

Crawl a site (same origin only), read robots.txt and sitemap.xml, pull candidate
routes out of its JavaScript bundles, and screenshot every page on desktop and mobile.

Options:
  --out <dir>         where to write recon.json, routes.md, evidence/recon/ (default ./oqa-output)
  --max-pages <n>     stop after this many pages (default 40)
  --auth <file>       storage state from "oqa login" to crawl as a signed-in user
  --no-shots          skip screenshots (faster)
  --browser <name>    chromium (default), firefox or webkit

Single-page apps: links like "#/active" (hash routers) are separate routes. Route-like
strings found in the JavaScript are tried relative to the start page's path (and as
#/routes when the site uses hash routing); each is checked, and one that answers 404
is listed as "candidate (bundle) – 404, probably not a real route", never as a route.
An unreachable start URL stops with exit code 2.

Links that look destructive (logout, delete, remove, unsubscribe...) are never followed.
Only crawl sites you are authorised to test.`;

export async function recon(url, opts = {}) {
  const start = normalise(url);
  if (!start || !/^https?:$/.test(start.protocol)) throw new Error(`Not a valid http(s) URL: ${url}`);
  const out = path.resolve(opts.out || 'oqa-output');
  const maxPages = opts.maxPages ?? 40;
  const shots = opts.shots !== false;
  const shotDir = path.join(out, 'evidence', 'recon');
  fs.mkdirSync(shots ? shotDir : out, { recursive: true });

  const engine = browserName(opts.browser);
  await assertReachable(start.href);
  info(`Recon ${c.bold(start.origin)} · max ${maxPages} pages · ${BROWSER_LABEL[engine]}${opts.auth ? ' · signed in' : ''}`);
  const browser = await launch({ browser: engine });
  const routes = new Map(); // route -> { route, sources:Set, ... }
  const add = (u, source) => {
    const r = routeOf(u);
    if (!routes.has(r)) routes.set(r, { route: r, url: u.href, sources: new Set() });
    routes.get(r).sources.add(source);
    return routes.get(r);
  };

  try {
    const desktop = await newContext(browser, 'desktop', opts.auth);
    const mobile = shots ? await newContext(browser, 'mobile', opts.auth) : null;

    const robots = await fetchText(desktop, new URL('/robots.txt', start).href);
    const sitemapUrls = [new URL('/sitemap.xml', start).href];
    const robotsPaths = [];
    if (robots.ok) {
      for (const line of robots.text.split(/\r?\n/)) {
        const m = line.match(/^\s*(allow|disallow|sitemap)\s*:\s*(\S+)/i);
        if (!m) continue;
        if (m[1].toLowerCase() === 'sitemap') sitemapUrls.push(m[2]);
        else if (m[2] !== '/' && !m[2].includes('*')) robotsPaths.push(m[2]);
      }
    }
    const sitemapPages = [];
    for (const sm of [...new Set(sitemapUrls)]) {
      const r = await fetchText(desktop, sm);
      if (!r.ok) continue;
      for (const m of r.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
        const u = normalise(m[1].replace(/&amp;/g, '&'));
        if (u && u.origin === start.origin) sitemapPages.push(u);
      }
    }
    step(`robots.txt ${robots.ok ? 'found' : 'not found'} · sitemap entries: ${sitemapPages.length}`);

    const bundleRoutes = new Set();
    const bundle = { hashRoutes: new Set(), hashSignal: false };
    const seenScripts = new Set();
    // Hash routing: the start URL, a crawled link or a bundle says routes live in "#/..." fragments.
    let hashPrefix = isHashRoute(start.hash) && start.hash.startsWith('#!') ? '#!' : '#';
    let hashRouting = isHashRoute(start.hash);
    const startDoc = new URL(start.href);
    startDoc.hash = '';
    const hashUrl = (r) => {
      const u = new URL(startDoc.href);
      u.hash = r.startsWith('#') ? r : hashPrefix + r;
      return u;
    };
    const queuedHash = new Set();
    const queue = [start];
    add(start, 'crawl');
    for (const u of sitemapPages) {
      add(u, 'sitemap');
      queue.push(u);
    }
    for (const p of robotsPaths) {
      const u = normalise(p, start);
      if (u) add(u, 'robots');
    }

    const visited = new Set();
    const pages = [];
    while (queue.length && visited.size < maxPages) {
      const u = queue.shift();
      const r = routeOf(u);
      if (visited.has(r)) continue;
      visited.add(r);
      const result = await visit(desktop, u, start.origin, seenScripts, bundleRoutes, bundle);
      const entry = routes.get(r) || add(u, 'crawl');
      Object.assign(entry, result.info);
      if (pages.length === 0 && !entry.status) {
        if (result.page) await result.page.close();
        const err = new Error(`could not load ${u.href}: ${(entry.consoleErrors || []).join(' ').replace(/^navigation failed: /, '') || 'no response'}`);
        err.exitCode = 2;
        throw err;
      }
      pages.push(entry);
      if (shots && result.page) {
        const base = `${String(pages.length).padStart(2, '0')}-${slug(r)}`;
        await result.page.screenshot({ path: path.join(shotDir, `${base}-desktop.png`) }).catch(() => {});
        entry.screenshots = [`evidence/recon/${base}-desktop.png`];
        const mp = await mobile.newPage();
        try {
          await mp.goto(u.href, { waitUntil: 'load', timeout: 30000 });
          await mp.waitForTimeout(300);
          await mp.screenshot({ path: path.join(shotDir, `${base}-mobile.png`) });
          entry.screenshots.push(`evidence/recon/${base}-mobile.png`);
        } catch {
          /* page failed on mobile; desktop result already recorded */
        }
        await mp.close();
      }
      if (result.page) await result.page.close();
      const status = entry.status;
      step(`${status >= 400 || !status ? c.red(status || 'ERR') : c.green(status)} ${r}${entry.consoleErrors?.length ? c.yellow(`  ${entry.consoleErrors.length} console error(s)`) : ''}`);
      for (const link of result.links) {
        const lu = normalise(link, u);
        if (!lu || lu.origin !== start.origin) continue;
        if (isHashRoute(lu.hash) && !hashRouting) {
          hashRouting = true;
          hashPrefix = lu.hash.startsWith('#!') ? '#!' : '#';
        }
        if (SKIP_LINK_RE.test(routeOf(lu)) || ASSET_RE.test(lu.pathname)) {
          if (SKIP_LINK_RE.test(routeOf(lu))) add(lu, 'crawl').skipped = 'not followed (looks destructive)';
          continue;
        }
        add(lu, 'crawl');
        if (!visited.has(routeOf(lu))) queue.push(lu);
      }
      if (bundle.hashRoutes.size || bundle.hashSignal) hashRouting = true;
      // A hash-routed app: every route-like string from its bundles is tried as a #/route of the start page.
      if (hashRouting) {
        for (const r of [...bundle.hashRoutes, ...bundleRoutes]) {
          const hu = hashUrl(r);
          if (SKIP_LINK_RE.test(r) || queuedHash.has(hu.href)) continue;
          queuedHash.add(hu.href);
          add(hu, 'bundle');
          if (!visited.has(routeOf(hu))) queue.push(hu);
        }
      }
    }
    if (queue.some((u) => !visited.has(routeOf(u)))) warn(`Stopped at --max-pages ${maxPages}; some routes were found but not visited.`);

    // Bundle strings not already explained: resolve against the start page's path, then check each answers.
    const startDir = startDoc.pathname.replace(/[^/]*$/, '');
    let probes = 0;
    const PROBE_LIMIT = 100;
    for (const b of bundleRoutes) {
      if (hashRouting) {
        const hu = hashUrl(b);
        const e = add(hu, 'bundle');
        if (!visited.has(routeOf(hu)) && e.sources.size === 1) e.candidate = 'candidate (bundle) – hash route, not visited (raise --max-pages)';
        continue;
      }
      const variants = [];
      if (startDir !== '/') variants.push(new URL(startDir + b.replace(/^\//, ''), start.origin));
      variants.push(new URL(b, start.origin));
      const known = variants.find((v) => routes.has(routeOf(v)));
      if (known) {
        add(known, 'bundle');
        continue;
      }
      if (probes >= PROBE_LIMIT) {
        add(variants[0], 'bundle').candidate = 'candidate (bundle) – unverified (probe limit reached)';
        continue;
      }
      let pick = null;
      let firstStatus = 0;
      for (const v of variants) {
        probes++;
        const st = (await fetchText(desktop, v.href, { body: false })).status;
        if (v === variants[0]) firstStatus = st;
        if (st && st < 400) {
          pick = { v, st };
          break;
        }
      }
      const e = add(pick ? pick.v : variants[0], 'bundle');
      if (pick) e.candidate = `candidate (bundle) – answers ${pick.st}, not linked`;
      else if (firstStatus === 401 || firstStatus === 403) e.candidate = `candidate (bundle) – answers ${firstStatus} (may need sign-in)`;
      else if (firstStatus) e.candidate = `candidate (bundle) – ${firstStatus}, probably not a real route`;
      else e.candidate = 'candidate (bundle) – no answer';
    }

    const list = [...routes.values()].map((e) => ({
      route: e.route,
      url: e.url,
      sources: [...e.sources],
      visited: visited.has(e.route),
      status: e.status ?? null,
      title: e.title ?? null,
      loadMs: e.loadMs ?? null,
      consoleErrors: e.consoleErrors ?? [],
      failedRequests: e.failedRequests ?? [],
      screenshots: e.screenshots ?? [],
      note: e.skipped || (visited.has(e.route) ? '' : e.candidate || 'found, not visited'),
    }));
    list.sort((a, b) => Number(b.visited) - Number(a.visited) || a.route.localeCompare(b.route));

    const json = { tool: 'oqa recon', target: start.href, origin: start.origin, browser: engine, hashRouting, date: new Date().toISOString(), maxPages, robotsTxt: robots.ok, routes: list };
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'recon.json'), JSON.stringify(json, null, 2) + '\n');
    writeRoutesTable(path.join(out, 'routes.md'), list, start);

    const vis = list.filter((r) => r.visited).length;
    const dead = list.filter((r) => /probably not a real route/.test(r.note)).length;
    ok(`${list.length} routes found (${vis} visited, ${list.filter((r) => r.note.startsWith('candidate')).length - dead} bundle candidates, ${dead} dead bundle string(s))${hashRouting ? ' · hash routing (#/...)' : ''}`);
    step(show(path.join(out, 'recon.json')));
    step(`${show(path.join(out, 'routes.md'))}  (table under "## All routes found")`);
    console.log(`\nNext: split routes into areas in routes.md, then run ${c.bold(`oqa scan --from ${show(path.join(out, 'recon.json'))} --out ${show(out)}`)}`);
    return json;
  } finally {
    await browser.close();
  }
}

async function fetchText(ctx, url, { body = true } = {}) {
  try {
    const r = await ctx.request.get(url, { timeout: 15000, failOnStatusCode: false });
    return { ok: r.ok(), status: r.status(), text: r.ok() && body ? await r.text() : '' };
  } catch {
    return { ok: false, status: 0, text: '' };
  }
}

async function visit(ctx, u, origin, seenScripts, bundleRoutes, bundle) {
  const page = await ctx.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  const scriptJobs = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 300)));
  page.on('pageerror', (e) => consoleErrors.push(String(e.message || e).slice(0, 300)));
  page.on('requestfailed', (r) => failedRequests.push(`${r.method()} ${r.url()} — ${r.failure()?.errorText || 'failed'}`));
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url() !== u.href) failedRequests.push(`${r.request().method()} ${r.url()} — ${r.status()}`);
    const ru = normalise(r.url());
    if (ru && ru.origin === origin && r.request().resourceType() === 'script' && !seenScripts.has(ru.href)) {
      seenScripts.add(ru.href);
      scriptJobs.push(
        r
          .text()
          .then((t) => {
            extractRoutes(t).forEach((x) => bundleRoutes.add(x));
            extractHashRoutes(t).forEach((x) => bundle.hashRoutes.add(x));
            if (usesHashRouting(t)) bundle.hashSignal = true;
          })
          .catch(() => {}),
      );
    }
  });
  const t0 = Date.now();
  let status = null;
  let title = null;
  let links = [];
  try {
    const resp = await page.goto(u.href, { waitUntil: 'load', timeout: 30000 });
    status = resp ? resp.status() : null;
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    title = await page.title();
    links = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
  } catch (err) {
    consoleErrors.push(`navigation failed: ${err.message.split('\n')[0]}`);
  }
  const loadMs = Date.now() - t0;
  await Promise.all(scriptJobs);
  return { page, links, info: { status, title, loadMs, consoleErrors, failedRequests } };
}

// Quoted strings that look like app paths: "/a", "/a/b", "/users/:id". Assets are dropped.
export function extractRoutes(js) {
  const found = new Set();
  for (const m of js.matchAll(/["'`](\/[A-Za-z0-9_\-.:~/]{1,80})["'`]/g)) {
    const s = m[1];
    if (s.startsWith('//') || ASSET_RE.test(s) || /\/\//.test(s) || /^\/[.:]/.test(s)) continue;
    if (!/[A-Za-z]/.test(s)) continue;
    found.add(s.replace(/\/$/, '') || '/');
  }
  return [...found];
}

// Quoted "#/path" or "#!/path" strings: routes of a hash router.
export function extractHashRoutes(js) {
  const found = new Set();
  for (const m of js.matchAll(/["'`](#!?\/[A-Za-z0-9_\-.:~/]{1,80})["'`]/g)) found.add(m[1].replace(/\/$/, ''));
  found.delete('#');
  found.delete('#!');
  return [...found];
}

// Signs that client-side routing lives in location.hash.
export function usesHashRouting(js) {
  return /addEventListener\(\s*["']hashchange["']|\bonhashchange\b|createHashHistory|\bHashRouter\b|createWebHashHistory|hashbang|["']#!?\/[A-Za-z]/.test(js);
}

function cell(s) {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function routesTable(list) {
  const rows = [
    '| Route | Source | Status | Title | Console errors | Failed requests |',
    '|---|---|---|---|---|---|',
  ];
  for (const r of list) {
    const status = r.visited ? (r.status ?? 'error') : r.note || 'not visited';
    rows.push(
      `| \`${cell(r.route)}\` | ${r.sources.join(', ')} | ${cell(status)} | ${cell(r.title || '')} | ${r.visited ? r.consoleErrors.length : ''} | ${r.visited ? r.failedRequests.length : ''} |`,
    );
  }
  return rows.join('\n');
}

export function writeRoutesTable(file, list, start) {
  const marker = '## All routes found';
  const block = `${marker}\n<!-- oqa recon writes the table below; re-running replaces it. Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC from ${start.href} -->\n\n${routesTable(list)}\n`;
  let text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : `# Routes and areas — ${start.host}\n\n`;
  const i = text.indexOf(marker);
  if (i === -1) {
    text = text.replace(/\s*$/, '\n\n') + block;
  } else {
    const rest = text.slice(i + marker.length);
    const next = rest.search(/\n## /);
    text = text.slice(0, i) + block + (next === -1 ? '' : rest.slice(next));
  }
  fs.writeFileSync(file, text);
}
