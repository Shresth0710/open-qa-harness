import fs from 'node:fs';
import path from 'node:path';
import { loadFindings, FIELDS, ENUMS, ID_RE, SEVERITIES, readTableAfter, readFirstTable } from './findings.mjs';
import { c, ok, bad, show } from './ui.mjs';
import { PLACEHOLDERS } from './newfinding.mjs';

// A placeholder counts even when half-edited: match its first two words ("<short title", "<what should").
const STEMS = PLACEHOLDERS.map((p) => {
  const words = p.split(' ');
  return words.length > 2 ? words.slice(0, 2).join(' ') : p;
});
const placeholderIn = (text) => {
  const i = STEMS.findIndex((st) => String(text || '').includes(st));
  return i === -1 ? null : PLACEHOLDERS[i];
};

export const lintHelp = `Usage: oqa lint <engagement-dir>

Check every finding in <engagement-dir>/findings/*.md (README.md is skipped).

Errors (exit code 1):
  missing field · empty "Steps to reproduce" · value not in the allowed list ·
  ID not shaped like QA-AREA-01 · the same ID twice · heading without " — " title ·
  a backticked evidence path that does not exist ·
  a title, field or step still holding a template placeholder from "oqa new-finding" (e.g. <short title ...>)

Warnings (exit code 0):
  a route in routes.md "All routes found" that coverage.md does not mention ·
  an Unconfirmed Critical · a finding with no screenshot`;

export function lintEngagement(engDir) {
  const errors = [];
  const warnings = [];
  if (!fs.existsSync(engDir)) {
    errors.push({ file: engDir, line: 0, id: '', message: 'engagement folder not found' });
    return { errors, warnings, findings: [] };
  }
  const { findings, problems, files } = loadFindings(engDir);
  for (const p of problems) errors.push(p);
  if (!files.length) warnings.push({ file: 'findings/', line: 0, id: '', message: 'no findings files yet' });

  const seen = new Map();
  for (const f of findings) {
    const at = (message, line = f.line) => errors.push({ file: f.file, line, id: f.id, message });
    if (!ID_RE.test(f.id)) at(`ID "${f.id}" does not match PREFIX-AREA-nn (e.g. QA-AUTH-01)`);
    if (seen.has(f.id)) at(`duplicate ID (also at ${seen.get(f.id)})`);
    else seen.set(f.id, `${f.file}:${f.line}`);
    if (placeholderIn(f.title)) at(`title still has the template placeholder ${placeholderIn(f.title)}`);

    for (const name of FIELDS) {
      const fld = f.fields[name];
      if (!fld) {
        at(`missing field "${name}"`);
        continue;
      }
      if (name === 'Steps to reproduce') {
        if (!f.steps.length) at('"Steps to reproduce" has no numbered steps', fld.line);
        const ph = f.steps.map(placeholderIn).find(Boolean);
        if (ph) at(`${name} still has the template placeholder ${ph}`, fld.line);
        continue;
      }
      if (!fld.value) {
        at(`field "${name}" is empty`, fld.line);
        continue;
      }
      if (placeholderIn(fld.value)) {
        at(`${name} still has the template placeholder ${placeholderIn(fld.value)}`, fld.line);
        continue;
      }
      if (ENUMS[name] && !ENUMS[name].includes(fld.value)) {
        at(`${name} "${fld.value}" is not one of: ${ENUMS[name].join(', ')}`, fld.line);
      }
    }
    for (const ev of f.evidence) {
      if (!fs.existsSync(path.join(engDir, ev))) at(`evidence file not found: ${ev}`, f.fields.Evidence?.line);
    }
    if (f.severity === 'Critical' && f.status === 'Unconfirmed') {
      warnings.push({ file: f.file, line: f.line, id: f.id, message: 'Critical but Unconfirmed: reproduce it again before reporting' });
    }
    if (f.fields.Evidence && !f.images.length) {
      warnings.push({ file: f.file, line: f.line, id: f.id, message: 'no screenshot in Evidence' });
    }
  }

  // coverage vs routes
  const routesFile = path.join(engDir, 'routes.md');
  const coverageFile = path.join(engDir, 'coverage.md');
  if (fs.existsSync(routesFile)) {
    const rows = readTableAfter(fs.readFileSync(routesFile, 'utf8'), /^##\s+All routes found/) || [];
    const routes = rows.map((r) => stripCode(r.Route || '')).filter(Boolean);
    const covText = fs.existsSync(coverageFile) ? fs.readFileSync(coverageFile, 'utf8') : '';
    const covRows = fs.existsSync(coverageFile) ? readFirstTable(covText) || [] : [];
    const covered = new Set();
    for (const r of covRows) {
      const cell = r['Route / feature'] ?? r.Route ?? '';
      for (const m of cell.split(/[·,]/)) covered.add(stripCode(m));
    }
    for (const r of routes) {
      if (!covered.has(r)) warnings.push({ file: 'coverage.md', line: 0, id: '', message: `route ${r} (from routes.md) is not in coverage.md` });
    }
  }
  return { errors, warnings, findings };
}

function stripCode(s) {
  return s.replace(/`/g, '').trim();
}

export function lintCommand(engDir) {
  const { errors, warnings, findings } = lintEngagement(engDir);
  const loc = (p) => `${p.file}${p.line ? `:${p.line}` : ''}`;
  const w = Math.max(10, ...[...errors, ...warnings].map((p) => loc(p).length));
  const iw = Math.max(0, ...[...errors, ...warnings].map((p) => p.id.length));
  for (const p of errors) console.log(`${c.red('error')}  ${loc(p).padEnd(w)}  ${p.id.padEnd(iw)}  ${p.message}`);
  for (const p of warnings) console.log(`${c.yellow('warn ')}  ${loc(p).padEnd(w)}  ${p.id.padEnd(iw)}  ${p.message}`);
  const counts = SEVERITIES.map((s) => `${s} ${findings.filter((f) => f.severity === s).length}`).join(' · ');
  console.log('');
  console.log(`${findings.length} finding(s) in ${show(engDir)}: ${counts}`);
  if (errors.length) {
    bad(`${errors.length} error(s), ${warnings.length} warning(s)`);
    return 1;
  }
  ok(`0 errors, ${warnings.length} warning(s)`);
  return 0;
}
