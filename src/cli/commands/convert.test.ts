import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, beforeEach } from 'vitest';
import { parseFromFormat, serializeToFormat, convertEnvFile } from './convert';
import { formatConvertText, formatConvertJson, formatConvertSummary } from './convert.formatter';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-convert-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

describe('parseFromFormat + serializeToFormat', () => {
  it('round-trips dotenv', () => {
    const content = 'FOO=bar\nBAZ=qux\n';
    const map = parseFromFormat(content, 'dotenv');
    expect(map.get('FOO')).toBe('bar');
    expect(map.get('BAZ')).toBe('qux');
    const out = serializeToFormat(map, 'dotenv');
    expect(out).toContain('FOO=bar');
  });

  it('round-trips json', () => {
    const content = JSON.stringify({ API_KEY: 'secret', PORT: '3000' });
    const map = parseFromFormat(content, 'json');
    expect(map.get('API_KEY')).toBe('secret');
    const out = serializeToFormat(map, 'json');
    const parsed = JSON.parse(out);
    expect(parsed.PORT).toBe('3000');
  });

  it('serializes to yaml format', () => {
    const map = new Map([['HOST', 'localhost'], ['PORT', '5432']]);
    const out = serializeToFormat(map, 'yaml');
    expect(out).toContain('HOST: "localhost"');
    expect(out).toContain('PORT: "5432"');
  });

  it('serializes to export format', () => {
    const map = new Map([['TOKEN', 'abc123']]);
    const out = serializeToFormat(map, 'export');
    expect(out).toContain('export TOKEN="abc123"');
  });
});

describe('convertEnvFile', () => {
  let tmpDir: string;
  beforeEach(() => { tmpDir = makeTmpDir(); });

  it('converts dotenv to json', () => {
    const input = writeFile(tmpDir, '.env', 'DB_HOST=localhost\nDB_PORT=5432\n');
    const output = path.join(tmpDir, 'env.json');
    const result = convertEnvFile({ input, output, from: 'dotenv', to: 'json' });
    expect(result.keysConverted).toBe(2);
    const written = JSON.parse(fs.readFileSync(output, 'utf-8'));
    expect(written.DB_HOST).toBe('localhost');
  });

  it('throws if input file does not exist', () => {
    expect(() => convertEnvFile({ input: '/no/such/file', output: '/tmp/out.json', from: 'dotenv', to: 'json' })).toThrow('Input file not found');
  });

  it('throws if output exists and overwrite is false', () => {
    const input = writeFile(tmpDir, '.env', 'X=1\n');
    const output = writeFile(tmpDir, 'out.json', '{}');
    expect(() => convertEnvFile({ input, output, from: 'dotenv', to: 'json', overwrite: false })).toThrow('already exists');
  });

  it('overwrites when flag is set', () => {
    const input = writeFile(tmpDir, '.env', 'X=1\n');
    const output = writeFile(tmpDir, 'out.json', '{}');
    const result = convertEnvFile({ input, output, from: 'dotenv', to: 'json', overwrite: true });
    expect(result.success).toBe(true);
  });
});

describe('convert formatters', () => {
  const result = { inputFile: '.env', outputFile: 'env.json', fromFormat: 'dotenv' as const, toFormat: 'json' as const, keysConverted: 3, success: true };

  it('formatConvertText includes key count', () => {
    expect(formatConvertText(result)).toContain('3');
  });

  it('formatConvertJson is valid JSON', () => {
    const obj = JSON.parse(formatConvertJson(result));
    expect(obj.keysConverted).toBe(3);
  });

  it('formatConvertSummary is concise', () => {
    expect(formatConvertSummary(result)).toContain('dotenv');
    expect(formatConvertSummary(result)).toContain('json');
  });
});
