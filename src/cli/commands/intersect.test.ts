import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { intersectEnvFiles, parseEnvFile, serializeEnvMap } from './intersect';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-intersect-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

describe('parseEnvFile', () => {
  it('parses key=value pairs and ignores comments and blanks', () => {
    const dir = makeTmpDir();
    const f = writeFile(dir, '.env', '# comment\nFOO=bar\nBAZ=qux\n');
    const map = parseEnvFile(f);
    expect(map.get('FOO')).toBe('bar');
    expect(map.get('BAZ')).toBe('qux');
    expect(map.size).toBe(2);
  });
});

describe('serializeEnvMap', () => {
  it('serializes map back to env format', () => {
    const map = new Map([['A', '1'], ['B', '2']]);
    const out = serializeEnvMap(map);
    expect(out).toContain('A=1');
    expect(out).toContain('B=2');
  });
});

describe('intersectEnvFiles', () => {
  it('returns keys present in all files', () => {
    const dir = makeTmpDir();
    const a = writeFile(dir, 'a.env', 'FOO=1\nBAR=2\nBAZ=3\n');
    const b = writeFile(dir, 'b.env', 'FOO=10\nBAZ=30\nQUX=40\n');
    const { keys, map } = intersectEnvFiles([a, b]);
    expect(keys.sort()).toEqual(['BAZ', 'FOO']);
    expect(map.get('FOO')).toBe('1');
    expect(map.get('BAZ')).toBe('3');
  });

  it('returns empty when no common keys', () => {
    const dir = makeTmpDir();
    const a = writeFile(dir, 'a.env', 'ALPHA=1\n');
    const b = writeFile(dir, 'b.env', 'BETA=2\n');
    const { keys } = intersectEnvFiles([a, b]);
    expect(keys).toHaveLength(0);
  });

  it('handles three files correctly', () => {
    const dir = makeTmpDir();
    const a = writeFile(dir, 'a.env', 'X=1\nY=2\nZ=3\n');
    const b = writeFile(dir, 'b.env', 'X=10\nY=20\n');
    const c = writeFile(dir, 'c.env', 'X=100\nZ=300\n');
    const { keys } = intersectEnvFiles([a, b, c]);
    expect(keys).toEqual(['X']);
  });

  it('returns all keys when single file provided', () => {
    const dir = makeTmpDir();
    const a = writeFile(dir, 'a.env', 'A=1\nB=2\n');
    const { keys } = intersectEnvFiles([a]);
    expect(keys.sort()).toEqual(['A', 'B']);
  });

  it('returns empty result for empty input', () => {
    const { keys, map } = intersectEnvFiles([]);
    expect(keys).toHaveLength(0);
    expect(map.size).toBe(0);
  });
});
