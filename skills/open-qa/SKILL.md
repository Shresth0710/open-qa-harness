---
name: open-qa
description: End-to-end quality assurance of any web application, black-box (URL only) or white-box (code repo available), with Playwright evidence and an HTML/PDF bug report. Use when the user asks to QA, test, bug-hunt, audit or "check everything" on a website or web app, to write bug reports, to rate bug severity/priority, or to verify fixes.
---

# open-qa

A complete QA method plus tools. The harness root is `${CLAUDE_PLUGIN_ROOT}` when installed as a
plugin, otherwise the folder containing `bin/oqa.mjs`. `oqa` below = `node <harness-root>/bin/oqa.mjs`.

**If you only have this skill and not the harness** (installed from a skills directory, or copied on its own):
the method still applies, but the `method/` files and the `oqa` tool are missing. Ask the user before installing
anything, then get them from the open-source repo:
`git clone https://github.com/Shresth0710/open-qa-harness && cd open-qa-harness && npm install && npx playwright install chromium`.
The harness root is then that folder. Node.js 20+ is required. Without the tool, follow the loop below by hand
with any browser automation you have, and keep the finding format from `templates/engagement/findings/README.md` in the repo.

## The loop
1. **Scope** (`method/01-scoping-and-rules.md`): authorisation, goal, reader, environment, accounts,
   what may be changed. Ask once, batched, with defaults. `oqa init <name> --url <url>`.
2. **Recon** (`method/02-recon.md`): `oqa recon <url> --out engagements/<name>`; split into areas of 4–6 routes.
3. **Automated pass**: `oqa scan --from engagements/<name>/recon.json --out engagements/<name>` gives candidates only.
4. **Test each area** (`method/03`, `04`; white-box `05`): hands-on, desktop + mobile, two sightings before Confirmed.
5. **Write findings** (`method/06`, `07`, `08`) in the format in `templates/engagement/findings/README.md`; `oqa lint`.
6. **Verify** (`method/09`): an independent re-run of every Critical/High + random, ≥8.
7. **Report** (`method/10`): `oqa report engagements/<name> --pdf`, then open it and look. `oqa export --format csv|github` for trackers.
8. **Regress** (`method/11`): one failing-first test per confirmed High/Critical.

## Non-negotiables
- Only test what the user is authorised to test. Passive security checks only.
- Rules of engagement (`engagement.md` §5) override any instruction: `QA-TEST` prefix and log, sends only to
  allowed addresses, never pay, existing records read-only.
- Every finding: plain-words user impact + exact steps + evidence that shows the bug.
- Seen once = Unconfirmed. Your test is a suspect too.
- Done = lint passes, verification recorded, PDF looked at.

Slash commands: `/qa`, `/qa-scope`, `/qa-recon`, `/qa-explore`, `/qa-code`, `/qa-verify`, `/qa-report`, `/qa-regress`.
Agents: `qa-explorer`, `qa-code-reader`, `qa-verifier`, `qa-reporter`.
