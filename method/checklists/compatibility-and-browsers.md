# Checklist · Compatibility and browsers

Pick targets from the owner's analytics if they exist. Otherwise: Chromium for the full pass,
WebKit and Firefox for the critical journeys (see [04](../04-black-box-execution.md#browsers-and-devices)).

```bash
npx playwright install firefox webkit
node bin/oqa.mjs scan --from engagements/<name>/recon.json --out engagements/<name> --browser webkit
```

## Per critical journey, in each target browser
- [ ] The journey completes (sign up, log in, core action, checkout to the payment screen)
- [ ] Date, time and number inputs: native pickers differ by browser; typed values are accepted in each
- [ ] File upload and download work (download names, MIME types)
- [ ] Copy/paste, autofill and password managers fill the right fields
- [ ] Popups and new tabs (OAuth sign-in, payment redirects) open and return correctly. Browsers generally block a popup that is not opened in direct response to a user action ([MDN: transient activation](https://developer.mozilla.org/en-US/docs/Glossary/Transient_activation)), so a popup opened after an `await` may be blocked
- [ ] Cookies and storage: third-party cookie restrictions do not break login, embeds or payments. Safari blocks third-party cookies by default ([WebKit](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)); Firefox partitions them by default since Firefox 103 ([MDN: state partitioning](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/State_Partitioning))
- [ ] Media: video/audio autoplay rules differ; nothing important depends on autoplay
- [ ] Fonts and icons load (no blank boxes); layout matches within reason

## Environment variations
- [ ] Browser zoom 200% (also an [accessibility](accessibility.md) requirement)
- [ ] Dark mode (`prefers-color-scheme: dark`): text stays readable if the site supports it, and nothing becomes invisible if it does not
- [ ] Reduced motion (`prefers-reduced-motion`) is respected for large animations
- [ ] An ad/tracker blocker installed: the core journey still works (blockers commonly remove scripts and elements named like ads or analytics)
- [ ] Slow or offline network: sensible errors, no infinite spinner, no lost input
- [ ] Older-but-supported versions, if the owner states a support policy

Write the browser **and version** in **Where** for every finding. Playwright's bundled builds are
close to, but not the same as, the branded browsers. For a Safari-only bug, confirm on real Safari
before rating it High.
