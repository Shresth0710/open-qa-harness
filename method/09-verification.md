# 09 · Verification: check the findings, and check yourself

A report with false bugs in it does more damage than a short one. The developer chasing a bug that
is not there loses a day, and loses trust in every other finding. Even at Google's scale, "almost
16% of our tests have some level of flakiness" and "about 84% of the transitions we observe from
pass to fail involve a flaky test"
([Google Testing Blog, 2016](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html)).
A single failure tells you less than it seems. Verification has three layers.

## Layer 1 · You: is it the product, or is it my test?

Before you file anything:

1. **Reproduce twice**, ideally from a fresh state (new tab, new session, freshly created record).
2. **Change exactly one variable and re-run.** Another value, another browser, another account,
   a longer wait. If the result flips, that variable is the finding or the flaw in your test.
3. **Look at the real response** before you assert on it. Print the actual API body once. Many
   "the API returns nothing" bugs turn out to be a test reading `id` at the top level when it is
   nested under `data.id`.
4. **Wait for the worst case, not the average.** Polling 9 s for something that takes 12 s gives
   you a timeout, not a bug.
5. **Read the current state, not the first match.** On pages that append (chats, feeds, wizards),
   the first matching element is often an old, disabled copy. Select the newest one.
6. **Judge each screen as someone allowed to see it.** A test signed in as the wrong role gets
   redirected and then "passes" or "fails" on the wrong page.

Typical failures of the tester, not the product:

| Symptom | Real cause |
|---|---|
| "Element never appears" | wrong selector, or the element is in an iframe / shadow DOM |
| "API returns empty" | reading the wrong field of the response |
| "Validation accepts empty input" | the test's `value || default` replaced the empty string |
| "Count is wrong" | counting a fixed phrase that varies run to run |
| "Fails only in CI" | timing; a fixed `sleep` instead of waiting for state |

## Layer 2 · Someone else: re-run from the write-up alone

A second person, or a fresh agent that did **not** find the bugs, re-runs a sample of findings
**using only the text of the finding**: every Critical and High, plus random others, at least 8.
Record it in `verification.md`.

- Reproduced → the finding is real **and** well written.
- Not reproduced → either the bug is intermittent (say so, add conditions) or the steps are
  incomplete (fix the steps). Either way the finding changes.

Aim for at least 7 of 8 reproducing. Lower than that means the write-ups are not reproducible yet.

## Layer 3 · Check your own checks

Every automated check, lint rule or script you rely on must be shown to **fail** on a case that
should fail, before you trust its pass.

- `oqa lint`: plant a finding with a missing field and a missing evidence file and confirm lint
  names both. (`test/` in this repo does exactly that.)
- A broken-link checker: point it at a known 404.
- A "no errors" console check: inject a `console.error` and confirm it is caught.

A check that has never failed may be unable to fail.

## Verifying a fix

When the developer says "fixed":
1. Re-run the original steps on the new build. Record the build/version.
2. Re-run the **neighbours**: the boundary values, the other roles, the mobile view.
3. For durability bugs ("works once, breaks on repeat"), repeat the action. Run it twice, reload,
   re-run after the next deploy.
4. Only then mark it verified, with the build it was verified on.

## "Is everything perfect?"
The honest answer is almost never yes. State what was verified, on which build, by whom, and what
was not checked.
