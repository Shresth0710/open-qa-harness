# Findings — PUB (public site)

### QA-PUB-01 — "Terms" link in the footer opens a "Page not found" page
- **Severity:** Medium
- **Priority:** P2
- **Status:** Confirmed
- **Category:** Content
- **Where:** http://localhost:4173/terms · desktop 1280 · Chromium
- **What the user experiences:** Someone who wants to read the terms before booking clicks "Terms" in the footer and gets "Page not found". The site asks people to pay without showing them its terms.
- **Steps to reproduce:**
  1. Open http://localhost:4173/ in a fresh browser.
  2. Scroll to the footer and click "Terms".
- **Expected:** A terms page opens (status 200) with the booking and cancellation terms.
- **Actual:** The page says "Page not found · We could not find /terms" and the server answers HTTP 404. The link is on every page, because it is in the shared footer.
- **Evidence:** `evidence/pub-01-terms-404.png`

### QA-PUB-02 — Pricing page scrolls sideways on a phone; pass prices are cut off
- **Severity:** Medium
- **Priority:** P2
- **Status:** Confirmed
- **Category:** UX
- **Where:** http://localhost:4173/pricing · mobile 390 · Chromium (mobile emulation)
- **What the user experiences:** On a phone the pricing table is wider than the screen. The 5-class and 10-class pass prices sit off the right edge, and the whole page slides sideways when the visitor scrolls.
- **Steps to reproduce:**
  1. Open http://localhost:4173/pricing on a 390 px wide phone (or browser device mode at 390×844).
  2. Look at the pricing table, then swipe left.
- **Expected:** The page fits the screen width; the table wraps, stacks or scrolls inside its own box.
- **Actual:** The page is 864 px wide on a 390 px screen (document scrollWidth 864 vs clientWidth 390), so the page scrolls horizontally and the pass columns are not visible without it.
- **Evidence:** `evidence/pub-02-pricing-mobile.png`

### QA-PUB-03 — Cancellation and refund terms on the pricing page are too faint to read
- **Severity:** Medium
- **Priority:** P3
- **Status:** Confirmed
- **Category:** Accessibility
- **Where:** http://localhost:4173/pricing · desktop 1280 · Chromium
- **What the user experiences:** The paragraph that says passes cannot be refunded and late cancellations are charged in full is printed in very light grey on a light background. Many people, especially on a phone in daylight, will not read it, and it is the text they most need before paying.
- **Steps to reproduce:**
  1. Open http://localhost:4173/pricing.
  2. Read the paragraph under the price table that starts "Passes are valid for 6 months".
- **Expected:** Body text meets WCAG AA contrast (at least 4.5:1 against its background).
- **Actual:** The text colour is rgb(185, 188, 196) on the off-white page background; axe reports it under color-contrast (serious).
- **Evidence:** `evidence/pub-03-fine-print.png`, `scan.json` (axe color-contrast)

### QA-PUB-04 — Hero image on the home page has no text alternative
- **Severity:** Low
- **Priority:** P4
- **Status:** Confirmed
- **Category:** Accessibility
- **Where:** http://localhost:4173/ · desktop 1280 · Chromium
- **What the user experiences:** A screen-reader user hears the image's file name, or nothing useful, instead of what the picture shows.
- **Steps to reproduce:**
  1. Open http://localhost:4173/.
  2. Inspect the large studio illustration next to the headline (or run a screen reader over it).
- **Expected:** The image has an `alt` attribute: a short description, or `alt=""` if it is decorative.
- **Actual:** The `<img class="hero-img" src="/static/studio.svg">` has no `alt` attribute at all; axe reports image-alt (critical).
- **Evidence:** `evidence/pub-04-hero-image.png`, `scan.json` (axe image-alt)

### QA-PUB-05 — Search button in the header has no name for screen readers
- **Severity:** Medium
- **Priority:** P3
- **Status:** Confirmed
- **Category:** Accessibility
- **Where:** every page, header · desktop 1280 · Chromium
- **What the user experiences:** The magnifier button in the header is announced only as "button". A screen-reader or voice-control user cannot tell what it does or ask for it by name.
- **Steps to reproduce:**
  1. Open http://localhost:4173/.
  2. Tab to the magnifier icon to the left of "Log in" and listen to (or inspect) its accessible name.
- **Expected:** The button has an accessible name, for example `aria-label="Search classes"`.
- **Actual:** The button contains only an SVG marked `aria-hidden="true"` and no text, `aria-label` or `title`; its accessible name is empty. axe reports button-name (critical).
- **Evidence:** `evidence/pub-05-search-button.png`, `scan.json` (axe button-name)
