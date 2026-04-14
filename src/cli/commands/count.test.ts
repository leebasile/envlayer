import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { countEnvFile, parseEnvFile } from './count';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-count-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('parseEnvFile', () => {
  it('parses key=value pairs', () => {
    const dir = makeTmpDir();
    const f = writeFile(dir, '.env', 'FOO=bar\nBAZ=qux\n');
    const map = parseEnvFile(f);
    expect(map.get('FOO')).toBe('bar');
    expect(map.get('BAZ')).toBe('qux');
  });

  it('ignores comment lines', () => {
    const dir = makeTmpDir();
    const f = writeFile(dir, '.env', '# comment\nFOO=bar\n');
    const map = parseEnvFile(f);
    expect(map.size).toBe(1);
  });
});

describe('countEnvFile', () => {
  it('counts total, nonEmpty, empty, commented', () => {
    const dir = makeTmpDir();
    const f = writeFile(
      dir,
      '.env',
      '# a comment\nFOO=bar\nBAZ=\nQUX=hello\n\n'
    );
    const result = countEnvFile(f);
    expect(result.nonEmpty).toBe(2);
    expect(result.empty).toBe(2);
    expect(result.commented).toBe(1);
    expect(result.total).toBe(4);
  });

  it('returns zero counts for empty file', () => {
    const dir = makeTmpDir();
    const f = writeFile(dir, '.env.empty', '');
    const result = countEnvFile(f);
    expect(result.total).toBe(0);
    expect(result.nonEmpty).toBe(0);
    expect(result.empty).toBe(0);
    expect(result.commented).toBe(0);
  });

  it('uses basename for file field', () => {
    const dir = makeTmpDir();
    const f = writeFile(dir, '.env.prod', 'KEY=val\n');
    const result = countEnvFile(f);
    expect(result.file).toBe('.env.prod');
  });
});
