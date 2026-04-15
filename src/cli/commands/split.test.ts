import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseEnvFile, serializeEnvMap, splitEnvFile } from './split';
import { formatSplitText, formatSplitJson, formatSplitSummary } from './split.formatter';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-split-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

describe('splitEnvFile', () => {
  it('splits keys by prefix', () => {
    const map = new Map([
      ['DB_HOST', 'localhost'],
      ['DB_PORT', '5432'],
      ['APP_NAME', 'myapp'],
      ['SECRET', 'abc'],
    ]);
    const result = splitEnvFile(map, ['DB', 'APP']);
    expect(result['DB'].get('DB_HOST')).toBe('localhost');
    expect(result['DB'].get('DB_PORT')).toBe('5432');
    expect(result['APP'].get('APP_NAME')).toBe('myapp');
    expect(result['_rest'].get('SECRET')).toBe('abc');
  });

  it('places unmatched keys in _rest', () => {
    const map = new Map([['UNKNOWN', 'val']]);
    const result = splitEnvFile(map, ['DB']);
    expect(result['_rest'].get('UNKNOWN')).toBe('val');
  });

  it('returns empty maps for prefixes with no matches', () => {
    const map = new Map([['APP_KEY', '1']]);
    const result = splitEnvFile(map, ['DB', 'APP']);
    expect(result['DB'].size).toBe(0);
    expect(result['APP'].size).toBe(1);
  });
});

describe('parseEnvFile + serializeEnvMap round-trip', () => {
  it('parses and serializes correctly', () => {
    const content = 'FOO=bar\nBAZ=qux\n';
    const map = parseEnvFile(content);
    expect(map.get('FOO')).toBe('bar');
    const serialized = serializeEnvMap(map);
    expect(serialized).toContain('FOO=bar');
    expect(serialized).toContain('BAZ=qux');
  });

  it('ignores comments and blank lines', () => {
    const content = '# comment\n\nKEY=value\n';
    const map = parseEnvFile(content);
    expect(map.size).toBe(1);
    expect(map.get('KEY')).toBe('value');
  });
});

describe('split formatters', () => {
  const result = { written: ['.env.DB', '.env.APP'], skipped: ['.env._rest'], total: 2 };

  it('formatSplitText includes written files', () => {
    const text = formatSplitText(result);
    expect(text).toContain('.env.DB');
    expect(text).toContain('2 file(s) written');
    expect(text).toContain('Skipped');
  });

  it('formatSplitJson returns valid JSON', () => {
    const json = JSON.parse(formatSplitJson(result));
    expect(json.total).toBe(2);
    expect(json.written).toHaveLength(2);
  });

  it('formatSplitSummary returns short summary', () => {
    const summary = formatSplitSummary(result);
    expect(summary).toContain('2 file(s) written');
    expect(summary).toContain('1 skipped');
  });
});
