import fs from 'fs';
import os from 'os';
import path from 'path';
import { lintEnvFile, parseEnvFile } from './lint';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-lint-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

describe('parseEnvFile', () => {
  it('parses key=value pairs', () => {
    const map = parseEnvFile('FOO=bar\nBAZ=qux\n');
    expect(map.get('FOO')).toBe('bar');
    expect(map.get('BAZ')).toBe('qux');
  });

  it('skips comments and blank lines', () => {
    const map = parseEnvFile('# comment\n\nKEY=val\n');
    expect(map.size).toBe(1);
  });
});

describe('lintEnvFile', () => {
  let dir: string;
  beforeEach(() => { dir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true }); });

  it('passes a clean file', () => {
    const f = writeFile(dir, '.env', 'FOO=bar\nBAZ=qux\n');
    const result = lintEnvFile(f);
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('detects empty values', () => {
    const f = writeFile(dir, '.env', 'FOO=\n');
    const result = lintEnvFile(f);
    expect(result.violations.some(v => v.rule === 'no-empty-values')).toBe(true);
  });

  it('detects quoted values', () => {
    const f = writeFile(dir, '.env', 'FOO="bar"\n');
    const result = lintEnvFile(f);
    expect(result.violations.some(v => v.rule === 'no-quoted-values')).toBe(true);
  });

  it('detects duplicate keys', () => {
    const f = writeFile(dir, '.env', 'FOO=bar\nFOO=baz\n');
    const result = lintEnvFile(f);
    expect(result.violations.some(v => v.rule === 'no-duplicate-keys')).toBe(true);
    expect(result.passed).toBe(false);
  });

  it('detects lowercase keys', () => {
    const f = writeFile(dir, '.env', 'foo=bar\n');
    const result = lintEnvFile(f);
    expect(result.violations.some(v => v.rule === 'no-lowercase-keys')).toBe(true);
  });

  it('counts errors and warnings separately', () => {
    const f = writeFile(dir, '.env', 'FOO=\nFOO=bar\n');
    const result = lintEnvFile(f);
    expect(result.errorCount).toBeGreaterThanOrEqual(1);
    expect(result.warnCount).toBeGreaterThanOrEqual(1);
  });
});
