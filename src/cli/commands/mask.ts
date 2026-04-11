import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { MaskOptions, MaskReport, MaskResult } from './mask.types';

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

export function maskValue(value: string, char: string = '*', reveal: number = 0): string {
  if (!value) return value;
  if (reveal >= value.length) return value;
  const visible = value.slice(-reveal) || '';
  const masked = char.repeat(value.length - reveal);
  return masked + visible;
}

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
}

export function maskEnvFile(
  content: string,
  options: MaskOptions = {}
): MaskReport {
  const { pattern, keys, char = '*', reveal = 0 } = options;
  const map = parseEnvFile(content);
  const results: MaskResult[] = [];
  const regex = pattern ? new RegExp(pattern, 'i') : null;

  for (const [key, original] of map.entries()) {
    const shouldMask =
      (keys && keys.includes(key)) ||
      (regex && regex.test(key)) ||
      (!keys && !regex);

    const masked = shouldMask ? maskValue(original, char, reveal) : original;
    results.push({ key, original, masked, wasChanged: masked !== original });
  }

  return {
    file: '',
    results,
    totalKeys: map.size,
    maskedCount: results.filter(r => r.wasChanged).length,
  };
}

export function buildMaskCommand(): Command {
  const cmd = new Command('mask');
  cmd
    .description('Mask sensitive values in an env file for safe display')
    .argument('<file>', 'Path to the .env file')
    .option('-k, --keys <keys>', 'Comma-separated list of keys to mask')
    .option('-p, --pattern <pattern>', 'Regex pattern to match keys for masking')
    .option('-c, --char <char>', 'Mask character to use', '*')
    .option('-r, --reveal <n>', 'Number of trailing characters to reveal', '0')
    .option('--json', 'Output as JSON')
    .action((file: string, opts) => {
      const absPath = path.resolve(file);
      const content = fs.readFileSync(absPath, 'utf-8');
      const keys = opts.keys ? opts.keys.split(',').map((k: string) => k.trim()) : undefined;
      const report = maskEnvFile(content, {
        keys,
        pattern: opts.pattern,
        char: opts.char,
        reveal: parseInt(opts.reveal, 10),
      });
      report.file = absPath;
      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        for (const r of report.results) {
          console.log(`${r.key}=${r.masked}`);
        }
        console.error(`\nMasked ${report.maskedCount}/${report.totalKeys} keys.`);
      }
    });
  return cmd;
}
