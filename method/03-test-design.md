# 03 · Test design: what to try on each page

**Output:** one short charter per area (top of `findings/<area>.md`, or in your notes).

You will not have a written spec for most apps. The design technique is **exploratory testing with
charters**: a time-boxed mission per area, steered by heuristics, where what you learn changes what
you try next ([Hendrickson, *Explore It!*, charters chapter](https://media.pragprog.com/titles/ehxta/charters.pdf);
[Bach, session-based test management](https://www.satisfice.com/download/session-based-test-management)).

## A charter is one sentence

> **Explore** *&lt;area&gt;* **with** *&lt;resources, data, technique&gt;* **to discover** *&lt;the kind of problem&gt;*.

- Explore **sign-up and login** with **invalid emails, weak passwords and a second browser** to discover **validation and session bugs**.
- Explore **the booking form** with **boundary values for date, quantity and price** to discover **calculation and data-integrity bugs**.
- Explore **every public page** at **390 px** to discover **layout, tap-target and overflow problems**.

Time-box each charter (45–90 min). When it ends, write what you covered and what you did not.

## The techniques that find the most bugs

### Equivalence classes and boundaries
For every input, list the valid class, each invalid class, and the **edges**:
`quantity`: 0, 1, the maximum, maximum + 1, -1, 1.5, empty, 10 000, a letter.
`date`: yesterday, today, the far future, Feb 29, a timezone boundary.
Bugs cluster at the edges because that is where developers write `<` when they meant `<=`.
(Formal definitions: [ISTQB Foundation Level syllabus v4.0](https://istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/).)

### State transitions
Draw the states of the main object (draft → published → booked → cancelled → refunded) and try
every transition, including the illegal ones: cancel twice, book a cancelled class, edit after
publishing, go back with the browser button mid-flow, double-click submit.

### CRUD on every object
Create, read, update, delete, for each thing the user manages. Then: does the list update? Does the
count on the dashboard? Does export include it? Does delete really delete, or just hide?

### Roles and permissions
Every screen, as every role that can reach it, and one that should not. A URL copied from the
admin's browser into a member's browser is a two-minute test that finds serious bugs.

### Interruptions and the "real user" set
Refresh mid-flow. Open the same page in two tabs. Lose network on submit. Use the back button.
Paste text with emoji, right-to-left script, leading spaces. Let the session expire. Switch from
`www.` to the bare domain. Real users do all of these every day.

### SFDIPOT: a prompt for what you have missed
[Bach's Heuristic Test Strategy Model](https://www.satisfice.com/download/heuristic-test-strategy-model)
(v6.3) names seven product factors to walk through: **S**tructure, **F**unction, **D**ata,
**I**nterfaces, **P**latform, **O**perations, **T**ime. When you think you are done, go through the
seven and ask "what about…?" for each.

## Every page, every time

Regardless of charter, on every page you open:
1. desktop 1440 and mobile 390 screenshots (the recon pass gives you these);
2. console errors and failed requests;
3. every visible link and button does *something* sensible;
4. the [accessibility](checklists/accessibility.md) quick five;
5. copy that is wrong, placeholder (`Lorem`, `TODO`, `undefined`, `NaN`, `[object Object]`) or leaks
   internal names.
