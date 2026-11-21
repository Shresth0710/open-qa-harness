# Routes and areas — {{NAME}}

> Produced by `oqa recon` (see `recon.json`), then edited by a human.
> **Route strings found in a JS bundle are CANDIDATES** — a dead string, a catch-all redirect or an
> old route looks the same as a live page. Visit each one before you treat it as real.
> Method: [method/02-recon.md](../../method/02-recon.md)

## Areas
Split the app into areas of **about 4–6 routes each**. One tester (or one agent) owns one area.
Bigger areas run out of time or context half-way and the second half gets tested badly.

| Area | Routes | Account | Owner |
|---|---|---|---|
| PUB — public site | / · /pricing · /about · … | visitor | |
| AUTH — sign-up / login | /signup · /login · /forgot-password · … | new user | |
| CORE — main app | /dashboard · … | owner | |

## All routes found
<!-- oqa recon writes the table below -->
