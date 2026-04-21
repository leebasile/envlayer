import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseEnvFile, truncateEnvValues, serializeEnvMap } from './truncate';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-truncate-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('truncateEnvValues', () => {
  it('truncates values exceeding max length', () => {
    const map = new Map([['KEY', 'abcdefghij']]);
    const { result, changes } = truncateEnvValues(map, 5);
    expect(result.get('KEY')).toBe('abcde');
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ key: 'KEY', original: 'abcdefghij', truncated: 'abcde' });
  });

  it('leaves values within max length unchanged', () => {
    const map = new Map([['KEY', 'abc']]);
    const { result, changes } = truncateEnvValues(map, 10);
    expect(result.get('KEY')).toBe('abc');
    expect(changes).toHaveLength(0);
  });

  it('handles multiple keys with mixed lengths', () => {
    const map = new Map([
      ['SHORT', 'hi'],
      ['LONG', 'this-is-a-very-long-value'],
    ]);
    const { result, changes } = truncateEnvValues(map, 10);
    expect(result.get('SHORT')).toBe('hi');
    expect(result.get('LONG')).toBe('this-is-a-');
    expect(changes).toHaveLength(1);
  });

  it('returns empty changes when map is empty', () => {
    const map = new Map<string, string>();
    const { result, changes } = truncateEnvValues(map, 5);
    expect(result.size).toBe(0);
    expect(changes).toHaveLength(0);
  });
});

describe('parseEnvFile + serializeEnvMap round-trip', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('parses and serializes correctly', () => {
    const filePath = writeFile(tmpDir, '.env', 'FOO=bar\nBAZ=qux\n');
    const map = parseEnvFile(filePath);
    expect(map.get('FOO')).toBe('bar');
    expect(map.get('BAZ')).toBe('qux');
    const serialized = serializeEnvMap(map);
    expect(serialized).toContain('FOO=bar');
    expect(serialized).toContain('BAZ=qux');
  });

  it('skips comments and blank lines', () => {
    const filePath = writeFile(tmpDir, '.env', '# comment\n\nKEY=value\n');
    const map = parseEnvFile(filePath);
    expect(map.size).toBe(1);
    expect(map.get('KEY')).toBe('value');
  });
});
