# 06 · Evidence

Every finding cites files in `evidence/`. Rules:

1. **The first file shows the bug.** The report displays the first evidence file, so if the bug is
   a wrong total, the first screenshot shows the wrong total, not the page before you clicked.
   Twelve screenshots of the journey are fine, as long as the right one comes first.
2. **Make the problem findable.** Crop to the relevant area or outline the element. A full-page
   screenshot of a 4000 px page with a 10 px bug in it shows the page, not the bug.
3. **Capture the invisible part too.** Console errors and failed network requests go in a `.txt`
   next to the screenshot (`auth-03-console.txt`), quoted exactly.
4. **Name files after the finding.** `core-07-total-wrong-qty10.png`, not `screenshot-2.png`. Names are
   how a second tester re-finds them.
5. **Desktop and mobile** for layout bugs; state which in **Where**.
6. **Never capture secrets.** Passwords, tokens, API keys and other people's personal data are
   blurred or cropped *before* the file is saved in the engagement. Redact by **whole token** and
   check the result. Find-and-replace on short strings corrupts paths and numbers elsewhere.
7. **Traces for flaky or timing bugs.** A Playwright trace (`trace.zip`) lets the developer replay
   the exact run.

## Playwright snippets

```js
// outline the offending element, then screenshot just that region
const el = page.getByRole('row', { name: /Total/ });
await el.evaluate(n => { n.style.outline = '3px solid #e11'; n.style.outlineOffset = '2px'; });
await el.screenshot({ path: 'evidence/core-07-total-wrong-qty10.png' });

// keep the console and failed requests
page.on('console', m => m.type() === 'error' && errors.push(m.text()));
page.on('requestfailed', r => failed.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`));
page.on('response', r => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));
```
