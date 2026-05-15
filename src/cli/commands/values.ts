import { Command } from 'commander';
import fs from 'fs';

export function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    map.set(key, value);
  }
  return map;
}

export interface ValuesResult {
  file: string;
  values: string[];
  total: number;
}

export function listEnvValues(filePath: string, opts: { unique?: boolean; sort?: boolean } = {}): ValuesResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const map = parseEnvFile(content);
  let values = Array.from(map.values());
  if (opts.unique) {
    values = [...new Set(values)];
  }
  if (opts.sort) {
    values = values.slice().sort();
  }
  return { file: filePath, values, total: values.length };
}

export function buildValuesCommand(): Command {
  const cmd = new Command('values');
  cmd
    .description('List all values from an env file')
    .argument('<file>', 'Path to the .env file')
    .option('-u, --unique', 'Show only unique values')
    .option('-s, --sort', 'Sort values alphabetically')
    .option('--json', 'Output as JSON')
    .action((file: string, opts: { unique?: boolean; sort?: boolean; json?: boolean }) => {
      const result = listEnvValues(file, { unique: opts.unique, sort: opts.sort });
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        result.values.forEach(v => console.log(v));
        console.error(`\nTotal: ${result.total}`);
      }
    });
  return cmd;
}
