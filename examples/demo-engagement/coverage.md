# Coverage — demo-engagement

> Every route and feature in `routes.md` appears here exactly once with a status.
> A route that is missing from this table was not tested — the report must say so.
> Status values: **pass** · **bugs** (list IDs) · **blocked** (say why) · **not tested** (say why)
> Mobile ✓ here means the page was opened at 390×844 and checked for sideways scrolling and cut-off content.

| Area | Route / feature | Desktop | Mobile | Status | Findings / reason |
|---|---|---|---|---|---|
| PUB | `/` | ✓ | ✓ | bugs | QA-PUB-04 (hero image alt), QA-PUB-05 (header search button, every page) |
| PUB | `/pricing` | ✓ | ✓ | bugs | QA-PUB-02 (mobile overflow), QA-PUB-03 (fine-print contrast) |
| PUB | `/about` | ✓ | ✓ | pass | contact link is `mailto:hello@example.com`; fits 390 px |
| PUB | `/terms` | ✓ | ✓ | bugs | QA-PUB-01 (404, linked from every footer) |
| AUTH | `/signup` | ✓ | ✓ | bugs | QA-AUTH-02 (accepts `a@b`), QA-AUTH-03 (1-character password) |
| AUTH | `/login` | ✓ | ✓ | bugs | QA-AUTH-01 (password in URL), QA-AUTH-04 (cookie flags); wrong password shows "That email and password do not match." (pass) |
| AUTH | `/logout` | ✓ | – | pass | not crawled (looks destructive); opened on purpose at the end of the session: back to `/`, cookie gone, /dashboard then shows "You are signed out" |
| AUTH | `/dashboard/` (trailing slash) | ✓ | – | bugs | QA-AUTH-05 |
| CORE | `/book` | ✓ | ✓ | bugs | QA-CORE-03 (past dates), QA-CORE-04 (negative seats) |
| CORE | `/book?class=darkroom` · `/book?class=drawing` · `/book?class=wheel` | ✓ | – | pass | each pre-selects its class: Darkroom photography · $30.00, Life drawing · $18.00, Pottery wheel basics · $24.00 |
| CORE | `/checkout` | ✓ | ✓ | bugs | QA-CORE-01 (total wrong at 10+ seats), QA-CORE-02 (double booking) |
| CORE | `/api/bookings` | ✓ | – | bugs | exercised through the Book button only (no direct API calls in black-box mode); same root as QA-CORE-01..04 |
| CORE | `/dashboard` | ✓ | ✓ | bugs | QA-CORE-05 (console TypeError); signed-out view correct |
| (candidate) | `/account/settings` | ✓ | – | pass | string in app.js only, not found by the crawl; visited: 404. Dead route, not filed |
| (candidate) | `/gift-cards` | ✓ | – | pass | string in app.js only; visited: 404. The footer "Gift cards" link points to /pricing, which has no gift cards; noted for the owner, not filed |
| — | security headers (all pages) | – | – | not tested | left as scan candidates QA-SCAN-09..13; not reproduced by hand in this session |
