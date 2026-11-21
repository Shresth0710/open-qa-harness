# 00 · Principles

Eight rules. Every chapter after this one applies them.

### 1. Test as the user, report for the fixer
You walk the app the way a real user does: their device, their typos, their impatience. You write
it up so the person who fixes it never has to ask a follow-up question. Every finding has both a
**plain-words line** (what the user lives through) and **exact steps** (what the developer runs).

### 2. Nothing counts until you have seen it twice
A bug seen once is **Unconfirmed** and stays labelled that way. Networks hiccup, test data
collides, your own click misses. Reproduce, then report.

### 3. Your test is a suspect too
When a check fails, the product is only one of the suspects. The selector, the wait, the
fixture, the assumption about the response shape are the others. Before filing, change one variable
and run it again. If the result flips, that variable is the finding.
([Chapter 09](09-verification.md) has the full discipline.)

### 4. Evidence or it did not happen
Every finding cites a file that **shows the bug**: a screenshot with the problem visible, the console
line, the failing request. "I saw it" is not evidence. The first image is the one the reader sees,
so it has to be the right one.

### 5. Coverage is stated, never implied
The report lists every route and feature with a status: pass, bugs, blocked (why), not tested (why).
A clean report with no coverage table is ambiguous: it could mean nothing broke, or that nothing
was checked.

### 6. Do no harm
Production has real users and real money. Prefix and log everything you create, delete it after, send
only to your own addresses, never pay, never touch other people's data. Only test what you are
authorised to test. ([Chapter 12](12-safety-in-production.md))

### 7. When two sources disagree, the disagreement is the finding
API says one thing, browser says another. Docs say one thing, the app does another. Do not average
them and do not keep the convenient one. Find out why. That is usually the most valuable bug in the
report.

### 8. Prefer checks that run to notes that are read
A lesson written in a document gets forgotten by the next release. A lesson turned into a lint rule,
an automated check or a regression test gets applied every time. When you find a class of bug,
leave behind something that catches the whole class.
