---
description: Start a QA engagement — ask the scoping questions and write engagement.md (no testing yet)
argument-hint: <url> [notes]
---

Scope a QA engagement for: $ARGUMENTS

Read `method/01-scoping-and-rules.md` (harness root = `${CLAUDE_PLUGIN_ROOT}` if installed as a plugin,
else the folder containing `bin/oqa.mjs`; `oqa` = `node <harness-root>/bin/oqa.mjs`).

1. Open the URL once in a fresh browser (or `oqa recon <url> --max-pages 5 --no-shots`) to learn what
   the product is.
2. Ask the user ONE batched message, max 5 questions, each with a default:
   authorisation · goal + report reader · environment (prod/staging) · accounts/roles and who signs in ·
   what may be created/sent/paid · code repo available?
3. `oqa init <name> --url <url> --mode <mode>` and fill every section of
   `engagements/<name>/engagement.md` from the answers, including the critical journeys (§6).
4. Show the user the filled rules of engagement (§5) and the critical journeys, and stop.
   Next step for them: `/qa-recon <name>`.
