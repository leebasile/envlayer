import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { PlaceholderEntry, PlaceholderResult } from './placeholder.types';

const PLACEHOLDER_PATTERN = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(CHANGE_ME|TODO|PLACEHOLDER|FIXME|<[^>]+>)\s*$/;

export function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    map.set(key, value);
  }
  return map;
}

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
}

export function findPlaceholders(content: string): PlaceholderEntry[] {
  const entries: PlaceholderEntry[] = [];
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const match = PLACEHOLDER_PATTERN.exec(line);
    if (match) {
      entries.push({ key: match[1], placeholder: match[2], line: idx + 1 });
    }
  });
  return entries;
}

export function replacePlaceholders(
  filePath: string,
  replacements: Record<string, string>
): PlaceholderResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const found = findPlaceholders(content);
  const map = parseEnvFile(content);
  let replaced = 0;
  let skipped = 0;

  for (const entry of found) {
    if (replacements[entry.key] !== undefined) {
      map.set(entry.key, replacements[entry.key]);
      replaced++;
    } else {
      skipped++;
    }
  }

  if (replaced > 0) {
    fs.writeFileSync(filePath, serializeEnvMap(map), 'utf-8');
  }

  return { file: path.resolve(filePath), found, replaced, skipped };
}

export function buildPlaceholderCommand(): Command {
  const cmd = new Command('placeholder');
  cmd
    .description('Find or replace placeholder values in an env file')
    .argument('<file>', 'Path to the .env file')
    .option('--replace <pairs...>', 'KEY=VALUE pairs to replace placeholders')
    .option('--format <fmt>', 'Output format: text or json', 'text')
    .action((file: string, opts: { replace?: string[]; format: string }) => {
      const content = fs.readFileSync(file, 'utf-8');
      const found = findPlaceholders(content);

      if (!opts.replace || opts.replace.length === 0) {
        if (opts.format === 'json') {
          console.log(JSON.stringify({ file, found }, null, 2));
        } else {
          if (found.length === 0) {
            console.log(`No placeholders found in ${file}`);
          } else {
            console.log(`Found ${found.length} placeholder(s) in ${file}:`);
            for (const e of found) {
              console.log(`  Line ${e.line}: ${e.key}=${e.placeholder}`);
            }
          }
        }
        return;
      }

      const replacements: Record<string, string> = {};
      for (const pair of opts.replace) {
        const idx = pair.indexOf('=');
        if (idx === -1) continue;
        replacements[pair.slice(0, idx)] = pair.slice(idx + 1);
      }

      const result = replacePlaceholders(file, replacements);
      if (opts.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Replaced ${result.replaced} placeholder(s), skipped ${result.skipped} in ${file}`);
      }
    });
  return cmd;
}
