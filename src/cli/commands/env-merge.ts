import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

export function parseEnvFile(content: string): Map<string, string> {
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

export interface EnvMergeResult {
  merged: Map<string, string>;
  overridden: string[];
  added: string[];
}

export function mergeEnvFilesDeep(
  base: Map<string, string>,
  overlay: Map<string, string>,
  overwrite: boolean
): EnvMergeResult {
  const merged = new Map(base);
  const overridden: string[] = [];
  const added: string[] = [];

  for (const [key, value] of overlay.entries()) {
    if (merged.has(key)) {
      if (overwrite) {
        merged.set(key, value);
        overridden.push(key);
      }
    } else {
      merged.set(key, value);
      added.push(key);
    }
  }

  return { merged, overridden, added };
}

export function buildEnvMergeCommand(): Command {
  return new Command('env-merge')
    .description('Deep-merge two or more .env files into an output file')
    .argument('<files...>', 'Input .env files (merged left to right)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .option('--overwrite', 'Allow later files to overwrite existing keys', false)
    .option('--format <format>', 'Output format: env | json', 'env')
    .action((files: string[], opts) => {
      let base = new Map<string, string>();
      const allOverridden: string[] = [];
      const allAdded: string[] = [];

      for (const file of files) {
        const content = fs.readFileSync(path.resolve(file), 'utf-8');
        const overlay = parseEnvFile(content);
        const result = mergeEnvFilesDeep(base, overlay, opts.overwrite);
        base = result.merged;
        allOverridden.push(...result.overridden);
        allAdded.push(...result.added);
      }

      let output: string;
      if (opts.format === 'json') {
        output = JSON.stringify(Object.fromEntries(base), null, 2);
      } else {
        output = serializeEnvMap(base);
      }

      if (opts.output) {
        fs.writeFileSync(path.resolve(opts.output), output, 'utf-8');
        console.log(`Merged ${files.length} file(s) → ${opts.output}`);
        if (allAdded.length) console.log(`  Added: ${allAdded.join(', ')}`);
        if (allOverridden.length) console.log(`  Overridden: ${allOverridden.join(', ')}`);
      } else {
        process.stdout.write(output);
      }
    });
}
