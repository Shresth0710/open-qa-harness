import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('demo server starts when run through a symlinked path', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oqa-link-'));
  const link = path.join(dir, 'demo-link');
  fs.symlinkSync(path.join(root, 'demo'), link);
  const port = String(4900 + Math.floor(Math.random() * 90));
  const child = spawn(process.execPath, [path.join(link, 'server.mjs')], { env: { ...process.env, PORT: port } });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  const started = await new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), 3000);
    child.stdout.on('data', () => { if (out.includes(`:${port}`)) { clearTimeout(t); resolve(true); } });
    child.on('exit', () => { clearTimeout(t); resolve(false); });
  });
  child.kill();
  fs.rmSync(dir, { recursive: true, force: true });
  assert.ok(started, 'server exited without listening when started through a symlink');
});
