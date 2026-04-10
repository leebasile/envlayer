import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseEnvFile, serializeEnvMap, addComment } from './comment';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-comment-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('parseEnvFile', () => {
  it('parses key=value pairs', () => {
    const map = parseEnvFile('FOO=bar\nBAZ=qux\n');
    expect(map.get('FOO')).toBe('bar');
    expect(map.get('BAZ')).toBe('qux');
  });

  it('ignores comment lines', () => {
    const map = parseEnvFile('# this is a comment\nFOO=bar\n');
    expect(map.size).toBe(1);
    expect(map.get('FOO')).toBe('bar');
  });

  it('ignores blank lines', () => {
    const map = parseEnvFile('\nFOO=bar\n\n');
    expect(map.size).toBe(1);
  });
});

describe('serializeEnvMap', () => {
  it('inserts comment above the target key', () => {
    const original = 'FOO=bar\nBAZ=qux\n';
    const comments = new Map([['FOO', 'This is foo']]);
    const result = serializeEnvMap(original, comments);
    expect(result).toContain('# This is foo');
    const lines = result.split('\n');
    const commentIdx = lines.indexOf('# This is foo');
    expect(lines[commentIdx + 1]).toBe('FOO=bar');
  });

  it('preserves existing comments', () => {
    const original = '# existing\nFOO=bar\n';
    const comments = new Map<string, string>();
    const result = serializeEnvMap(original, comments);
    expect(result).toContain('# existing');
  });
});

describe('addComment', () => {
  it('adds a comment above the specified key', () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, '.env', 'FOO=bar\nBAZ=qux\n');
    addComment(file, 'FOO', 'The foo variable');
    const content = fs.readFileSync(file, 'utf-8');
    expect(content).toContain('# The foo variable');
    expect(content).toContain('FOO=bar');
  });

  it('throws if file does not exist', () => {
    expect(() => addComment('/nonexistent/.env', 'FOO', 'test')).toThrow('File not found');
  });

  it('throws if key does not exist', () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, '.env', 'FOO=bar\n');
    expect(() => addComment(file, 'MISSING', 'test')).toThrow('Key "MISSING" not found');
  });
});
