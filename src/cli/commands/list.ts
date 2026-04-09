import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

export interface EnvEntry {
  key: string;
  value: string;
  file: string;
}

export function parseEnvFileEntries(filePath: string): EnvEntry[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = dotenv.parse(content);
  return Object.entries(parsed).map(([key, value]) => ({
    key,
    value,
    file: path.basename(filePath),
  }));
}

export function formatEnvTable(entries: EnvEntry[], maskValues: boolean): string {
  if (entries.length === 0) {
    return 'No environment variables found.';
  }
  const header = `${'KEY'.padEnd(30)} ${'VALUE'.padEnd(30)} FILE`;
  const separator = '-'.repeat(75);
  const rows = entries.map((e) => {
    const displayValue = maskValues
      ? e.value.length > 0
        ? '***'
        : '(empty)'
      : e.value || '(empty)';
    return `${e.key.padEnd(30)} ${displayValue.padEnd(30)} ${e.file}`;
  });
  return [header, separator, ...rows].join('\n');
}

export function buildListCommand(): Command {
  const cmd = new Command('list');
  cmd
    .description('List all environment variables from one or more .env files')
    .argument('[files...]', '.env files to list', ['.env'])
    .option('-m, --mask', 'mask variable values', false)
    .option('--json', 'output as JSON', false)
    .action((files: string[], options: { mask: boolean; json: boolean }) => {
      const allEntries: EnvEntry[] = [];
      for (const file of files) {
        const entries = parseEnvFileEntries(file);
        allEntries.push(...entries);
      }
      if (options.json) {
        const output = options.mask
          ? allEntries.map((e) => ({ ...e, value: e.value.length > 0 ? '***' : '' }))
          : allEntries;
        console.log(JSON.stringify(output, null, 2));
      } else {
        console.log(formatEnvTable(allEntries, options.mask));
      }
    });
  return cmd;
}
