import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { launch } from './browser.mjs';
import { c, ok, warn, info, show } from './ui.mjs';

export const loginHelp = `Usage: oqa login <url> [--save <file>]

Open a real (headed) Chromium window at <url>. You sign in by hand; nothing you type is
read by this tool. Press Enter in this terminal when you are signed in, and the session
(cookies + local storage) is saved to <file> (default auth/state.json).

Use it with --auth <file> on recon and scan. The file is a live session: anyone who has
it is signed in as you. auth/ and *.storage.json are git-ignored; keep it that way.`;

export async function login(url, opts = {}) {
  const file = path.resolve(opts.save || path.join('auth', 'state.json'));
  if (!process.stdin.isTTY) warn('stdin is not a terminal; press Enter (or close stdin) when signed in.');
  const browser = await launch({ headless: false });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    const page = await ctx.newPage();
    await page.goto(url);
    info(`A browser window is open at ${c.bold(url)}. Sign in there by hand.`);
    await waitForEnter(`Press ${c.bold('Enter')} here when you are signed in... `);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await ctx.storageState({ path: file });
    fs.chmodSync(file, 0o600);
    ok(`Session saved to ${show(file)}`);
    warn(`This file is a live login. Do not commit or share it. Delete it when the engagement ends.`);
    console.log(`\nNext: ${c.bold(`oqa recon ${url} --auth ${show(file)}`)}`);
  } finally {
    await browser.close();
  }
}

function waitForEnter(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, () => {
      rl.close();
      resolve();
    });
    rl.on('close', resolve);
  });
}
