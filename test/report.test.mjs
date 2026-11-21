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
