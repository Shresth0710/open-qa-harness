import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const EXAMPLE = path.join(ROOT, 'examples', 'demo-engagement');
export const PLANTED = path.join(ROOT, 'test', 'fixtures', 'planted-bad');
export const CLI = path.join(ROOT, 'bin', 'oqa.mjs');

export function tempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oqa-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

// Silence the CLI helpers' console output inside a test.
export function quiet(t) {
  const log = console.log;
  console.log = () => {};
  t.after(() => (console.log = log));
}

export async function chromiumLaunches() {
  try {
    const { chromium } = await import('playwright');
    const b = await chromium.launch();
    await b.close();
    return true;
  } catch {
    return false;
  }
}
