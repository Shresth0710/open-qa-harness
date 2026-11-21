import fs from 'node:fs';
import { c, ok, bad, warn } from './ui.mjs';
import { HARNESS_ROOT, INSTALL_DEPS, installBrowser, BROWSER_LABEL } from './browser.mjs';

// Playwright 1.5x declares "node": ">=20"; keep this in step with package.json "engines".
export const MIN_NODE = 20;

export const doctorHelp = `Usage: oqa doctor

Check that this machine can run the harness: Node version, Playwright, axe-core,
a Chromium that actually launches (required), and whether Firefox and WebKit are
installed (optional, for --browser firefox|webkit). Prints the exact fix for anything missing.`;

export async function doctor() {
  let failed = 0;
  const fail = (msg, ...fixes) => {
    failed++;
    bad(`${msg}\n${fixes.map((f) => `    fix: ${c.bold(f)}`).join('\n')}`);
  };

  const major = Number(process.versions.node.split('.')[0]);
  if (major >= MIN_NODE) ok(`Node ${process.versions.node}`);
  else fail(`Node ${process.versions.node} is too old: Playwright needs Node ${MIN_NODE} or newer`, `install Node ${MIN_NODE} or newer from https://nodejs.org (or: nvm install ${MIN_NODE})`);

  let pw = null;
  try {
    pw = await import('playwright');
    ok('Playwright is installed');
  } catch {
    fail(`Playwright is not installed in ${HARNESS_ROOT}`, INSTALL_DEPS, installBrowser('chromium'));
  }
  try {
    await import('@axe-core/playwright');
    ok('axe-core is installed');
  } catch {
    if (pw) fail(`@axe-core/playwright is not installed in ${HARNESS_ROOT}`, INSTALL_DEPS);
  }

  if (pw) {
    const exe = pw.chromium.executablePath();
    if (!exe || !fs.existsSync(exe)) {
      fail('Chromium for Playwright is not downloaded', installBrowser('chromium'));
    } else {
      try {
        const b = await pw.chromium.launch({ headless: true });
        const v = b.version();
        await b.close();
        ok(`Chromium ${v} launches`);
      } catch (err) {
        const linux = process.platform === 'linux';
        fail(`Chromium is downloaded but does not start: ${err.message.split('\n')[0]}`, linux ? `cd "${HARNESS_ROOT}" && npx playwright install --with-deps chromium` : installBrowser('chromium'));
      }
    }
    for (const name of ['firefox', 'webkit']) {
      const p = pw[name].executablePath();
      if (p && fs.existsSync(p)) ok(`${BROWSER_LABEL[name]} is installed (optional; use --browser ${name})`);
      else warn(`${BROWSER_LABEL[name]} is not installed (optional, for --browser ${name}): ${installBrowser(name)}`);
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
