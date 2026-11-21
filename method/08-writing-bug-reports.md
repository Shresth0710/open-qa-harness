# 08 · Writing bug reports

A finding has two readers: the **owner**, who decides whether it matters, and the **developer**,
who has to reproduce it. Write for both in the same block. The format below is checked by
`oqa lint` and rendered by `oqa report`.

```markdown
### QA-CORE-01 — Checkout total is wrong when 10 or more seats are booked
- **Severity:** Critical
- **Priority:** P1
- **Status:** Confirmed
- **Category:** Functional
- **Where:** http://localhost:4173/checkout · desktop 1280 · Chromium
- **What the user experiences:** A customer booking 12 seats at $24 each is shown a total of $48.00 instead of $288.00, and the booking is saved with that total. The studio under-charges every group booking of 10 or more.
- **Steps to reproduce:**
  1. Log in with the demo account.
  2. Open http://localhost:4173/book and choose "Pottery wheel basics · $24.00".
  3. Date: `2026-12-05`. Seats: `12`. Click "Continue to checkout".
- **Expected:** Total = 12 × $24.00 = $288.00.
- **Actual:** Seats 12, price per seat $24.00, Total **$48.00**: the total matches 2 seats, the last digit of the quantity. 9 seats gives the right total ($216.00); 10 seats gives $0.00.
- **Evidence:** `evidence/core-01-total-12-seats.png`
```

## Field by field

**Title.** Name the symptom the user sees, plus the condition: *"Checkout total is wrong when 10
or more seats are booked"*. Not the cause (*"parseInt bug"*), not a vague label (*"Booking broken"*). A good title
lets the owner triage without opening the finding.

**ID.** `QA-<AREA>-<nn>`, for example `QA-CORE-01`. Never reused, even if a finding is withdrawn. Mark it withdrawn instead.

**What the user experiences.** One to three sentences, no jargon, in the user's terms: what they
tried, what happened, what it costs them. This is the line an owner reads, so it must stand alone.

**Steps to reproduce.** Numbered, starting from a URL and a known state (which account, which data).
Each step is one action. Include the exact values typed. Someone who has never seen the app
should be able to follow them.

**Expected / Actual.** Concrete and comparable. "Should work" is not an expectation. Put exact
error text, status codes and console messages in **Actual**.

**Evidence.** Files that exist. The first one shows the bug ([06](06-evidence.md)).

**Status.** `Confirmed` only after two independent sightings. Otherwise `Unconfirmed`, and say in Actual
what you saw and why it may not reproduce.

## Rules that separate good reports from noise
1. **One bug per finding.** Two symptoms with one cause go in one finding. One symptom with two
   causes goes in two findings, linked.
2. **Minimise the steps.** Remove every step that is not needed to trigger the bug. Fewer steps
   mean faster fixes. ([Mozilla's bug-writing guidelines](https://bugzilla.mozilla.org/page.cgi?id=bug-writing.html) make the same point.)
3. **Find the boundary.** "Right at 9 seats, wrong from 10" helps far more than "wrong at 12". Spend a few
   more minutes finding where the behaviour flips.
4. **Facts in the finding, guesses labelled.** "The session appears to be stored per hostname
   (local storage on `www` has no token)" is useful when it is labelled as an observation. Never
   present a guess about the code as a fact.
5. **No blame, no adjectives.** "Broken", "terrible", "obviously" add nothing. The evidence speaks.
6. **Known before new.** Check whether it is already filed. A duplicate wastes the fixer's time.
