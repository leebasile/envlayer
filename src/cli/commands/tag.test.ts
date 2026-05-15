import fs from 'fs';
import os from 'os';
import path from 'path';
import { tagEnvFile, parseEnvFile, serializeEnvMap } from './tag';
import { formatTagText, formatTagJson, formatTagSummary } from './tag.formatter';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-tag-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

describe('tagEnvFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns all keys as untagged when no tag comments exist', () => {
    const file = writeFile(tmpDir, '.env', 'FOO=bar\nBAZ=qux\n');
    const result = tagEnvFile(file, [], 'filter');
    expect(result.totalKeys).toBe(2);
    expect(result.tagged).toHaveLength(0);
    expect(result.untagged).toHaveLength(2);
  });

  it('filter mode returns tagged and untagged correctly', () => {
    const content = '# @tag[prod,staging]\nDB_URL=postgres://localhost\nSECRET=abc\n';
    const file = writeFile(tmpDir, '.env', content);
    const result = tagEnvFile(file, [], 'filter');
    expect(result.totalKeys).toBe(2);
    expect(result.tagged.find(e => e.key === 'DB_URL')).toBeDefined();
    expect(result.untagged.find(e => e.key === 'SECRET')).toBeDefined();
  });

  it('reports correct file basename', () => {
    const file = writeFile(tmpDir, 'staging.env', 'KEY=val\n');
    const result = tagEnvFile(file, [], 'filter');
    expect(result.file).toBe('staging.env');
  });
});

describe('formatTagText', () => {
  it('formats tagged and untagged entries', () => {
    const result = {
      file: '.env',
      totalKeys: 2,
      tagged: [{ key: 'DB_URL', value: 'postgres://localhost', tags: ['prod'] }],
      untagged: [{ key: 'SECRET', value: 'abc', tags: [] }],
    };
    const text = formatTagText(result);
    expect(text).toContain('DB_URL');
    expect(text).toContain('prod');
    expect(text).toContain('SECRET');
  });
});

describe('formatTagSummary', () => {
  it('calculates percentage correctly', () => {
    const result = {
      file: '.env',
      totalKeys: 4,
      tagged: [{ key: 'A', value: '1', tags: ['x'] }, { key: 'B', value: '2', tags: ['y'] }],
      untagged: [{ key: 'C', value: '3', tags: [] }, { key: 'D', value: '4', tags: [] }],
    };
    const summary = formatTagSummary(result);
    expect(summary).toContain('50%');
  });
});
