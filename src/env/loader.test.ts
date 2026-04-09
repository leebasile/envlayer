import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadEnvFiles, resolveEnvFiles } from './loader';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-'));
}

function writeFile(dir: string, name: string, content: string): void {
  fs.writeFileSync(path.join(dir, name), content, 'utf-8');
}

describe('resolveEnvFiles', () => {
  it('returns only existing files', () => {
    const dir = makeTmpDir();
    writeFile(dir, '.env', 'BASE=1');
    const files = resolveEnvFiles(undefined, dir);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain('.env');
  });

  it('includes environment-specific file when present', () => {
    const dir = makeTmpDir();
    writeFile(dir, '.env', 'BASE=1');
    writeFile(dir, '.env.staging', 'STAGE=1');
    const files = resolveEnvFiles('staging', dir);
    expect(files.some((f) => f.endsWith('.env.staging'))).toBe(true);
  });
});

describe('loadEnvFiles', () => {
  it('loads variables from .env', () => {
    const dir = makeTmpDir();
    writeFile(dir, '.env', 'APP_NAME=envlayer\nPORT=3000');
    const { vars, sources } = loadEnvFiles({ cwd: dir });
    expect(vars.APP_NAME).toBe('envlayer');
    expect(vars.PORT).toBe('3000');
    expect(sources).toHaveLength(1);
  });

  it('merges base and environment-specific files', () => {
    const dir = makeTmpDir();
    writeFile(dir, '.env', 'APP_NAME=envlayer\nPORT=3000');
    writeFile(dir, '.env.production', 'PORT=8080\nDEBUG=false');
    const { vars } = loadEnvFiles({ environment: 'production', cwd: dir });
    expect(vars.APP_NAME).toBe('envlayer');
    expect(vars.PORT).toBe('3000'); // base wins without override
    expect(vars.DEBUG).toBe('false');
  });

  it('override flag gives precedence to later files', () => {
    const dir = makeTmpDir();
    writeFile(dir, '.env', 'PORT=3000');
    writeFile(dir, '.env.production', 'PORT=8080');
    const { vars } = loadEnvFiles({ environment: 'production', cwd: dir, override: true });
    expect(vars.PORT).toBe('8080');
  });

  it('returns empty vars when no files exist', () => {
    const dir = makeTmpDir();
    const { vars, sources } = loadEnvFiles({ cwd: dir });
    expect(vars).toEqual({});
    expect(sources).toHaveLength(0);
  });
});
