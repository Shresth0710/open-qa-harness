# 11 · Regression and CI

A one-off QA pass gets worse with every release. To keep the value, turn the important parts into
checks that run on every deploy.

## What to automate (and what not to)

| Automate | Keep manual |
|---|---|
| The critical journeys, end to end (sign up, log in, core action, checkout to the payment screen) | Exploratory charters on new features |
| One regression test per confirmed High/Critical bug | Judging copy, design, "does this make sense" |
| `oqa scan` on every public route (a11y, headers, links, console, overflow) | Anything that needs a real payment or real messages |
| API contract checks for the endpoints the UI depends on | Visual polish beyond obvious breakage |

## A regression test per bug

For each confirmed bug:
1. Write the test **before** the fix and run it. It must fail on the current build. A test that
   passes on a buggy build is not testing the bug.
2. Name it after the finding: `test('QA-CORE-01 total correct at 12 seats', …)`.
3. After the fix it passes. Keep it.

## Running on every deploy

Minimum viable pipeline:

```yaml
# .github/workflows/qa.yml (sketch)
on: [deployment_status]
jobs:
  qa:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm i -D github:Shresth0710/open-qa-harness @playwright/test
      - run: npx playwright install --with-deps chromium
      - run: npx oqa scan ${{ github.event.deployment_status.environment_url }} --out qa-out
      - run: npx playwright test            # your journey + regression tests
      - uses: actions/upload-artifact@v4
        with: { name: qa-out, path: qa-out }
```

## Know which build you tested

Record the build or version of every run: a version string in the page, a bundle hash, a commit
SHA from a `/version` endpoint. "Verified on build `a1b2c3`" is a fact. "Verified" on its own is
not. Do not infer "it's live" from a merged ticket or a newest tag. Read it from the running app.

## Keep the published results honest
- If two suites write results for the same case, keep **both** and surface disagreements. Never let
  the last writer silently win.
- Check the published results independently: re-derive a few numbers from the primary source (the
  live app, the tracker), not from the pipeline's own output.
- Diff two consecutive runs. Results that change with no deploy in between point to a flaky test
  or flaky infrastructure, and that needs a fix before you trust anything else.
