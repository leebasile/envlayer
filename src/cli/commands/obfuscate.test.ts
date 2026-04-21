import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseEnvFile, obfuscateValue, obfuscateEnvFile, serializeEnvMap } from './obfuscate';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-obfuscate-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('obfuscateValue', () => {
  it('returns a 16-char hex string by default (sha256)', () => {
    const result = obfuscateValue('secret');
    expect(result).toHaveLength(16);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it('produces consistent output for the same input', () => {
    expect(obfuscateValue('hello')).toBe(obfuscateValue('hello'));
  });

  it('produces different output for different inputs', () => {
    expect(obfuscateValue('foo')).not.toBe(obfuscateValue('bar'));
  });

  it('supports md5 algorithm', () => {
    const result = obfuscateValue('test', 'md5');
    expect(result).toHaveLength(16);
  });
});

describe('obfuscateEnvFile', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it('obfuscates all keys when no keys specified', () => {
    const file = writeFile(tmpDir, '.env', 'FOO=bar\nBAZ=qux\n');
    const result = obfuscateEnvFile(file, [], 'sha256');
    expect(result.total).toBe(2);
    expect(result.keys).toContain('FOO');
    expect(result.keys).toContain('BAZ');
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).not.toContain('bar');
    expect(content).not.toContain('qux');
  });

  it('obfuscates only specified keys', () => {
    const file = writeFile(tmpDir, '.env', 'FOO=bar\nBAZ=qux\n');
    const result = obfuscateEnvFile(file, ['FOO'], 'sha256');
    expect(result.total).toBe(1);
    expect(result.keys).toEqual(['FOO']);
    const map = parseEnvFile(fs.readFileSync(file, 'utf-8'));
    expect(map.get('BAZ')).toBe('qux');
    expect(map.get('FOO')).not.toBe('bar');
  });

  it('skips keys that do not exist in the file', () => {
    const file = writeFile(tmpDir, '.env', 'FOO=bar\n');
    const result = obfuscateEnvFile(file, ['MISSING'], 'sha256');
    expect(result.total).toBe(0);
  });

  it('ignores comments and blank lines', () => {
    const file = writeFile(tmpDir, '.env', '# comment\n\nFOO=bar\n');
    const result = obfuscateEnvFile(file, [], 'sha256');
    expect(result.total).toBe(1);
  });
});
