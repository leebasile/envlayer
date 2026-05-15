import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseEnvFile, serializeEnvMap, shuffleEnvKeys } from './shuffle';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-shuffle-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

let tmpDir: string;

beforeEach(() => { tmpDir = makeTmpDir(); });
afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

describe('parseEnvFile', () => {
  it('parses key=value pairs', () => {
    const map = parseEnvFile('A=1\nB=2\nC=3\n');
    expect(map.get('A')).toBe('1');
    expect(map.get('B')).toBe('2');
    expect(map.get('C')).toBe('3');
  });

  it('ignores comments and blank lines', () => {
    const map = parseEnvFile('# comment\n\nX=hello\n');
    expect(map.size).toBe(1);
    expect(map.get('X')).toBe('hello');
  });
});

describe('serializeEnvMap', () => {
  it('serializes map to dotenv format', () => {
    const map = new Map([['FOO', 'bar'], ['BAZ', 'qux']]);
    const result = serializeEnvMap(map);
    expect(result).toContain('FOO=bar');
    expect(result).toContain('BAZ=qux');
  });
});

describe('shuffleEnvKeys', () => {
  it('returns a map with the same keys and values', () => {
    const map = new Map([['A', '1'], ['B', '2'], ['C', '3'], ['D', '4']]);
    const shuffled = shuffleEnvKeys(map);
    expect(shuffled.size).toBe(map.size);
    for (const [k, v] of map) {
      expect(shuffled.get(k)).toBe(v);
    }
  });

  it('preserves all entries after shuffle', () => {
    const original = new Map(Array.from({ length: 10 }, (_, i) => [`KEY${i}`, `val${i}`]));
    const shuffled = shuffleEnvKeys(original);
    expect([...shuffled.keys()].sort()).toEqual([...original.keys()].sort());
  });

  it('returns a new Map instance', () => {
    const map = new Map([['X', '1']]);
    const shuffled = shuffleEnvKeys(map);
    expect(shuffled).not.toBe(map);
  });
});
