import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

export interface EnvDiff {
  added: string[];
  removed: string[];
  changed: string[];
}

export function diffEnvFiles(
  baseVars: Record<string, string>,
  targetVars: Record<string, string>
): EnvDiff {
  const baseKeys = new Set(Object.keys(baseVars));
  const targetKeys = new Set(Object.keys(targetVars));

  const added = [...targetKeys].filter((k) => !baseKeys.has(k));
  const removed = [...baseKeys].filter((k) => !targetKeys.has(k));
  const changed = [...baseKeys].filter(
    (k) => targetKeys.has(k) && baseVars[k] !== targetVars[k]
  );

  return { added, removed, changed };
}

export function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = dotenv.parse(content);
  return parsed as Record<string, string>;
}

export function buildDiffCommand(): Command {
  const cmd = new Command('diff');

  cmd
    .description('Show differences between two environment files')
    .argument('<base>', 'Base environment file')
    .argument('<target>', 'Target environment file')
    .option('--keys-only', 'Only show key names without values')
    .action((base: string, target: string, options: { keysOnly?: boolean }) => {
      try {
        const baseVars = parseEnvFile(path.resolve(base));
        const targetVars = parseEnvFile(path.resolve(target));
        const diff = diffEnvFiles(baseVars, targetVars);

        if (diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0) {
          console.log('No differences found.');
          return;
        }

        if (diff.added.length > 0) {
          console.log('\n+ Added:');
          diff.added.forEach((k) => {
            const val = options.keysOnly ? '' : ` = ${targetVars[k]}`;
            console.log(`  + ${k}${val}`);
          });
        }

        if (diff.removed.length > 0) {
          console.log('\n- Removed:');
          diff.removed.forEach((k) => {
            const val = options.keysOnly ? '' : ` = ${baseVars[k]}`;
            console.log(`  - ${k}${val}`);
          });
        }

        if (diff.changed.length > 0) {
          console.log('\n~ Changed:');
          diff.changed.forEach((k) => {
            if (options.keysOnly) {
              console.log(`  ~ ${k}`);
            } else {
              console.log(`  ~ ${k}: ${baseVars[k]} -> ${targetVars[k]}`);
            }
          });
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  return cmd;
}
