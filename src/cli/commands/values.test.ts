import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseEnvFile, listEnvValues } from './values';
import { formatValuesText, formatValuesJson, formatValuesSummary } from './values.formatter';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-values-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content);
  return p;
}

describe('parseEnvFile', () => {
  it('parses key=value pairs', () => {
    const map = parseEnvFile('A=1\nB=hello\n');
    expect(map.get('A')).toBe('1');
    expect(map.get('B')).toBe('hello');
  });

  it('ignores comments and blank lines', () => {
    const map = parseEnvFile('# comment\n\nC=world\n');
    expect(map.size).toBe(1);
    expect(map.get('C')).toBe('world');
  });

  it('strips surrounding quotes', () => {
    const map = parseEnvFile('D="quoted"\nE=\'single\'\n');
    expect(map.get('D')).toBe('quoted');
    expect(map.get('E')).toBe('single');
  });
});

describe('listEnvValues', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it('returns all values', () => {
    const f = writeFile(tmpDir, '.env', 'A=foo\nB=bar\n');
    const result = listEnvValues(f);
    expect(result.values).toEqual(['foo', 'bar']);
    expect(result.total).toBe(2);
  });

  it('returns unique values when flag set', () => {
    const f = writeFile(tmpDir, '.env', 'A=foo\nB=foo\nC=bar\n');
    const result = listEnvValues(f, { unique: true });
    expect(result.values).toEqual(['foo', 'bar']);
    expect(result.total).toBe(2);
  });

  it('sorts values when flag set', () => {
    const f = writeFile(tmpDir, '.env', 'A=zebra\nB=apple\n');
    const result = listEnvValues(f, { sort: true });
    expect(result.values).toEqual(['apple', 'zebra']);
  });
});

describe('formatters', () => {
  const result = { file: '.env', values: ['foo', 'bar'], total: 2 };

  it('formatValuesText includes file and values', () => {
    const text = formatValuesText(result);
    expect(text).toContain('File: .env');
    expect(text).toContain('foo');
    expect(text).toContain('bar');
  });

  it('formatValuesJson is valid JSON', () => {
    const json = JSON.parse(formatValuesJson(result));
    expect(json.total).toBe(2);
    expect(json.values).toContain('foo');
  });

  it('formatValuesSummary is concise', () => {
    expect(formatValuesSummary(result)).toBe('.env: 2 value(s)');
  });
});
