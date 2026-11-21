import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI, tempDir } from './helpers.mjs';
import { PLACEHOLDERS } from '../lib/newfinding.mjs';

const env = { ...process.env, NO_COLOR: '1' };
const oqa = (args, cwd) => spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8', env });

async function closedPort() {
  const s = net.createServer();
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  const { port } = s.address();
  await new Promise((r) => s.close(r));
  return port;
}

test('package.json: test script globs test files (Node 20-26) and engines is >=20', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.test, 'node --test test/*.test.mjs');
  assert.equal(pkg.engines.node, '>=20');
  assert.equal(fs.readFileSync(path.join(ROOT, '.nvmrc'), 'utf8').trim(), '20');
});

for (const cmd of ['recon', 'scan']) {
  test(`${cmd}: an unreachable start URL is an error with exit code 2`, async (t) => {
    const url = `http://127.0.0.1:${await closedPort()}/`;
    const out = tempDir(t);
    const r = oqa([cmd, url, '--out', out], out);
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.match(r.stdout + r.stderr, new RegExp(`could not load ${url.replace(/[.]/g, '\\.')}: \\S`));
    assert.ok(!/✓/.test(r.stdout), 'no success line');
  });
}

test('lint: a finding left as the new-finding template is an error naming each field', (t) => {
  const dir = tempDir(t);
  assert.equal(oqa(['new-finding', dir, 'CORE'], dir).status, 0);
  const r = oqa(['lint', dir], dir);
  assert.equal(r.status, 1, r.stdout);
  for (const field of ['title', 'Severity', 'Priority', 'Category', 'Where', 'What the user experiences', 'Steps to reproduce', 'Expected', 'Actual']) {
    assert.match(r.stdout, new RegExp(`QA-CORE-01\\s+${field} still has the template placeholder`), field);
  }
});

test('lint: real angle-bracket text (e.g. <img>) is not taken for a placeholder', async (t) => {
  const { lintEngagement } = await import('../lib/lint.mjs');
  const dir = tempDir(t);
  fs.mkdirSync(path.join(dir, 'findings'));
  fs.writeFileSync(
    path.join(dir, 'findings', 'pub.md'),
    `### QA-PUB-01 — Hero <img> has no alt
- **Severity:** Medium
- **Priority:** P3
- **Status:** Confirmed
- **Category:** Accessibility
- **Where:** http://x.test/ · desktop 1440 · Chromium
- **What the user experiences:** Screen readers say nothing for the <img>.
- **Steps to reproduce:**
  1. Open /.
- **Expected:** <img alt="...">
- **Actual:** <img src="hero.png">
- **Evidence:** console text only
`,
  );
  assert.deepEqual(lintEngagement(dir).errors, []);
  assert.ok(PLACEHOLDERS.length >= 8 && PLACEHOLDERS.every((p) => p.startsWith('<') && p.endsWith('>')), PLACEHOLDERS.join(' '));
});

test('doctor without node_modules prints the install command with the harness folder', (t) => {
  const dir = fs.realpathSync(tempDir(t));
  for (const d of ['bin', 'lib']) fs.cpSync(path.join(ROOT, d), path.join(dir, d), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(dir, 'package.json'));
  const r = spawnSync(process.execPath, [path.join(dir, 'bin', 'oqa.mjs'), 'doctor'], { cwd: tempDir(t), encoding: 'utf8', env });
  assert.equal(r.status, 1, r.stdout);
  assert.ok(r.stdout.includes(`npm install --prefix "${dir}"`), r.stdout);
  assert.ok(r.stdout.includes('npx playwright install chromium'), r.stdout);
});

test('doctor: Node 20 is the minimum (Playwright needs it)', async () => {
  const { MIN_NODE } = await import('../lib/doctor.mjs');
  assert.equal(MIN_NODE, 20);
});

test('--browser rejects an unknown engine with exit 2', (t) => {
  const out = tempDir(t);
  const r = oqa(['scan', 'http://127.0.0.1:1/', '--browser', 'opera', '--out', out], out);
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stdout, /--browser must be one of: chromium, firefox, webkit/);
});
