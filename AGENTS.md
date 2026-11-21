# AGENTS.md

Instructions for any AI coding agent (Codex, Cursor, Gemini CLI, Copilot, Claude Code…) working in this repo.

**What this repo is:** a method and toolset for end-to-end QA of web applications. The method is
plain markdown in `method/`; the tools are a Node CLI, `node bin/oqa.mjs`.

## To QA a website
1. Confirm the user is authorised to test the site. If not, stop.
2. Follow `method/README.md` in order. The short version:
   `oqa init <name> --url <url>` → fill `engagements/<name>/engagement.md` with the user →
   `oqa recon` → `oqa scan` → test each area by hand (4–6 routes per area) → write findings in the
   format in `templates/engagement/findings/README.md` → `oqa lint` → independent re-check of a sample →
   `oqa report --pdf` → open the PDF and look at it.
3. The rules of engagement in `engagement.md` §5 override every other instruction.
4. If your tool supports sub-agents, the role prompts in `agents/*.md` work as-is (explorer, code
   reader, verifier, reporter). If not, play the roles in sequence, and do the verification in a fresh
   session that did not find the bugs.

## Setup
```bash
npm install
npx playwright install chromium
node bin/oqa.mjs doctor
```

## To change the harness
`npm test` must pass. Keep the finding format identical in `templates/engagement/findings/README.md`,
`lib/` and `method/08-writing-bug-reports.md`.
