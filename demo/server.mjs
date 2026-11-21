// Acme Studio Booking: a small fictional app with deliberately seeded bugs.
// See demo/ANSWER-KEY.md. Do not fix the bugs; the examples depend on them.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const STATIC = path.join(here, 'static');

const CLASSES = [
  { id: 'wheel', name: 'Pottery wheel basics', price: 24, length: '2 hours' },
  { id: 'drawing', name: 'Life drawing', price: 18, length: '90 minutes' },
  { id: 'darkroom', name: 'Darkroom photography', price: 30, length: '3 hours' },
];

export function createDemoServer() {
  const users = new Map([['demo@acme.test', { name: 'Demo', password: 'demo1234' }]]);
  const sessions = new Map();
  const bookings = new Map();
  let nextRef = 1041;

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;
    const email = sessions.get(readCookies(req).session) || null;
    const user = email ? { email, ...users.get(email) } : null;

    try {
      if (p.startsWith('/static/')) return serveStatic(res, p);
      if (p === '/robots.txt') return send(res, 200, `User-agent: *\nDisallow: /dashboard\nSitemap: ${origin(req)}/sitemap.xml\n`, 'text/plain');
      if (p === '/sitemap.xml') return send(res, 200, sitemap(req), 'application/xml');
      if (p === '/favicon.ico') return serveStatic(res, '/static/logo.svg');

      if (p === '/') return page(res, user, 'Book a class', home());
      if (p === '/pricing') return page(res, user, 'Pricing', pricing());
      if (p === '/about') return page(res, user, 'About us', about());
      if (p === '/book') return page(res, user, 'Book a class', book(url));
      if (p === '/checkout') return page(res, user, 'Checkout', checkout(url, user));

      if (p === '/login') {
        // Seeded bug: the form uses GET, so the password ends up in the URL.
        const e = url.searchParams.get('email');
        const pw = url.searchParams.get('password');
        if (e !== null || pw !== null) {
          const u = users.get((e || '').trim().toLowerCase());
          if (u && u.password === pw) return startSession(res, sessions, e.trim().toLowerCase());
          return page(res, user, 'Log in', login('That email and password do not match.'), 401);
        }
        return page(res, user, 'Log in', login());
      }

      if (p === '/signup') {
        if (req.method === 'POST') {
          const f = new URLSearchParams(await body(req));
          const e = (f.get('email') || '').trim().toLowerCase();
          const pw = f.get('password') || '';
          const name = (f.get('name') || '').trim() || 'Friend';
          // Seeded bug: only checks for "@" and a non-empty password.
          if (!e.includes('@') || pw.length < 1) return page(res, user, 'Sign up', signup('Please enter an email and a password.', f), 400);
          if (users.has(e)) return page(res, user, 'Sign up', signup('That email already has an account. Log in instead.', f), 409);
          users.set(e, { name, password: pw });
          return startSession(res, sessions, e);
        }
        return page(res, user, 'Sign up', signup());
      }

      if (p === '/dashboard') return page(res, user, 'Your bookings', dashboard(user, bookings.get(email) || [], url));
      // Seeded bug: the trailing-slash route never reads the session.
      if (p === '/dashboard/') return page(res, null, 'Your bookings', dashboard(null, [], url));

      if (p === '/logout') {
        sessions.delete(readCookies(req).session);
        res.writeHead(302, { Location: '/', 'Set-Cookie': 'session=; Path=/; Max-Age=0' });
        return res.end();
      }

      if (p === '/api/bookings' && req.method === 'POST') {
        if (!user) return send(res, 401, JSON.stringify({ error: 'Log in first' }), 'application/json');
        const data = JSON.parse((await body(req)) || '{}');
        await new Promise((r) => setTimeout(r, 400));
        const cls = CLASSES.find((c) => c.id === data.class) || CLASSES[0];
        const qty = Number(data.qty);
        const list = bookings.get(email) || [];
        const ref = 'AC-' + nextRef++;
        list.push({ ref, cls: cls.name, date: data.date, qty, total: lineTotal(cls.price, qty) });
        bookings.set(email, list);
        return send(res, 201, JSON.stringify({ ok: true, ref }), 'application/json');
      }

      return page(res, user, 'Page not found', notFound(p), 404);
    } catch (err) {
      return send(res, 500, 'Something went wrong', 'text/plain');
    }
  });
  return server;
}

// Seeded bug: only the last digit of the quantity is used.
function lineTotal(price, qty) {
  return price * Number(String(qty).slice(-1)) * (Number(qty) < 0 ? -1 : 1);
}

function startSession(res, sessions, email) {
  const id = crypto.randomBytes(12).toString('hex');
  sessions.set(id, email);
  // Seeded bug: no HttpOnly, no SameSite, no Secure.
  res.writeHead(302, { Location: '/dashboard', 'Set-Cookie': `session=${id}; Path=/` });
  res.end();
}

function readCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

function body(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 1e5) req.destroy();
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function origin(req) {
  return `http://${req.headers.host || 'localhost'}`;
}

function send(res, status, text, type) {
  res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8` });
  res.end(text);
}

function serveStatic(res, p) {
  const file = path.join(STATIC, path.normalize(p.replace(/^\/static\//, '')).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(STATIC) || !fs.existsSync(file)) return send(res, 404, 'Not found', 'text/plain');
  const type = { '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  fs.createReadStream(file).pipe(res);
}

function sitemap(req) {
  const o = origin(req);
  const urls = ['/', '/pricing', '/about', '/book', '/signup', '/login'];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${o}${u}</loc></url>`)
    .join('\n')}\n</urlset>\n`;
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const money = (n) => (n < 0 ? '-$' : '$') + Math.abs(n).toFixed(2);

function page(res, user, title, main, status = 200) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Acme Studio</title>
<link rel="icon" href="/static/logo.svg">
<link rel="stylesheet" href="/static/style.css">
<script src="/static/app.js" defer></script>
</head>
<body>
<header class="top">
  <div class="wrap top-in">
    <a class="brand" href="/"><img src="/static/logo.svg" alt="" width="28" height="28"><span>Acme Studio</span></a>
    <nav class="nav" aria-label="Main">
      <a href="/book">Classes</a>
      <a href="/pricing">Pricing</a>
      <a href="/about">About</a>
    </nav>
    <div class="nav-right">
      <button class="icon-btn" type="button" id="search-btn"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      ${user ? `<a class="btn ghost" href="/dashboard">My bookings</a><a class="link-quiet" href="/logout">Log out</a>` : `<a class="link-quiet" href="/login">Log in</a><a class="btn" href="/signup">Sign up</a>`}
    </div>
  </div>
</header>
<main id="main" class="wrap">
${main}
</main>
<footer class="foot">
  <div class="wrap foot-in">
    <p>© 2026 Acme Studio · 14 Example Street · A fictional demo app with planted bugs</p>
    <nav aria-label="Footer"><a href="/about">Contact</a><a href="/terms">Terms</a><a href="/pricing">Gift cards</a></nav>
  </div>
</footer>
</body>
</html>`;
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function home() {
  return `<section class="hero">
  <div class="hero-text">
    <p class="eyebrow">Small classes · Real studio · Evenings and weekends</p>
    <h1>Make something with your hands this week.</h1>
    <p class="lede">Pottery, life drawing and darkroom classes for beginners. Book a seat in under a minute.</p>
    <p class="cta"><a class="btn big" href="/book">Book a class</a> <a class="btn ghost big" href="/pricing">See pricing</a></p>
  </div>
  <img class="hero-img" src="/static/studio.svg" width="460" height="340">
</section>
<section class="cards">
${CLASSES.map(
  (c) => `  <article class="card">
    <h2>${esc(c.name)}</h2>
    <p class="muted">${esc(c.length)} · up to 8 people</p>
    <p class="price">${money(c.price)} <span>per seat</span></p>
    <a href="/book?class=${c.id}">Book this class →</a>
  </article>`,
).join('\n')}
</section>`;
}

function pricing() {
  return `<h1>Pricing</h1>
<p class="lede">Pay per class, or save with a pass. Every price includes materials and firing.</p>
<table class="price-table">
  <thead><tr><th scope="col">Class</th><th scope="col">Length</th><th scope="col">Single seat</th><th scope="col">5-class pass</th><th scope="col">10-class pass</th><th scope="col">Materials</th></tr></thead>
  <tbody>
${CLASSES.map(
  (c) =>
    `    <tr><td>${esc(c.name)}</td><td>${esc(c.length)}</td><td>${money(c.price)}</td><td>${money(c.price * 5 * 0.9)}</td><td>${money(c.price * 10 * 0.8)}</td><td>Included</td></tr>`,
).join('\n')}
  </tbody>
</table>
<p class="fine-print">Passes are valid for 6 months from the date of purchase and cannot be refunded once a class has been booked. Cancellations made less than 24 hours before a class are charged in full.</p>`;
}

function about() {
  return `<h1>About Acme Studio</h1>
<div class="prose">
<p>Acme Studio is a shared workshop with six wheels, a kiln, a north-light drawing room and a small darkroom. We run classes for complete beginners most evenings and all weekend.</p>
<p>Every class has at most eight people, so the teacher gets to everyone. You leave with something you made.</p>
<h2>Contact</h2>
<p>Email <a href="mailto:hello@example.com">hello@example.com</a>. We reply within a working day.</p>
</div>`;
}

function login(error) {
  return `<div class="auth">
<h1>Log in</h1>
${error ? `<p class="alert" role="alert">${esc(error)}</p>` : ''}
<form class="form" method="get" action="/login">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="email" required>
  <label for="password">Password</label>
  <input id="password" name="password" type="password" autocomplete="current-password" required>
  <button class="btn big" type="submit">Log in</button>
</form>
<p class="muted">Demo account: demo@acme.test / demo1234</p>
<p>New here? <a href="/signup">Create an account</a></p>
</div>`;
}

function signup(error, f) {
  const v = (k) => esc(f?.get(k) || '');
  return `<div class="auth">
<h1>Create your account</h1>
${error ? `<p class="alert" role="alert">${esc(error)}</p>` : ''}
<form class="form" method="post" action="/signup" novalidate>
  <label for="name">Your name</label>
  <input id="name" name="name" autocomplete="name" value="${v('name')}">
  <label for="email">Email</label>
  <input id="email" name="email" type="text" autocomplete="email" value="${v('email')}">
  <label for="password">Password</label>
  <input id="password" name="password" type="password" autocomplete="new-password">
  <p class="hint">At least 8 characters.</p>
  <button class="btn big" type="submit">Create account</button>
</form>
<p>Already have an account? <a href="/login">Log in</a></p>
</div>`;
}

function book(url) {
  const sel = url.searchParams.get('class') || 'wheel';
  return `<h1>Book a class</h1>
<p class="lede">Pick a class, a date and how many seats you need.</p>
<form class="form book-form" method="get" action="/checkout">
  <label for="class">Class</label>
  <select id="class" name="class">
${CLASSES.map((c) => `    <option value="${c.id}"${c.id === sel ? ' selected' : ''}>${esc(c.name)} · ${money(c.price)}</option>`).join('\n')}
  </select>
  <label for="date">Date</label>
  <input id="date" name="date" type="date" required>
  <label for="qty">Seats</label>
  <input id="qty" name="qty" type="number" value="1" required>
  <button class="btn big" type="submit">Continue to checkout</button>
</form>`;
}

function checkout(url, user) {
  const cls = CLASSES.find((c) => c.id === url.searchParams.get('class')) || CLASSES[0];
  const date = url.searchParams.get('date') || '';
  const qty = Number(url.searchParams.get('qty') || 1);
  const total = lineTotal(cls.price, qty);
  return `<h1>Checkout</h1>
<div class="summary">
  <dl>
    <dt>Class</dt><dd>${esc(cls.name)}</dd>
    <dt>Date</dt><dd>${esc(date || 'not chosen')}</dd>
    <dt>Seats</dt><dd>${esc(qty)}</dd>
    <dt>Price per seat</dt><dd>${money(cls.price)}</dd>
    <dt class="total">Total</dt><dd class="total" id="total">${money(total)}</dd>
  </dl>
  ${
    user
      ? `<button class="btn big" id="book-btn" type="button" data-class="${cls.id}" data-date="${esc(date)}" data-qty="${esc(qty)}">Book</button>
  <p class="muted" id="book-status" aria-live="polite"></p>`
      : `<p><a class="btn big" href="/login">Log in to book</a></p>`
  }
</div>`;
}

function dashboard(user, list, url) {
  if (!user) {
    return `<div class="auth"><h1>You are signed out</h1><p>Log in to see your bookings.</p><p><a class="btn big" href="/login">Log in</a></p></div>`;
  }
  const rows = list
    .map((b) => `<tr><td>${esc(b.ref)}</td><td>${esc(b.cls)}</td><td>${esc(b.date)}</td><td>${esc(b.qty)}</td><td>${money(b.total)}</td></tr>`)
    .join('\n');
  return `<h1>Welcome back, ${esc(user.name)}</h1>
${url.searchParams.get('booked') ? '<p class="notice" role="status">Your booking is confirmed.</p>' : ''}
<p class="muted" id="prefs"></p>
<h2>Your bookings</h2>
${
  list.length
    ? `<table class="data"><thead><tr><th scope="col">Ref</th><th scope="col">Class</th><th scope="col">Date</th><th scope="col">Seats</th><th scope="col">Total</th></tr></thead><tbody>${rows}</tbody></table>`
    : '<p class="empty">No bookings yet. <a href="/book">Book a class</a></p>'
}
<script>
  window.__USER__ = ${JSON.stringify({ name: user.name, email: user.email })};
  document.getElementById('prefs').textContent = 'Reminders: ' + window.__USER__.preferences.reminders;
</script>`;
}

function notFound(p) {
  return `<div class="auth"><h1>Page not found</h1><p>We could not find <code>${esc(p)}</code>.</p><p><a href="/">Back to the home page</a></p></div>`;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const port = Number(process.env.PORT || 4173);
  // Loopback only: this app is insecure on purpose, so it is not offered to the network. HOST=0.0.0.0 to override.
  const host = process.env.HOST || '127.0.0.1';
  createDemoServer().listen(port, host, () => {
    console.log(`Acme Studio Booking (demo app with planted bugs) on http://localhost:${port}`);
    console.log('Demo login: demo@acme.test / demo1234 · Bugs are listed in demo/ANSWER-KEY.md');
  });
}
