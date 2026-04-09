import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { diffEnvFiles, parseEnvFile } from './diff';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-diff-test-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('diffEnvFiles', () => {
  it('returns empty diff for identical objects', () => {
    const vars = { FOO: 'bar', BAZ: '123' };
    const diff = diffEnvFiles(vars, { ...vars });
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
  });

  it('detects added keys', () => {
    const base = { FOO: 'bar' };
    const target = { FOO: 'bar', NEW_KEY: 'value' };
    const diff = diffEnvFiles(base, target);
    expect(diff.added).toContain('NEW_KEY');
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
  });

  it('detects removed keys', () => {
    const base = { FOO: 'bar', OLD_KEY: 'value' };
    const target = { FOO: 'bar' };
    const diff = diffEnvFiles(base, target);
    expect(diff.removed).toContain('OLD_KEY');
    expect(diff.added).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
  });

  it('detects changed values', () => {
    const base = { FOO: 'bar', PORT: '3000' };
    const target = { FOO: 'bar', PORT: '8080' };
    const diff = diffEnvFiles(base, target);
    expect(diff.changed).toContain('PORT');
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
  });

  it('handles all diff types simultaneously', () => {
    const base = { A: '1', B: '2', C: '3' };
    const target = { A: '1', B: 'changed', D: '4' };
    const diff = diffEnvFiles(base, target);
    expect(diff.added).toContain('D');
    expect(diff.removed).toContain('C');
    expect(diff.changed).toContain('B');
  });
});

describe('parseEnvFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('parses a valid .env file', () => {
    const filePath = writeFile(tmpDir, '.env', 'FOO=bar\nPORT=3000\n');
    const vars = parseEnvFile(filePath);
    expect(vars).toEqual({ FOO: 'bar', PORT: '3000' });
  });

  it('throws if file does not exist', () => {
    expect(() => parseEnvFile(path.join(tmpDir, 'nonexistent.env'))).toThrow('File not found');
  });
});
