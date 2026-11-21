# Checklist · i18n and localisation

Use this when the product serves more than one language, country or currency, or plans to.

## Text
- [ ] Every visible string is translated: no English fallbacks, no raw keys (`checkout.total.label`)
- [ ] Long translations fit: German or Finnish text is often much longer than the English. Buttons, tabs and table headers do not clip or wrap badly
- [ ] Right-to-left languages (Arabic, Hebrew): layout mirrors, icons that imply direction flip, mixed RTL/LTR text (an English product name inside Arabic) displays in the right order
- [ ] Non-Latin input works everywhere text is accepted: names `José Müller`, `王小明`, `Zoë O'Brien`; search finds them; exports keep them (no `Ã©`)
- [ ] Emails, PDFs and SMS the app sends are in the user's language too
- [ ] Plurals are right ("1 seat", "2 seats", and the languages with more plural forms)

## Formats
- [ ] Dates in the locale's order (05/12 is May 12 or 5 December), with the right first day of the week
- [ ] Times and time zones: a booking made in one zone shows the right time to a user in another; daylight-saving change days are handled
- [ ] Numbers: decimal and thousands separators (`1,234.5` vs `1.234,5`); input accepts the local form
- [ ] Currency: symbol and position, decimals (JPY has none), rounding, tax/VAT display rules per country
- [ ] Addresses and phone numbers: postcode formats, optional states/provinces, international phone input

## Switching
- [ ] The language switcher is findable, keeps the user on the same page, and the choice persists
- [ ] `<html lang>` changes with the language (screen readers depend on it); `hreflang` set on public pages if they are translated
- [ ] URLs and redirects per locale (`/de/…`) do not loop or 404
