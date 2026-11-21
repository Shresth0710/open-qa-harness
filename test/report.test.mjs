import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildReportHtml, renderPdf } from '../lib/report.mjs';
import { loadFindings } from '../lib/findings.mjs';
import { EXAMPLE, tempDir, chromiumLaunches } from './helpers.mjs';

const ids = loadFindings(EXAMPLE, { includeCandidates: false }).findings.map((f) => f.id);

test('report HTML contains every finding ID and leaves scan candidates out', () => {
  const { html, findings } = buildReportHtml(EXAMPLE);
  assert.equal(findings.length, ids.length);
  for (const id of ids) assert.ok(html.includes(id), id);
  assert.ok(!html.includes('QA-SCAN-01'), 'candidates are not findings');
});

test('--include-candidates adds the scan candidates', () => {
  const { html } = buildReportHtml(EXAMPLE, { includeCandidates: true });
  assert.ok(html.includes('QA-SCAN-01'));
});

test('report HTML embeds the first screenshot of each finding', () => {
  const { html } = buildReportHtml(EXAMPLE);
  const imgs = html.match(/<img[^>]+src="data:image\/png;base64,/g) || [];
  assert.ok(imgs.length >= ids.length, `${imgs.length} embedded images for ${ids.length} findings`);
});

test('PDF renders (valid PDF header, non-trivial size)', async (t) => {
  if (!(await chromiumLaunches())) return t.skip('Chromium not installed (npm run setup)');
  const dir = tempDir(t);
  const file = path.join(dir, 'report.pdf');
  const { html } = buildReportHtml(EXAMPLE);
  await renderPdf(html, file);
  const head = fs.readFileSync(file).subarray(0, 5).toString();
  assert.equal(head, '%PDF-');
  assert.ok(fs.statSync(file).size > 50_000);
});

test('report HTML does not scroll sideways on a 390px phone', async (t) => {
  if (!(await chromiumLaunches())) return t.skip('Chromium not installed (npm run setup)');
  const { chromium } = await import('playwright');
  const b = await chromium.launch();
  t.after(() => b.close());
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  await page.setContent(buildReportHtml(EXAMPLE, { includeCandidates: true }).html, { waitUntil: 'load' });
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  assert.ok(sw <= iw, `scrollWidth ${sw} > innerWidth ${iw}`);
  // Wide tables scroll inside their own box; they are not crushed into one-letter columns to fit the phone.
  const narrow = await page.evaluate(() => [...document.querySelectorAll('table.grid td')]
    .filter((td) => td.textContent.trim().length > 3 && td.getBoundingClientRect().width < 56)
    .map((td) => `${Math.round(td.getBoundingClientRect().width)}px "${td.textContent.trim().slice(0, 20)}"`));
  assert.deepEqual(narrow.slice(0, 5), [], `table cells crushed below 56px: ${narrow.length}`);
});
