# 01 · Scoping and rules of engagement

**Output:** `engagements/<name>/engagement.md` (from `oqa init`), filled in and agreed with the owner.

Most bad QA is not a testing problem. Usually the scope was wrong: the wrong account, a
production database nobody said you could write to, an email blast to real customers, a report
written for the wrong reader. Ten minutes here saves days.

## The six things you must know before testing

| # | Question | Why it matters | Default if the owner does not care |
|---|---|---|---|
| 1 | **What is the goal?** Launch readiness, a post-release regression, due diligence, "find everything"? | Sets depth and what "done" means | "Find everything a new user would hit in their first week" |
| 2 | **Who reads the report?** | A founder needs impact and priorities; a developer needs steps and logs | Both: plain-words line + exact steps for every finding |
| 3 | **Which environment?** prod / staging / local | Decides what you may write | Staging if it exists; production read-mostly otherwise |
| 4 | **Which accounts?** Who signs in, with what role? | Many bugs only exist for one role | Owner signs in themselves; you create a `+alias` test user |
| 5 | **What may you change?** Test data, messages, money | This is where harm happens | The safe defaults in the template (§5) |
| 6 | **Code available?** | Chooses black-box ([04](04-black-box-execution.md)) or white-box ([05](05-white-box-with-a-repo.md)) | Black-box |

Ask everything you need **in one message**, each question with the default you will use if nobody
answers. Then write the answers into `engagement.md` so nobody asks again.

## Rules of engagement

The template ships production-safe defaults. Change a line only when the owner says so, and write
down who said it.

1. **Test data** is prefixed `QA-TEST`, logged in `created-items.md`, deleted at the end.
   Existing records are read-only.
2. **Messages** go only to addresses you control (`you+qa1@…`). Log every send in `sends.md`.
3. **Money:** follow checkout to the payment screen, then stop. Screenshot the plan before and after.
4. **Passwords and resets** only on test accounts.
5. **Integrations:** create a test API key or webhook, then revoke or delete it. No delivery to outside endpoints.
6. **Security:** passive only. See [checklists/security-passive.md](checklists/security-passive.md).
7. **QA does not fix.** It reports.

> **Authorisation is not optional.** Testing a system you do not own and were not invited to test can
> be illegal, even when all you do is fill in forms. The "Authorised by" line in `engagement.md` names
> a real person.

## Name the critical journeys

Write down the 3–5 things this product exists to do: sign up, log in, the core action users pay
for, payment. Anything that blocks one of these is **Critical** by definition
([07](07-severity-and-priority.md)). Agreeing on this up front ends most severity arguments
before they start.

## Definition of done, written so a machine could check it

Not "thorough QA". Instead:
- every route in `routes.md` appears in `coverage.md` with a status;
- every finding passes `oqa lint` (all fields, evidence exists);
- every Critical/High was re-run by someone else ([09](09-verification.md));
- `created-items.md` shows everything deleted;
- the report PDF opens and contains every finding ID.
