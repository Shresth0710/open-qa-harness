# Findings

One file per area: `findings/<area>.md` (for example `findings/auth.md`). This README is ignored by the tools.

Copy this block for every bug. `oqa lint` checks every field; `oqa report` reads exactly this shape.
Full guidance: [method/08-writing-bug-reports.md](../../../method/08-writing-bug-reports.md)

```markdown
### QA-AUTH-01 — Short title that names the symptom, not the cause
- **Severity:** Critical | High | Medium | Low
- **Priority:** P1 | P2 | P3 | P4
- **Status:** Confirmed | Unconfirmed
- **Category:** Functional | UX | Content | Accessibility | Performance | Security | Compatibility
- **Where:** https://app.example.com/login · desktop 1440 · Chromium
- **What the user experiences:** One to three plain sentences a non-technical owner understands.
- **Steps to reproduce:**
  1. Open …
  2. Type …
  3. Click …
- **Expected:** What should happen.
- **Actual:** What happens instead, including any console or network error text.
- **Evidence:** `evidence/auth-01-login-error.png`, `evidence/auth-01-console.txt`
```

- **Status: Confirmed** means you saw it happen at least twice. Seen once = **Unconfirmed**, and it stays labelled that way.
- The **first** file in Evidence is the one the report shows, so put the screenshot that shows the bug first.
