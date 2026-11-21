# 02 · Recon: map the app before you test it

**Output:** `routes.md` (every route, split into areas) + `recon.json` + a first set of screenshots.
**Tool:** `oqa recon <url> --out engagements/<name>`

You cannot state coverage for pages you never knew existed. Recon builds the list.

## Where routes come from

| Source | How | Trust |
|---|---|---|
| **Crawl** | Follow every same-origin link from the home page (`oqa recon` does this) | High: a real page linked from the UI |
| **sitemap.xml / robots.txt** | Fetched by `oqa recon` | Medium: may list old pages |
| **JS bundle strings** | Single-page apps ship their route table in the bundle; `oqa recon` extracts path-like strings | **Low.** These are candidates, not facts |
| **Signed-in crawl** | `oqa login <url> --save auth/owner.json`, then `oqa recon <url> --auth auth/owner.json` | High, for that role only |
| **The code** (white-box) | The router file, the API routes, the OpenAPI spec | Highest, see [05](05-white-box-with-a-repo.md) |
| **Emails and links the app sends** | Invite, reset, receipt links | Often missed, so add them by hand |

> ⚠️ **Bundle strings lie.** A minified bundle contains dead routes, catch-all redirects, routes
> behind feature flags and strings that only look like paths. Visit each one before treating it as a
> page, and never file a bug on a bundle string you have not loaded.

## Single-page apps and hash routes

Many apps are single-page apps (React, Vue, Angular…). Three things change:
- **Hash routing.** If links look like `/#/settings` or `#!/orders`, the part after `#` *is* the route.
  `oqa recon` keeps `#/…` fragments as distinct routes. Test them as pages.
- **Routes that are not links.** Screens reached only by a button (`navigate('/billing')`) never
  appear in a crawl. They show up as bundle candidates, or in the code (white-box). Open them
  directly by URL, then also reach them through the UI. A screen that works by URL but cannot be
  reached by clicking is itself a finding.
- **Deep links and refresh.** Open a deep route directly in a fresh tab and refresh it. Single-page
  apps often 404 on refresh because the server does not rewrite deep paths to `index.html`.

## Split into areas

Group routes into areas of **about 4–6 routes** that share an account and a purpose:

| Area code | Typical contents | Account |
|---|---|---|
| `PUB` | landing, pricing, about, legal, blog, 404 | visitor (fresh browser) |
| `AUTH` | sign-up, login, logout, forgot/reset password, invite accept, onboarding | new test user |
| `CORE` | the screens users came for | owner/user |
| `ADMIN` | settings, team, billing, integrations, exports | owner/admin |

Area codes become finding IDs (`QA-AUTH-03`), so pick short ones.

**Why small areas:** whoever tests a big area, person or AI agent, runs out of time or context
half-way, and the second half gets a much thinner pass than the first. Six routes tested properly
beat fifteen skimmed.

## Read the recon output before designing tests

`oqa recon` already tells you a lot:
- pages returning 4xx/5xx → findings, once confirmed by hand;
- console errors on load → note them; confirm whether the user sees anything;
- failed requests → which API calls break, and on which page;
- the desktop and mobile screenshots → an instant visual tour, and your "before" state.

## Note the facts you will need later

At the top of `routes.md`, write down what you learned about how the app works: auth provider,
whether the session lives in a cookie or local storage, which hostnames are involved
(`www.` vs bare domain, `app.` vs `api.`), which third parties load. Most of the strangest bugs
come from these facts. A session stored per hostname, for example, logs you out when you switch
between `www.example.com` and `example.com`.
