import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { init } from '../lib/init.mjs';
import { CLI, tempDir, quiet } from './helpers.mjs';

const EXPECTED = ['engagement.md', 'routes.md', 'coverage.md', 'verification.md', 'created-items.md', 'sends.md', 'findings', 'evidence', 'report'];

test('init --root creates the engagement from the template', (t) => {
  quiet(t);
  const root = tempDir(t);
  const dest = init('acme', { root, url: 'http://localhost:4173', mode: 'white-box' });
  assert.equal(dest, path.join(root, 'engagements', 'acme'));
  for (const f of EXPECTED) assert.ok(fs.existsSync(path.join(dest, f)), f);
  const eng = fs.readFileSync(path.join(dest, 'engagement.md'), 'utf8');
  assert.match(eng, /http:\/\/localhost:4173/);
  assert.match(eng, /- \*\*Mode:\*\* white-box/);
  assert.ok(!eng.includes('{{'), 'no template placeholders left');
  assert.throws(() => init('acme', { root }), /already exists/);
  assert.throws(() => init('../escape', { root }), /may only use/);
});

test('CLI from another working directory: init defaults to cwd, then lint and report work', (t) => {
  const cwd = tempDir(t);
  const run = (...args) => spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } });
  const i = run('init', 'shop', '--url', 'http://localhost:4173');
  assert.equal(i.status, 0, i.stdout + i.stderr);
  const dest = path.join(cwd, 'engagements', 'shop');
  assert.ok(fs.existsSync(path.join(dest, 'engagement.md')));
  const l = run('lint', 'engagements/shop');
  assert.equal(l.status, 0, l.stdout + l.stderr);
  const r = run('report', 'engagements/shop');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(fs.existsSync(path.join(dest, 'report', 'report.html')));
  const h = run('--help');
  assert.equal(h.status, 0);
});
