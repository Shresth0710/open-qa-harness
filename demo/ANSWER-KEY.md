# Answer key — Acme Studio demo app

Spoilers. Try `/qa http://localhost:4173` (or the method by hand) **before** you read this.

The demo app (`npm run demo`, http://localhost:4173, log in as `demo@acme.test` / `demo1234`) has these bugs planted on
purpose. The finished engagement that finds them is in
[`examples/demo-engagement/`](../examples/demo-engagement/); its report is `examples/demo-engagement/report/report.pdf`.

"Found by" names the automated check that surfaces it. Candidate numbers (`QA-SCAN-..`) depend on the run, so match a
candidate by its title, not its number. **manual only** means no automated check flags it: a person (or an agent
following `method/04-black-box-execution.md`) has to try it. That column is the point of the demo: about half of the bugs
that matter are invisible to scanners.

`npm run try` signs in as the demo user before it runs recon and scan, so it finds every automated row below: the
signed-in rows (QA-AUTH-04, QA-CORE-05) only show up with a session. Running `oqa scan` yourself without `--auth` finds
the other six.

| ID in the example | Route | The bug | How it was found | Found by |
|---|---|---|---|---|
| QA-PUB-01 | `/terms` | Footer "Terms" link (on every page) goes to a 404 | Following every link; recon lists `/terms` as 404 | `oqa recon` (status 404), `oqa scan`: broken link, "Link to /terms is broken (404)" |
| QA-PUB-02 | `/pricing` | Price table makes the page 864 px wide on a 390 px phone | Mobile pass at 390×844 | `oqa scan`: mobile overflow, "/pricing scrolls sideways on a 390px phone" |
| QA-PUB-03 | `/pricing` | Refund and cancellation fine print is very light grey (`#b9bcc4`) | Reading the page; axe | `oqa scan`: axe `color-contrast` |
| QA-PUB-04 | `/` | Hero image has no `alt` attribute | axe | `oqa scan`: axe `image-alt` |
| QA-PUB-05 | every page | Header search button is an icon with no accessible name | axe; keyboard pass | `oqa scan`: axe `button-name` |
| QA-AUTH-01 | `/login` | Login form uses `method="get"`: the password goes into the URL | Network log while logging in | `oqa scan`: password form sent with GET |
| QA-AUTH-02 | `/signup` | Any email containing "@" is accepted (`a@b`) | Boundary values on the email field | manual only |
| QA-AUTH-03 | `/signup` | One-character password accepted although the form says "At least 8 characters" | Boundary values on the password field | manual only |
| QA-AUTH-04 | `/login` | Session cookie set as `session=<id>; Path=/`: no HttpOnly, no SameSite, no Secure | Reading the raw `Set-Cookie` header | `oqa scan` (signed in): cookie flags, `Cookie "session" is missing HttpOnly`. **Missing SameSite is manual only**: Chromium reports an unset SameSite as `Lax` in its cookie store, so a scan that reads cookies from the browser cannot see it. Read the raw header. |
| QA-AUTH-05 | `/dashboard/` | The trailing-slash address is routed to the signed-out view: a signed-in user sees "You are signed out". The session itself is fine; `/dashboard` without the slash still works | Trying URL variants of a signed-in page | manual only |
| QA-CORE-01 | `/checkout` | Total uses only the last digit of the seat count: 12 seats × $24.00 shows **$48.00** (should be $288.00); 10 seats shows $0.00; 1–9 are right | Boundary values on quantity | manual only |
| QA-CORE-02 | `/checkout` | "Book" is not disabled while the request runs (about 0.4 s) and the server does not deduplicate: a double-click makes two bookings | Double-clicking the submit button | manual only |
| QA-CORE-03 | `/book`, `/checkout` | Dates in the past are accepted (2020-01-15 booked) | Boundary values on the date | manual only |
| QA-CORE-04 | `/book`, `/checkout` | Negative seats accepted: -2 seats shows -$48.00 and can be booked | Boundary values on quantity | manual only |
| QA-CORE-05 | `/dashboard` | Script error on every load: `Cannot read properties of undefined (reading 'reminders')` | Console watch | `oqa recon` (console error count), `oqa scan` (signed in): console error on /dashboard |
| (not filed) | every page | No security headers (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options) | Response headers | `oqa scan`: security headers, five candidates; left unfiled in the example |

## Things that look like bugs but are not
- `/account/settings` and `/gift-cards` appear in `static/app.js` and recon lists them as **bundle candidates**. Both
  answer 404 and nothing links to them: dead strings. Recon probes every bundle string with a GET and labels these
  "candidate (bundle) – 404, probably not a real route".
- `/api/bookings` gets the same 404 label. It is real, but only for `POST` (the checkout form calls it); a GET probe
  cannot tell an endpoint like this from a dead string, which is why bundle routes stay candidates.
- `/checkout` is labelled "candidate (bundle) – answers 200, not linked": it is real and reached from `/book`'s form,
  not from a link.
- `/logout` is not crawled by recon on purpose (it looks destructive). It works.

## Totals
15 findings in the example: 1 Critical, 2 High, 10 Medium, 2 Low. 7 of the 15 are manual only. Plus 5 header
candidates left unfiled.
