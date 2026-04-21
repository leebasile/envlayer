import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseEnvFile, sanitizeEnvFile, serializeEnvMap } from './sanitize';
import { formatSanitizeText, formatSanitizeJson, formatSanitizeSummary } from './sanitize.formatter';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-sanitize-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

let tmpDir: string;
beforeEach(() => { tmpDir = makeTmpDir(); });
afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

describe('sanitizeEnvFile', () => {
  it('removes keys matching pattern', () => {
    const map = new Map([['API_SECRET', 'abc'], ['DB_HOST', 'localhost'], ['AUTH_TOKEN', 'xyz']]);
    const { removed, sanitized } = sanitizeEnvFile(map, [/secret/i, /token/i]);
    expect(removed).toContain('API_SECRET');
    expect(removed).toContain('AUTH_TOKEN');
    expect(sanitized.has('DB_HOST')).toBe(true);
    expect(sanitized.size).toBe(1);
  });

  it('returns empty removed when no patterns match', () => {
    const map = new Map([['PORT', '3000'], ['HOST', 'localhost']]);
    const { removed, sanitized } = sanitizeEnvFile(map, [/secret/i]);
    expect(removed).toHaveLength(0);
    expect(sanitized.size).toBe(2);
  });

  it('removes all keys if all match', () => {
    const map = new Map([['SECRET_KEY', 'a'], ['SECRET_TOKEN', 'b']]);
    const { removed, sanitized } = sanitizeEnvFile(map, [/secret/i]);
    expect(removed).toHaveLength(2);
    expect(sanitized.size).toBe(0);
  });
});

describe('parseEnvFile + serializeEnvMap roundtrip', () => {
  it('parses and serializes correctly', () => {
    const file = writeFile(tmpDir, '.env', 'FOO=bar\nBAZ=qux\n');
    const map = parseEnvFile(file);
    expect(map.get('FOO')).toBe('bar');
    expect(map.get('BAZ')).toBe('qux');
    const out = serializeEnvMap(map);
    expect(out).toContain('FOO=bar');
    expect(out).toContain('BAZ=qux');
  });
});

describe('formatSanitize*', () => {
  const result = {
    removed: ['API_SECRET'],
    sanitized: new Map([['PORT', '3000']]),
  };

  it('formatSanitizeText includes removed key', () => {
    const text = formatSanitizeText(result, '/out/.env');
    expect(text).toContain('API_SECRET');
    expect(text).toContain('Remaining keys: 1');
  });

  it('formatSanitizeJson is valid JSON', () => {
    const json = JSON.parse(formatSanitizeJson(result, '/out/.env'));
    expect(json.removed).toContain('API_SECRET');
    expect(json.remainingCount).toBe(1);
  });

  it('formatSanitizeSummary returns short string', () => {
    const summary = formatSanitizeSummary(result);
    expect(summary).toContain('1 removed');
    expect(summary).toContain('1 remaining');
  });
});
