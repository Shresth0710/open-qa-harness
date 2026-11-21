// npm run try — the whole automated half of the method on the demo app, in about a minute:
// start the demo, create an engagement, sign in with the demo account, recon and scan as that
// signed-in user, and build a report of the scan candidates.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDemoServer } from './server.mjs';
import { launch } from '../lib/browser.mjs';

// Sign in through the demo's own login form, as a person would, and keep the session for --auth.
// (On a real site you sign in by hand with "oqa login"; this demo account is public.)
async function signIn(url, file) {
  console.log(`\n$ sign in to the demo as demo@acme.test (saved to ${file})`);
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${url}/login`);
    await page.fill('input[name="email"]', 'demo@acme.test');
    await page.fill('input[name="password"]', 'demo1234');
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login')), page.click('form[action="/login"] button[type="submit"]')]);
    await page.context().storageState({ path: path.join(root, file) });
  } finally {
    await browser.close();
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const oqa = path.join(root, 'bin', 'oqa.mjs');

function run(args) {
  return new Promise((resolve, reject) => {
    console.log(`\n$ oqa ${args.join(' ')}`);
    const p = spawn(process.execPath, [oqa, ...args], { cwd: root, stdio: 'inherit' });
    p.on('exit', code => (code === 0 ? resolve() : reject(new Error(`oqa ${args[0]} exited ${code}`))));
  });
}

const server = createDemoServer();
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://localhost:${server.address().port}`;
const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
const name = `try-${stamp}`;
const dir = path.join('engagements', name);
console.log(`Demo app (planted bugs) running on ${url}`);

try {
  await run(['doctor']);
  await run(['init', name, '--url', url]);
  const auth = path.join(dir, 'auth-demo.json');
  await signIn(url, auth);
  await run(['recon', url, '--out', dir, '--max-pages', '20', '--auth', auth]);
  await run(['scan', '--from', path.join(dir, 'recon.json'), '--out', dir, '--auth', auth]);
  await run(['report', dir, '--pdf', '--include-candidates', '--title', 'Automated pass — demo app']);
  const html = path.join(root, dir, 'report', 'report.html');
  console.log(`
Done. What you have now:
  ${path.join(dir, 'routes.md')}                     every route found
  ${path.join(dir, 'findings', 'scan-candidates.md')}   automated candidates (unconfirmed leads)
  ${path.join(dir, 'report', 'report.pdf')}          a report of those candidates

That is the automated half. The hands-on half (the bugs no scanner finds) is in method/04,
and examples/demo-engagement/ shows the finished result: 15 verified findings and the full report.
Compare what the scan found with demo/ANSWER-KEY.md.`);
  if (!process.env.CI && existsSync(html)) {
    const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
    spawn(opener, [html], { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
  }
} catch (err) {
  console.error(`\n✗ ${err.message}. Run "node bin/oqa.mjs doctor" for the fix.`);
  process.exitCode = 1;
} finally {
  server.close();
}
