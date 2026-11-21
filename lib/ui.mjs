import path from 'node:path';

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const wrap = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s));

export const c = {
  bold: wrap('1'),
  dim: wrap('2'),
  red: wrap('31'),
  green: wrap('32'),
  yellow: wrap('33'),
  blue: wrap('34'),
  cyan: wrap('36'),
};

export const ok = (msg) => console.log(`${c.green('✓')} ${msg}`);
export const bad = (msg) => console.log(`${c.red('✗')} ${msg}`);
export const warn = (msg) => console.log(`${c.yellow('!')} ${msg}`);
export const info = (msg) => console.log(`${c.cyan('›')} ${msg}`);
export const step = (msg) => console.log(`  ${c.dim('→')} ${msg}`);

export function show(p) {
  const rel = path.relative(process.cwd(), p);
  return !rel ? '.' : rel.startsWith('..') ? p : rel;
}

export class UsageError extends Error {}

// Minimal argv parser. spec: { flagName: 'string' | 'boolean' | 'number' }
export function parseArgs(argv, spec) {
  const opts = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      opts.help = true;
      continue;
    }
    if (a.startsWith('--')) {
      let name = a.slice(2);
      let value;
      const eq = name.indexOf('=');
      if (eq !== -1) {
        value = name.slice(eq + 1);
        name = name.slice(0, eq);
      }
      if (name.startsWith('no-') && spec[name] === undefined && spec[name.slice(3)] === 'boolean') {
        opts[camel(name.slice(3))] = false;
        continue;
      }
      const type = spec[name];
      if (!type) throw new UsageError(`Unknown option --${name}`);
      if (type === 'boolean') {
        opts[camel(name)] = true;
        continue;
      }
      if (value === undefined) {
        value = argv[++i];
        if (value === undefined) throw new UsageError(`--${name} needs a value`);
      }
      if (type === 'number') {
        const n = Number(value);
        if (!Number.isFinite(n)) throw new UsageError(`--${name} must be a number`);
        value = n;
      }
      if (type === 'list') {
        (opts[camel(name)] ||= []).push(value);
        continue;
      }
      opts[camel(name)] = value;
      continue;
    }
    positional.push(a);
  }
  return { opts, positional };
}

function camel(s) {
  return s.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
}

export function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'root';
}
