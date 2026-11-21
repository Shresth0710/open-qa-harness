# Checklist · Accessibility

Target: [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA, the level most accessibility laws and
procurement rules reference.

> Automated tools (axe-core, which `oqa scan` runs) find only a share of WCAG issues. Deque, the
> makers of axe, reported that "on average, 57 percent of accessibility issues were completely covered
> by this automated testing" in their dataset, counted by number of issues
> ([Deque, 2021](https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues/)).
> Of the criteria new in WCAG 2.2, axe-core's automated rules cover target size only
> ([axe-core rule list](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)).
> The rest needs a human with a keyboard and a screen reader.

## The quick five (every page)
- [ ] **Keyboard only:** Tab through the page. Can you reach and operate every control? Is the focus
      always visible? Do you ever get stuck? ([2.1.1](https://www.w3.org/WAI/WCAG22/Understanding/keyboard), [2.1.2](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap), [2.4.7](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible))
- [ ] **Focus not hidden:** a focused element is never fully covered by a sticky header, cookie bar or chat widget ([2.4.11, new in 2.2](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum))
- [ ] **Names:** every button, link, icon button and input has an accessible name (axe flags most)
- [ ] **Contrast:** body text ≥ 4.5:1, large text ≥ 3:1 ([1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum))
- [ ] **Zoom to 200% / 320 px wide:** content reflows without horizontal scroll or loss ([1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow))

## Forms
- [ ] Every input has a visible label (not just a placeholder)
- [ ] Errors name the field and say how to fix it, in text, not colour alone ([3.3.1](https://www.w3.org/WAI/WCAG22/Understanding/error-identification), [3.3.3](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion))
- [ ] Information already entered is not asked for again in the same process ([3.3.7 Redundant Entry, new in 2.2](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry))
- [ ] Login does not require solving a puzzle or remembering/transcribing a code without an alternative such as paste or a password manager ([3.3.8 Accessible Authentication, new in 2.2](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum))

## Pointer and touch
- [ ] Targets are at least 24×24 CSS px, or have enough spacing ([2.5.8 Target Size, new in 2.2](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum))
- [ ] Anything done by dragging can also be done with a single click/tap ([2.5.7 Dragging Movements, new in 2.2](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements))

## Content and structure
- [ ] Images that carry meaning have alt text; decorative images have `alt=""`
- [ ] One `h1`, headings in order, landmarks (`header`, `nav`, `main`, `footer`)
- [ ] Page `<title>` is unique and describes the page; `<html lang>` is set
- [ ] Video has captions; nothing flashes more than 3 times per second
- [ ] Help/contact link is in the same place on every page ([3.2.6 Consistent Help, new in 2.2](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help))

## Screen reader spot check (10 minutes)
VoiceOver (macOS: Cmd+F5) or NVDA (Windows, free): read the main flow top to bottom. Are buttons announced
with their purpose? Are errors and toasts announced? Does a modal trap focus inside it and
return focus when closed?

**Severity guide:** rate by what it does to the person who meets it. A barrier that stops a
keyboard or screen-reader user from completing a critical journey is Critical for them.
