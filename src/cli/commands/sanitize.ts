import { Command } from 'commander';
import fs from 'fs';
import path from 'path';

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

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
}

export interface SanitizeResult {
  removed: string[];
  sanitized: Map<string, string>;
}

export function sanitizeEnvFile(
  map: Map<string, string>,
  patterns: RegExp[]
): SanitizeResult {
  const removed: string[] = [];
  const sanitized = new Map<string, string>();
  for (const [key, value] of map.entries()) {
    const matches = patterns.some((p) => p.test(key) || p.test(value));
    if (matches) {
      removed.push(key);
    } else {
      sanitized.set(key, value);
    }
  }
  return { removed, sanitized };
}

export function buildSanitizeCommand(): Command {
  const cmd = new Command('sanitize');
  cmd
    .description('Remove sensitive or unwanted keys from an env file')
    .argument('<file>', 'Path to the .env file')
    .option('-p, --pattern <patterns...>', 'Regex patterns to match keys/values for removal')
    .option('-o, --output <file>', 'Output file (defaults to overwriting input)')
    .option('--format <fmt>', 'Output format: text | json', 'text')
    .action((file: string, opts: { pattern?: string[]; output?: string; format: string }) => {
      const absFile = path.resolve(file);
      const map = parseEnvFile(absFile);
      const patterns = (opts.pattern ?? ['password', 'secret', 'token', 'key']).map(
        (p) => new RegExp(p, 'i')
      );
      const { removed, sanitized } = sanitizeEnvFile(map, patterns);
      const outPath = opts.output ? path.resolve(opts.output) : absFile;
      fs.writeFileSync(outPath, serializeEnvMap(sanitized), 'utf-8');
      if (opts.format === 'json') {
        console.log(JSON.stringify({ removed, total: sanitized.size }, null, 2));
      } else {
        if (removed.length === 0) {
          console.log('No keys removed.');
        } else {
          console.log(`Removed ${removed.length} key(s): ${removed.join(', ')}`);
        }
        console.log(`Sanitized file written to: ${outPath}`);
      }
    });
  return cmd;
}
