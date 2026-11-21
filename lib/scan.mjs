import fs from 'node:fs';
import path from 'node:path';
import { launch, newContext, normalise, shotWithOutline, routeOf, isHashRoute, assertReachable, browserName, BROWSER_LABEL, SKIP_LINK_RE } from './browser.mjs';

// A page's name in titles: its path, plus the #/route for hash-routed apps.
const pageName = (u) => u.pathname + (isHashRoute(u.hash) ? u.hash : '');
import { c, info, ok, warn, step, slug, show } from './ui.mjs';

export const scanHelp = `Usage: oqa scan <url...> [options]
       oqa scan --from <recon.json> [options]

Run automated checks on each page, on desktop (1440x900) and mobile (390x844):
  accessibility (axe-core, WCAG 2.0/2.1/2.2 A and AA), security headers, cookie flags,
  mixed content, lab performance (TTFB, LCP, CLS), broken same-origin links,
  console and page errors, horizontal overflow on mobile, password forms sent by GET.

Writes <out>/scan.json and <out>/findings/scan-candidates.md (IDs QA-SCAN-nn).
Every candidate is Unconfirmed: a person must reproduce it before it becomes a finding.

Options:
  --from <file>   take the page list from a recon.json (visited pages with status < 400)
  --out <dir>     output folder, usually your engagement folder (default ./oqa-output)
  --auth <file>   storage state from "oqa login" to scan signed-in pages
  --browser <name>  chromium (default), firefox or webkit; the Where line names it

An unreachable first page stops the scan with exit code 2.

Checks are passive: pages are loaded and links are fetched once with GET. Nothing is submitted.`;

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const LCP_LIMIT = 2500;
const CLS_LIMIT = 0.1;

const PERF_INIT = `(() => {
  window.__oqa = { lcp: null, cls: 0 };
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__oqa.lcp = e.renderTime || e.loadTime || e.startTime; })
      .observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__oqa.cls += e.value; })
      .observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
})();`;

export async function scan(urls, opts = {}) {
  const out = path.resolve(opts.out || 'oqa-output');
  let targets = urls.map((u) => normalise(u)).filter(Boolean);
  if (opts.from) {
    const recon = JSON.parse(fs.readFileSync(opts.from, 'utf8'));
    for (const r of recon.routes || []) {
      if (r.visited && r.status && r.status < 400) targets.push(normalise(r.url));
    }
  }
  const seen = new Set();
  targets = targets.filter((u) => u && /^https?:$/.test(u.protocol) && !seen.has(u.href) && seen.add(u.href));
  if (!targets.length) throw new Error('No pages to scan.');
  const origin = targets[0].origin;
  const engine = browserName(opts.browser);
  const B = BROWSER_LABEL[engine];
  await assertReachable(targets[0].href);

  const evRel = 'evidence/scan';
  const evDir = path.join(out, evRel);
  fs.mkdirSync(evDir, { recursive: true });
  fs.mkdirSync(path.join(out, 'findings'), { recursive: true });

  info(`Scan ${c.bold(targets.length)} page(s) on desktop + mobile · ${B}${opts.auth ? ' · signed in' : ''}`);
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  const browser = await launch({ browser: engine });
  const browserLabel = `${B} ${browser.version()}`;
  const raw = { tool: 'oqa scan', origin, browser: engine, date: new Date().toISOString(), tags: AXE_TAGS, pages: [], links: [], cookies: [] };
  const axeGroups = new Map();
  const headerGaps = new Map();
  const links = new Map();
  const consoleGroups = new Map();
  const others = [];

  try {
    const ctx = { desktop: await newContext(browser, 'desktop', opts.auth), mobile: await newContext(browser, 'mobile', opts.auth) };
    for (const u of targets) {
      for (const kind of ['desktop', 'mobile']) {
        const vp = kind === 'desktop' ? 'desktop 1440' : 'mobile 390';
        const page = await ctx[kind].newPage();
        await page.addInitScript(PERF_INIT);
        const errors = [];
        const requests = [];
        page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 400)));
        page.on('pageerror', (e) => errors.push(`Uncaught ${e.name || 'Error'}: ${e.message}`.slice(0, 400)));
        page.on('request', (r) => requests.push(r.url()));

        const rec = { url: u.href, viewport: kind, status: null };
        raw.pages.push(rec);
        let resp;
        try {
          resp = await page.goto(u.href, { waitUntil: 'load', timeout: 45000 });
          rec.status = resp ? resp.status() : null;
          await page.waitForTimeout(3000);
        } catch (err) {
          rec.error = err.message.split('\n')[0];
          step(`${c.red('ERR')} ${u.href} (${kind}): ${rec.error}`);
          await page.close();
          continue;
        }
        const base = `${slug(routeOf(u))}-${kind}`;

        // (e) lab performance
        rec.perf = await page.evaluate(() => {
          const nav = performance.getEntriesByType('navigation')[0];
          return { ttfb: nav ? Math.round(nav.responseStart) : null, lcp: window.__oqa?.lcp != null ? Math.round(window.__oqa.lcp) : null, cls: window.__oqa ? Number(window.__oqa.cls.toFixed(3)) : null };
        });
        for (const [metric, val, limit, unit] of [
          ['LCP', rec.perf.lcp, LCP_LIMIT, 'ms'],
          ['CLS', rec.perf.cls, CLS_LIMIT, ''],
        ]) {
          if (val != null && val > limit) {
            const file = `${evRel}/perf-${metric.toLowerCase()}-${base}.png`;
            await page.screenshot({ path: path.join(out, file) });
            others.push({
              key: `perf-${metric}-${u.href}-${kind}`,
              title: `${metric} is ${val}${unit} on ${pageName(u)} (${kind}, lab)`,
              severity: 'Medium',
              category: 'Performance',
              where: [{ url: u.href, vp }],
              experience: metric === 'LCP' ? 'The main content of the page takes a long time to appear.' : 'Content moves around while the page loads, so people can click the wrong thing.',
              steps: [`Open ${u.href} at ${vp} in ${B} with an empty cache.`, `Measure ${metric} (DevTools Performance panel or Lighthouse).`],
              expected: `${metric} under ${limit}${unit} (the "good" threshold).`,
              actual: `${metric} ${val}${unit} in a lab measurement (one load on the tester's machine, not field data). TTFB ${rec.perf.ttfb}ms.`,
              evidence: [file],
            });
          }
        }

        // (g) console and page errors
        rec.consoleErrors = errors;
        for (const msg of errors) {
          if (/Failed to load resource/.test(msg) && rec.status >= 400) continue;
          const g = consoleGroups.get(msg) || { msg, where: [], shot: null };
          g.where.push({ url: u.href, vp });
          if (!g.shot) {
            g.shot = `${evRel}/console-${base}.png`;
            await page.screenshot({ path: path.join(out, g.shot) });
          }
          consoleGroups.set(msg, g);
        }

        // (d) mixed content
        if (u.protocol === 'https:') {
          const mixed = [...new Set(requests.filter((r) => r.startsWith('http:')))];
          if (mixed.length) {
            const file = `${evRel}/mixed-${base}.png`;
            await page.screenshot({ path: path.join(out, file) });
            others.push({
              key: `mixed-${u.href}`,
              title: `Page loads ${mixed.length} resource(s) over plain HTTP`,
              severity: 'Medium',
              category: 'Security',
              where: [{ url: u.href, vp }],
              experience: 'Parts of a secure page are fetched insecurely; browsers may block them or show a warning.',
              steps: [`Open ${u.href} in ${B}.`, 'Open DevTools > Console and look for mixed-content warnings.'],
              expected: 'Every resource on an https page is loaded over https.',
              actual: `Requested over http: ${mixed.slice(0, 5).join(', ')}${mixed.length > 5 ? ' …' : ''}`,
              evidence: [file],
            });
          }
        }

        if (kind === 'desktop') {
          // (b) security headers
          const h = resp ? await resp.allHeaders() : {};
          const csp = h['content-security-policy'] || '';
          const checks = [
            ['Content-Security-Policy', !!csp],
            ['X-Content-Type-Options', /nosniff/i.test(h['x-content-type-options'] || '')],
            ['Referrer-Policy', !!h['referrer-policy']],
            ['Permissions-Policy', !!h['permissions-policy']],
            ['X-Frame-Options or CSP frame-ancestors', !!h['x-frame-options'] || /frame-ancestors/i.test(csp)],
          ];
          if (u.protocol === 'https:') checks.push(['Strict-Transport-Security', !!h['strict-transport-security']]);
          rec.headers = Object.fromEntries(checks);
          for (const [name, present] of checks) {
            if (!present) headerGaps.set(name, [...(headerGaps.get(name) || []), u.href]);
          }

          // (f) collect same-origin links
          const found = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
          for (const href of found) {
            const lu = normalise(href, u);
            if (!lu || lu.origin !== origin || SKIP_LINK_RE.test(lu.pathname) || !/^https?:$/.test(lu.protocol)) continue;
            const l = links.get(lu.href) || { href: lu.href, raw: href, pages: [] };
            if (!l.pages.includes(u.href)) l.pages.push(u.href);
            links.set(lu.href, l);
          }

          // (i) password field in a GET form
          const getForms = await page.evaluate(() => {
            const outF = [];
            document.querySelectorAll('form').forEach((f, i) => {
              const method = (f.getAttribute('method') || 'get').toLowerCase();
              if (method === 'get' && f.querySelector('input[type="password"]')) {
                f.setAttribute('data-oqa-target', `getform-${i}`);
                outF.push({ sel: `[data-oqa-target="getform-${i}"]`, action: f.getAttribute('action') || '(same page)' });
              }
            });
            return outF;
          });
          for (const f of getForms) {
            const file = `${evRel}/password-get-${base}.png`;
            await shotWithOutline(page, f.sel, path.join(out, file));
            others.push({
              key: `pwget-${u.href}`,
              title: `Password form on ${pageName(u)} is sent with GET, so the password goes into the URL`,
              severity: 'High',
              category: 'Security',
              where: [{ url: u.href, vp }],
              experience: "The password a person types ends up in the address bar, the browser history and the server's logs.",
              steps: [`Open ${u.href}.`, 'Fill in the form that has a password field and submit it.', 'Look at the address bar after submitting.'],
              expected: 'Forms with a password field use method="post"; the password never appears in a URL.',
              actual: `The form (action ${f.action}) has no method="post", so the browser sends the fields, including the password, as URL query parameters.`,
              evidence: [file],
            });
          }
        } else {
          // (h) horizontal overflow on mobile
          const ov = await page.evaluate(() => {
            const vw = document.documentElement.clientWidth;
            const docW = document.documentElement.scrollWidth;
            if (docW <= vw + 1) return null;
            let best = null;
            for (const el of document.body.querySelectorAll('*')) {
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.right <= vw + 1) continue;
              const p = el.parentElement;
              if (p && p !== document.body && p.getBoundingClientRect().right > vw + 1) continue;
              if (!best || r.width > best.w) best = { el, w: Math.round(r.width), tag: el.tagName.toLowerCase(), cls: el.className && typeof el.className === 'string' ? el.className : '' };
            }
            if (best) best.el.setAttribute('data-oqa-target', 'overflow');
            return { vw, docW, tag: best?.tag, cls: best?.cls, w: best?.w };
          });
          if (ov) {
            const file = `${evRel}/overflow-${base}.png`;
            await shotWithOutline(page, '[data-oqa-target="overflow"]', path.join(out, file));
            others.push({
              key: `overflow-${u.href}`,
              title: `${pageName(u)} scrolls sideways on a 390px phone`,
              severity: 'Low',
              category: 'UX',
              where: [{ url: u.href, vp }],
              experience: 'On a phone the page is wider than the screen, so people have to scroll sideways and content is cut off.',
              steps: [`Open ${u.href} at 390x844 (iPhone-sized) in ${B}.`, 'Try to scroll the page to the right.'],
              expected: 'The page fits the 390px width; nothing needs sideways scrolling.',
              actual: `The document is ${ov.docW}px wide in a ${ov.vw}px viewport. Widest element sticking out: <${ov.tag}${ov.cls ? ` class="${ov.cls}"` : ''}> (${ov.w}px).`,
              evidence: [file],
            });
          }
        }

        // (a) accessibility
        try {
          const res = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
          rec.axe = res.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
          for (const v of res.violations) {
            const g = axeGroups.get(v.id) || { id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl, description: v.description, hits: [], shot: null };
            const targetsList = v.nodes.map((n) => (Array.isArray(n.target) ? n.target.flat().join(' ') : String(n.target)));
            g.hits.push({ url: u.href, vp, targets: targetsList, html: v.nodes[0]?.html?.slice(0, 200) || '', summary: v.nodes[0]?.failureSummary?.split('\n').slice(1, 2).join(' ').trim() || '' });
            if (!g.shot) {
              g.shot = `${evRel}/a11y-${v.id}-${base}.png`;
              const first = v.nodes[0]?.target;
              const sel = Array.isArray(first) && first.length === 1 && typeof first[0] === 'string' ? first[0] : null;
              await shotWithOutline(page, sel, path.join(out, g.shot));
            }
            axeGroups.set(v.id, g);
          }
        } catch (err) {
          rec.axeError = err.message.split('\n')[0];
          warn(`axe failed on ${u.href} (${kind}): ${rec.axeError}`);
        }

        step(`${rec.status >= 400 ? c.red(rec.status) : c.green(rec.status)} ${routeOf(u)} ${c.dim(kind)}  axe ${rec.axe?.length ?? '?'} · console ${errors.length} · LCP ${rec.perf?.lcp ?? '?'}ms`);
        await page.close();
      }
    }

    // (c) cookie flags
    const host = new URL(origin).hostname;
    const cookies = [...(await ctx.desktop.cookies()), ...(await ctx.mobile.cookies())].filter((ck) => host.endsWith(ck.domain.replace(/^\./, '')));
    const byName = new Map(cookies.map((ck) => [ck.name, ck]));
    for (const ck of byName.values()) {
      const missing = [];
      if (!ck.httpOnly) missing.push('HttpOnly');
      if (!ck.sameSite || ck.sameSite === 'None') missing.push('SameSite');
      if (origin.startsWith('https:') && !ck.secure) missing.push('Secure');
      raw.cookies.push({ name: ck.name, domain: ck.domain, path: ck.path, httpOnly: ck.httpOnly, secure: ck.secure, sameSite: ck.sameSite });
      if (!missing.length) continue;
      const sessionLike = /sess|auth|token|sid|login|jwt/i.test(ck.name);
      others.push({
        key: `cookie-${ck.name}`,
        title: `Cookie "${ck.name}" is missing ${missing.join(', ')}`,
        severity: sessionLike ? 'Medium' : 'Low',
        category: 'Security',
        where: [{ url: origin + '/', vp: 'any' }],
        experience: sessionLike ? 'If any script on the site is ever compromised, it can read this login cookie and take over the account.' : 'A cookie is sent with weaker protection than it could have.',
        steps: [`Open ${origin}/${opts.auth ? ' signed in' : ''} in ${B}.`, 'Open DevTools > Application > Cookies and select the site.', `Look at the HttpOnly, Secure and SameSite columns for "${ck.name}".`],
        expected: 'Session cookies are HttpOnly, SameSite=Lax or Strict, and Secure on https.',
        actual: `"${ck.name}" (path ${ck.path}): httpOnly=${ck.httpOnly}, secure=${ck.secure}, sameSite=${ck.sameSite || 'not set'}.`,
        evidence: [],
      });
    }

    // (f) broken links, each fetched once
    for (const l of links.values()) {
      let status = 0;
      try {
        const r = await ctx.desktop.request.get(l.href, { timeout: 15000, failOnStatusCode: false });
        status = r.status();
      } catch {
        status = 0;
      }
      l.status = status;
      raw.links.push({ href: l.href, status, linkedFrom: l.pages });
      if (status && status < 400) continue;
      const page = await ctx.desktop.newPage();
      const file = `${evRel}/link-${slug(new URL(l.href).pathname)}.png`;
      try {
        await page.goto(l.pages[0], { waitUntil: 'load', timeout: 30000 });
        await shotWithOutline(page, `a[href="${l.raw.replace(/"/g, '\\"')}"]`, path.join(out, file));
      } catch {
        /* screenshot is best effort */
      }
      await page.close();
      const p = new URL(l.href).pathname;
      others.push({
        key: `link-${l.href}`,
        title: `Link to ${p} is broken (${status || 'no response'})`,
        severity: 'Medium',
        category: 'Functional',
        where: l.pages.map((x) => ({ url: x, vp: 'desktop 1440' })),
        experience: `People who click the "${p}" link land on an error page instead of the content they wanted.`,
        steps: [`Open ${l.pages[0]}.`, `Click the link to ${p} (outlined in the screenshot).`],
        expected: 'The link opens a working page.',
        actual: `GET ${l.href} returned ${status || 'no response'}. Linked from ${l.pages.length} page(s): ${l.pages.map((x) => new URL(x).pathname).join(', ')}.`,
        evidence: fs.existsSync(path.join(out, file)) ? [file] : [],
      });
    }
  } finally {
    await browser.close();
  }

  // assemble candidates
  const cands = [...others];
  for (const [name, urlsMissing] of headerGaps) {
    cands.push({
      key: `hdr-${name}`,
      title: `Security header missing: ${name}`,
      severity: 'Low',
      category: 'Security',
      where: urlsMissing.map((x) => ({ url: x, vp: 'any' })),
      experience: 'The browser is not told to apply a protection it supports, which makes some attacks easier if another bug exists.',
      steps: [`Open ${urlsMissing[0]} in ${B} with DevTools > Network open.`, 'Select the document request and read the Response Headers.'],
      expected: `The response sets ${name}.`,
      actual: `Not set on ${urlsMissing.length} of ${targets.length} page(s): ${urlsMissing.map((x) => new URL(x).pathname).join(', ')}.`,
      evidence: [],
    });
  }
  for (const g of consoleGroups.values()) {
    cands.push({
      key: `console-${g.msg}`,
      title: `Console error on ${[...new Set(g.where.map((w) => pageName(new URL(w.url))))].join(', ')}: ${g.msg.slice(0, 70)}`,
      severity: 'Medium',
      category: 'Functional',
      where: g.where,
      experience: 'Something on the page failed in the background; a feature may not work or data may be missing.',
      steps: [`Open ${g.where[0].url} at ${g.where[0].vp}.`, 'Open DevTools > Console.'],
      expected: 'No errors in the console.',
      actual: g.msg,
      evidence: [g.shot],
    });
  }
  for (const g of axeGroups.values()) {
    const pages = [...new Set(g.hits.map((h) => new URL(h.url).pathname))];
    const nodes = g.hits.reduce((n, h) => n + h.targets.length, 0);
    cands.push({
      key: `axe-${g.id}`,
      title: `${g.help} (axe: ${g.id}, ${g.impact})`,
      severity: g.impact === 'critical' || g.impact === 'serious' ? 'Medium' : 'Low',
      category: 'Accessibility',
      where: g.hits,
      experience: axeExperience(g.id, g.description),
      steps: [`Open ${g.hits[0].url} at ${g.hits[0].vp}.`, `Inspect the element(s): ${g.hits[0].targets.slice(0, 3).join(', ')}.`, `Check against ${g.helpUrl}`],
      expected: g.help + '.',
      actual: `${nodes} element(s) on ${pages.length} page(s) (${pages.join(', ')}). First: ${g.hits[0].html}${g.hits[0].summary ? ` — ${g.hits[0].summary}` : ''}`,
      evidence: [g.shot],
    });
  }
  const sevOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  cands.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
  cands.forEach((cd, i) => (cd.id = `QA-SCAN-${String(i + 1).padStart(2, '0')}`));

  raw.candidates = cands.map(({ id, title, severity, category, where, actual, evidence }) => ({ id, title, severity, category, where, actual, evidence }));
  fs.writeFileSync(path.join(out, 'scan.json'), JSON.stringify(raw, null, 2) + '\n');
  fs.writeFileSync(path.join(out, 'findings', 'scan-candidates.md'), candidatesMarkdown(cands, origin, raw.date, browserLabel));

  ok(`${cands.length} candidate(s) written`);
  for (const cd of cands) step(`${cd.id}  ${sevColour(cd.severity)}  ${cd.title}`);
  step(show(path.join(out, 'findings', 'scan-candidates.md')));
  step(show(path.join(out, 'scan.json')));
  console.log(`\nNext: reproduce each candidate by hand. Real bugs move into findings/<area>.md with an area ID; the rest are deleted.`);
  return { candidates: cands, raw };
}

function sevColour(s) {
  return { High: c.red, Critical: c.red, Medium: c.yellow, Low: c.dim }[s](s.padEnd(6));
}

function axeExperience(id, description) {
  const map = {
    'image-alt': 'People using a screen reader hear a file name or nothing at all where an image is.',
    'button-name': 'A screen reader announces just "button" with no name, so people cannot tell what it does.',
    'link-name': 'A screen reader announces a link with no name, so people cannot tell where it goes.',
    'color-contrast': 'Some text is too faint against its background to read comfortably, especially on a phone outdoors or with low vision.',
    label: 'A form field has no label, so screen-reader users do not know what to type.',
    'html-has-lang': 'Screen readers may read the page in the wrong language.',
    'document-title': 'The browser tab and screen readers have no page title.',
  };
  return map[id] || `Accessibility problem: ${description}`;
}

function clean(s) {
  return String(s ?? '').replace(/`/g, "'").replace(/\s+/g, ' ').trim();
}

function whereLine(list, browserLabel) {
  const first = list[0];
  const more = new Set(list.map((w) => w.url)).size - 1;
  return `${first.url} · ${first.vp} · ${browserLabel}${more > 0 ? ` (and ${more} more page${more > 1 ? 's' : ''})` : ''}`;
}

export function candidatesMarkdown(cands, origin, date, browserLabel = 'Chromium') {
  const lines = [
    `# Scan candidates — ${origin}`,
    '',
    `> Generated by \`oqa scan\` on ${date.slice(0, 16).replace('T', ' ')} UTC. **Every candidate below is Unconfirmed and must be`,
    '> checked by a human** before it moves into an area findings file (with a new area ID such as QA-AUTH-04).',
    '> Reproduce it, check it is real and matters to a user, rewrite the user-impact line in your own words, then delete it from here.',
    '> Automated checks find a small share of real bugs and some false ones; this is a lead list, not a report.',
    '',
  ];
  for (const cd of cands) {
    lines.push(
      `### ${cd.id} — ${clean(cd.title)}`,
      `- **Severity:** ${cd.severity}`,
      '- **Priority:** P3',
      '- **Status:** Unconfirmed',
      `- **Category:** ${cd.category}`,
      `- **Where:** ${clean(whereLine(cd.where, browserLabel))}`,
      `- **What the user experiences:** ${clean(cd.experience)}`,
      '- **Steps to reproduce:**',
      ...cd.steps.map((s, i) => `  ${i + 1}. ${clean(s)}`),
      `- **Expected:** ${clean(cd.expected)}`,
      `- **Actual:** ${clean(cd.actual)}`,
      `- **Evidence:** ${cd.evidence.length ? cd.evidence.map((e) => `\`${e}\``).join(', ') + ', raw detail in `scan.json`' : 'raw detail in `scan.json` (no screenshot: this check reads headers or cookies)'}`,
      '',
    );
  }
  return lines.join('\n');
}
