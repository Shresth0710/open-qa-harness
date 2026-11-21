---
description: Turn confirmed High/Critical findings into Playwright regression tests that fail on the current build
argument-hint: <engagement-name> [output dir, default engagements/<name>/regression]
---

Write regression tests for `engagements/$1` (method: `method/11-regression-and-ci.md`).

For every finding with `Status: Confirmed` and Severity Critical or High:
1. Write one Playwright test named after the finding ID (`test('QA-CORE-01 …', …)`) using
   `getByRole`/`getByLabel` locators and the exact steps and expected result from the finding.
2. Run it against the current build. It **must fail**. If it passes, the test does not capture the
   bug: fix the test, or report that the bug no longer reproduces.
3. If `@playwright/test` is not installed where the tests will live, install it (`npm i -D @playwright/test`).
   Save tests to `${2:-engagements/$1/regression}/` with a minimal `playwright.config.mjs` whose
   `baseURL` comes from `engagement.md`.
4. Report: which findings got a test, each test's result on the current build, and how to run them
   (`npx playwright test -c <dir>`).
