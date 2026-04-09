import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { parseEnvFile } from './diff';

export function copyEnvFile(
  sourcePath: string,
  destPath: string,
  options: { overwrite?: boolean; keys?: string[] }
): { copied: string[]; skipped: string[] } {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }

  const sourceEntries = parseEnvFile(fs.readFileSync(sourcePath, 'utf-8'));
  let destEntries: Record<string, string> = {};

  if (fs.existsSync(destPath)) {
    if (!options.overwrite) {
      destEntries = parseEnvFile(fs.readFileSync(destPath, 'utf-8'));
    }
  }

  const copied: string[] = [];
  const skipped: string[] = [];

  const keysToCopy = options.keys && options.keys.length > 0
    ? options.keys
    : Object.keys(sourceEntries);

  for (const key of keysToCopy) {
    if (!(key in sourceEntries)) {
      skipped.push(key);
      continue;
    }
    if (!options.overwrite && key in destEntries) {
      skipped.push(key);
      continue;
    }
    destEntries[key] = sourceEntries[key];
    copied.push(key);
  }

  const content = Object.entries(destEntries)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf-8');

  return { copied, skipped };
}

export function buildCopyCommand(): Command {
  const cmd = new Command('copy');

  cmd
    .description('Copy environment variables from one .env file to another')
    .argument('<source>', 'Source .env file path')
    .argument('<destination>', 'Destination .env file path')
    .option('--overwrite', 'Overwrite existing keys in destination', false)
    .option('--keys <keys>', 'Comma-separated list of keys to copy')
    .action((source: string, destination: string, opts: { overwrite: boolean; keys?: string }) => {
      const keys = opts.keys ? opts.keys.split(',').map((k) => k.trim()) : [];
      try {
        const { copied, skipped } = copyEnvFile(source, destination, {
          overwrite: opts.overwrite,
          keys,
        });
        console.log(`Copied ${copied.length} key(s) to ${destination}`);
        if (copied.length > 0) console.log(`  Copied: ${copied.join(', ')}`);
        if (skipped.length > 0) console.log(`  Skipped: ${skipped.join(', ')}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  return cmd;
}
