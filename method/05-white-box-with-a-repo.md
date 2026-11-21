# 05 · White-box: when you have the code

**Output:** `requirements.md` (what the code says the app must do), API-level checks, browser-level
checks, and a **disagreements** table, plus everything from [04](04-black-box-execution.md).

Having the repo does not replace black-box testing. The code tells you what was **intended**, and
the browser tells you what a user actually **gets**. The bugs worth most are where the two disagree.

## Step 1 · Read the code for requirements (do not edit it)

Extract, with file and line references:

| Look in | You get |
|---|---|
| Router / pages directory / `routes.*` | the real route list, which replaces bundle guessing |
| API routes, controllers, OpenAPI/GraphQL schema | every endpoint, method, auth requirement |
| Validation (zod/yup/joi schemas, DB constraints, model validators) | the exact boundaries to test |
| Role/permission checks (`can()`, middleware, policies) | the role × screen matrix |
| Feature flags, env-dependent branches | what is on in this environment |
| Error handling and empty `catch` blocks | where failures are swallowed |
| Existing tests | what is already covered, and what is asserted wrongly |
| Hard-coded lists, magic numbers, TODO/FIXME | assumptions that break on real data |

Write each as a testable line in `requirements.md`:

```
R-012  Booking quantity must be 1–20 (src/booking/schema.ts:14). Test: 0, 1, 20, 21 via UI AND API.
```

## Step 2 · Run the API and the browser against the same requirement

For each requirement, check it **twice**:
- **API level:** call the endpoint directly (`fetch`, `curl`, Playwright's [`request` context](https://playwright.dev/docs/api-testing)), with the auth a real client would use. Fast, precise, covers edge values the UI cannot send.
- **Browser level:** do it through the UI as a user, with `getByRole` locators, screenshots and a trace.

Then compare.

| API says | Browser says | Usually means |
|---|---|---|
| rejects 0 | accepts 0 | UI sends something else (default, rounding), or the UI path uses another endpoint |
| accepts 0 | rejects 0 | validation only in the UI, so anyone with curl bypasses it (**security-relevant**) |
| succeeds | shows error | UI misreads the response shape |
| fails | shows success | UI shows success without checking the response (**data loss**) |

> **Do not average a disagreement, and do not drop the result you did not expect.** Each
> disagreement is a finding until you can explain it. Where API and browser results conflict, look
> for a defect at the boundary between them, such as a field name, a stemmed word or a default value.

## Step 3 · Keep both verdicts when two suites judge one thing

If an API suite and a browser suite both report on requirement R-012, store **both** results. A
pipeline where the later suite overwrites the earlier one will turn a browser Fail into an API Pass
without anyone noticing. Show the disagreement in the report.

## Step 4 · Run the existing tests, then distrust them a little

Run the project's own test suite. A green suite tells you what the authors thought to check.
Look for:
- tests that assert a mock rather than the behaviour;
- tests skipped (`.skip`, `xit`) or marked flaky;
- the critical journeys from `engagement.md` with no end-to-end test at all.

Those gaps belong in the report under "risk", even when nothing is broken today.

## Step 5 · Turn findings into regression checks

White-box mode lets you leave behind real tests. For each confirmed bug, write the test that would
have caught it, run it against the current build (it must **fail**), and hand it over with the
finding. See [11](11-regression-and-ci.md).

## What white-box adds that black-box cannot
- Validation that exists only on one side (UI or API).
- Endpoints the UI never calls but that are reachable.
- Permission checks done in the UI only.
- Errors swallowed by empty `catch` blocks (the UI says nothing, the data is gone).
- "Closed world" logic: code that only checks a hard-coded list, so anything not on the list reads
  as "none" or "safe".
