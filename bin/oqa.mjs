#!/usr/bin/env node
import { c, bad, parseArgs, UsageError } from '../lib/ui.mjs';

const COMMANDS = {
  doctor: { summary: 'check Node, Playwright and the browsers are ready', spec: {} },
  init: { summary: 'create an engagement folder from the template', spec: { url: 'string', mode: 'string', root: 'string' } },
  login: { summary: 'sign in by hand once and save the session for other commands', spec: { save: 'string' } },
  recon: { summary: 'crawl a site and list every route found', spec: { out: 'string', 'max-pages': 'number', auth: 'string', shots: 'boolean', browser: 'string' } },
  scan: { summary: 'run automated checks and write candidate findings', spec: { from: 'string', out: 'string', auth: 'string', browser: 'string' } },
  lint: { summary: 'check every finding is complete and its evidence exists', spec: {} },
  report: { summary: 'build report.html (and report.pdf) from an engagement', spec: { pdf: 'boolean', title: 'string', 'include-candidates': 'boolean' } },
  'new-finding': { summary: 'append a blank finding with the next free ID', spec: {} },
  export: { summary: 'export findings as CSV or GitHub issue files (never sends anything)', spec: { format: 'string', out: 'string', 'include-candidates': 'boolean' } },
};

function mainHelp() {
  const w = Math.max(...Object.keys(COMMANDS).map((k) => k.length));
  return `${c.bold('oqa')} — open-qa-harness command line

Usage: oqa <command> [options]     (oqa <command> --help for details)

Commands:
${Object.entries(COMMANDS)
  .map(([k, v]) => `  ${k.padEnd(w)}  ${v.summary}`)
  .join('\n')}

Start here (from a clone, "oqa" is "node bin/oqa.mjs" or "npm run oqa --"):
  npm run demo                          # a small app with planted bugs, on http://localhost:4173
  oqa doctor
  oqa init my-first --url http://localhost:4173
  oqa recon http://localhost:4173 --out engagements/my-first

recon and scan take --browser chromium|firefox|webkit (default chromium).

Only test systems you are authorised to test.`;
}

async function run(argv) {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    console.log(mainHelp());
    return 0;
  }
  if (cmd === '--version' || cmd === '-v') {
    const { createRequire } = await import('node:module');
    console.log(createRequire(import.meta.url)('../package.json').version);
    return 0;
  }
  const def = COMMANDS[cmd];
  if (!def) throw new UsageError(`Unknown command "${cmd}". Run: oqa --help`);
  const { opts, positional } = parseArgs(rest, def.spec);

  switch (cmd) {
    case 'doctor': {
      const m = await import('../lib/doctor.mjs');
      if (opts.help) return say(m.doctorHelp);
      return m.doctor();
    }
    case 'init': {
      const m = await import('../lib/init.mjs');
      if (opts.help) return say(m.initHelp);
      need(positional[0], 'a name', m.initHelp);
      m.init(positional[0], opts);
      return 0;
    }
    case 'login': {
      const m = await import('../lib/login.mjs');
      if (opts.help) return say(m.loginHelp);
      need(positional[0], 'a URL', m.loginHelp);
      await m.login(positional[0], opts);
      return 0;
    }
    case 'recon': {
      const m = await import('../lib/recon.mjs');
      if (opts.help) return say(m.reconHelp);
      need(positional[0], 'a URL', m.reconHelp);
      await m.recon(positional[0], opts);
      return 0;
    }
    case 'scan': {
      const m = await import('../lib/scan.mjs');
      if (opts.help) return say(m.scanHelp);
      if (!positional.length && !opts.from) throw new UsageError(`Give one or more URLs, or --from recon.json\n\n${m.scanHelp}`);
      await m.scan(positional, opts);
      return 0;
    }
    case 'lint': {
      const m = await import('../lib/lint.mjs');
      if (opts.help) return say(m.lintHelp);
      need(positional[0], 'an engagement folder', m.lintHelp);
      return m.lintCommand(positional[0]);
    }
    case 'report': {
      const m = await import('../lib/report.mjs');
      if (opts.help) return say(m.reportHelp);
      need(positional[0], 'an engagement folder', m.reportHelp);
      await m.report(positional[0], opts);
      return 0;
    }
    case 'new-finding': {
      const m = await import('../lib/newfinding.mjs');
      if (opts.help) return say(m.newFindingHelp);
      need(positional[0], 'an engagement folder', m.newFindingHelp);
      need(positional[1], 'an AREA (e.g. AUTH)', m.newFindingHelp);
      m.newFinding(positional[0], positional[1]);
      return 0;
    }
    case 'export': {
      const m = await import('../lib/export.mjs');
      if (opts.help) return say(m.exportHelp);
      need(positional[0], 'an engagement folder', m.exportHelp);
      m.exportFindings(positional[0], opts);
      return 0;
    }
  }
  return 0;
}

function say(text) {
  console.log(text);
  return 0;
}

function need(v, what, help) {
  if (!v) throw new UsageError(`Missing ${what}.\n\n${help}`);
}

run(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code || 0;
  },
  (err) => {
    if (err instanceof UsageError) {
      bad(err.message);
      process.exitCode = 2;
      return;
    }
    bad(err.message || String(err));
    if (process.env.OQA_DEBUG) console.error(err.stack);
    process.exitCode = err.exitCode || 1;
  },
);
