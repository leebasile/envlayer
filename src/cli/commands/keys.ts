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
    if (key) map.set(key, value);
  }
  return map;
}

export interface KeysResult {
  file: string;
  keys: string[];
  total: number;
}

export function listEnvKeys(filePath: string, pattern?: string): KeysResult {
  const map = parseEnvFile(filePath);
  let keys = Array.from(map.keys());
  if (pattern) {
    const regex = new RegExp(pattern, 'i');
    keys = keys.filter((k) => regex.test(k));
  }
  return {
    file: path.resolve(filePath),
    keys,
    total: keys.length,
  };
}

export function buildKeysCommand(): Command {
  const cmd = new Command('keys');
  cmd
    .description('List all keys in an env file')
    .argument('<file>', 'Path to the .env file')
    .option('-p, --pattern <regex>', 'Filter keys by regex pattern')
    .option('-j, --json', 'Output as JSON')
    .option('-c, --count', 'Show only the count of keys')
    .action((file: string, options: { pattern?: string; json?: boolean; count?: boolean }) => {
      const result = listEnvKeys(file, options.pattern);
      if (options.count) {
        console.log(String(result.total));
        return;
      }
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      if (result.keys.length === 0) {
        console.log('No keys found.');
        return;
      }
      result.keys.forEach((k) => console.log(k));
    });
  return cmd;
}
