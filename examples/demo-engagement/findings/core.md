# Findings — CORE (booking and bookings page)

### QA-CORE-01 — Checkout total is wrong when 10 or more seats are booked
- **Severity:** Critical
- **Priority:** P1
- **Status:** Confirmed
- **Category:** Functional
- **Where:** http://localhost:4173/checkout · desktop 1280 · Chromium
- **What the user experiences:** A customer booking 12 seats at $24 each is shown a total of $48.00 instead of $288.00, and the booking is saved with that total. The studio under-charges every group booking of 10 or more.
- **Steps to reproduce:**
  1. Log in with the demo account.
  2. Open http://localhost:4173/book and choose "Pottery wheel basics · $24.00".
  3. Date: `2026-12-05`. Seats: `12`. Click "Continue to checkout".
- **Expected:** Total = 12 × $24.00 = $288.00.
- **Actual:** Seats 12, price per seat $24.00, Total **$48.00**: the total matches 2 seats, the last digit of the quantity. 9 seats gives the right total ($216.00); 10 seats gives $0.00.
- **Evidence:** `evidence/core-01-total-12-seats.png`

### QA-CORE-02 — Double-clicking "Book" creates two bookings
- **Severity:** High
- **Priority:** P1
- **Status:** Confirmed
- **Category:** Functional
- **Where:** http://localhost:4173/checkout · desktop 1280 · Chromium
- **What the user experiences:** The Book button takes a moment to respond, so people click it twice. Each click books another seat: the customer ends up with two bookings (and two charges in a real shop) for one class.
- **Steps to reproduce:**
  1. Log in with the demo account.
  2. Open http://localhost:4173/checkout?class=drawing&date=2026-12-12&qty=1.
  3. Double-click "Book".
  4. Look at "Your bookings" on /dashboard.
- **Expected:** One booking. The button is disabled after the first click, and the server ignores a repeated request.
- **Actual:** Two bookings, AC-1041 and AC-1042, both "Life drawing · 2026-12-12 · 1 seat · $18.00".
- **Evidence:** `evidence/core-02-double-booking.png`

### QA-CORE-03 — A class can be booked for a date in the past
- **Severity:** Medium
- **Priority:** P2
- **Status:** Confirmed
- **Category:** Functional
- **Where:** http://localhost:4173/book → /checkout · desktop 1280 · Chromium
- **What the user experiences:** A customer who picks the wrong year (or a stale link) pays for a class that has already happened, and the booking is confirmed as if nothing were wrong.
- **Steps to reproduce:**
  1. Log in with the demo account.
  2. Open http://localhost:4173/checkout?class=darkroom&date=2020-01-15&qty=1 (or pick 15 Jan 2020 on /book).
  3. Click "Book".
- **Expected:** Dates before today are refused, on the form and by the server.
- **Actual:** The booking is confirmed as AC-1043, "Darkroom photography · 2020-01-15".
- **Evidence:** `evidence/core-03-past-date.png`

### QA-CORE-04 — Negative seat numbers give a negative total
- **Severity:** Medium
- **Priority:** P2
- **Status:** Confirmed
- **Category:** Functional
- **Where:** http://localhost:4173/book → /checkout · desktop 1280 · Chromium
- **What the user experiences:** The seats field accepts "-2" and checkout shows a total of -$48.00 with a working "Book" button. In a real payment flow that is a refund or a crash.
- **Steps to reproduce:**
  1. Log in with the demo account.
  2. Open http://localhost:4173/book, choose "Pottery wheel basics", Date `2026-12-05`, Seats `-2`.
  3. Click "Continue to checkout".
- **Expected:** Seats must be at least 1; the form and the server refuse 0 and negative numbers.
- **Actual:** Checkout shows Seats -2, Total **-$48.00**, and "Book" is enabled.
- **Evidence:** `evidence/core-04-negative-seats.png`

### QA-CORE-05 — Bookings page throws a script error and never shows reminder settings
- **Severity:** Low
- **Priority:** P3
- **Status:** Confirmed
- **Category:** Functional
- **Where:** http://localhost:4173/dashboard · desktop 1280 · Chromium
- **What the user experiences:** The line under "Welcome back" that should show the user's reminder setting stays empty. Today nothing else breaks, but any script placed after the failing line would not run either.
- **Steps to reproduce:**
  1. Open the browser console.
  2. Log in with the demo account; you land on /dashboard.
- **Expected:** No console errors; the reminder preference is shown.
- **Actual:** `Uncaught TypeError: Cannot read properties of undefined (reading 'reminders')` on every load of /dashboard, and the reminders line is blank.
- **Evidence:** `evidence/core-05-dashboard-typeerror.png`, `evidence/core-05-console.txt`
