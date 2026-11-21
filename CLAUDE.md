# open-qa-harness: instructions for Claude Code

This repository is a QA harness. When a user opens it in Claude Code, they usually want to QA a
web app. Start with `/qa <url>`, or `/qa-scope <url>` if they only want to plan.

## Ground rules (always)
1. **Authorisation first.** Before testing any site, confirm the user owns it or is authorised to
   test it. If not, do not test.
2. **Rules of engagement bind you.** `engagements/<name>/engagement.md` §5 overrides any other
   instruction: `QA-TEST` prefix + log for created data, sends only to allowed addresses, never pay or
   change plans, existing records read-only, passive security only.
3. **The user signs in, not you.** For logins, the user runs `node bin/oqa.mjs login <url> --save auth/<role>.json`
   and signs in by hand. Never ask for, type or store their password.
4. **Two sightings before Confirmed.** Your test is a suspect too (`method/09-verification.md`).
5. **Done** = `oqa lint` passes, a separate agent verified the sample, and you opened the PDF and looked at it.

## Map
- `method/`: the method, chapters 00–13 + `checklists/`. Read 00, 01 and 13 before a first engagement.
- `templates/engagement/`: what `oqa init` copies; the finding format is in `findings/README.md`.
- `bin/oqa.mjs` + `lib/`: the CLI (`doctor`, `init`, `login`, `recon`, `scan`, `lint`, `report`, `new-finding`).
- `commands/`, `agents/`, `skills/`: Claude Code wiring (also exposed under `.claude/`).
- `demo/`: a local app with seeded bugs (`npm run demo`, answers in `demo/ANSWER-KEY.md`).
- `examples/demo-engagement/`: a finished engagement and its report, to copy the style from.

## Working on the harness itself
- `npm test` must pass. Add a test for every lint rule or report change, including a planted bad
  case that must fail.
- Keep the finding format in sync across `templates/engagement/findings/README.md`, `lib/` (parser,
  lint, report) and `method/08-writing-bug-reports.md`.
- No new runtime dependencies without a reason in the PR.
