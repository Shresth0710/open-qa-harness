# The method

End-to-end QA of a web application, from "here is a URL" to a report a developer can fix from
and an owner can decide from. The chapters are short on purpose. Read them in order once; after
that, the checklists and templates are what you keep open.

```
 ┌──────────┐   ┌───────┐   ┌────────┐   ┌─────────┐   ┌─────────┐   ┌────────┐   ┌────────┐
 │ 1 Scope  │ → │2 Recon│ → │3 Design│ → │4/5 Test │ → │9 Verify │ → │10 Report│ → │11 Regress│
 │ + rules  │   │ map   │   │charters│   │ + evidence│ │ 2nd pair│   │ HTML/PDF│   │ every   │
 │          │   │ routes│   │        │   │ (6,7,8) │   │ of eyes │   │         │   │ release │
 └──────────┘   └───────┘   └────────┘   └─────────┘   └─────────┘   └────────┘   └────────┘
       ▲                                                                                │
       └──────────────────────── what you learned feeds the next scope ─────────────────┘
```

| # | Chapter | You come out with |
|---|---|---|
| 00 | [Principles](00-principles.md) | the eight rules everything else follows from |
| 01 | [Scoping and rules of engagement](01-scoping-and-rules.md) | `engagement.md`, signed off |
| 02 | [Recon](02-recon.md) | `routes.md`: every page, split into areas |
| 03 | [Test design](03-test-design.md) | a charter per area |
| 04 | [Black-box execution](04-black-box-execution.md) | findings + coverage, with only a URL |
| 05 | [White-box: when you have the code](05-white-box-with-a-repo.md) | requirements from code, API + browser runs, and their disagreements |
| 06 | [Evidence](06-evidence.md) | a screenshot that shows the bug, every time |
| 07 | [Severity and priority](07-severity-and-priority.md) | consistent, defensible ratings |
| 08 | [Writing bug reports](08-writing-bug-reports.md) | findings a stranger can reproduce |
| 09 | [Verification](09-verification.md) | proof that your findings are real, and your tests too |
| 10 | [Reporting](10-reporting.md) | the HTML/PDF report |
| 11 | [Regression and CI](11-regression-and-ci.md) | checks that run on every release |
| 12 | [Safety in production](12-safety-in-production.md) | no harm done to real users or real money |
| 13 | [QA with AI agents](13-qa-with-ai-agents.md) | how to split the work so agents do it well |

Checklists, for use during testing:
[accessibility](checklists/accessibility.md) ·
[auth and sessions](checklists/auth-and-sessions.md) ·
[forms and input](checklists/forms-and-input.md) ·
[mobile and responsive](checklists/mobile-and-responsive.md) ·
[performance](checklists/performance.md) ·
[security (passive)](checklists/security-passive.md) ·
[payments and billing](checklists/payments-and-billing.md) ·
[compatibility and browsers](checklists/compatibility-and-browsers.md) ·
[i18n and localisation](checklists/i18n-and-localisation.md) ·
[content and SEO basics](checklists/content-and-seo-basics.md)
