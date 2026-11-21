import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { c, ok, step, show } from './ui.mjs';

const TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'engagement');

export const initHelp = `Usage: oqa init <name> [--url <url>] [--mode black-box|white-box] [--root <dir>]

Create engagements/<name>/ from the template: engagement.md, routes.md, coverage.md,
findings/, evidence/, created-items.md, sends.md, verification.md, report/.

Options:
  --url <url>     the app you will test (written into engagement.md)
  --mode <mode>   black-box (URL only, default) or white-box (you also have the code)
  --root <dir>    folder that holds engagements/ (default: current folder)`;

export function init(name, opts = {}) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) throw new Error(`Name "${name}" may only use letters, numbers, dot, dash and underscore.`);
  const mode = opts.mode || 'black-box';
  if (!['black-box', 'white-box'].includes(mode)) throw new Error('--mode must be black-box or white-box');
  const root = path.resolve(opts.root || '.');
  const dest = path.join(root, 'engagements', name);
  if (fs.existsSync(dest)) throw new Error(`${show(dest)} already exists. Pick another name or delete it first.`);
  const url = opts.url || '<the URL you will test>';

  copyDir(TEMPLATE, dest, (text) => text.replaceAll('{{NAME}}', name).replaceAll('{{URL}}', url));
  for (const d of ['evidence', 'report', 'findings']) fs.mkdirSync(path.join(dest, d), { recursive: true });
  const eng = path.join(dest, 'engagement.md');
  if (fs.existsSync(eng)) {
    const t = fs.readFileSync(eng, 'utf8');
    const modeLine = mode === 'black-box' ? '- **Mode:** black-box (URL only)' : '- **Mode:** white-box (code repo at: `…`)';
    fs.writeFileSync(eng, t.replace(/^- \*\*Mode:\*\*.*$/m, modeLine));
  }

  ok(`Created ${show(dest)} (${mode})`);
  console.log(`
Next:
  1. Fill in ${c.bold(show(eng))} with the owner of the app. Do not test until every line has an answer.
  2. ${c.bold(`oqa recon ${opts.url || '<url>'} --out ${show(dest)}`)}
  3. ${c.bold(`oqa scan --from ${show(path.join(dest, 'recon.json'))} --out ${show(dest)}`)}
  4. Test each area by hand; write findings with ${c.bold(`oqa new-finding ${show(dest)} AUTH`)}
  5. ${c.bold(`oqa lint ${show(dest)}`)} then ${c.bold(`oqa report ${show(dest)} --pdf`)}`);
  return dest;
}

function copyDir(src, dest, transform) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d, transform);
    else if (e.name.endsWith('.md')) fs.writeFileSync(d, transform(fs.readFileSync(s, 'utf8')));
    else if (e.name !== '.DS_Store') fs.copyFileSync(s, d);
  }
}
