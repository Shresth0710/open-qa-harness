import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadFindings } from '../lib/findings.mjs';
import { EXAMPLE, CLI, tempDir } from './helpers.mjs';

const env = { ...process.env, NO_COLOR: '1' };
const findings = loadFindings(EXAMPLE, { includeCandidates: false }).findings;

// RFC 4180 reader, independent of the writer under test.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let f = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') (f += '"'), i++;
      else if (ch === '"') q = false;
      else f += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') row.push(f), (f = '');
    else if (ch === '\r' && text[i + 1] === '\n') {
      row.push(f), rows.push(row), (row = []), (f = ''), i++;
    } else f += ch;
  }
  if (f || row.length) row.push(f), rows.push(row);
  return rows;
}

test('export --format csv: one row per finding, parses back, from another cwd', (t) => {
  const cwd = tempDir(t);
  const file = path.join(cwd, 'out.csv');
  const r = spawnSync(process.execPath, [CLI, 'export', EXAMPLE, '--format', 'csv', '--out', file], { cwd, encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const rows = parseCsv(fs.readFileSync(file, 'utf8'));
  assert.deepEqual(rows[0], ['ID', 'Title', 'Severity', 'Priority', 'Status', 'Category', 'Where', 'User impact', 'Steps', 'Expected', 'Actual', 'Evidence']);
  assert.equal(rows.length - 1, 15);
  assert.equal(findings.length, 15);
  for (const f of findings) {
    const row = rows.find((x) => x[0] === f.id);
    assert.ok(row, f.id);
    assert.equal(row.length, 12, f.id);
    assert.equal(row[1], f.title);
    assert.equal(row[2], f.severity);
    assert.equal(row[8], f.steps.join(' / '));
  }
});

test('export --format github: one issue body per finding plus a script the user runs', (t) => {
  const cwd = tempDir(t);
  const dir = path.join(cwd, 'issues');
  const r = spawnSync(process.execPath, [CLI, 'export', EXAMPLE, '--format', 'github', '--out', dir], { cwd, encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const bodies = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  assert.equal(bodies.length, 15);
  const sh = fs.readFileSync(path.join(dir, 'create-issues.sh'), 'utf8');
  const gh = sh.split('\n').filter((l) => /^gh issue create /.test(l));
  assert.equal(gh.length, 15);
  for (const f of findings) {
    const line = gh.find((l) => l.includes(`[${f.id}]`));
    assert.ok(line, f.id);
    assert.ok(line.includes(`severity:${f.severity.toLowerCase()}`), line);
    assert.match(line, /--body-file /);
  }
  assert.equal(spawnSync('bash', ['-n', path.join(dir, 'create-issues.sh')]).status, 0, 'script parses');
  const body = fs.readFileSync(path.join(dir, bodies[0]), 'utf8');
  assert.match(body, /Steps to reproduce/);
  assert.match(body, /Expected/);
});

test('export: unknown format is a usage error', (t) => {
  const cwd = tempDir(t);
  const r = spawnSync(process.execPath, [CLI, 'export', EXAMPLE, '--format', 'xml'], { cwd, encoding: 'utf8', env });
  assert.equal(r.status, 2, r.stdout);
  assert.match(r.stdout, /--format must be one of: csv, github/);
});
