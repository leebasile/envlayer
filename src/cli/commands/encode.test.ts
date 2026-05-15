import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseEnvFile, encodeEnvValues, decodeEnvValues } from './encode';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-encode-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

describe('encodeEnvValues', () => {
  it('encodes values as base64', () => {
    const map = new Map([['KEY', 'hello'], ['SECRET', 'world']]);
    const { result, encoded } = encodeEnvValues(map, 'base64');
    expect(result.get('KEY')).toBe(Buffer.from('hello').toString('base64'));
    expect(result.get('SECRET')).toBe(Buffer.from('world').toString('base64'));
    expect(encoded).toEqual(['KEY', 'SECRET']);
  });

  it('encodes values as hex', () => {
    const map = new Map([['KEY', 'abc']]);
    const { result, encoded } = encodeEnvValues(map, 'hex');
    expect(result.get('KEY')).toBe(Buffer.from('abc').toString('hex'));
    expect(encoded).toContain('KEY');
  });

  it('encodes values as uri', () => {
    const map = new Map([['URL', 'hello world']]);
    const { result, encoded } = encodeEnvValues(map, 'uri');
    expect(result.get('URL')).toBe('hello%20world');
    expect(encoded).toContain('URL');
  });

  it('does not mark unchanged uri values as encoded', () => {
    const map = new Map([['KEY', 'nospaces']]);
    const { encoded } = encodeEnvValues(map, 'uri');
    expect(encoded).not.toContain('KEY');
  });
});

describe('decodeEnvValues', () => {
  it('decodes base64 values', () => {
    const encoded = Buffer.from('hello').toString('base64');
    const map = new Map([['KEY', encoded]]);
    const { result, decoded } = decodeEnvValues(map, 'base64');
    expect(result.get('KEY')).toBe('hello');
    expect(decoded).toContain('KEY');
  });

  it('decodes hex values', () => {
    const hex = Buffer.from('abc').toString('hex');
    const map = new Map([['KEY', hex]]);
    const { result } = decodeEnvValues(map, 'hex');
    expect(result.get('KEY')).toBe('abc');
  });

  it('decodes uri values', () => {
    const map = new Map([['URL', 'hello%20world']]);
    const { result } = decodeEnvValues(map, 'uri');
    expect(result.get('URL')).toBe('hello world');
  });
});

describe('parseEnvFile', () => {
  let tmpDir: string;
  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it('parses key=value pairs', () => {
    const file = writeFile(tmpDir, '.env', 'FOO=bar\nBAZ=qux\n');
    const content = fs.readFileSync(file, 'utf8');
    const map = parseEnvFile(content);
    expect(map.get('FOO')).toBe('bar');
    expect(map.get('BAZ')).toBe('qux');
  });

  it('ignores comments and blank lines', () => {
    const content = '# comment\n\nKEY=val\n';
    const map = parseEnvFile(content);
    expect(map.size).toBe(1);
    expect(map.get('KEY')).toBe('val');
  });
});
