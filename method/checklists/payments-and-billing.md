# Checklist · Payments and billing

Rule zero: **never complete a real payment, change a real plan or cancel a real subscription**
unless the owner has set up a test mode and said so in writing. Follow every flow **to** the payment
screen, then stop. Screenshot the plan/billing summary at the start and the end of testing.

- [ ] Pricing page matches what checkout charges (amount, currency, tax, billing period)
- [ ] Plan limits shown in the app match the pricing page
- [ ] Upgrade/downgrade flows reach the payment or confirmation screen with the right amount
- [ ] Coupons: a valid code applies once; invalid and expired codes explain themselves; codes do not stack unless intended
- [ ] Currency and tax: correct symbol, rounding, tax line shown where required
- [ ] Totals at boundaries: quantity 0, 1, 10, max; mixed items; free items
- [ ] Payment failure path (test cards in test mode, e.g. [Stripe's](https://docs.stripe.com/testing)): clear message, no order created, user can retry
- [ ] Double-click "Pay": one charge, one order
- [ ] Receipts/invoices: downloadable, correct, with the legal details the owner's jurisdiction requires
- [ ] Cancelling explains what happens and when; the app reflects it after the period ends
- [ ] If no payment provider is connected (common in early products), say so in coverage as **blocked**. Do not guess what would happen.
