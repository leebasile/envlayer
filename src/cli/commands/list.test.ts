import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseEnvFileEntries, formatEnvTable, EnvEntry } from './list';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-list-test-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('parseEnvFileEntries', () => {
  it('returns empty array for non-existent file', () => {
    const entries = parseEnvFileEntries('/non/existent/.env');
    expect(entries).toEqual([]);
  });

  it('parses key-value pairs from a .env file', () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, '.env', 'FOO=bar\nBAZ=qux\n');
    const entries = parseEnvFileEntries(file);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ key: 'FOO', value: 'bar' });
    expect(entries[1]).toMatchObject({ key: 'BAZ', value: 'qux' });
  });

  it('includes the filename in each entry', () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, '.env.production', 'API_KEY=secret\n');
    const entries = parseEnvFileEntries(file);
    expect(entries[0].file).toBe('.env.production');
  });

  it('returns empty array for empty file', () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, '.env', '');
    const entries = parseEnvFileEntries(file);
    expect(entries).toEqual([]);
  });
});

describe('formatEnvTable', () => {
  it('returns a message when no entries provided', () => {
    const result = formatEnvTable([], false);
    expect(result).toBe('No environment variables found.');
  });

  it('includes header and separator in output', () => {
    const entries: EnvEntry[] = [{ key: 'FOO', value: 'bar', file: '.env' }];
    const result = formatEnvTable(entries, false);
    expect(result).toContain('KEY');
    expect(result).toContain('VALUE');
    expect(result).toContain('FILE');
  });

  it('masks values when mask option is true', () => {
    const entries: EnvEntry[] = [{ key: 'SECRET', value: 'mysecret', file: '.env' }];
    const result = formatEnvTable(entries, true);
    expect(result).toContain('***');
    expect(result).not.toContain('mysecret');
  });

  it('shows (empty) for blank values', () => {
    const entries: EnvEntry[] = [{ key: 'EMPTY_VAR', value: '', file: '.env' }];
    const result = formatEnvTable(entries, false);
    expect(result).toContain('(empty)');
  });
});
