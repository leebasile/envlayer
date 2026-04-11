import fs from 'fs';
import path from 'path';
import type { Argv } from 'yargs';
import type { ConvertFormat, ConvertResult } from './convert.types';

export function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key) map.set(key, val);
  }
  return map;
}

export function serializeToFormat(map: Map<string, string>, format: ConvertFormat): string {
  const entries = Array.from(map.entries());
  if (format === 'json') {
    return JSON.stringify(Object.fromEntries(entries), null, 2) + '\n';
  }
  if (format === 'yaml') {
    return entries.map(([k, v]) => `${k}: "${v.replace(/"/g, '\\"')}"`).join('\n') + '\n';
  }
  if (format === 'export') {
    return entries.map(([k, v]) => `export ${k}="${v.replace(/"/g, '\\"')}"`).join('\n') + '\n';
  }
  // dotenv
  return entries.map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
}

export function parseFromFormat(content: string, format: ConvertFormat): Map<string, string> {
  if (format === 'json') {
    const obj = JSON.parse(content) as Record<string, unknown>;
    const map = new Map<string, string>();
    for (const [k, v] of Object.entries(obj)) map.set(k, String(v));
    return map;
  }
  if (format === 'yaml') {
    const map = new Map<string, string>();
    for (const line of content.split('\n')) {
      const match = line.match(/^([\w]+):\s*["']?(.+?)["']?\s*$/);
      if (match) map.set(match[1], match[2]);
    }
    return map;
  }
  // dotenv and export share the same parser
  return parseEnvFile(content);
}

export function convertEnvFile(opts: { input: string; output: string; from: ConvertFormat; to: ConvertFormat; overwrite?: boolean }): ConvertResult {
  if (!fs.existsSync(opts.input)) throw new Error(`Input file not found: ${opts.input}`);
  if (fs.existsSync(opts.output) && !opts.overwrite) throw new Error(`Output file already exists: ${opts.output}. Use --overwrite to replace it.`);
  const content = fs.readFileSync(opts.input, 'utf-8');
  const map = parseFromFormat(content, opts.from);
  const serialized = serializeToFormat(map, opts.to);
  fs.mkdirSync(path.dirname(opts.output), { recursive: true });
  fs.writeFileSync(opts.output, serialized, 'utf-8');
  return { inputFile: opts.input, outputFile: opts.output, fromFormat: opts.from, toFormat: opts.to, keysConverted: map.size, success: true };
}

export function buildConvertCommand(yargs: Argv): Argv {
  return yargs.command(
    'convert <input> <output>',
    'Convert an env file between formats (dotenv, json, yaml, export)',
    (y) =>
      y
        .positional('input', { type: 'string', demandOption: true, describe: 'Input file path' })
        .positional('output', { type: 'string', demandOption: true, describe: 'Output file path' })
        .option('from', { type: 'string', default: 'dotenv', choices: ['dotenv', 'json', 'yaml', 'export'], describe: 'Input format' })
        .option('to', { type: 'string', default: 'json', choices: ['dotenv', 'json', 'yaml', 'export'], describe: 'Output format' })
        .option('overwrite', { type: 'boolean', default: false, describe: 'Overwrite output file if it exists' }),
    (argv) => {
      try {
        const result = convertEnvFile({ input: argv.input as string, output: argv.output as string, from: argv.from as ConvertFormat, to: argv.to as ConvertFormat, overwrite: argv.overwrite as boolean });
        console.log(`Converted ${result.keysConverted} key(s) from ${result.fromFormat} → ${result.toFormat}`);
        console.log(`Output written to: ${result.outputFile}`);
      } catch (err) {
        console.error((err as Error).message);
        process.exit(1);
      }
    }
  );
}
