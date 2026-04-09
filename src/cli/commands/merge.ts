import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { parseEnvFileEntries } from './list';

export type MergeStrategy = 'base-wins' | 'override-wins';

export function mergeEnvFiles(
  baseFile: string,
  overrideFile: string,
  strategy: MergeStrategy = 'override-wins'
): Map<string, string> {
  const baseEntries = new Map(parseEnvFileEntries(baseFile));
  const overrideEntries = new Map(parseEnvFileEntries(overrideFile));

  const merged = new Map<string, string>(baseEntries);

  for (const [key, value] of overrideEntries) {
    if (strategy === 'override-wins' || !merged.has(key)) {
      merged.set(key, value);
    }
  }

  return merged;
}

export function serializeEnvMap(entries: Map<string, string>): string {
  return Array.from(entries.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

export function buildMergeCommand(): Command {
  const cmd = new Command('merge');

  cmd
    .description('Merge two .env files into one')
    .argument('<base>', 'Base .env file')
    .argument('<override>', 'Override .env file (applied on top of base)')
    .option('-o, --output <output>', 'Output file path (defaults to stdout)')
    .option(
      '-s, --strategy <strategy>',
      'Merge strategy: override-wins | base-wins',
      'override-wins'
    )
    .action((base: string, override: string, options: { output?: string; strategy: string }) => {
      const basePath = path.resolve(base);
      const overridePath = path.resolve(override);

      for (const [label, p] of [['base', basePath], ['override', overridePath]] as const) {
        if (!fs.existsSync(p)) {
          console.error(`Error: ${label} file not found: ${p}`);
          process.exit(1);
        }
      }

      const strategy = options.strategy as MergeStrategy;
      const merged = mergeEnvFiles(basePath, overridePath, strategy);
      const output = serializeEnvMap(merged);

      if (options.output) {
        const outPath = path.resolve(options.output);
        fs.writeFileSync(outPath, output, 'utf-8');
        console.log(`Merged env written to ${outPath}`);
      } else {
        console.log(output);
      }
    });

  return cmd;
}
