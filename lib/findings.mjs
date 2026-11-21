import fs from 'node:fs';
import path from 'node:path';

export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
export const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];
export const STATUSES = ['Confirmed', 'Unconfirmed'];
export const CATEGORIES = ['Functional', 'UX', 'Content', 'Accessibility', 'Performance', 'Security', 'Compatibility'];

export const FIELDS = [
  'Severity',
  'Priority',
  'Status',
  'Category',
  'Where',
  'What the user experiences',
  'Steps to reproduce',
  'Expected',
  'Actual',
  'Evidence',
];

export const ENUMS = {
  Severity: SEVERITIES,
  Priority: PRIORITIES,
  Status: STATUSES,
  Category: CATEGORIES,
};

export const ID_RE = /^[A-Z0-9]+-[A-Z0-9]+-\d{2,}$/;
const IMAGE_RE = /\.(png|jpe?g|gif|webp)$/i;
const FIELD_RE = /^- \*\*([^*]+?):\*\*\s?(.*)$/;
const STEP_RE = /^\s+(\d+)\.\s+(.*)$/;

// Parse one findings markdown file. Returns { findings, problems } where problems are
// structural issues found while reading (e.g. a heading with no title).
export function parseFindings(text, file = '') {
  const lines = text.split(/\r?\n/);
  const findings = [];
  const problems = [];
  let cur = null;
  let field = null;
  let inFence = false;

  const close = () => {
    if (cur) findings.push(cur);
    cur = null;
    field = null;
  };

  lines.forEach((raw, i) => {
    const lineNo = i + 1;
    if (/^\s*```/.test(raw)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    if (/^#{1,3}\s/.test(raw)) {
      close();
      const m = raw.match(/^###\s+(.*)$/);
      if (!m) return;
      const heading = m[1].trim();
      const sep = heading.indexOf(' — ');
      let id;
      let title;
      if (sep === -1) {
        id = heading.split(/\s+/)[0];
        title = '';
        problems.push({ file, line: lineNo, id, message: 'heading has no " — " title separator' });
      } else {
        id = heading.slice(0, sep).trim();
        title = heading.slice(sep + 3).trim();
      }
      cur = { id, title, file, line: lineNo, fields: {}, steps: [], evidence: [] };
      return;
    }
    if (!cur) return;

    const fm = raw.match(FIELD_RE);
    if (fm) {
      const name = fm[1].trim();
      field = name;
      cur.fields[name] = { value: fm[2].trim(), line: lineNo };
      return;
    }
    if (!field) return;

    if (field === 'Steps to reproduce') {
      const sm = raw.match(STEP_RE);
      if (sm) {
        cur.steps.push(sm[2].trim());
        return;
      }
      if (/^\s{3,}\S/.test(raw) && cur.steps.length) {
        cur.steps[cur.steps.length - 1] += ' ' + raw.trim();
        return;
      }
    }
    // indented continuation of the current field
    if (/^\s+\S/.test(raw)) {
      const f = cur.fields[field];
      f.value = f.value ? `${f.value} ${raw.trim()}` : raw.trim();
      return;
    }
    if (raw.trim() === '') return;
    field = null;
  });
  close();

  for (const f of findings) {
    const ev = f.fields.Evidence?.value || '';
    f.evidence = [...ev.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim()).filter(looksLikePath);
    f.images = f.evidence.filter((p) => IMAGE_RE.test(p));
    for (const k of FIELDS) f[key(k)] = f.fields[k]?.value ?? '';
  }
  return { findings, problems };
}

function key(name) {
  return {
    Severity: 'severity',
    Priority: 'priority',
    Status: 'status',
    Category: 'category',
    Where: 'where',
    'What the user experiences': 'experience',
    'Steps to reproduce': 'stepsText',
    Expected: 'expected',
    Actual: 'actual',
    Evidence: 'evidenceText',
  }[name];
}

function looksLikePath(s) {
  return /[\\/]/.test(s) || /\.[a-z0-9]{2,5}$/i.test(s);
}

export function isImage(p) {
  return IMAGE_RE.test(p);
}

// Read every findings file in an engagement. README.md is always skipped.
export function loadFindings(engDir, { includeCandidates = true } = {}) {
  const dir = path.join(engDir, 'findings');
  if (!fs.existsSync(dir)) return { files: [], findings: [], problems: [] };
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md')
    .filter((f) => includeCandidates || f !== 'scan-candidates.md')
    .sort();
  const findings = [];
  const problems = [];
  for (const f of files) {
    const rel = path.join('findings', f);
    const r = parseFindings(fs.readFileSync(path.join(dir, f), 'utf8'), rel);
    findings.push(...r.findings);
    problems.push(...r.problems);
  }
  return { files, findings, problems };
}

export function sortFindings(list) {
  const sev = (s) => (SEVERITIES.indexOf(s) === -1 ? 9 : SEVERITIES.indexOf(s));
  const pri = (p) => (PRIORITIES.indexOf(p) === -1 ? 9 : PRIORITIES.indexOf(p));
  return [...list].sort(
    (a, b) => sev(a.severity) - sev(b.severity) || pri(a.priority) - pri(b.priority) || a.id.localeCompare(b.id, 'en', { numeric: true }),
  );
}

// Parse a markdown pipe table that follows a given heading. Returns array of row objects.
export function readTableAfter(text, headingRe) {
  const lines = text.split(/\r?\n/);
  let i = lines.findIndex((l) => headingRe.test(l));
  if (i === -1) return null;
  i++;
  while (i < lines.length && !lines[i].trim().startsWith('|')) {
    if (/^#{1,6}\s/.test(lines[i])) return [];
    i++;
  }
  return tableFrom(lines, i);
}

export function readFirstTable(text) {
  const lines = text.split(/\r?\n/);
  const i = lines.findIndex((l) => l.trim().startsWith('|'));
  if (i === -1) return null;
  return tableFrom(lines, i);
}

function tableFrom(lines, i) {
  const rows = [];
  let header = null;
  for (; i < lines.length && lines[i].trim().startsWith('|'); i++) {
    const cells = splitRow(lines[i]);
    if (!header) {
      header = cells;
      continue;
    }
    if (cells.every((x) => /^:?-{2,}:?$/.test(x))) continue;
    const row = {};
    header.forEach((h, j) => (row[h] = cells[j] ?? ''));
    rows.push(row);
  }
  return rows;
}

function splitRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((x) => x.trim());
}
