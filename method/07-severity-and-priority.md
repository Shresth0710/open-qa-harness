# 07 · Severity and priority

Two different questions, often confused:

- **Severity** is how bad the impact is when it happens: a property of the bug.
- **Priority** is how soon it should be fixed: a business decision that also weighs how many users
  hit it, how often, and what else is in the queue.

(Definitions follow the ISTQB glossary: [*severity*](https://glossary.istqb.org/en_US/term/severity), "the degree of
impact that a defect has on the development, testing or operation of a component or system";
[*priority*](https://glossary.istqb.org/en_US/term/priority), "the level of importance assigned to a task
according to specific criteria". Microsoft's Azure Boards guidance shows the two set independently, a
rare crash rated "Severity = 2 - High and Priority = 3"
([Microsoft Learn](https://learn.microsoft.com/en-us/azure/devops/boards/backlogs/manage-bugs?view=azure-devops)).)

A typo on the checkout button is low severity, yet it can be a high priority because every paying
user sees it. A crash in an admin export used once a year is high severity, and its priority can
reasonably wait.

## Severity: the default rubric

| Severity | Use when | Examples |
|---|---|---|
| **Critical** | Blocks a **critical journey** (from `engagement.md`), loses or corrupts data, leaks data, or takes money wrongly | cannot sign up/log in; booking silently not saved; another user's data visible; charged twice |
| **High** | A core feature is broken or gives wrong results, and there is no reasonable workaround | totals wrong; a main screen errors for some inputs; invites never arrive |
| **Medium** | Works, but wrongly, confusingly, or with a workaround; accessibility barriers on main flows | invalid input accepted; list does not refresh; misleading error; missing labels on a form |
| **Low** | Cosmetic, copy, minor layout, edge-case polish | typo; misaligned icon; low-contrast footer text; missing favicon |

Tie-breakers:
- **Between two levels, pick the higher one** and write one line saying why (the rule GitLab's triage
  handbook uses, [archived copy](http://web.archive.org/web/20250604195506/https://handbook.gitlab.com/handbook/engineering/infrastructure/engineering-productivity/issue-triage/)).
- **Data and money push up.** Anything that can lose data, leak it, or move money wrongly is at least High.
- **Scope pushes up.** A Medium that happens on every page for every user may be High.
- **Unconfirmed never pushes up.** Rate what you have shown, and label it Unconfirmed until you see it twice.
- **Accessibility** is rated by the impact on the person who meets it. A keyboard trap on checkout
  blocks that user completely, so it is Critical for them.

The four levels line up with common public scales: Mozilla's S1–S4
([BMO bug fields](https://wiki.mozilla.org/BMO/UserGuide/BugFields)) and Azure Boards' 1 Critical – 4 Low.

## Priority: the default rule

| Priority | Meaning | Default from severity |
|---|---|---|
| **P1** | Fix before release / now | Critical |
| **P2** | Fix this cycle | High |
| **P3** | Fix soon | Medium |
| **P4** | When convenient | Low |

Start from the default, then move it **one step at most**, with a reason in the finding: frequency
(every user vs. rare), visibility (first screen vs. buried), cost of the workaround. If you move it
further than one step, the severity is probably wrong.

## Consistency checks before you publish
- Sort all findings by severity and read the titles top to bottom. Does any Low feel worse than a
  Medium above it? Fix the rating, not the order.
- Every Critical names which critical journey it blocks, or which data/money/privacy harm it causes.
- No "Critical" that is really "annoying". Overuse makes the label meaningless to the reader.
