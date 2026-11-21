# Created items — demo-engagement

> Every record created during testing. All names start with `QA-TEST`. At the end, every row
> says **deleted = yes**, or gives the reason it could not be deleted and who can remove it.

| When | Area | Type | Name / ID | Deleted? | Note |
|---|---|---|---|---|---|
| 2026-11-21 | AUTH | account | `QA-TEST bad email` · `a@b` | yes | the demo keeps data in memory; removed when the demo server restarted |
| 2026-11-21 | AUTH | account | `QA-TEST short password` · `qa-test+shortpw@example.com` | yes | as above |
| 2026-11-21 | CORE | booking | AC-1041 · Life drawing · 2026-12-12 | yes | QA-CORE-02, first of the double booking (demo account) |
| 2026-11-21 | CORE | booking | AC-1042 · Life drawing · 2026-12-12 | yes | QA-CORE-02, the duplicate |
| 2026-11-21 | CORE | booking | AC-1043 · Darkroom photography · 2020-01-15 | yes | QA-CORE-03 |
| 2026-11-21 | AUTH | account | `QA-TEST verify` · `a@b` | yes | verification pass (after a restart); cleared by the next restart |
| 2026-11-21 | AUTH | account | `QA-TEST verify` · `qa-test+shortpw2@example.com` | yes | verification pass |
| 2026-11-21 | CORE | booking | AC-1041 … AC-1043 (second set) | yes | verification pass re-created the three bookings on the restarted demo |

The demo has no delete button for bookings or accounts. On a real system that is itself worth reporting, and the
owner would be asked to remove the rows; here a restart of `npm run demo` clears everything.
