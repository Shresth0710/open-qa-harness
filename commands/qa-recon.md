---
description: Map every route of the app and split them into testable areas
argument-hint: <engagement-name> [--auth auth/<role>.json]
---

Run recon for the engagement `engagements/$1` (method: `method/02-recon.md`; `oqa` =
`node <harness-root>/bin/oqa.mjs`, harness root = `${CLAUDE_PLUGIN_ROOT}` or the folder containing `bin/oqa.mjs`).

1. Read `engagements/$1/engagement.md` for the URL, mode and accounts.
2. `oqa recon <url> --out engagements/$1` (fresh visitor). If the engagement needs a login and no
   `auth/<role>.json` exists, ask the user to run `oqa login <url> --save auth/<role>.json` and sign in
   themselves; then re-run recon with `--auth`.
3. White-box mode: dispatch the `qa-code-reader` agent with the repo path; merge its route list.
4. Visit each bundle-only candidate route once; mark it real or dead in `routes.md`.
5. Write the "Areas" table (4–6 routes each, area codes like PUB/AUTH/CORE/ADMIN) and the app facts
   (auth provider, hostnames, where the session lives).
6. Report: route count by source, the areas, and any 4xx/5xx or console errors already seen.
