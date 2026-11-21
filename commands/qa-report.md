---
description: Build the HTML + PDF report from the findings, then check it renders correctly
argument-hint: <engagement-name>
---

Build and check the report for `engagements/$1` (method: `method/10-reporting.md`;
`oqa` = `node <harness-root>/bin/oqa.mjs`).

1. `oqa lint engagements/$1`: 0 errors required.
2. `oqa report engagements/$1 --pdf`
3. Check it like a reader would:
   - every finding ID is in the PDF (`pdftotext engagements/$1/report/report.pdf - | grep -o 'QA-[A-Z0-9]*-[0-9]*' | sort -u | wc -l`
     equals the number of findings), or open `report.html` and count;
   - open the PDF and look at the cover, the summary and at least 5 finding pages. The image must
     show the bug its caption names, and nothing may be clipped;
   - no secrets or other people's personal data visible.
4. Tell the user the path, the counts by severity, and the three findings that matter most, in plain words.
