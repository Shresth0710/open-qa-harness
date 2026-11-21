# Findings — AUTH (sign-up and log-in)

### QA-AUTH-01 — Logging in puts the password in the address bar and browser history
- **Severity:** High
- **Priority:** P1
- **Status:** Confirmed
- **Category:** Security
- **Where:** http://localhost:4173/login · desktop 1280 · Chromium
- **What the user experiences:** After a person logs in, their password is part of a URL. It is saved in browser history, can be seen by anyone who looks at the history or a shared screen, and is written into server and proxy logs.
- **Steps to reproduce:**
  1. Open http://localhost:4173/login.
  2. Enter the demo account (demo@acme.test / demo1234) and click "Log in".
  3. Look at the browser's network log or history for the request the form sent.
- **Expected:** The login form is sent with POST; the password never appears in a URL.
- **Actual:** The form has `method="get"`. The browser requests `GET /login?email=demo%40acme.test&password=demo1234` before being redirected to /dashboard.
- **Evidence:** `evidence/auth-01-password-in-url.png`, `evidence/auth-01-network.txt`

### QA-AUTH-02 — Sign-up accepts "a@b" as an email address
- **Severity:** Medium
- **Priority:** P3
- **Status:** Confirmed
- **Category:** Functional
- **Where:** http://localhost:4173/signup · desktop 1280 · Chromium
- **What the user experiences:** A person who mistypes their email still gets an account. They never receive booking confirmations or reset emails and cannot work out why.
- **Steps to reproduce:**
  1. Open http://localhost:4173/signup.
  2. Name: `QA-TEST bad email`, Email: `a@b`, Password: `qatest-pass-1`.
  3. Click "Create account".
- **Expected:** The form refuses the address and says what is wrong ("Enter a full email address, like name@example.com").
- **Actual:** The account is created and the user lands on /dashboard, signed in. The only check is that the email contains "@".
- **Evidence:** `evidence/auth-02-invalid-email.png`

### QA-AUTH-03 — Sign-up accepts a one-character password although the form says "At least 8 characters"
- **Severity:** Medium
- **Priority:** P2
- **Status:** Confirmed
- **Category:** Security
- **Where:** http://localhost:4173/signup · desktop 1280 · Chromium
- **What the user experiences:** The form promises a minimum of 8 characters but lets people create accounts with a password like "x", which anyone can guess.
- **Steps to reproduce:**
  1. Open http://localhost:4173/signup.
  2. Name: `QA-TEST short password`, Email: `qa-test+shortpw@example.com`, Password: `x`.
  3. Click "Create account".
- **Expected:** The form refuses the password and repeats the 8-character rule, in the browser and on the server.
- **Actual:** The account is created and the user is signed in on /dashboard.
- **Evidence:** `evidence/auth-03-short-password.png`

### QA-AUTH-04 — Login cookie can be read by page scripts and has no SameSite setting
- **Severity:** Medium
- **Priority:** P2
- **Status:** Confirmed
- **Category:** Security
- **Where:** http://localhost:4173/login (Set-Cookie on the redirect) · desktop 1280 · Chromium
- **What the user experiences:** Nothing visible today. If any script on the site is ever compromised (a bad dependency, an injected snippet), it can read the login cookie and take over the account.
- **Steps to reproduce:**
  1. Open the browser's network panel and log in with the demo account.
  2. Read the `Set-Cookie` header on the response to `/login?...` (the 302 redirect).
  3. In the console on /dashboard, run `document.cookie`.
- **Expected:** `Set-Cookie: session=<id>; Path=/; HttpOnly; SameSite=Lax` (plus `Secure` once the site is served over HTTPS), and `document.cookie` does not show the session.
- **Actual:** The header is `Set-Cookie: session=<id>; Path=/`: no HttpOnly, no SameSite, no Secure. `document.cookie` returns `session=<id>`. (Chromium treats a missing SameSite as Lax, so automated cookie checks that read the browser's cookie store report "Lax" and miss it; the raw header shows the attribute is not set.)
- **Evidence:** `evidence/auth-04-session-cookie.png`, `evidence/auth-04-set-cookie.txt`

### QA-AUTH-05 — Adding a slash to the bookings address shows a signed-in user as signed out
- **Severity:** Medium
- **Priority:** P3
- **Status:** Confirmed
- **Category:** Functional
- **Where:** http://localhost:4173/dashboard/ · desktop 1280 · Chromium
- **What the user experiences:** A signed-in person who opens /dashboard/ (from a bookmark, an email link or autocomplete) is told "You are signed out" and asked to log in again. Logging in again does not help on that address.
- **Steps to reproduce:**
  1. Log in with the demo account; /dashboard shows "Welcome back, Demo".
  2. In the same tab, open http://localhost:4173/dashboard/ (with the trailing slash).
  3. Open http://localhost:4173/dashboard again (without the slash).
- **Expected:** /dashboard/ shows the same signed-in bookings page as /dashboard, or redirects to it.
- **Actual:** /dashboard/ shows "You are signed out · Log in to see your bookings". The session is still valid: /dashboard without the slash shows "Welcome back, Demo" again. The trailing-slash address is routed to the signed-out view without reading the session.
- **Evidence:** `evidence/auth-05-trailing-slash.png`
