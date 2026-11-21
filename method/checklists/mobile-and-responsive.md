# Checklist · Mobile and responsive

Default viewports: **390×844** (a common modern phone) and **1440×900** (laptop). Add 768 (tablet)
if the audience uses tablets. Emulation in Playwright/DevTools catches layout bugs. For touch,
keyboard and performance, also try one real phone.

- [ ] No horizontal scroll on any page (`document.documentElement.scrollWidth > innerWidth`, which `oqa scan` checks)
- [ ] Tables: scroll inside their own container, or reflow into cards. They do not push the page wider
- [ ] Navigation: the menu opens, closes, and every item is reachable; the current page is indicated
- [ ] Tap targets at least 24×24 px with spacing ([WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)); primary buttons comfortably larger
- [ ] Sticky headers, cookie bars and chat bubbles do not cover inputs, buttons or focused elements
- [ ] Modals fit the screen and can be closed; the page behind does not scroll
- [ ] Text readable without zoom (≥16 px body is a common floor); pinch-zoom not disabled
- [ ] Forms: right keyboard type, labels visible while typing, the submit button reachable with the keyboard open
- [ ] Images sized for the viewport (no 4000 px hero on a phone; check the network panel)
- [ ] Orientation change keeps state (half-filled form survives rotate)
- [ ] Safe areas: nothing important under the notch or the home indicator
