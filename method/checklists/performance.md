# Checklist · Performance (in a QA pass)

QA is not a full performance audit. It flags what a user will feel. Google's
[Core Web Vitals](https://web.dev/articles/vitals) give the thresholds for "good" at the 75th
percentile of real page loads:

| Metric | Measures | Good |
|---|---|---|
| **LCP** (Largest Contentful Paint) | loading: when the main content shows | ≤ 2.5 s |
| **INP** (Interaction to Next Paint) | responsiveness: delay after a tap/click | ≤ 200 ms |
| **CLS** (Cumulative Layout Shift) | visual stability: things jumping around | ≤ 0.1 |

> `oqa scan` reports **lab** LCP and CLS from one load on your machine and network. Lab numbers are
> a signal, not the field truth. Real-user (field) data comes from the
> [Chrome UX Report](https://developer.chrome.com/docs/crux) or the site's own RUM. Say which one
> you are quoting.

## What to check by hand
- [ ] First load on a throttled connection (DevTools: "Fast 4G" / "Slow 4G"). Does the page show something useful quickly?
- [ ] Main interactions (open menu, submit form, filter list) respond visibly within a fraction of a second
- [ ] Layout does not jump as images, fonts, ads or banners load
- [ ] Long lists paginate or virtualise; a 1000-row account does not freeze the tab
- [ ] No request waterfalls you can see in the network panel (10 sequential API calls before content)
- [ ] Images: right size and modern format; nothing over ~500 KB on a mobile page without reason
- [ ] Nothing polls the server every second while idle

**Severity guide:** "slow" is Medium when it is on a critical journey and measurable (e.g. LCP 6 s
on the signup page). It is High when users time out or give up (spinner over 10 s, double submissions
caused by lag).
