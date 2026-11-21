import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { normalise, routeOf } from '../lib/browser.mjs';
import { extractHashRoutes, usesHashRouting } from '../lib/recon.mjs';
import { CLI, tempDir, chromiumLaunches } from './helpers.mjs';

test('normalise keeps hash-router fragments (#/ and #!/) and drops plain anchors', () => {
  assert.equal(routeOf(normalise('#/active', 'https://x.test/todo/')), '/todo/#/active');
  assert.equal(routeOf(normalise('#!/done', 'https://x.test/')), '/#!/done');
  assert.equal(routeOf(normalise('#main', 'https://x.test/a')), '/a');
  assert.equal(normalise('/b#top', 'https://x.test/').href, 'https://x.test/b');
});

test('bundle reading: hash routes and hash-router signals', () => {
  assert.deepEqual(extractHashRoutes('a="#/active";b=\'#/completed\';c="#/"'), ['#/active', '#/completed']);
  assert.equal(usesHashRouting('window.addEventListener("hashchange", f)'), true);
  assert.equal(usesHashRouting('fetch("/api/items")'), false);
});

// Two tiny sites: a hash-routed SPA under /todo/ (no links in the DOM, like TodoMVC with no items),
// and a plain site under /base/ whose bundle names one real route and one dead string.
function fixtureServer() {
  const html = (script) => `<!doctype html><html lang="en"><head><title>Fixture</title></head><body><main id="v">home</main><script src="${script}"></script></body></html>`;
  return http.createServer((req, res) => {
    const send = (code, type, body) => {
      res.writeHead(code, { 'content-type': type });
      res.end(body);
    };
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/todo/') return send(200, 'text/html', html('app.js'));
    if (u.pathname === '/todo/app.js')
      return send(200, 'text/javascript', `var r={"/active":1,"/completed":1};function show(){document.getElementById('v').textContent=location.hash||'all'}window.addEventListener('hashchange',show);show();`);
    if (u.pathname === '/base/') return send(200, 'text/html', html('main.js'));
    if (u.pathname === '/base/main.js') return send(200, 'text/javascript', `var a="/reports", b="/ghost-page";`);
    if (u.pathname === '/base/reports') return send(200, 'text/html', html('main.js'));
    return send(404, 'text/html', 'not found');
  });
}

function runCli(args) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [CLI, ...args], { env: { ...process.env, NO_COLOR: '1' } });
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (out += d));
    p.on('exit', (code) => resolve({ code, out }));
  });
}

test('recon on a hash-routed SPA visits #/ routes; bundle paths are resolved against the start path', async (t) => {
  if (!(await chromiumLaunches())) return t.skip('Chromium not installed (npm run setup)');
  const server = fixtureServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;

  const a = tempDir(t);
  const r1 = await runCli(['recon', `${base}/todo/`, '--out', a, '--no-shots', '--max-pages', '5']);
  assert.equal(r1.code, 0, r1.out);
  const j1 = JSON.parse(fs.readFileSync(path.join(a, 'recon.json'), 'utf8'));
  const visited = j1.routes.filter((r) => r.visited).map((r) => r.route);
  assert.ok(visited.includes('/todo/#/active'), visited.join(' '));
  assert.ok(visited.includes('/todo/#/completed'), visited.join(' '));
  assert.ok(!j1.routes.some((r) => r.route === '/active' || r.route === '/completed'), 'no origin-root guesses for a hash router');

  const b = tempDir(t);
  const r2 = await runCli(['recon', `${base}/base/`, '--out', b, '--no-shots', '--max-pages', '5']);
  assert.equal(r2.code, 0, r2.out);
  const j2 = JSON.parse(fs.readFileSync(path.join(b, 'recon.json'), 'utf8'));
  const by = Object.fromEntries(j2.routes.map((r) => [r.route, r]));
  assert.ok(by['/base/reports'], `base-relative candidate missing: ${Object.keys(by).join(' ')}`);
  assert.equal(by['/base/reports'].note, 'candidate (bundle) – answers 200, not linked');
  const ghost = j2.routes.find((r) => r.route.endsWith('/ghost-page'));
  assert.ok(ghost, 'dead bundle string listed');
  assert.equal(ghost.note, 'candidate (bundle) – 404, probably not a real route');
  const md = fs.readFileSync(path.join(b, 'routes.md'), 'utf8');
  assert.match(md, /ghost-page` \| bundle \| candidate \(bundle\) – 404, probably not a real route/);
});
