---
description: Independently re-run a sample of findings from their write-ups (every Critical/High + random, ≥8)
argument-hint: <engagement-name>
---

Verify the findings of `engagements/$1` (method: `method/09-verification.md`).

1. `oqa lint engagements/$1` must show 0 errors first (`oqa` = `node <harness-root>/bin/oqa.mjs`).
2. Pick the sample: every Critical and High, plus random others, at least 8 in total.
3. Dispatch the `qa-verifier` agent with ONLY the finding IDs and the engagement path. Do not
   pass your notes or opinions; it must work from the written finding alone.
4. Apply its results: findings that did not reproduce get fixed steps, extra conditions, or
   `Status: Unconfirmed`. Never delete a finding silently. Withdrawn findings stay, marked withdrawn.
5. Report: k/n reproduced and what changed.
