# Routes and areas — demo-engagement

> Produced by `oqa recon` (see `recon.json`), then edited by a human.
> **Route strings found in a JS bundle are CANDIDATES** — a dead string, a catch-all redirect or an
> old route looks the same as a live page. Visit each one before you treat it as real.
> Method: [method/02-recon.md](../../method/02-recon.md)

## Areas
Split the app into areas of **about 4–6 routes each**. One tester (or one agent) owns one area.
Bigger areas run out of time or context half-way and the second half gets tested badly.

| Area | Routes | Account | Owner |
|---|---|---|---|
| PUB — public site | / · /pricing · /about · /terms · footer links | visitor | tester 1 |
| AUTH — sign-up / login | /signup · /login · /logout · session cookie · /dashboard/ | new user, customer | tester 1 |
| CORE — booking | /book (+ ?class=…) · /checkout · /api/bookings · /dashboard | customer | tester 1 |
| (candidates) | /account/settings · /gift-cards | customer | tester 1: visited, both 404, not linked anywhere |

## All routes found
<!-- oqa recon writes the table below; re-running replaces it. Generated 2026-11-21 13:53 UTC from http://localhost:4173/ -->

| Route | Source | Status | Title | Console errors | Failed requests |
|---|---|---|---|---|---|
| `/` | crawl, sitemap | 200 | Book a class · Acme Studio | 0 | 0 |
| `/about` | sitemap, crawl | 200 | About us · Acme Studio | 0 | 0 |
| `/book` | sitemap, crawl, bundle | 200 | Book a class · Acme Studio | 0 | 0 |
| `/book?class=darkroom` | crawl | 200 | Book a class · Acme Studio | 0 | 0 |
| `/book?class=drawing` | crawl | 200 | Book a class · Acme Studio | 0 | 0 |
| `/book?class=wheel` | crawl | 200 | Book a class · Acme Studio | 0 | 0 |
| `/dashboard` | robots, crawl, bundle | 200 | Your bookings · Acme Studio | 1 | 0 |
| `/login` | sitemap, crawl | 200 | Log in · Acme Studio | 0 | 0 |
| `/pricing` | sitemap, crawl | 200 | Pricing · Acme Studio | 0 | 0 |
| `/signup` | sitemap, crawl | 200 | Sign up · Acme Studio | 0 | 0 |
| `/terms` | crawl | 404 | Page not found · Acme Studio | 1 | 0 |
| `/account/settings` | bundle | candidate (bundle) – unverified |  |  |  |
| `/api/bookings` | bundle | candidate (bundle) – unverified |  |  |  |
| `/checkout` | bundle | candidate (bundle) – unverified |  |  |  |
| `/gift-cards` | bundle | candidate (bundle) – unverified |  |  |  |
| `/logout` | crawl | not followed (looks destructive) |  |  |  |
