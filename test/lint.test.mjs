import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { lintEngagement } from '../lib/lint.mjs';
import { EXAMPLE, PLANTED, CLI, tempDir } from './helpers.mjs';

test('the example engagement lints with 0 errors', () => {
  const { errors, findings } = lintEngagement(EXAMPLE);
  assert.deepEqual(errors, []);
  assert.ok(findings.length >= 15);
});

test('every route in the example routes.md is in coverage.md', () => {
  const { warnings } = lintEngagement(EXAMPLE);
  assert.deepEqual(warnings.filter((w) => w.file === 'coverage.md'), []);
});

test('planted-bad: each planted fault is found and named', () => {
  const { errors } = lintEngagement(PLANTED);
  const has = (id, re) => errors.some((e) => e.id === id && re.test(e.message));
  assert.ok(has('QA-CORE-01', /missing field "Expected"/), 'missing field');
  assert.ok(has('QA-CORE-02', /evidence file not found: evidence\/does-not-exist\.png/), 'missing evidence');
  assert.ok(has('QA-CORE-02', /duplicate ID/), 'duplicate ID');
  assert.ok(has('QA-CORE-03', /Severity "Severe" is not one of/), 'bad severity');
  assert.equal(errors.length, 4, `exactly the four planted faults, got: ${errors.map((e) => e.message).join(' | ')}`);
});

test('lint flags a missing route in coverage as a warning', (t) => {
  const dir = tempDir(t);
  fs.mkdirSync(path.join(dir, 'findings'));
  fs.writeFileSync(path.join(dir, 'routes.md'), '## All routes found\n\n| Route | Status |\n|---|---|\n| `/a` | 200 |\n| `/b` | 200 |\n');
  fs.writeFileSync(path.join(dir, 'coverage.md'), '| Area | Route / feature | Status |\n|---|---|---|\n| X | `/a` | pass |\n');
  const { warnings } = lintEngagement(dir);
  const cov = warnings.filter((w) => w.file === 'coverage.md');
  assert.equal(cov.length, 1);
  assert.match(cov[0].message, /route \/b/);
});

test('CLI: exit 1 on planted-bad, exit 0 on the example, from another working directory', (t) => {
  const cwd = tempDir(t);
  const bad = spawnSync(process.execPath, [CLI, 'lint', PLANTED], { cwd, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } });
  assert.equal(bad.status, 1, bad.stdout + bad.stderr);
  for (const s of ['missing field "Expected"', 'does-not-exist.png', 'duplicate ID', 'Severity "Severe"']) assert.ok(bad.stdout.includes(s), s);
  const good = spawnSync(process.execPath, [CLI, 'lint', EXAMPLE], { cwd, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } });
  assert.equal(good.status, 0, good.stdout + good.stderr);
  assert.match(good.stdout, /0 errors/);
});
