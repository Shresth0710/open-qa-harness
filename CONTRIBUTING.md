# Contributing

Thanks for helping. This project is a QA method plus small tools, and improvements to either are welcome.

## Good first contributions
- A **checklist** for a domain we do not cover yet (`method/checklists/`): e-commerce search,
  file uploads, i18n, real-time/chat, maps. Keep it to things a tester can check by observation.
- A **seeded bug** for the demo app (`demo/`), with its line in `demo/ANSWER-KEY.md`.
- A new **`oqa scan` rule.** It must come with a test that fails on the demo's seeded bug and
  passes on a clean page.
- Corrections to the method, with a source link for any external fact.

## Ground rules
- `npm test` passes. Every new check ships with a planted bad case that must fail.
- The finding format is a contract. Changing it means updating `templates/engagement/findings/README.md`,
  the parser in `lib/`, `method/08-writing-bug-reports.md` and the example engagement together.
- No new runtime dependencies without a reason in the PR description.
- Examples use the bundled demo app or `example.com`, never a real company's site.
- Security content stays **passive**. PRs adding active attack tooling will be declined.

## Development
```bash
npm install && npx playwright install chromium
npm run demo            # http://localhost:4173
npm test
node bin/oqa.mjs doctor
```

By contributing you agree that your contribution is licensed under the MIT licence of this repo.
