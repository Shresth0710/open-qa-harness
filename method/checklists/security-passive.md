# Checklist · Security (passive only)

> **Passive** means observing what the app already sends you: headers, cookies, page source, your
> own network traffic. No attacks, no fuzzing, no scanning of other people's data, no load. Active
> security testing is a separate engagement with separate written permission. Only test what you
> are authorised to test.

## Headers (`oqa scan` checks these)
Recommended by the [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/):

| Header | Why |
|---|---|
| `Strict-Transport-Security` | forces HTTPS on later visits |
| `Content-Security-Policy` | limits where scripts can load from; cuts XSS impact |
| `X-Content-Type-Options: nosniff` | stops MIME-type guessing |
| `X-Frame-Options` or CSP `frame-ancestors` | stops click-jacking in iframes |
| `Referrer-Policy` | limits what URLs leak to other sites |
| `Permissions-Policy` | switches off browser features the site does not use |

Missing headers are usually **Low** on their own; they become more serious alongside other findings.

## Cookies
- [ ] Session cookies are `Secure`, `HttpOnly`, and have a `SameSite` value ([MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie))
- [ ] No personal data or tokens readable in non-HttpOnly cookies or `localStorage` that you would not expect

## Transport and exposure
- [ ] HTTPS everywhere; HTTP redirects to HTTPS; no mixed content
- [ ] Passwords never in URLs (GET forms), never echoed back in pages or analytics requests
- [ ] No API keys, private tokens or internal URLs in the page source or JS bundles. A public
      publishable key (e.g. a payment provider's `pk_…`) is by design. A secret key is Critical
- [ ] Source maps (`*.js.map`) publicly served? Note it; whether that is acceptable is the owner's call
- [ ] Error pages do not show stack traces, framework versions or SQL
- [ ] `robots.txt` and `sitemap.xml` do not list private admin paths
- [ ] Security contact published ([`/.well-known/security.txt`](https://www.rfc-editor.org/rfc/rfc9116))

## Access control (with your own two test accounts only)
- [ ] Account A cannot see account B's records by changing an ID in the URL or the API call
- [ ] UI-hidden admin actions are also refused by the API for non-admins (white-box makes this easy)

**If you find something serious** (another user's data, a live secret), stop, do not explore it further, and
tell the owner privately and immediately. Do not put the live secret in the report. Describe where it is.
