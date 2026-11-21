---
description: Hands-on test one area of the app and write findings + coverage
argument-hint: <engagement-name> <AREA-CODE>
---

Dispatch the `qa-explorer` agent for area **$2** of `engagements/$1`, or do the work yourself in
that role if agents are not available.

Give it: the routes for $2 from `engagements/$1/routes.md`, the account to use, the path to
`engagements/$1/engagement.md` (rules of engagement), and a one-line charter
(`method/03-test-design.md`). If the area involves sending, creating or paying, quote the
`engagement.md` §5 line that allows it.

When it returns: run `oqa lint engagements/$1` (`oqa` = `node <harness-root>/bin/oqa.mjs`) and fix
any errors with the agent before accepting the area.
