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

export interface MissingResult {
  file: string;
  missingKeys: string[];
  presentKeys: string[];
  totalRequired: number;
}

export function findMissingKeys(
  filePath: string,
  requiredKeys: string[]
): MissingResult {
  const env = parseEnvFile(filePath);
  const missingKeys: string[] = [];
  const presentKeys: string[] = [];

  for (const key of requiredKeys) {
    if (env.has(key) && env.get(key) !== '') {
      presentKeys.push(key);
    } else {
      missingKeys.push(key);
    }
  }

  return {
    file: path.resolve(filePath),
    missingKeys,
    presentKeys,
    totalRequired: requiredKeys.length,
  };
}

export function buildMissingCommand(): Command {
  const cmd = new Command('missing');
  cmd
    .description('Report keys missing from an env file compared to a reference list')
    .argument('<file>', 'env file to check')
    .requiredOption('-k, --keys <keys...>', 'required keys to check for')
    .option('-f, --format <format>', 'output format: text | json', 'text')
    .option('--fail', 'exit with non-zero code if any keys are missing', false)
    .action((file: string, opts: { keys: string[]; format: string; fail: boolean }) => {
      const result = findMissingKeys(file, opts.keys);

      if (opts.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        if (result.missingKeys.length === 0) {
          console.log(`✔ All ${result.totalRequired} required keys are present in ${file}`);
        } else {
          console.log(`✖ Missing ${result.missingKeys.length}/${result.totalRequired} keys in ${file}:`);
          for (const key of result.missingKeys) {
            console.log(`  - ${key}`);
          }
        }
      }

      if (opts.fail && result.missingKeys.length > 0) {
        process.exit(1);
      }
    });

  return cmd;
}
