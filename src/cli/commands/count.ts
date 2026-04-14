import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

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

export interface CountResult {
  file: string;
  total: number;
  empty: number;
  nonEmpty: number;
  commented: number;
}

export function countEnvFile(filePath: string): CountResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let commented = 0;
  let empty = 0;
  let nonEmpty = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      empty++;
    } else if (trimmed.startsWith('#')) {
      commented++;
    } else if (trimmed.includes('=')) {
      const value = trimmed.slice(trimmed.indexOf('=') + 1).trim();
      if (value === '') {
        empty++;
      } else {
        nonEmpty++;
      }
    }
  }

  return {
    file: path.basename(filePath),
    total: nonEmpty + empty,
    empty,
    nonEmpty,
    commented,
  };
}

export function buildCountCommand(): Command {
  return new Command('count')
    .description('Count keys in one or more .env files')
    .argument('<files...>', '.env files to count')
    .option('--json', 'output as JSON')
    .action((files: string[], opts: { json?: boolean }) => {
      const results: CountResult[] = files.map(countEnvFile);

      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }

      for (const r of results) {
        console.log(`${r.file}:`);
        console.log(`  Total keys : ${r.total}`);
        console.log(`  Non-empty  : ${r.nonEmpty}`);
        console.log(`  Empty      : ${r.empty}`);
        console.log(`  Comments   : ${r.commented}`);
      }
    });
}
