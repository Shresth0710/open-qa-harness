# Verification — demo-engagement

> A second person (or a fresh agent that did not find the bugs) re-runs the steps of a sample of
> findings against the live app, **using only what is written in the finding**.
> Sample: every Critical and High, plus random others, at least 8 in total.
> Method: [method/09-verification.md](../../method/09-verification.md)

Re-run as a separate pass after restarting the demo (fresh data, booking numbers start at AC-1041 again), following
the written steps only. The pass was scripted, so it also recorded the exact values below.

| Finding ID | Re-run on (date, build) | Reproduced? | Notes (what differed) |
|---|---|---|---|
| QA-CORE-01 | 2026-11-21, demo restarted | yes | 12 seats → $48.00. Extra boundary values: 9 → $216.00 (right), 10 → $0.00 |
| QA-CORE-02 | 2026-11-21, demo restarted | yes | double-click → AC-1041 and AC-1042, both Life drawing · 2026-12-12 · 1 · $18.00 |
| QA-AUTH-01 | 2026-11-21, demo restarted | yes | request `/login?email=demo%40acme.test&password=demo1234` |
| QA-PUB-01 | 2026-11-21, demo restarted | yes | /terms answers 404 |
| QA-PUB-02 | 2026-11-21, demo restarted | yes | /pricing scrollWidth 864 at clientWidth 390; every other public page fits (390/390) |
| QA-AUTH-02 | 2026-11-21, demo restarted | yes | `a@b` signed in on /dashboard |
| QA-AUTH-03 | 2026-11-21, demo restarted | yes | password `x` signed in on /dashboard |
| QA-AUTH-04 | 2026-11-21, demo restarted | yes | `document.cookie` returns `session=<id>` |
| QA-AUTH-05 | 2026-11-21, demo restarted | yes | /dashboard/ → "You are signed out"; /dashboard straight after → "Welcome back, Demo" |
| QA-CORE-03 | 2026-11-21, demo restarted | yes | 2020-01-15 booked as AC-1043 |
| QA-CORE-04 | 2026-11-21, demo restarted | yes | -2 seats → -$48.00, Book button enabled |
| QA-CORE-05 | 2026-11-21, demo restarted | yes | TypeError "Cannot read properties of undefined (reading 'reminders')" on load |

**Result:** 12/12 reproduced (every Critical and High, plus 9 others). Mismatches: none.
Not re-run: QA-PUB-03, QA-PUB-04, QA-PUB-05 (each is also reported by the automated axe scan in `scan.json`).
