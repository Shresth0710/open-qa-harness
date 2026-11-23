# 04 · Black-box execution: QA with only a URL

**Output:** `findings/<area>.md`, `coverage.md`, `evidence/`, `created-items.md`, `sends.md`.

No code, no spec, no developer to ask, often just a URL and a login. This is the most common
situation in real life, and black-box QA done properly finds the kinds of problems users actually run into, because it
uses the product the way they do.

## The loop, per area

```
for each area (4–6 routes):
  1. identity check     → who am I signed in as? screenshot it
  2. automated pass     → oqa scan on the area's routes (candidates only)
  3. charter session    → hands-on, desktop then mobile
  4. write as you go    → a finding the moment you confirm a bug
  5. coverage row       → for every route, before moving on
  6. clean up           → delete QA-TEST items, update created-items.md
```

### 1. Identity check
Before any action that writes, look at the account menu and screenshot it. If the app shows a
different account than `engagement.md` lists, **stop**. Testing as the wrong identity can create
data, send messages or change billing on someone else's account.

### 2. Automated pass first, as a starting point
`oqa scan` runs accessibility (axe-core), security headers, cookie flags, broken links, console
errors, lab performance and mobile overflow on each page. It writes **candidates** to
`findings/scan-candidates.md`. They are a starting point. Each one needs a human to confirm it, judge
the real user impact and write the plain-words line before it moves into an area file. Automated
accessibility checks catch only part of WCAG; see the [accessibility checklist](checklists/accessibility.md).

### 3. Hands-on session
Follow the charter ([03](03-test-design.md)). Typical order for a feature:
1. **Happy path** as a new user would do it. Does the main thing work at all?
2. **Validation**: every field, its boundaries, its invalid classes.
3. **State**: refresh, back, two tabs, double-click, expire the session.
4. **Roles**: the same screen as each role.
5. **Mobile** at 390 px: same flow, then tap targets, keyboard covering inputs, overflow.
6. **Side effects**: did the list, count, email, export and dashboard all update?

Keep the browser's DevTools console and network panel open (or use `oqa scan`'s capture). Many real
bugs show up there before they show on screen: a 500 behind a "Saved!" toast, or a silent 401.

### 4. Write findings as you go
Write the finding the moment the bug reproduces a second time, while the steps are still fresh.
Use `oqa new-finding engagements/<name> AUTH` to get the next free ID and a blank block. Writing
everything at the end produces vague steps and the wrong screenshots.

### 5. Coverage before moving on
For every route in the area, a row in `coverage.md`: pass / bugs (IDs) / blocked (why) / not
tested (why). An honest "blocked: payment provider not connected in staging" helps the reader more than
a silent gap.

### 6. Clean up
Delete everything prefixed `QA-TEST`. Mark each row in `created-items.md`. If something cannot be
deleted from the UI, that is often itself a finding ("records cannot be deleted"). Note who can
remove it.

## Driving the browser

You can do all of this by hand. Playwright makes it repeatable and gives you screenshots and traces
for free.

| Need | How |
|---|---|
| Fresh visitor | a new browser context (no cookies), which is what `oqa recon`/`oqa scan` use |
| Signed-in session | `oqa login <url> --save auth/owner.json` once, the owner signs in by hand, then `--auth auth/owner.json` |
| The owner's own logged-in browser | Start Chrome with `--remote-debugging-port=9222` on a **copy** of the profile, then `chromium.connectOverCDP('http://127.0.0.1:9222')` ([docs](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp)) |
| Robust element lookup | `page.getByRole('button', { name: 'Book' })` over CSS classes ([locators](https://playwright.dev/docs/locators)) |
| Reproducible evidence | `context.tracing.start({ screenshots: true, snapshots: true })` → open in the [trace viewer](https://playwright.dev/docs/trace-viewer) |

> Never put a password in a script or a finding. `auth/*.json` files are live sessions. They are
> git-ignored, and you should delete them when the engagement ends.

## Browsers and devices

Test on what the audience uses, not on what you have. If the owner has analytics, take the top
browsers and devices from there. If not, a sensible default is:
- **Chromium** (Chrome, Edge) desktop and mobile emulation for the full pass;
- **WebKit** (the engine behind Safari, and behind most iPhone browsers; since iOS 17.4 Apple lets
  browsers in the EU use other engines, [Apple](https://developer.apple.com/support/alternative-browser-engines/)) for the critical journeys;
- **Firefox** for the critical journeys if the audience is technical or European.

`oqa recon` and `oqa scan` take `--browser chromium|firefox|webkit`
(`npx playwright install firefox webkit` first). Emulation catches layout and engine bugs. Touch,
the on-screen keyboard and real performance need one real phone. Record the browser and version
in **Where** for every finding, because "works in Chrome, broken in Safari" is a common real bug.
Checklist: [compatibility](checklists/compatibility-and-browsers.md).

## Things black-box testing reliably finds that teams miss
- Hostname splits (`www` vs bare, `app` vs marketing site) breaking sessions or links.
- Validation in the UI but not the API (or the reverse): the form blocks `0`, but pasting it works.
- Success messages shown on failure (check the network response, not the toast).
- Lists and counters that do not update until reload.
- Records that cannot be deleted, exports that omit fields, emails with broken links.
- Mobile: horizontal scroll, fixed headers covering inputs, tap targets under 24 px.
- Copy leaking internals: `undefined`, enum names, stack traces, "TODO".
