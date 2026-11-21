# 10 · Reporting

**Tool:** `oqa report engagements/<name> --pdf` → `report/report.html` + `report/report.pdf`

The report is what the owner reads in five minutes and what the developer works through for a
week. It is built from your findings, never written separately. A hand-written summary drifts
from the data it summarises.

## Structure (what `oqa report` produces)

1. **Cover:** target, date, counts by severity.
2. **Executive summary:** counts by severity × status, the top Critical/High issues by title,
   and how to read the report. An owner who reads only this page knows what to do next.
3. **Coverage:** every route and feature with its status. This is what makes "no bugs found here"
   mean something.
4. **Findings,** sorted Severity → Priority → ID. Each one shows the plain-words line in a highlighted
   box, steps, expected vs. actual side by side, and the screenshot that shows the bug.
5. **Appendix:** verification results and the severity rubric used.

## Before you send it
- `oqa lint engagements/<name>` passes with 0 errors.
- Every finding ID appears in the PDF (`pdftotext report.pdf - | grep -c QA-`).
- **Open the PDF and look at it.** Values and layout fail independently: a report can contain all
  the right IDs while a title is clipped, an image shows the wrong state, or a table wraps unreadably.
  Page through it.
- Spot-check five findings: does the image show what the caption says?
- Read the executive summary as the owner would, without the rest of the report. Does it say what
  matters?
- Remove anything private: tokens in URLs, other users' names in screenshots, internal hostnames
  the client did not want shared.

## Writing for the reader
- **Owner / founder:** they need impact and the decision. The summary and the plain-words lines
  are for them.
- **Developer:** they need steps, environment, logs and evidence. The finding body is for them.
- **External client:** add a short scope statement and what was out of scope, so a clean area is
  not read as a guarantee.

Avoid percentages and scores that you cannot defend ("78% quality"). Counts by severity plus a
coverage table are honest, and they are enough.
