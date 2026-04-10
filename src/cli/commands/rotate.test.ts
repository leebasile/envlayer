import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, beforeEach } from 'vitest';
import { rotateEnvFile, generateValue, parseEnvFile } from './rotate';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-rotate-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('generateValue', () => {
  it('generates hex value of correct length', () => {
    const val = generateValue('hex', 32);
    expect(val).toHaveLength(32);
    expect(val).toMatch(/^[0-9a-f]+$/);
  });

  it('generates uuid value', () => {
    const val = generateValue('uuid');
    expect(val).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('generates base64 value of correct length', () => {
    const val = generateValue('base64', 24);
    expect(val).toHaveLength(24);
  });
});

describe('rotateEnvFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  it('rotates specified keys and writes output', () => {
    const input = writeFile(tmpDir, '.env', 'SECRET=oldsecret\nAPI_KEY=oldkey\nFOO=bar\n');
    const report = rotateEnvFile({ input, keys: ['SECRET', 'API_KEY'], generator: 'hex', length: 16 });

    expect(report.rotated).toHaveLength(2);
    expect(report.skipped).toHaveLength(0);

    const written = fs.readFileSync(input, 'utf-8');
    const map = parseEnvFile(written);
    expect(map.get('SECRET')).not.toBe('oldsecret');
    expect(map.get('API_KEY')).not.toBe('oldkey');
    expect(map.get('FOO')).toBe('bar');
  });

  it('skips keys not present in file', () => {
    const input = writeFile(tmpDir, '.env', 'EXISTING=value\n');
    const report = rotateEnvFile({ input, keys: ['MISSING'], generator: 'hex', length: 16 });

    expect(report.rotated).toHaveLength(0);
    expect(report.skipped).toContain('MISSING');
  });

  it('does not write file in dry-run mode', () => {
    const original = 'SECRET=original\n';
    const input = writeFile(tmpDir, '.env', original);
    rotateEnvFile({ input, keys: ['SECRET'], dryRun: true });

    const content = fs.readFileSync(input, 'utf-8');
    expect(content).toBe(original);
  });

  it('writes to separate output file when specified', () => {
    const input = writeFile(tmpDir, '.env', 'TOKEN=abc\n');
    const output = path.join(tmpDir, '.env.rotated');
    rotateEnvFile({ input, output, keys: ['TOKEN'] });

    expect(fs.existsSync(output)).toBe(true);
    const content = fs.readFileSync(input, 'utf-8');
    expect(content).toBe('TOKEN=abc\n');
  });
});
