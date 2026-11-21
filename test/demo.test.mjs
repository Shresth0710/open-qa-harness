import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoServer } from '../demo/server.mjs';

let base;
let server;
test.before(async () => {
  server = createDemoServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => new Promise((r) => server.close(r)));

test('home page is up', async () => {
  const res = await fetch(base + '/');
  assert.equal(res.status, 200);
  assert.match(await res.text(), /Acme Studio/);
});

test('seeded: /terms is a 404', async () => {
  assert.equal((await fetch(base + '/terms')).status, 404);
});

test('seeded: login form uses method="get"', async () => {
  const html = await (await fetch(base + '/login')).text();
  assert.match(html, /<form[^>]*method="get"[^>]*action="\/login"/);
});

test('seeded: 12 seats at $24 shows $48.00, 9 seats is right', async () => {
  const total = async (q) => (await (await fetch(`${base}/checkout?class=wheel&date=2026-12-05&qty=${q}`)).text()).match(/id="total">([^<]+)/)[1];
  assert.equal(await total(12), '$48.00');
  assert.equal(await total(9), '$216.00');
});

test('seeded: login cookie has no HttpOnly/SameSite', async () => {
  const res = await fetch(base + '/login?email=demo%40acme.test&password=demo1234', { redirect: 'manual' });
  assert.equal(res.status, 302);
  assert.match(res.headers.get('set-cookie'), /^session=[0-9a-f]+; Path=\/$/);
});

test('demo/server.mjs listens on 127.0.0.1 only by default (not the LAN)', async (t) => {
  const os = await import('node:os');
  const net = await import('node:net');
  const { spawn } = await import('node:child_process');
  const lan = Object.values(os.networkInterfaces()).flat().find((i) => i && i.family === 'IPv4' && !i.internal);
  if (!lan) return t.skip('no non-loopback IPv4 address on this machine');
  const probe = net.createServer();
  await new Promise((r) => probe.listen(0, '127.0.0.1', r));
  const port = probe.address().port;
  await new Promise((r) => probe.close(r));
  const { fileURLToPath } = await import('node:url');
  const child = spawn(process.execPath, [fileURLToPath(new URL('../demo/server.mjs', import.meta.url))], { env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'inherit'] });
  t.after(() => child.kill());
  const line = await new Promise((r) => {
    child.stdout.once('data', (d) => r(String(d)));
    child.once('exit', (code) => r(`server exited ${code}`));
  });
  assert.match(line, new RegExp(`http://localhost:${port}`));
  assert.equal((await fetch(`http://127.0.0.1:${port}/`)).status, 200);
  const lanOk = await fetch(`http://${lan.address}:${port}/`, { signal: AbortSignal.timeout(3000) }).then(() => true, () => false);
  assert.equal(lanOk, false, `reachable on ${lan.address}`);
});
