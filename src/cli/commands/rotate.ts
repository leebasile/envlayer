import fs from 'fs';
import path from 'path';
import { randomBytes, randomUUID } from 'crypto';
import { Command } from 'commander';
import { RotateOptions, RotateReport, RotateResult } from './rotate.types';

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

export function generateValue(generator: string = 'hex', length: number = 32): string {
  switch (generator) {
    case 'uuid':
      return randomUUID();
    case 'base64':
      return randomBytes(Math.ceil(length * 0.75)).toString('base64').slice(0, length);
    case 'hex':
    default:
      return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }
}

export function rotateEnvFile(options: RotateOptions): RotateReport {
  const content = fs.readFileSync(options.input, 'utf-8');
  const envMap = parseEnvFile(content);
  const rotated: RotateResult[] = [];
  const skipped: string[] = [];

  for (const key of options.keys) {
    if (!envMap.has(key)) {
      skipped.push(key);
      continue;
    }
    const oldValue = envMap.get(key)!;
    const newValue = generateValue(options.generator, options.length);
    rotated.push({ key, oldValue, newValue });
    envMap.set(key, newValue);
  }

  const outputFile = options.output ?? options.input;

  if (!options.dryRun) {
    fs.writeFileSync(outputFile, serializeEnvMap(envMap), 'utf-8');
  }

  return { rotated, skipped, outputFile };
}

export function buildRotateCommand(): Command {
  const cmd = new Command('rotate');
  cmd
    .description('Rotate values for specified keys in an env file')
    .requiredOption('-i, --input <file>', 'Input .env file')
    .option('-o, --output <file>', 'Output file (defaults to input file)')
    .requiredOption('-k, --keys <keys...>', 'Keys to rotate')
    .option('-g, --generator <type>', 'Value generator: uuid, hex, base64', 'hex')
    .option('-l, --length <number>', 'Generated value length', '32')
    .option('--dry-run', 'Preview changes without writing', false)
    .action((opts) => {
      const report = rotateEnvFile({
        input: path.resolve(opts.input),
        output: opts.output ? path.resolve(opts.output) : undefined,
        keys: opts.keys,
        generator: opts.generator,
        length: parseInt(opts.length, 10),
        dryRun: opts.dryRun,
      });

      if (report.rotated.length > 0) {
        console.log(`Rotated ${report.rotated.length} key(s)${opts.dryRun ? ' (dry run)' : ''}:`);
        for (const r of report.rotated) {
          console.log(`  ${r.key}: ${r.oldValue.slice(0, 4)}... -> ${r.newValue.slice(0, 4)}...`);
        }
      }
      if (report.skipped.length > 0) {
        console.warn(`Skipped (not found): ${report.skipped.join(', ')}`);
      }
      if (!opts.dryRun) {
        console.log(`Written to: ${report.outputFile}`);
      }
    });
  return cmd;
}
