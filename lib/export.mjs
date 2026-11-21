import fs from 'node:fs';
import path from 'node:path';
import { loadFindings, sortFindings } from './findings.mjs';
import { UsageError, ok, step, show } from './ui.mjs';

export const FORMATS = ['csv', 'github'];

export const exportHelp = `Usage: oqa export <engagement-dir> --format csv|github [--out <file|dir>]

Turn findings/*.md into something a team's tracker takes in. Nothing is sent anywhere:
this command only writes files.

  --format csv      one row per finding (RFC 4180): ID, Title, Severity, Priority, Status,
                    Category, Where, User impact, Steps (joined by " / "), Expected, Actual,
                    Evidence. Opens in a spreadsheet; imports into Jira, Linear and others.
                    Default --out: <engagement-dir>/export/findings.csv
  --format github   a folder with one issue body (.md) per finding and create-issues.sh.
                    YOU read the script and run it (GH_REPO=owner/repo bash create-issues.sh);
                    it calls the GitHub CLI once per finding:
                    gh issue create --title "[ID] title" --body-file ... --label "qa,severity:<s>"
                    Default --out: <engagement-dir>/export/github-issues/
  --include-candidates   also export findings/scan-candidates.md (left out by default:
                    candidates are unconfirmed leads, not findings)

Run oqa lint first: export reads whatever is in the files.`;

const CSV_COLUMNS = ['ID', 'Title', 'Severity', 'Priority', 'Status', 'Category', 'Where', 'User impact', 'Steps', 'Expected', 'Actual', 'Evidence'];

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function findingsCsv(findings) {
  const rows = [CSV_COLUMNS];
  for (const f of findings) {
    rows.push([f.id, f.title, f.severity, f.priority, f.status, f.category, f.where, f.experience, f.steps.join(' / '), f.expected, f.actual, f.evidenceText]);
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function issueBody(f) {
  const shots = f.images.length
    ? `\n> Screenshot${f.images.length > 1 ? 's' : ''} to attach (drag into the issue): ${f.images.map((p) => `\`${p}\``).join(', ')}\n`
    : '';
  return `| Severity | Priority | Status | Category |
|---|---|---|---|
| ${f.severity} | ${f.priority} | ${f.status} | ${f.category} |

**Where:** ${f.where}

**What the user experiences:** ${f.experience}

### Steps to reproduce
${f.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

### Expected
${f.expected}

### Actual
${f.actual}

### Evidence
${f.evidenceText}
${shots}
---
Finding ${f.id}, exported by open-qa-harness (oqa export).
`;
}

// POSIX single-quote: safe for any title, including quotes, $ and backticks.
const sq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

export function issuesScript(findings, files) {
  const sevs = [...new Set(findings.map((f) => f.severity.toLowerCase()))];
  return `#!/usr/bin/env bash
# Creates one GitHub issue per finding with the GitHub CLI (https://cli.github.com).
# oqa wrote this file and did not run it. Read it, then run it yourself, naming the repo:
#   GH_REPO=owner/repo bash create-issues.sh
set -euo pipefail
: "\${GH_REPO:?set GH_REPO=owner/repo, the repository to file these issues in}"
export GH_REPO
D="$(cd "$(dirname "$0")" && pwd)"

# Labels must exist before issues can use them (--force updates them if they already exist).
gh label create qa --color 5319e7 --description "Found in QA" --force
${sevs.map((s) => `gh label create ${sq(`severity:${s}`)} --color ${{ critical: 'b60205', high: 'd93f0b', medium: 'fbca04', low: 'c2e0c6' }[s] || 'ededed'} --force`).join('\n')}

${findings.map((f, i) => `gh issue create --title ${sq(`[${f.id}] ${f.title}`)} --body-file "$D"/${sq(files[i])} --label ${sq(`qa,severity:${f.severity.toLowerCase()}`)}`).join('\n')}
`;
}

export function exportFindings(engDir, opts = {}) {
  const format = String(opts.format || '').toLowerCase();
  if (!FORMATS.includes(format)) throw new UsageError(`--format must be one of: ${FORMATS.join(', ')}\n\n${exportHelp}`);
  if (!fs.existsSync(engDir)) throw new Error(`Engagement folder not found: ${engDir}`);
  const findings = sortFindings(loadFindings(engDir, { includeCandidates: !!opts.includeCandidates }).findings);
  if (!findings.length) throw new Error(`No findings in ${path.join(engDir, 'findings')}`);

  if (format === 'csv') {
    const file = path.resolve(opts.out || path.join(engDir, 'export', 'findings.csv'));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, findingsCsv(findings));
    ok(`${findings.length} finding(s) written to ${show(file)}`);
    return { file, count: findings.length };
  }

  const dir = path.resolve(opts.out || path.join(engDir, 'export', 'github-issues'));
  fs.mkdirSync(dir, { recursive: true });
  const files = findings.map((f) => `${f.id}.md`);
  findings.forEach((f, i) => fs.writeFileSync(path.join(dir, files[i]), issueBody(f)));
  const script = path.join(dir, 'create-issues.sh');
  fs.writeFileSync(script, issuesScript(findings, files), { mode: 0o755 });
  ok(`${findings.length} issue bod${findings.length === 1 ? 'y' : 'ies'} and create-issues.sh written to ${show(dir)}`);
  step('Nothing was sent. Read create-issues.sh, then run: GH_REPO=owner/repo bash create-issues.sh (needs gh, signed in).');
  return { dir, count: findings.length };
}
