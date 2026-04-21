import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

export function parseEnvFile(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    map.set(key, value);
  }
  return map;
}

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
}

export interface TruncateResult {
  key: string;
  original: string;
  truncated: string;
}

export function truncateEnvValues(
  map: Map<string, string>,
  maxLength: number
): { result: Map<string, string>; changes: TruncateResult[] } {
  const result = new Map<string, string>();
  const changes: TruncateResult[] = [];

  for (const [key, value] of map.entries()) {
    if (value.length > maxLength) {
      const truncated = value.slice(0, maxLength);
      result.set(key, truncated);
      changes.push({ key, original: value, truncated });
    } else {
      result.set(key, value);
    }
  }

  return { result, changes };
}

export function buildTruncateCommand(): Command {
  return new Command('truncate')
    .description('Truncate env variable values to a maximum length')
    .argument('<file>', 'Path to the .env file')
    .option('-n, --max-length <number>', 'Maximum value length', '64')
    .option('-o, --output <file>', 'Output file (defaults to overwriting input)')
    .option('--json', 'Output result as JSON')
    .action((file: string, options: { maxLength: string; output?: string; json?: boolean }) => {
      const filePath = path.resolve(file);
      const maxLength = parseInt(options.maxLength, 10);

      if (isNaN(maxLength) || maxLength <= 0) {
        console.error('Error: --max-length must be a positive integer');
        process.exit(1);
      }

      const map = parseEnvFile(filePath);
      const { result, changes } = truncateEnvValues(map, maxLength);
      const outPath = options.output ? path.resolve(options.output) : filePath;

      fs.writeFileSync(outPath, serializeEnvMap(result), 'utf-8');

      if (options.json) {
        console.log(JSON.stringify({ truncated: changes.length, changes }, null, 2));
      } else {
        if (changes.length === 0) {
          console.log('No values needed truncation.');
        } else {
          console.log(`Truncated ${changes.length} value(s) to max length ${maxLength}:`);
          for (const c of changes) {
            console.log(`  ${c.key}: "${c.original}" → "${c.truncated}"`);
          }
        }
      }
    });
}
