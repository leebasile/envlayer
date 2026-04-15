import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseEnvFile, serializeEnvMap, reorderEnvKeys } from './reorder';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-reorder-'));
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
  it('parses key=value lines', () => {
    const map = parseEnvFile('FOO=1\nBAR=2\n');
    expect(map.get('FOO')).toBe('1');
    expect(map.get('BAR')).toBe('2');
  });

  it('skips comments and blank lines', () => {
    const map = parseEnvFile('# comment\n\nFOO=bar\n');
    expect(map.size).toBe(1);
  });
});

describe('serializeEnvMap', () => {
  it('serializes map back to env format', () => {
    const map = new Map([['A', '1'], ['B', '2']]);
    expect(serializeEnvMap(map)).toBe('A=1\nB=2\n');
  });
});

describe('reorderEnvKeys', () => {
  it('moves keys to top', () => {
    const map = new Map([['FOO', '1'], ['BAR', '2'], ['BAZ', '3']]);
    const { result, moved } = reorderEnvKeys(map, ['BAZ'], 'top');
    const keys = Array.from(result.keys());
    expect(keys[0]).toBe('BAZ');
    expect(moved).toBe(1);
  });

  it('moves keys to bottom', () => {
    const map = new Map([['FOO', '1'], ['BAR', '2'], ['BAZ', '3']]);
    const { result, moved } = reorderEnvKeys(map, ['FOO'], 'bottom');
    const keys = Array.from(result.keys());
    expect(keys[keys.length - 1]).toBe('FOO');
    expect(moved).toBe(1);
  });

  it('ignores keys not in map', () => {
    const map = new Map([['FOO', '1'], ['BAR', '2']]);
    const { moved } = reorderEnvKeys(map, ['MISSING'], 'top');
    expect(moved).toBe(0);
  });

  it('preserves values after reorder', () => {
    const map = new Map([['A', 'alpha'], ['B', 'beta'], ['C', 'gamma']]);
    const { result } = reorderEnvKeys(map, ['C', 'A'], 'top');
    expect(result.get('C')).toBe('gamma');
    expect(result.get('A')).toBe('alpha');
  });
});
