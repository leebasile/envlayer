import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { copyEnvFile } from './copy';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-copy-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('copyEnvFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('copies all keys from source to a new destination file', () => {
    const src = writeFile(tmpDir, '.env.source', 'FOO=bar\nBAZ=qux\n');
    const dest = path.join(tmpDir, '.env.dest');

    const { copied, skipped } = copyEnvFile(src, dest, {});

    expect(copied).toEqual(['FOO', 'BAZ']);
    expect(skipped).toEqual([]);
    const content = fs.readFileSync(dest, 'utf-8');
    expect(content).toContain('FOO=bar');
    expect(content).toContain('BAZ=qux');
  });

  it('skips existing keys in destination without --overwrite', () => {
    const src = writeFile(tmpDir, '.env.source', 'FOO=new\nBAR=new\n');
    const dest = writeFile(tmpDir, '.env.dest', 'FOO=old\n');

    const { copied, skipped } = copyEnvFile(src, dest, { overwrite: false });

    expect(copied).toContain('BAR');
    expect(skipped).toContain('FOO');
    const content = fs.readFileSync(dest, 'utf-8');
    expect(content).toContain('FOO=old');
    expect(content).toContain('BAR=new');
  });

  it('overwrites existing keys when --overwrite is set', () => {
    const src = writeFile(tmpDir, '.env.source', 'FOO=new\n');
    const dest = writeFile(tmpDir, '.env.dest', 'FOO=old\n');

    const { copied } = copyEnvFile(src, dest, { overwrite: true });

    expect(copied).toContain('FOO');
    const content = fs.readFileSync(dest, 'utf-8');
    expect(content).toContain('FOO=new');
  });

  it('copies only specified keys', () => {
    const src = writeFile(tmpDir, '.env.source', 'FOO=1\nBAR=2\nBAZ=3\n');
    const dest = path.join(tmpDir, '.env.dest');

    const { copied, skipped } = copyEnvFile(src, dest, { keys: ['FOO', 'BAZ'] });

    expect(copied).toEqual(['FOO', 'BAZ']);
    expect(skipped).toEqual([]);
    const content = fs.readFileSync(dest, 'utf-8');
    expect(content).toContain('FOO=1');
    expect(content).not.toContain('BAR=2');
    expect(content).toContain('BAZ=3');
  });

  it('throws when source file does not exist', () => {
    expect(() =>
      copyEnvFile(path.join(tmpDir, 'nonexistent.env'), path.join(tmpDir, 'dest.env'), {})
    ).toThrow('Source file not found');
  });

  it('skips keys not present in source when keys filter is used', () => {
    const src = writeFile(tmpDir, '.env.source', 'FOO=1\n');
    const dest = path.join(tmpDir, '.env.dest');

    const { skipped } = copyEnvFile(src, dest, { keys: ['MISSING'] });

    expect(skipped).toContain('MISSING');
  });
});
