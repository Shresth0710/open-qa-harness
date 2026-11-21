import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createDemoServer } from '../demo/server.mjs';
import { CLI, tempDir } from './helpers.mjs';

async function firefoxInstalled() {
  try {
    const { firefox } = await import('playwright');
    return fs.existsSync(firefox.executablePath());
  } catch {
    return false;
  }
}

test('scan --browser firefox runs on the demo and labels findings Firefox', async (t) => {
  if (!(await firefoxInstalled())) return t.skip('Firefox for Playwright is not installed (optional: npx playwright install firefox)');
  const server = createDemoServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(() => server.close());
  const url = `http://127.0.0.1:${server.address().port}/pricing`;
  const out = tempDir(t);
  const code = await new Promise((resolve) => {
    const p = spawn(process.execPath, [CLI, 'scan', url, '--browser', 'firefox', '--out', out], { env: { ...process.env, NO_COLOR: '1' }, stdio: 'ignore' });
    p.on('exit', resolve);
  });
  assert.equal(code, 0);
  const raw = JSON.parse(fs.readFileSync(path.join(out, 'scan.json'), 'utf8'));
  assert.equal(raw.browser, 'firefox');
  assert.ok(raw.candidates.length > 0);
  const md = fs.readFileSync(path.join(out, 'findings', 'scan-candidates.md'), 'utf8');
  assert.match(md, /· Firefox/);
  assert.doesNotMatch(md, /Chromium/);
});
