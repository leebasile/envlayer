import fs from 'fs';
import os from 'os';
import path from 'path';
import { cloneEnvFile, parseEnvFile } from './clone';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-clone-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('cloneEnvFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('clones an env file to a new destination', () => {
    const src = writeFile(tmpDir, '.env', 'FOO=bar\nBAZ=qux\n');
    const dest = path.join(tmpDir, '.env.copy');

    const result = cloneEnvFile(src, dest, false);

    expect(result.keysCloned).toBe(2);
    expect(result.overwritten).toBe(false);
    expect(fs.existsSync(dest)).toBe(true);

    const cloned = parseEnvFile(fs.readFileSync(dest, 'utf-8'));
    expect(cloned.get('FOO')).toBe('bar');
    expect(cloned.get('BAZ')).toBe('qux');
  });

  it('throws if source file does not exist', () => {
    const src = path.join(tmpDir, 'nonexistent.env');
    const dest = path.join(tmpDir, '.env.copy');

    expect(() => cloneEnvFile(src, dest, false)).toThrow('Source file not found');
  });

  it('throws if destination exists and overwrite is false', () => {
    const src = writeFile(tmpDir, '.env', 'KEY=value\n');
    const dest = writeFile(tmpDir, '.env.copy', 'OTHER=val\n');

    expect(() => cloneEnvFile(src, dest, false)).toThrow('already exists');
  });

  it('overwrites destination when overwrite is true', () => {
    const src = writeFile(tmpDir, '.env', 'NEW_KEY=new_val\n');
    const dest = writeFile(tmpDir, '.env.copy', 'OLD_KEY=old_val\n');

    const result = cloneEnvFile(src, dest, true);

    expect(result.overwritten).toBe(true);
    expect(result.keysCloned).toBe(1);

    const cloned = parseEnvFile(fs.readFileSync(dest, 'utf-8'));
    expect(cloned.has('NEW_KEY')).toBe(true);
    expect(cloned.has('OLD_KEY')).toBe(false);
  });

  it('creates nested destination directories if needed', () => {
    const src = writeFile(tmpDir, '.env', 'A=1\n');
    const dest = path.join(tmpDir, 'nested', 'dir', '.env.copy');

    const result = cloneEnvFile(src, dest, false);

    expect(fs.existsSync(dest)).toBe(true);
    expect(result.keysCloned).toBe(1);
  });

  it('ignores comments and blank lines', () => {
    const src = writeFile(tmpDir, '.env', '# comment\n\nFOO=1\nBAR=2\n');
    const dest = path.join(tmpDir, '.env.copy');

    const result = cloneEnvFile(src, dest, false);

    expect(result.keysCloned).toBe(2);
  });
});
