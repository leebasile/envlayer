import { Command } from 'commander';
import * as fs from 'fs';

export interface TypeCheckResult {
  key: string;
  value: string;
  expectedType: string;
  actualType: string;
  valid: boolean;
}

const TYPE_PATTERNS: Record<string, RegExp> = {
  number: /^-?\d+(\.\d+)?$/,
  boolean: /^(true|false|1|0)$/i,
  url: /^https?:\/\/.+/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  json: /^[\[{].*[\]}]$/s,
};

export function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    map.set(key, value);
  }
  return map;
}

export function detectType(value: string): string {
  if (TYPE_PATTERNS.number.test(value)) return 'number';
  if (TYPE_PATTERNS.boolean.test(value)) return 'boolean';
  if (TYPE_PATTERNS.url.test(value)) return 'url';
  if (TYPE_PATTERNS.email.test(value)) return 'email';
  try { JSON.parse(value); return 'json'; } catch {}
  return 'string';
}

export function typecheckEnvFile(
  entries: Map<string, string>,
  schema: Record<string, string>
): TypeCheckResult[] {
  return Object.entries(schema).map(([key, expectedType]) => {
    const value = entries.get(key) ?? '';
    const actualType = value === '' ? 'missing' : detectType(value);
    const valid = value !== '' && actualType === expectedType;
    return { key, value, expectedType, actualType, valid };
  });
}

export function buildTypecheckCommand(): Command {
  const cmd = new Command('typecheck');
  cmd
    .description('Check types of env values against a type schema')
    .argument('<file>', '.env file to check')
    .argument('<schema>', 'JSON file mapping keys to expected types')
    .option('--json', 'Output as JSON')
    .action((file: string, schemaFile: string, opts: { json?: boolean }) => {
      const content = fs.readFileSync(file, 'utf-8');
      const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf-8'));
      const entries = parseEnvFile(content);
      const results = typecheckEnvFile(entries, schema);
      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        let hasErrors = false;
        for (const r of results) {
          if (!r.valid) {
            console.error(`✗ ${r.key}: expected ${r.expectedType}, got ${r.actualType} ("${r.value}")`);
            hasErrors = true;
          } else {
            console.log(`✓ ${r.key}: ${r.actualType}`);
          }
        }
        if (hasErrors) process.exit(1);
      }
    });
  return cmd;
}
