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
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    map.set(key, value);
  }
  return map;
}

export function serializeEnvMap(map: Map<string, string>): string {
  return Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
}

export type EncodeFormat = 'base64' | 'hex' | 'uri';

export function encodeEnvValues(
  map: Map<string, string>,
  format: EncodeFormat
): { result: Map<string, string>; encoded: string[] } {
  const result = new Map<string, string>();
  const encoded: string[] = [];
  for (const [key, value] of map.entries()) {
    let encodedValue: string;
    if (format === 'base64') {
      encodedValue = Buffer.from(value).toString('base64');
    } else if (format === 'hex') {
      encodedValue = Buffer.from(value).toString('hex');
    } else {
      encodedValue = encodeURIComponent(value);
    }
    result.set(key, encodedValue);
    if (encodedValue !== value) encoded.push(key);
  }
  return { result, encoded };
}

export function decodeEnvValues(
  map: Map<string, string>,
  format: EncodeFormat
): { result: Map<string, string>; decoded: string[] } {
  const result = new Map<string, string>();
  const decoded: string[] = [];
  for (const [key, value] of map.entries()) {
    let decodedValue: string;
    try {
      if (format === 'base64') {
        decodedValue = Buffer.from(value, 'base64').toString('utf8');
      } else if (format === 'hex') {
        decodedValue = Buffer.from(value, 'hex').toString('utf8');
      } else {
        decodedValue = decodeURIComponent(value);
      }
    } catch {
      decodedValue = value;
    }
    result.set(key, decodedValue);
    if (decodedValue !== value) decoded.push(key);
  }
  return { result, decoded };
}

export function buildEncodeCommand(): Command {
  const cmd = new Command('encode');
  cmd
    .description('Encode or decode env variable values')
    .argument('<file>', 'Path to .env file')
    .option('-f, --format <format>', 'Encoding format: base64 | hex | uri', 'base64')
    .option('-d, --decode', 'Decode instead of encode', false)
    .option('-o, --output <file>', 'Output file (defaults to stdout)')
    .option('--json', 'Output as JSON', false)
    .action((file, opts) => {
      const content = fs.readFileSync(path.resolve(file), 'utf8');
      const map = parseEnvFile(content);
      const format = opts.format as EncodeFormat;
      if (opts.decode) {
        const { result, decoded } = decodeEnvValues(map, format);
        const serialized = serializeEnvMap(result);
        if (opts.output) {
          fs.writeFileSync(path.resolve(opts.output), serialized, 'utf8');
          if (opts.json) {
            console.log(JSON.stringify({ decoded, count: decoded.length }));
          } else {
            console.log(`Decoded ${decoded.length} value(s) using ${format}.`);
          }
        } else {
          process.stdout.write(serialized);
        }
      } else {
        const { result, encoded } = encodeEnvValues(map, format);
        const serialized = serializeEnvMap(result);
        if (opts.output) {
          fs.writeFileSync(path.resolve(opts.output), serialized, 'utf8');
          if (opts.json) {
            console.log(JSON.stringify({ encoded, count: encoded.length }));
          } else {
            console.log(`Encoded ${encoded.length} value(s) using ${format}.`);
          }
        } else {
          process.stdout.write(serialized);
        }
      }
    });
  return cmd;
}
