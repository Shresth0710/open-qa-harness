# Planted faults (one per finding)

### QA-CORE-01 — Missing field: no Expected line
- **Severity:** High
- **Priority:** P1
- **Status:** Confirmed
- **Category:** Functional
- **Where:** http://localhost:4173/checkout · desktop 1280 · Chromium
- **What the user experiences:** Planted: the Expected field is missing.
- **Steps to reproduce:**
  1. Open the page.
- **Actual:** Something.
- **Evidence:** `evidence/real.txt`

### QA-CORE-02 — Evidence file that does not exist
- **Severity:** Medium
- **Priority:** P2
- **Status:** Confirmed
- **Category:** Functional
- **Where:** http://localhost:4173/checkout · desktop 1280 · Chromium
- **What the user experiences:** Planted: the evidence path points nowhere.
- **Steps to reproduce:**
  1. Open the page.
- **Expected:** Something.
- **Actual:** Something else.
- **Evidence:** `evidence/does-not-exist.png`

### QA-CORE-02 — Duplicate ID
- **Severity:** Low
- **Priority:** P4
- **Status:** Confirmed
- **Category:** UX
- **Where:** http://localhost:4173/ · desktop 1280 · Chromium
- **What the user experiences:** Planted: same ID as the finding above.
- **Steps to reproduce:**
  1. Open the page.
- **Expected:** Something.
- **Actual:** Something else.
- **Evidence:** `evidence/real.txt`

### QA-CORE-03 — Severity outside the allowed list
- **Severity:** Severe
- **Priority:** P2
- **Status:** Confirmed
- **Category:** Functional
- **Where:** http://localhost:4173/ · desktop 1280 · Chromium
- **What the user experiences:** Planted: "Severe" is not a severity.
- **Steps to reproduce:**
  1. Open the page.
- **Expected:** Something.
- **Actual:** Something else.
- **Evidence:** `evidence/real.txt`
