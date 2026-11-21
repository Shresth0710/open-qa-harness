---
description: White-box mode — read a code repo for routes, endpoints, validation and roles, and write requirements.md
argument-hint: <engagement-name> <path-to-repo>
---

Dispatch the `qa-code-reader` agent on the repository at `$2` for engagement `engagements/$1`
(method: `method/05-white-box-with-a-repo.md`). It reads and never edits.

When it returns:
1. Merge its route list into `engagements/$1/routes.md` (source = code).
2. For each requirement in `engagements/$1/requirements.md`, plan an API check and a browser check.
3. Run both; record disagreements in `engagements/$1/disagreements.md` with columns
   Requirement · API result · Browser result · Explanation · Finding ID.
   Each unexplained disagreement is a finding.
