import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { findMissingKeys, parseEnvFile } from './missing';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-missing-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('parseEnvFile', () => {
  let tmpDir: string;
  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it('parses key=value pairs', () => {
    const file = writeFile(tmpDir, '.env', 'FOO=bar\nBAZ=qux\n');
    const map = parseEnvFile(file);
    expect(map.get('FOO')).toBe('bar');
    expect(map.get('BAZ')).toBe('qux');
  });

  it('ignores comments and blank lines', () => {
    const file = writeFile(tmpDir, '.env', '# comment\n\nFOO=bar\n');
    const map = parseEnvFile(file);
    expect(map.size).toBe(1);
  });
});

describe('findMissingKeys', () => {
  let tmpDir: string;
  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it('returns no missing keys when all are present', () => {
    const file = writeFile(tmpDir, '.env', 'FOO=bar\nBAR=baz\n');
    const result = findMissingKeys(file, ['FOO', 'BAR']);
    expect(result.missingKeys).toHaveLength(0);
    expect(result.presentKeys).toEqual(['FOO', 'BAR']);
    expect(result.totalRequired).toBe(2);
  });

  it('identifies missing keys', () => {
    const file = writeFile(tmpDir, '.env', 'FOO=bar\n');
    const result = findMissingKeys(file, ['FOO', 'BAR', 'BAZ']);
    expect(result.missingKeys).toEqual(['BAR', 'BAZ']);
    expect(result.presentKeys).toEqual(['FOO']);
  });

  it('treats empty values as missing', () => {
    const file = writeFile(tmpDir, '.env', 'FOO=\nBAR=set\n');
    const result = findMissingKeys(file, ['FOO', 'BAR']);
    expect(result.missingKeys).toContain('FOO');
    expect(result.presentKeys).toContain('BAR');
  });

  it('returns correct totalRequired count', () => {
    const file = writeFile(tmpDir, '.env', 'A=1\n');
    const result = findMissingKeys(file, ['A', 'B', 'C']);
    expect(result.totalRequired).toBe(3);
  });

  it('handles empty required keys list', () => {
    const file = writeFile(tmpDir, '.env', 'FOO=bar\n');
    const result = findMissingKeys(file, []);
    expect(result.missingKeys).toHaveLength(0);
    expect(result.presentKeys).toHaveLength(0);
    expect(result.totalRequired).toBe(0);
  });
});
