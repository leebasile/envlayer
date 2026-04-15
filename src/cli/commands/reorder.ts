import fs from 'fs';
import path from 'path';
import { CommandModule } from 'yargs';
import { ReorderOptions, ReorderResult } from './reorder.types';
import { formatReorderText, formatReorderJson } from './reorder.formatter';

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
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
}

export function reorderEnvKeys(
  map: Map<string, string>,
  keys: string[],
  position: 'top' | 'bottom'
): { result: Map<string, string>; moved: number } {
  const originalOrder = Array.from(map.keys());
  const validKeys = keys.filter((k) => map.has(k));
  const remaining = originalOrder.filter((k) => !validKeys.includes(k));

  const newOrder =
    position === 'top' ? [...validKeys, ...remaining] : [...remaining, ...validKeys];

  const result = new Map<string, string>();
  for (const key of newOrder) {
    result.set(key, map.get(key)!);
  }

  return { result, moved: validKeys.length };
}

export function buildReorderCommand(): CommandModule {
  return {
    command: 'reorder <file>',
    describe: 'Reorder keys in an env file to the top or bottom',
    builder: (yargs) =>
      yargs
        .positional('file', { type: 'string', demandOption: true })
        .option('keys', { type: 'array', string: true, demandOption: true, alias: 'k' })
        .option('position', {
          choices: ['top', 'bottom'] as const,
          default: 'top' as const,
          alias: 'p',
        })
        .option('output', { type: 'string', alias: 'o' })
        .option('format', { choices: ['text', 'json'] as const, default: 'text' as const }),
    handler: (argv) => {
      const filePath = path.resolve(argv.file as string);
      const content = fs.readFileSync(filePath, 'utf-8');
      const map = parseEnvFile(content);
      const originalOrder = Array.from(map.keys());

      const opts = argv as unknown as ReorderOptions & { file: string };
      const { result, moved } = reorderEnvKeys(map, opts.keys, opts.position);

      const reorderResult: ReorderResult = {
        file: filePath,
        originalOrder,
        newOrder: Array.from(result.keys()),
        moved,
      };

      const outPath = opts.output ? path.resolve(opts.output) : filePath;
      fs.writeFileSync(outPath, serializeEnvMap(result), 'utf-8');

      const output =
        opts.format === 'json'
          ? formatReorderJson(reorderResult)
          : formatReorderText(reorderResult);
      console.log(output);
    },
  };
}
