import fs from 'node:fs';
import { c, ok, bad } from './ui.mjs';

export const doctorHelp = `Usage: oqa doctor

Check that this machine can run the harness: Node version, Playwright, axe-core,
and a Chromium that actually launches. Prints the fix for anything missing.`;

export async function doctor() {
  let failed = 0;
  const fail = (msg, fix) => {
    failed++;
    bad(`${msg}\n    fix: ${c.bold(fix)}`);
  };

  const major = Number(process.versions.node.split('.')[0]);
  if (major >= 18) ok(`Node ${process.versions.node}`);
  else fail(`Node ${process.versions.node} is too old (need 18 or newer)`, 'install Node 20 from https://nodejs.org or run: nvm install 20');

  let pw = null;
  try {
    pw = await import('playwright');
    ok('Playwright is installed');
  } catch {
    fail('Playwright is not installed', 'npm install');
  }
  try {
    await import('@axe-core/playwright');
    ok('axe-core is installed');
  } catch {
    fail('@axe-core/playwright is not installed', 'npm install');
  }

  if (pw) {
    const exe = pw.chromium.executablePath();
    if (!exe || !fs.existsSync(exe)) {
      fail('Chromium for Playwright is not downloaded', 'npm run setup   (or: npx playwright install chromium)');
    } else {
      try {
        const b = await pw.chromium.launch({ headless: true });
        const v = b.version();
        await b.close();
        ok(`Chromium ${v} launches`);
      } catch (err) {
        const linux = process.platform === 'linux';
        fail(`Chromium is downloaded but does not start: ${err.message.split('\n')[0]}`, linux ? 'npx playwright install --with-deps chromium' : 'npm run setup');
      }
    }
  }

  console.log('');
  if (failed) {
    bad(`${failed} problem(s). Fix them and run oqa doctor again.`);
    return 1;
  }
  ok('Ready.');
  console.log(`\nNext: ${c.bold('npm run demo')} in one terminal, then in another:\n      ${c.bold('node bin/oqa.mjs init my-first --url http://localhost:4173')}`);
  return 0;
}
