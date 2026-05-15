import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { listEnvKeys } from './keys';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-keys-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('listEnvKeys', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns all keys from a valid env file', () => {
    const file = writeFile(tmpDir, '.env', 'FOO=bar\nBAZ=qux\nHELLO=world\n');
    const result = listEnvKeys(file);
    expect(result.keys).toEqual(['FOO', 'BAZ', 'HELLO']);
    expect(result.total).toBe(3);
  });

  it('ignores comments and blank lines', () => {
    const file = writeFile(tmpDir, '.env', '# comment\n\nFOO=bar\n  \nBAZ=qux\n');
    const result = listEnvKeys(file);
    expect(result.keys).toEqual(['FOO', 'BAZ']);
    expect(result.total).toBe(2);
  });

  it('filters keys by pattern', () => {
    const file = writeFile(tmpDir, '.env', 'DB_HOST=localhost\nDB_PORT=5432\nAPP_NAME=test\n');
    const result = listEnvKeys(file, '^DB_');
    expect(result.keys).toEqual(['DB_HOST', 'DB_PORT']);
    expect(result.total).toBe(2);
  });

  it('returns empty keys when pattern matches nothing', () => {
    const file = writeFile(tmpDir, '.env', 'FOO=bar\nBAZ=qux\n');
    const result = listEnvKeys(file, '^NOPE_');
    expect(result.keys).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('handles empty env file', () => {
    const file = writeFile(tmpDir, '.env', '');
    const result = listEnvKeys(file);
    expect(result.keys).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('includes the resolved file path in result', () => {
    const file = writeFile(tmpDir, '.env', 'KEY=value\n');
    const result = listEnvKeys(file);
    expect(result.file).toBe(require('path').resolve(file));
  });
});
