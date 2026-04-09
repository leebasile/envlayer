import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { mergeEnvFiles, serializeEnvMap } from './merge';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-merge-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('mergeEnvFiles', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('merges two files with override-wins strategy', () => {
    const base = writeFile(tmpDir, '.env.base', 'APP=base\nPORT=3000\n');
    const override = writeFile(tmpDir, '.env.override', 'PORT=4000\nDEBUG=true\n');
    const result = mergeEnvFiles(base, override, 'override-wins');
    expect(result.get('APP')).toBe('base');
    expect(result.get('PORT')).toBe('4000');
    expect(result.get('DEBUG')).toBe('true');
  });

  it('merges two files with base-wins strategy', () => {
    const base = writeFile(tmpDir, '.env.base', 'APP=base\nPORT=3000\n');
    const override = writeFile(tmpDir, '.env.override', 'PORT=4000\nDEBUG=true\n');
    const result = mergeEnvFiles(base, override, 'base-wins');
    expect(result.get('PORT')).toBe('3000');
    expect(result.get('DEBUG')).toBe('true');
  });

  it('includes all keys from both files', () => {
    const base = writeFile(tmpDir, '.env.base', 'A=1\nB=2\n');
    const override = writeFile(tmpDir, '.env.override', 'C=3\nD=4\n');
    const result = mergeEnvFiles(base, override);
    expect(result.size).toBe(4);
  });

  it('handles empty base file', () => {
    const base = writeFile(tmpDir, '.env.base', '');
    const override = writeFile(tmpDir, '.env.override', 'KEY=value\n');
    const result = mergeEnvFiles(base, override);
    expect(result.get('KEY')).toBe('value');
  });

  it('handles empty override file', () => {
    const base = writeFile(tmpDir, '.env.base', 'KEY=value\n');
    const override = writeFile(tmpDir, '.env.override', '');
    const result = mergeEnvFiles(base, override);
    expect(result.get('KEY')).toBe('value');
  });
});

describe('serializeEnvMap', () => {
  it('serializes a map to dotenv format', () => {
    const map = new Map([['FOO', 'bar'], ['BAZ', 'qux']]);
    const result = serializeEnvMap(map);
    expect(result).toContain('FOO=bar');
    expect(result).toContain('BAZ=qux');
  });

  it('returns empty string for empty map', () => {
    const result = serializeEnvMap(new Map());
    expect(result).toBe('');
  });
});
