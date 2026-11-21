import fs from 'node:fs';
import path from 'node:path';
import { loadFindings, sortFindings, readFirstTable, SEVERITIES, STATUSES, isImage } from './findings.mjs';
import { lintEngagement } from './lint.mjs';
import { c, ok, warn, step, show } from './ui.mjs';

export const reportHelp = `Usage: oqa report <engagement-dir> [--pdf] [--title "..."] [--include-candidates]

Build <engagement-dir>/report/report.html: a single self-contained file (screenshots are
embedded) with a cover, an executive summary, the coverage table, every finding sorted by
severity then priority, and the verification table.

Options:
  --pdf                  also write report/report.pdf (A4, page numbers) using Chromium
  --title "..."          report title (default: "QA report — <engagement name>")
  --include-candidates   also include findings/scan-candidates.md (normally left out:
                         candidates are unchecked leads, not findings)`;

const SEV_COLOUR = { Critical: '#b42318', High: '#c4320a', Medium: '#b54708', Low: '#475467' };
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' };

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

// Escape, then allow `code` and **bold** only.
export function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function readEngagement(engDir) {
  const file = path.join(engDir, 'engagement.md');
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const get = (label) => {
    const m = text.match(new RegExp(`^- \\*\\*${label.replace(/[/()]/g, '\\$&')}:\\*\\*\\s*(.*)$`, 'm'));
    return m ? m[1].replace(/<!--.*?-->/g, '').trim() : '';
  };
  const h = text.match(/^#\s+Engagement\s+—\s+(.+)$/m);
  return {
    name: h ? h[1].trim() : path.basename(path.resolve(engDir)),
    target: get('Product / app'),
    environment: get('Environment'),
    mode: get('Mode'),
    authorisedBy: get('Authorised by'),
    window: get('Date window'),
    why: get('Why this QA is happening'),
    readers: get('Who reads the report'),
  };
}

function tableFile(engDir, name) {
  const file = path.join(engDir, name);
  if (!fs.existsSync(file)) return { rows: null, text: '' };
  const text = fs.readFileSync(file, 'utf8');
  return { rows: readFirstTable(text), text };
}

function imgTag(engDir, rel, alt) {
  const file = path.join(engDir, rel);
  if (!fs.existsSync(file)) return `<p class="missing">Evidence file missing: <code>${esc(rel)}</code></p>`;
  const data = fs.readFileSync(file).toString('base64');
  return `<img src="data:${MIME[path.extname(rel).toLowerCase()] || 'image/png'};base64,${data}" alt="${esc(alt)}">`;
}

function renderTable(rows, { emptyText = 'Nothing recorded.' } = {}) {
  if (!rows || !rows.length) return `<p class="muted">${esc(emptyText)}</p>`;
  const cols = Object.keys(rows[0]);
  return `<table class="grid"><thead><tr>${cols.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${cols.map((h) => `<td>${inline(r[h])}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

function chip(label, value, colour) {
  return `<span class="chip"${colour ? ` style="--chip:${colour}"` : ''}><span class="chip-k">${esc(label)}</span>${esc(value || '—')}</span>`;
}

function findingCard(f, engDir) {
  const colour = SEV_COLOUR[f.severity] || '#475467';
  const first = f.images[0];
  const others = f.evidence.filter((e) => e !== first);
  return `<article class="finding" id="${esc(f.id)}" style="--sev:${colour}">
  <header>
    <p class="fid">${esc(f.id)}</p>
    <h3>${inline(f.title)}</h3>
    <div class="chips">${chip('Severity', f.severity, colour)}${chip('Priority', f.priority)}${chip('Status', f.status)}${chip('Category', f.category)}</div>
  </header>
  <p class="where"><span class="label">Where</span> ${inline(f.where)}</p>
  <div class="experience"><span class="label">What the user experiences</span><p>${inline(f.experience)}</p></div>
  <div class="steps"><span class="label">Steps to reproduce</span><ol>${f.steps.map((s) => `<li>${inline(s)}</li>`).join('')}</ol></div>
  <div class="ea">
    <div><span class="label">Expected</span><p>${inline(f.expected)}</p></div>
    <div><span class="label">Actual</span><p>${inline(f.actual)}</p></div>
  </div>
  ${first ? `<figure>${imgTag(engDir, first, `${f.id} evidence`)}<figcaption>${esc(first)}</figcaption></figure>` : ''}
  <p class="evidence"><span class="label">Evidence</span> ${inline(f.evidenceText)}${others.length ? '' : ''}</p>
</article>`;
}

export function buildReportHtml(engDir, opts = {}) {
  const eng = readEngagement(engDir);
  const { findings: all } = loadFindings(engDir, { includeCandidates: !!opts.includeCandidates });
  const findings = sortFindings(all);
  const title = opts.title || `QA report — ${eng.name}`;
  const date = opts.date || new Date().toISOString().slice(0, 10);
  const coverage = tableFile(engDir, 'coverage.md');
  const verification = tableFile(engDir, 'verification.md');
  const verResult = (verification.text.match(/^\*\*Result:\*\*\s*(.*)$/m) || [])[1] || '';

  const count = (sev, st) => findings.filter((f) => f.severity === sev && (!st || f.status === st)).length;
  const tiles = SEVERITIES.map(
    (s) => `<div class="tile" style="--sev:${SEV_COLOUR[s]}"><span class="n">${count(s)}</span><span class="t">${s}</span></div>`,
  ).join('');
  const matrix = `<table class="grid matrix"><thead><tr><th>Severity</th>${STATUSES.map((s) => `<th>${s}</th>`).join('')}<th>Total</th></tr></thead><tbody>${SEVERITIES.map(
    (s) => `<tr><td><span class="dot" style="--sev:${SEV_COLOUR[s]}"></span>${s}</td>${STATUSES.map((st) => `<td>${count(s, st)}</td>`).join('')}<td><strong>${count(s)}</strong></td></tr>`,
  ).join('')}<tr class="sum"><td>All</td>${STATUSES.map((st) => `<td>${findings.filter((f) => f.status === st).length}</td>`).join('')}<td><strong>${findings.length}</strong></td></tr></tbody></table>`;
  const top = findings.filter((f) => f.severity === 'Critical' || f.severity === 'High').slice(0, 5);
  const meta = [
    ['Target', eng.target],
    ['Environment', eng.environment],
    ['Mode', eng.mode],
    ['Authorised by', eng.authorisedBy],
    ['Testing window', eng.window],
  ].filter(([, v]) => v);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
:root { --ink:#101828; --muted:#475467; --line:#e4e7ec; --soft:#f6f7f9; --accent:#2e5aac; }
* { box-sizing:border-box; }
body { margin:0; font:14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color:var(--ink); background:#fff; }
.page { max-width:880px; margin:0 auto; padding:40px 32px 64px; }
h1 { font-size:30px; line-height:1.2; margin:0 0 8px; letter-spacing:-0.01em; }
h2 { font-size:20px; margin:40px 0 12px; padding-bottom:6px; border-bottom:2px solid var(--ink); }
h3 { font-size:17px; margin:2px 0 8px; line-height:1.3; }
code { font:12.5px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background:var(--soft); border:1px solid var(--line); border-radius:4px; padding:0 4px; word-break:break-word; }
.muted { color:var(--muted); }
.label { display:block; font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); margin-bottom:2px; }
.cover { padding:56px 0 32px; border-bottom:1px solid var(--line); }
.eyebrow { color:var(--accent); font-weight:700; letter-spacing:.08em; text-transform:uppercase; font-size:12px; margin:0 0 14px; }
.cover .target { font-size:16px; color:var(--muted); margin:0 0 28px; word-break:break-all; }
.meta { display:grid; grid-template-columns:max-content 1fr; gap:6px 20px; margin:0 0 32px; }
.meta dt { color:var(--muted); } .meta dd { margin:0; }
.tiles { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
.tile { border:1px solid var(--line); border-top:4px solid var(--sev); border-radius:8px; padding:14px 16px; }
.tile .n { display:block; font-size:34px; font-weight:700; color:var(--sev); line-height:1.1; }
.tile .t { color:var(--muted); font-weight:600; }
.cover .total { margin-top:14px; color:var(--muted); }
table.grid { width:100%; border-collapse:collapse; font-size:13px; margin:8px 0 16px; }
table.grid th { text-align:left; font-size:11px; letter-spacing:.05em; text-transform:uppercase; color:var(--muted); border-bottom:1px solid var(--ink); padding:6px 8px; }
table.grid td { border-bottom:1px solid var(--line); padding:6px 8px; vertical-align:top; }
table.grid tr { break-inside:avoid; }
table.matrix { width:auto; min-width:420px; }
table.matrix tr.sum td { border-top:1px solid var(--ink); }
.dot { display:inline-block; width:9px; height:9px; border-radius:50%; background:var(--sev); margin-right:8px; }
.top li { margin:4px 0; }
.howto { background:var(--soft); border-radius:8px; padding:14px 18px; margin-top:16px; }
.howto p { margin:6px 0; }
.finding { border:1px solid var(--line); border-left:5px solid var(--sev); border-radius:8px; padding:18px 20px; margin:0 0 18px; break-inside:avoid; page-break-inside:avoid; }
.fid { margin:0; font:700 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color:var(--sev); letter-spacing:.02em; }
.chips { display:flex; flex-wrap:wrap; gap:6px; }
.chip { --chip:#344054; display:inline-flex; gap:6px; align-items:center; border:1px solid var(--line); border-radius:999px; padding:2px 10px; font-size:12px; font-weight:600; color:var(--chip); }
.chip-k { color:var(--muted); font-weight:500; }
.where { margin:12px 0 10px; word-break:break-word; }
.where .label, .evidence .label { display:inline; margin-right:6px; }
.experience { background:#eef3fb; border-left:3px solid var(--accent); border-radius:4px; padding:10px 14px; margin:10px 0; }
.experience p { margin:2px 0 0; font-size:15px; }
.steps ol { margin:4px 0 10px; padding-left:22px; } .steps li { margin:2px 0; }
.ea { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:8px 0 12px; }
.ea > div { background:var(--soft); border-radius:6px; padding:10px 12px; }
.ea p { margin:2px 0 0; word-break:break-word; }
figure { margin:8px 0 6px; border:1px solid var(--line); border-radius:6px; padding:8px; background:var(--soft); text-align:center; }
figure img { max-width:100%; max-height:110mm; object-fit:contain; display:block; margin:0 auto; }
figcaption { font:11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color:var(--muted); margin-top:6px; }
.evidence { font-size:12.5px; color:var(--muted); margin:6px 0 0; word-break:break-word; }
.missing { color:#b42318; }
.rubric dt { font-weight:700; margin-top:8px; } .rubric dd { margin:0 0 4px; }
footer.end { margin-top:40px; color:var(--muted); font-size:12px; border-top:1px solid var(--line); padding-top:10px; }
@page { size:A4; margin:16mm 14mm 18mm; }
@media print {
  body { font-size:12px; }
  .page { max-width:none; padding:0; }
  .cover { padding-top:30mm; border:0; break-after:page; }
  h2 { break-after:avoid; }
  a { color:inherit; text-decoration:none; }
}
</style>
</head>
<body>
<div class="page">
<section class="cover">
  <p class="eyebrow">Quality assurance report</p>
  <h1>${esc(title)}</h1>
  <p class="target">${inline(eng.target)}</p>
  <dl class="meta">${meta.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${inline(v)}</dd>`).join('')}<dt>Report date</dt><dd>${esc(date)}</dd></dl>
  <div class="tiles">${tiles}</div>
  <p class="total">${findings.length} finding${findings.length === 1 ? '' : 's'} · ${findings.filter((f) => f.status === 'Confirmed').length} confirmed (seen at least twice)</p>
</section>

<section>
  <h2>Executive summary</h2>
  ${eng.why ? `<p>${inline(eng.why)}</p>` : ''}
  ${matrix}
  ${
    top.length
      ? `<p><strong>Fix these first</strong> (${top.length} most severe):</p><ol class="top">${top
          .map((f) => `<li><code>${esc(f.id)}</code> <strong>${esc(f.severity)}</strong> · ${inline(f.title)}</li>`)
          .join('')}</ol>`
      : '<p>No Critical or High findings.</p>'
  }
  <div class="howto">
    <p><strong>How to read this report.</strong> Each finding is one problem, written so someone who was not there can reproduce it.</p>
    <p><strong>Severity</strong> is how badly it hurts a user (Critical blocks a key journey or exposes data; Low is cosmetic). <strong>Priority</strong> is when to fix it (P1 now, P4 when convenient). <strong>Confirmed</strong> means the tester saw it at least twice; <strong>Unconfirmed</strong> means once, and it is labelled honestly.</p>
    <p>The first screenshot of each finding shows the problem; the steps say exactly how to see it yourself. The coverage table lists what was and was not tested, so silence about a page never means it passed.</p>
  </div>
</section>

<section>
  <h2>Coverage</h2>
  ${renderTable(coverage.rows, { emptyText: 'coverage.md has no table: coverage was not recorded.' })}
</section>

<section>
  <h2>Findings</h2>
  ${findings.length ? findings.map((f) => findingCard(f, engDir)).join('\n') : '<p class="muted">No findings.</p>'}
</section>

<section>
  <h2>Appendix</h2>
  <h3>Verification</h3>
  <p class="muted">A separate verification pass re-ran a sample of findings using only what is written in them (details in verification.md).</p>
  ${renderTable(verification.rows, { emptyText: 'No independent verification was recorded.' })}
  ${verResult && !/^<k>/.test(verResult) ? `<p>${inline(verResult)}</p>` : ''}
  <h3>Severity and priority</h3>
  <dl class="rubric">
    <dt style="color:${SEV_COLOUR.Critical}">Critical</dt><dd>Blocks a critical journey (sign up, log in, the core paid action, payment), loses or exposes data, or breaks security. No workaround.</dd>
    <dt style="color:${SEV_COLOUR.High}">High</dt><dd>A main feature is broken or gives wrong results for many users, or a workaround exists but most people will not find it.</dd>
    <dt style="color:${SEV_COLOUR.Medium}">Medium</dt><dd>A feature partly works, a workaround is easy, or only some users or devices are affected. Includes accessibility barriers on secondary flows.</dd>
    <dt style="color:${SEV_COLOUR.Low}">Low</dt><dd>Cosmetic, wording, minor layout or hardening issues with little direct user impact.</dd>
    <dt>Priority</dt><dd>P1 fix before release · P2 fix in the next release · P3 schedule it · P4 backlog. Priority is the owner's call; the tester proposes it.</dd>
  </dl>
  <footer class="end">Generated by open-qa-harness (<code>oqa report</code>) on ${esc(date)}.</footer>
</section>
</div>
</body>
</html>
`;
  return { html, findings, title };
}

export async function report(engDir, opts = {}) {
  if (!fs.existsSync(engDir)) throw new Error(`Engagement folder not found: ${engDir}`);
  const lint = lintEngagement(engDir);
  if (lint.errors.length) warn(`oqa lint reports ${lint.errors.length} error(s); the report is built anyway. Run: oqa lint ${show(engDir)}`);
  const { html, findings } = buildReportHtml(engDir, opts);
  const outDir = path.join(engDir, 'report');
  fs.mkdirSync(outDir, { recursive: true });
  const htmlFile = path.join(outDir, 'report.html');
  fs.writeFileSync(htmlFile, html);
  ok(`${findings.length} finding(s) → ${show(htmlFile)} (${Math.round(html.length / 1024)} KB)`);
  if (opts.pdf) {
    const pdfFile = path.join(outDir, 'report.pdf');
    await renderPdf(html, pdfFile);
    ok(`PDF → ${show(pdfFile)}`);
  }
  if (!opts.includeCandidates && fs.existsSync(path.join(engDir, 'findings', 'scan-candidates.md'))) {
    step('findings/scan-candidates.md was left out (unchecked leads). Use --include-candidates to add it.');
  }
  return htmlFile;
}

export async function renderPdf(html, file) {
  const { launch } = await import('./browser.mjs');
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path: file,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate:
        '<div style="width:100%;font:9px -apple-system,Segoe UI,Arial,sans-serif;color:#667085;padding:0 14mm;display:flex;justify-content:space-between;"><span class="title"></span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
      margin: { top: '16mm', bottom: '18mm', left: '14mm', right: '14mm' },
    });
  } finally {
    await browser.close();
  }
}
