# Engagement — demo-engagement

> Fill this in **before** you test anything. Every line is a decision someone with authority
> over the target has made. If a line is blank, you are not ready to start.
> Method: [method/01-scoping-and-rules.md](../../method/01-scoping-and-rules.md)

## 1. Target
- **Product / app:** http://localhost:4173
- **Environment:** local (the bundled demo app, `npm run demo`)
- **Mode:** black-box (URL only; the demo's source was not read during testing)
- **Authorised by:** the demo app's owner (you: it runs on your own machine)
- **Date window:** 2026-11-21 (one session)

## 2. Goal and audience of the report
- **Why this QA is happening:** launch readiness: "find everything a first customer would hit"
- **Who reads the report:** the studio owner (non-technical) and the developer who fixes
- **What "done" means:** every route in routes.md has a status in coverage.md; every Critical and High re-run by a second pass; report PDF delivered

## 3. Scope
- **In scope (areas):** PUB public site · AUTH sign-up/login · CORE booking and bookings page
- **Out of scope:** load testing · active security attacks · email delivery (the demo sends none) · real payment
- **Viewports:** desktop 1440×900 · mobile 390×844   <!-- the default; add tablet if it matters -->
- **Browsers:** Chromium

## 4. Accounts and identity
| Role | Account | Who signs in | Notes |
|---|---|---|---|
| visitor | none | — | fresh browser, no cookies |
| customer | demo@acme.test | the owner (saved with `oqa login`) | the demo's built-in account |
| new user | `a@b`, `qa-test+shortpw@example.com` | tester | created during test; removed when the demo restarts |

**Identity check:** before any write action, confirm on screen which account is signed in. If it is
not the one listed here, STOP.

## 5. Rules of engagement (production-safe defaults — change only with the owner's yes)
1. **Test data:** allowed. Every item created is prefixed **`QA-TEST`** and logged in
   `created-items.md`. Everything created is deleted at the end. **Existing records are read-only.**
2. **Messages:** emails/SMS/WhatsApp/invites go **only** to: `qa-test+…@example.com` (the demo sends nothing).
   Every send is logged in `sends.md`. Never message a real customer.
3. **Money:** billing pages are read-only. Checkout is followed **up to** the payment screen, then STOP.
   Never pay, change a plan or cancel. Screenshot the plan at start and end.
4. **Passwords / resets:** only on test accounts, never on the owner's real account.
5. **Integrations:** API keys / webhooks may be created then revoked; no delivery to outside endpoints.
6. **Security:** passive observation only (headers, cookies, what the page already exposes). No attacks,
   no fuzzing of other users' data, no load.
7. **No fixing.** QA reports; it does not change the product.

## 6. Severity rubric for THIS product
Default rubric: [method/07-severity-and-priority.md](../../method/07-severity-and-priority.md).
Name this product's **critical journeys** (anything that blocks these is Critical):
- sign up · log in · book a class (pick class, date, seats → checkout → Book) · see my bookings

## 7. Open questions for the owner
- None open. The owner is the tester.
