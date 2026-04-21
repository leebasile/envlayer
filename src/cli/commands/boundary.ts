import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

export interface BoundaryResult {
  file: string;
  allowed: string[];
  forbidden: string[];
  violations: string[];
}

export function parseEnvFile(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    map.set(key, value);
  }
  return map;
}

export function checkBoundary(
  envMap: Map<string, string>,
  allowedPrefixes: string[],
  forbiddenPrefixes: string[]
): { violations: string[]; allowed: string[]; forbidden: string[] } {
  const violations: string[] = [];
  const allowed: string[] = [];
  const forbidden: string[] = [];

  for (const key of envMap.keys()) {
    const isForbidden = forbiddenPrefixes.some((p) => key.startsWith(p));
    const isAllowed =
      allowedPrefixes.length === 0 ||
      allowedPrefixes.some((p) => key.startsWith(p));

    if (isForbidden) {
      forbidden.push(key);
      violations.push(key);
    } else if (!isAllowed) {
      violations.push(key);
    } else {
      allowed.push(key);
    }
  }

  return { violations, allowed, forbidden };
}

export function buildBoundaryCommand(): Command {
  const cmd = new Command('boundary');
  cmd
    .description('Check that env keys conform to prefix boundary rules')
    .argument('<file>', 'Path to .env file')
    .option('--allow <prefixes>', 'Comma-separated list of allowed key prefixes')
    .option('--forbid <prefixes>', 'Comma-separated list of forbidden key prefixes')
    .option('--format <fmt>', 'Output format: text or json', 'text')
    .action((file: string, opts) => {
      const resolved = path.resolve(file);
      const envMap = parseEnvFile(resolved);
      const allowedPrefixes = opts.allow ? opts.allow.split(',').map((s: string) => s.trim()) : [];
      const forbiddenPrefixes = opts.forbid ? opts.forbid.split(',').map((s: string) => s.trim()) : [];

      const { violations, allowed, forbidden } = checkBoundary(envMap, allowedPrefixes, forbiddenPrefixes);

      const result: BoundaryResult = { file: resolved, allowed, forbidden, violations };

      if (opts.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        if (violations.length === 0) {
          console.log(`✔ All keys in ${file} satisfy boundary rules.`);
        } else {
          console.log(`✖ ${violations.length} boundary violation(s) in ${file}:`);
          for (const v of violations) console.log(`  - ${v}`);
        }
      }

      if (violations.length > 0) process.exit(1);
    });
  return cmd;
}
