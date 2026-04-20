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

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
}

export function intersectEnvFiles(
  files: string[]
): { keys: string[]; map: Map<string, string> } {
  if (files.length === 0) return { keys: [], map: new Map() };

  const maps = files.map(parseEnvFile);
  const [first, ...rest] = maps;

  const commonKeys = Array.from(first.keys()).filter((key) =>
    rest.every((m) => m.has(key))
  );

  const result = new Map<string, string>();
  for (const key of commonKeys) {
    result.set(key, first.get(key)!);
  }

  return { keys: commonKeys, map: result };
}

export function buildIntersectCommand(): Command {
  const cmd = new Command('intersect');
  cmd
    .description('Output keys that exist in ALL provided .env files')
    .argument('<files...>', '.env files to intersect')
    .option('-o, --output <file>', 'write result to file instead of stdout')
    .option('--format <fmt>', 'output format: text or json', 'text')
    .action((files: string[], opts) => {
      const resolved = files.map((f) => path.resolve(f));
      const { keys, map } = intersectEnvFiles(resolved);

      if (opts.format === 'json') {
        const out = JSON.stringify(
          { count: keys.length, keys, entries: Object.fromEntries(map) },
          null,
          2
        );
        if (opts.output) {
          fs.writeFileSync(path.resolve(opts.output), out + '\n');
          console.log(`Wrote ${keys.length} intersecting key(s) to ${opts.output}`);
        } else {
          console.log(out);
        }
        return;
      }

      const serialized = serializeEnvMap(map);
      if (opts.output) {
        fs.writeFileSync(path.resolve(opts.output), serialized);
        console.log(`Wrote ${keys.length} intersecting key(s) to ${opts.output}`);
      } else {
        if (keys.length === 0) {
          console.log('No common keys found.');
        } else {
          process.stdout.write(serialized);
        }
      }
    });
  return cmd;
}
