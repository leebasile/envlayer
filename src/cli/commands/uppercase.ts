import * as fs from 'fs';
import * as path from 'path';
import { Argv, ArgumentsCamelCase } from 'yargs';

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

export interface UppercaseResult {
  changed: string[];
  unchanged: string[];
  total: number;
}

export function uppercaseEnvKeys(
  inputPath: string,
  outputPath: string
): UppercaseResult {
  const map = parseEnvFile(inputPath);
  const newMap = new Map<string, string>();
  const changed: string[] = [];
  const unchanged: string[] = [];

  for (const [key, value] of map.entries()) {
    const upper = key.toUpperCase();
    if (upper !== key) {
      changed.push(key);
    } else {
      unchanged.push(key);
    }
    newMap.set(upper, value);
  }

  fs.writeFileSync(outputPath, serializeEnvMap(newMap), 'utf-8');
  return { changed, unchanged, total: map.size };
}

export function buildUppercaseCommand(yargs: Argv): Argv {
  return yargs.command(
    'uppercase <file>',
    'Convert all env variable keys to uppercase',
    (y) =>
      y
        .positional('file', {
          describe: 'Path to the .env file',
          type: 'string',
          demandOption: true,
        })
        .option('output', {
          alias: 'o',
          type: 'string',
          describe: 'Output file path (defaults to input file)',
        })
        .option('json', {
          type: 'boolean',
          default: false,
          describe: 'Output result as JSON',
        }),
    (argv: ArgumentsCamelCase<{ file: string; output?: string; json: boolean }>) => {
      const inputPath = path.resolve(argv.file);
      const outputPath = path.resolve(argv.output ?? argv.file);
      const result = uppercaseEnvKeys(inputPath, outputPath);
      if (argv.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Processed ${result.total} keys.`);
        if (result.changed.length > 0) {
          console.log(`Uppercased: ${result.changed.join(', ')}`);
        } else {
          console.log('All keys were already uppercase.');
        }
      }
    }
  );
}
