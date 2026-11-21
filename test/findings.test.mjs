import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFindings, sortFindings, readTableAfter, ID_RE, FIELDS } from '../lib/findings.mjs';

const SAMPLE = `# Findings

### QA-AUTH-01 — Password is sent in the URL
- **Severity:** High
- **Priority:** P1
- **Status:** Confirmed
- **Category:** Security
- **Where:** http://localhost:4173/login · desktop 1280 · Chromium
- **What the user experiences:** The password ends up in history.
- **Steps to reproduce:**
  1. Open /login.
  2. Log in
     with the demo account.
- **Expected:** POST.
- **Actual:** GET with the password
  in the query string.
- **Evidence:** \`evidence/auth-01.png\`, \`evidence/auth-01.txt\`, raw detail in scan.json

\`\`\`markdown
### QA-FAKE-01 — inside a code fence, ignored
\`\`\`

### QA-PUB-02 — Low thing
- **Severity:** Low
`;

test('parses every field, steps and evidence of a finding', () => {
  const { findings, problems } = parseFindings(SAMPLE, 'findings/x.md');
  assert.equal(problems.length, 0);
  assert.equal(findings.length, 2, 'the fenced example is not a finding');
  const [f] = findings;
  assert.equal(f.id, 'QA-AUTH-01');
  assert.equal(f.title, 'Password is sent in the URL');
  assert.equal(f.severity, 'High');
  assert.equal(f.priority, 'P1');
  assert.equal(f.category, 'Security');
  assert.deepEqual(f.steps, ['Open /login.', 'Log in with the demo account.']);
  assert.equal(f.actual, 'GET with the password in the query string.');
  assert.deepEqual(f.evidence, ['evidence/auth-01.png', 'evidence/auth-01.txt']);
  assert.deepEqual(f.images, ['evidence/auth-01.png']);
  for (const name of FIELDS) assert.ok(f.fields[name], `field ${name} parsed`);
});

test('a heading without the " — " separator is reported as a problem', () => {
  const { problems } = parseFindings('### QA-AUTH-09 no separator\n- **Severity:** Low\n');
  assert.equal(problems.length, 1);
  assert.match(problems[0].message, /separator/);
});

test('ID shape', () => {
  for (const ok of ['QA-AUTH-01', 'ACME-CORE-12', 'QA-PUB-100']) assert.ok(ID_RE.test(ok), ok);
  for (const bad of ['QA-AUTH-1', 'qa-auth-01', 'AUTH-01', 'QA-AUTH-01a']) assert.ok(!ID_RE.test(bad), bad);
});

test('sorts by severity, then priority, then ID (numeric)', () => {
  const list = [
    { id: 'QA-A-10', severity: 'Low', priority: 'P4' },
    { id: 'QA-A-02', severity: 'Critical', priority: 'P2' },
    { id: 'QA-A-01', severity: 'Critical', priority: 'P1' },
    { id: 'QA-A-09', severity: 'Low', priority: 'P4' },
  ];
  assert.deepEqual(sortFindings(list).map((f) => f.id), ['QA-A-01', 'QA-A-02', 'QA-A-09', 'QA-A-10']);
});

test('reads the table under a heading', () => {
  const md = '# R\n\n## All routes found\n<!-- x -->\n\n| Route | Status |\n|---|---|\n| `/` | 200 |\n| `/a\\|b` | 404 |\n\n## Next\n';
  const rows = readTableAfter(md, /^##\s+All routes found/);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].Route, '`/`');
  assert.equal(rows[1].Status, '404');
});
