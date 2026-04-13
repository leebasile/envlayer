import fs from 'fs';
import os from 'os';
import path from 'path';
import { findPlaceholders, replacePlaceholders, parseEnvFile } from './placeholder';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-placeholder-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('findPlaceholders', () => {
  it('detects CHANGE_ME values', () => {
    const content = 'API_KEY=CHANGE_ME\nDB_HOST=localhost\n';
    const found = findPlaceholders(content);
    expect(found).toHaveLength(1);
    expect(found[0].key).toBe('API_KEY');
    expect(found[0].placeholder).toBe('CHANGE_ME');
    expect(found[0].line).toBe(1);
  });

  it('detects TODO values', () => {
    const content = 'SECRET=TODO\n';
    const found = findPlaceholders(content);
    expect(found[0].placeholder).toBe('TODO');
  });

  it('detects angle-bracket placeholders', () => {
    const content = 'TOKEN=<your-token>\n';
    const found = findPlaceholders(content);
    expect(found).toHaveLength(1);
    expect(found[0].placeholder).toBe('<your-token>');
  });

  it('returns empty array when no placeholders', () => {
    const content = 'HOST=localhost\nPORT=3000\n';
    expect(findPlaceholders(content)).toHaveLength(0);
  });

  it('ignores comment lines', () => {
    const content = '# API_KEY=CHANGE_ME\nDB_URL=postgres://localhost\n';
    expect(findPlaceholders(content)).toHaveLength(0);
  });
});

describe('replacePlaceholders', () => {
  it('replaces matching placeholders and writes file', () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, '.env', 'API_KEY=CHANGE_ME\nDB_HOST=localhost\n');
    const result = replacePlaceholders(file, { API_KEY: 'secret123' });
    expect(result.replaced).toBe(1);
    expect(result.skipped).toBe(0);
    const updated = parseEnvFile(fs.readFileSync(file, 'utf-8'));
    expect(updated.get('API_KEY')).toBe('secret123');
    expect(updated.get('DB_HOST')).toBe('localhost');
  });

  it('skips placeholders with no replacement provided', () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, '.env', 'API_KEY=CHANGE_ME\nSECRET=TODO\n');
    const result = replacePlaceholders(file, { API_KEY: 'abc' });
    expect(result.replaced).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it('does not write file when nothing is replaced', () => {
    const dir = makeTmpDir();
    const content = 'HOST=localhost\n';
    const file = writeFile(dir, '.env', content);
    const mtime1 = fs.statSync(file).mtimeMs;
    replacePlaceholders(file, { HOST: 'other' });
    const mtime2 = fs.statSync(file).mtimeMs;
    expect(mtime2).toBe(mtime1);
  });
});
