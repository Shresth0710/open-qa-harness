# Checklist · Auth and sessions

Use a test account on an address you control. Never on the owner's real account.

## Sign-up
- [ ] Invalid emails rejected (`a@b`, `a@b.`, spaces, missing `@`), with a clear message
- [ ] Password rules stated up front and enforced the same in UI and API
- [ ] Existing email: a helpful message, not a crash (and, for privacy-sensitive apps, not a confirmation that the account exists)
- [ ] Verification email arrives, the link works once, and an expired/used link explains itself
- [ ] Social login (Google, etc.): first sign-in creates the account; second signs in; cancel returns sensibly
- [ ] After sign-up you land where the product says you will (onboarding, dashboard)

## Login and logout
- [ ] Wrong password: a generic message; a few attempts do not lock out silently
- [ ] Password is never in the URL (form `method="POST"`), never in logs or analytics calls
- [ ] "Remember me" behaves as described
- [ ] Logout really ends the session: Back after logout does not show private data, and the API returns 401
- [ ] Logged-in user visiting `/login` or `/signup` is redirected sensibly

## Sessions across addresses
- [ ] Sign in on `example.com`, open `www.example.com` (and the reverse): still signed in, or redirected to one canonical host
- [ ] Trailing slash, uppercase path and query-string variants of a private URL behave the same
- [ ] Two tabs: logging out in one is reflected in the other on next action
- [ ] Session expiry: an expired session leads to login, then back to where the user was. Unsaved work is not lost silently

## Password reset
- [ ] Reset email arrives; link single-use and time-limited
- [ ] The response does not reveal whether an email is registered (or the owner has accepted that trade-off)
- [ ] After reset, old sessions are ended (or the owner has decided otherwise)

## Roles
- [ ] Each private URL opened as each role: allowed roles see it; others get a clear "no access", not a blank page or someone else's data
- [ ] Changing an ID in the URL (`/orders/123` → `/orders/124`) never shows another account's record (passive check: use two of *your own* test accounts)

## Invites and teams
- [ ] Invite email link works for a new and for an existing user
- [ ] Accepting twice, or after the invite is revoked, explains itself
- [ ] Removing a member actually removes access on their next request
