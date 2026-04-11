import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { uppercaseEnvKeys, parseEnvFile } from './uppercase';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-uppercase-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('uppercaseEnvKeys', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('converts lowercase keys to uppercase', () => {
    const input = writeFile(tmpDir, '.env', 'db_host=localhost\ndb_port=5432\n');
    const output = path.join(tmpDir, '.env.out');
    const result = uppercaseEnvKeys(input, output);
    expect(result.changed).toContain('db_host');
    expect(result.changed).toContain('db_port');
    expect(result.unchanged).toHaveLength(0);
    expect(result.total).toBe(2);
    const map = parseEnvFile(output);
    expect(map.get('DB_HOST')).toBe('localhost');
    expect(map.get('DB_PORT')).toBe('5432');
  });

  it('leaves already-uppercase keys unchanged', () => {
    const input = writeFile(tmpDir, '.env', 'API_KEY=secret\nDEBUG=true\n');
    const output = path.join(tmpDir, '.env.out');
    const result = uppercaseEnvKeys(input, output);
    expect(result.changed).toHaveLength(0);
    expect(result.unchanged).toContain('API_KEY');
    expect(result.unchanged).toContain('DEBUG');
    expect(result.total).toBe(2);
  });

  it('handles mixed-case keys', () => {
    const input = writeFile(tmpDir, '.env', 'MyKey=value\nALREADY=ok\nother_key=123\n');
    const output = path.join(tmpDir, '.env.out');
    const result = uppercaseEnvKeys(input, output);
    expect(result.changed).toContain('MyKey');
    expect(result.changed).toContain('other_key');
    expect(result.unchanged).toContain('ALREADY');
    const map = parseEnvFile(output);
    expect(map.get('MYKEY')).toBe('value');
    expect(map.get('ALREADY')).toBe('ok');
    expect(map.get('OTHER_KEY')).toBe('123');
  });

  it('overwrites input file when no output is specified', () => {
    const input = writeFile(tmpDir, '.env', 'foo=bar\n');
    uppercaseEnvKeys(input, input);
    const map = parseEnvFile(input);
    expect(map.has('FOO')).toBe(true);
    expect(map.get('FOO')).toBe('bar');
  });

  it('skips comment lines and blank lines', () => {
    const input = writeFile(tmpDir, '.env', '# comment\n\nkey=val\n');
    const output = path.join(tmpDir, '.env.out');
    const result = uppercaseEnvKeys(input, output);
    expect(result.total).toBe(1);
    const map = parseEnvFile(output);
    expect(map.get('KEY')).toBe('val');
  });
});
