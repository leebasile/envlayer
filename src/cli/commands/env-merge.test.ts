import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseEnvFile, serializeEnvMap, mergeEnvFilesDeep } from './env-merge';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-env-merge-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

let tmpDir: string;

beforeEach(() => { tmpDir = makeTmpDir(); });
afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

describe('parseEnvFile', () => {
  it('parses key=value pairs', () => {
    const map = parseEnvFile('A=1\nB=hello\n');
    expect(map.get('A')).toBe('1');
    expect(map.get('B')).toBe('hello');
  });

  it('ignores comments and blank lines', () => {
    const map = parseEnvFile('# comment\n\nA=1\n');
    expect(map.size).toBe(1);
    expect(map.get('A')).toBe('1');
  });

  it('handles values with equals signs', () => {
    const map = parseEnvFile('URL=http://x.com?a=1\n');
    expect(map.get('URL')).toBe('http://x.com?a=1');
  });
});

describe('serializeEnvMap', () => {
  it('serializes map to dotenv format', () => {
    const map = new Map([['A', '1'], ['B', '2']]);
    const result = serializeEnvMap(map);
    expect(result).toContain('A=1');
    expect(result).toContain('B=2');
  });
});

describe('mergeEnvFilesDeep', () => {
  it('adds new keys from overlay', () => {
    const base = new Map([['A', '1']]);
    const overlay = new Map([['B', '2']]);
    const { merged, added, overridden } = mergeEnvFilesDeep(base, overlay, false);
    expect(merged.get('B')).toBe('2');
    expect(added).toContain('B');
    expect(overridden).toHaveLength(0);
  });

  it('does not overwrite existing keys when overwrite=false', () => {
    const base = new Map([['A', 'original']]);
    const overlay = new Map([['A', 'new']]);
    const { merged, overridden } = mergeEnvFilesDeep(base, overlay, false);
    expect(merged.get('A')).toBe('original');
    expect(overridden).toHaveLength(0);
  });

  it('overwrites existing keys when overwrite=true', () => {
    const base = new Map([['A', 'original']]);
    const overlay = new Map([['A', 'new']]);
    const { merged, overridden } = mergeEnvFilesDeep(base, overlay, true);
    expect(merged.get('A')).toBe('new');
    expect(overridden).toContain('A');
  });

  it('merges multiple entries correctly', () => {
    const base = new Map([['A', '1'], ['B', '2']]);
    const overlay = new Map([['B', '99'], ['C', '3']]);
    const { merged, added, overridden } = mergeEnvFilesDeep(base, overlay, true);
    expect(merged.size).toBe(3);
    expect(merged.get('B')).toBe('99');
    expect(added).toContain('C');
    expect(overridden).toContain('B');
  });
});
