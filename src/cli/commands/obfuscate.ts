import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

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

export function obfuscateValue(value: string, algorithm: string = 'sha256'): string {
  return crypto.createHash(algorithm).update(value).digest('hex').slice(0, 16);
}

export interface ObfuscateResult {
  file: string;
  keys: string[];
  total: number;
}

export function obfuscateEnvFile(
  filePath: string,
  keys: string[],
  algorithm: string
): ObfuscateResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const map = parseEnvFile(content);
  const obfuscated: string[] = [];

  const targetKeys = keys.length > 0 ? keys : Array.from(map.keys());

  for (const key of targetKeys) {
    if (map.has(key)) {
      map.set(key, obfuscateValue(map.get(key)!, algorithm));
      obfuscated.push(key);
    }
  }

  fs.writeFileSync(filePath, serializeEnvMap(map), 'utf-8');

  return { file: path.basename(filePath), keys: obfuscated, total: obfuscated.length };
}

export function buildObfuscateCommand(): Command {
  const cmd = new Command('obfuscate');
  cmd
    .description('Obfuscate values in a .env file using a hash function')
    .argument('<file>', '.env file to obfuscate')
    .option('-k, --keys <keys>', 'comma-separated list of keys to obfuscate (default: all)', '')
    .option('-a, --algorithm <algo>', 'hash algorithm to use (sha256, md5, sha1)', 'sha256')
    .option('--json', 'output as JSON')
    .action((file: string, opts: { keys: string; algorithm: string; json: boolean }) => {
      const keys = opts.keys ? opts.keys.split(',').map((k) => k.trim()) : [];
      const result = obfuscateEnvFile(file, keys, opts.algorithm);
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Obfuscated ${result.total} key(s) in ${result.file}`);
        result.keys.forEach((k) => console.log(`  - ${k}`));
      }
    });
  return cmd;
}
