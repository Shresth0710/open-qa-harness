import fs from 'node:fs';
import path from 'node:path';
import { loadFindings } from './findings.mjs';
import { ok, step, show } from './ui.mjs';

export const newFindingHelp = `Usage: oqa new-finding <engagement-dir> <AREA>

Append a blank finding with the next free ID (QA-<AREA>-nn) to findings/<area>.md.
AREA is a short upper-case code such as PUB, AUTH, CORE, BILLING.`;

export function newFinding(engDir, areaArg) {
  const area = String(areaArg).toUpperCase();
  if (!/^[A-Z0-9]+$/.test(area)) throw new Error('AREA must be letters and digits only, e.g. AUTH');
  if (!fs.existsSync(engDir)) throw new Error(`Engagement folder not found: ${engDir}`);
  const dir = path.join(engDir, 'findings');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${area.toLowerCase()}.md`);
  const { findings } = loadFindings(engDir);
  const prefix = `QA-${area}-`;
  const max = findings.filter((f) => f.id.startsWith(prefix)).reduce((m, f) => Math.max(m, Number(f.id.slice(prefix.length)) || 0), 0);
  const id = `${prefix}${String(max + 1).padStart(2, '0')}`;
  const block = `### ${id} — <short title naming the symptom>
- **Severity:** <Critical | High | Medium | Low>
- **Priority:** <P1 | P2 | P3 | P4>
- **Status:** Unconfirmed
- **Category:** <Functional | UX | Content | Accessibility | Performance | Security | Compatibility>
- **Where:** <url> · <desktop 1440 | mobile 390> · Chromium
- **What the user experiences:** <1-3 plain sentences>
- **Steps to reproduce:**
  1. <step>
- **Expected:** <what should happen>
- **Actual:** <what happens, with any error text>
- **Evidence:** \`evidence/${id.toLowerCase()}.png\`
`;
  let text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : `# Findings — ${area}\n`;
  text = text.replace(/\s*$/, '\n\n') + block;
  fs.writeFileSync(file, text);
  ok(`Added ${id} to ${show(file)}`);
  step('Fill in every <...>, save the screenshot as the Evidence path, then run oqa lint.');
  return id;
}
