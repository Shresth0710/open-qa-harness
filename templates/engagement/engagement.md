# Engagement — {{NAME}}

> Fill this in **before** you test anything. Every line is a decision someone with authority
> over the target has made. If a line is blank, you are not ready to start.
> Method: [method/01-scoping-and-rules.md](../../method/01-scoping-and-rules.md)

## 1. Target
- **Product / app:** {{URL}}
- **Environment:** production | staging | local   <!-- pick one -->
- **Mode:** black-box (URL only) | white-box (code repo at: `…`)
- **Authorised by:** <name + role of the person who owns the system and said yes>
- **Date window:** <from – to>

## 2. Goal and audience of the report
- **Why this QA is happening:** <launch readiness / a regression after a release / due diligence / "find everything">
- **Who reads the report:** <founder · developer who fixes · client · investor>
- **What "done" means:** <e.g. every route in routes.md tested on desktop + mobile; report PDF delivered>

## 3. Scope
- **In scope (areas):** <public site · sign-up/login · core app · admin · billing · integrations>
- **Out of scope:** <load testing · active security attacks · third-party sites · …>
- **Viewports:** desktop 1440×900 · mobile 390×844   <!-- the default; add tablet if it matters -->
- **Browsers:** Chromium (default) · + WebKit / Firefox if the audience uses them

## 4. Accounts and identity
| Role | Account | Who signs in | Notes |
|---|---|---|---|
| visitor | none | — | fresh browser, no cookies |
| owner/admin | <email> | <the owner signs in themselves> | |
| new user | <plus-alias, e.g. you+qa@…> | tester | created during test, deleted after |

**Identity check:** before any write action, confirm on screen which account is signed in. If it is
not the one listed here, STOP.

## 5. Rules of engagement (production-safe defaults — change only with the owner's yes)
1. **Test data:** allowed / not allowed. Every item created is prefixed **`QA-TEST`** and logged in
   `created-items.md`. Everything created is deleted at the end. **Existing records are read-only.**
2. **Messages:** emails/SMS/WhatsApp/invites go **only** to: <your own address and its +aliases>.
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
- <e.g. sign up · log in · the core action users pay for · payment>

## 7. Open questions for the owner
- <question> — **default if no answer:** <what you will do>
